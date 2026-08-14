import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SEED_SUBSCRIPTIONS } from '@/lib/adminSeed';
import { usePlatformUserStore } from '@/lib/stores/platformUsers';
import { PREMIUM_PRICE_TWD, useSessionStore } from '@/lib/stores/session';
import { LOCAL_USER_ID, type SubscriptionRecord } from '@/lib/types';

const DAY = 24 * 60 * 60 * 1000;

interface RevenueState {
  subscriptions: SubscriptionRecord[];
  /** 管理員手動開通進階版（不經 App Store／Google Play）。 */
  grantPremium: (user: { id: string; name: string }) => void;
  /** 取消進階版：使用中的帳務紀錄轉為已取消。 */
  revokePremium: (userId: string) => void;
  /** 標記退款：同時停用該使用者的進階版。 */
  refundSubscription: (subscriptionId: string) => void;
}

/** 同步本機示範帳號的訂閱狀態，讓管理端動作能反映在使用者端畫面。 */
function syncLocalSession(userId: string, isPremium: boolean) {
  usePlatformUserStore.getState().setPremium(userId, isPremium);
  if (userId !== LOCAL_USER_ID) return;
  const session = useSessionStore.getState();
  if (isPremium) session.activatePremium();
  else session.cancelPremium();
}

export const useRevenueStore = create<RevenueState>()(
  persist(
    (set, get) => ({
      subscriptions: SEED_SUBSCRIPTIONS,

      grantPremium: (user) => {
        const hasActive = get().subscriptions.some(
          (item) => item.userId === user.id && item.status === 'active',
        );
        if (!hasActive) {
          const now = Date.now();
          const record: SubscriptionRecord = {
            id: `sub_${now}`,
            userId: user.id,
            userName: user.name,
            amount: PREMIUM_PRICE_TWD,
            status: 'active',
            channel: 'manual',
            invoiceNo: `IG-M-${String(now).slice(-6)}`,
            startedAt: now,
            renewsAt: now + 30 * DAY,
          };
          set((state) => ({ subscriptions: [record, ...state.subscriptions] }));
        }
        syncLocalSession(user.id, true);
      },

      revokePremium: (userId) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((item) =>
            item.userId === userId && item.status === 'active'
              ? { ...item, status: 'cancelled' }
              : item,
          ),
        }));
        syncLocalSession(userId, false);
      },

      refundSubscription: (subscriptionId) => {
        const record = get().subscriptions.find((item) => item.id === subscriptionId);
        set((state) => ({
          subscriptions: state.subscriptions.map((item) =>
            item.id === subscriptionId
              ? { ...item, status: 'refunded', refundedAt: Date.now() }
              : item,
          ),
        }));
        if (record) syncLocalSession(record.userId, false);
      },
    }),
    {
      name: 'instantgig-revenue',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);

export interface RevenueTotals {
  activeCount: number;
  cancelledCount: number;
  refundedCount: number;
  refundedAmount: number;
  ledgerMrr: number;
  renewRate: number;
}

export function revenueTotals(subscriptions: SubscriptionRecord[]): RevenueTotals {
  const activeCount = subscriptions.filter((item) => item.status === 'active').length;
  const cancelledCount = subscriptions.filter((item) => item.status === 'cancelled').length;
  const refunded = subscriptions.filter((item) => item.status === 'refunded');
  const total = subscriptions.length;

  return {
    activeCount,
    cancelledCount,
    refundedCount: refunded.length,
    refundedAmount: refunded.reduce((sum, item) => sum + item.amount, 0),
    ledgerMrr: activeCount * PREMIUM_PRICE_TWD,
    renewRate: total === 0 ? 0 : (activeCount / total) * 100,
  };
}

export function subscriptionsForUser(
  subscriptions: SubscriptionRecord[],
  userId: string,
): SubscriptionRecord[] {
  return subscriptions.filter((item) => item.userId === userId);
}
