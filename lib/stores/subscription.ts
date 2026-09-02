import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { purchaseProduct, restorePurchases } from '@/lib/iap';
import type { CoinPack, SubscriptionPlan, Tier } from '@/lib/types';

export interface Entitlements {
  unlimitedLikes: boolean;
  dailyLikeLimit: number;
  seeWhoLikedYou: boolean;
  readReceipts: boolean;
  videoCalls: boolean;
  incognito: boolean;
  advancedFilters: boolean;
  rewind: boolean;
  hideAds: boolean;
  monthlyBoosts: number;
  dailySuperLikes: number;
  priorityRanking: boolean;
  travelMode: boolean;
}

export function entitlementsFor(tier: Tier): Entitlements {
  if (tier === 'vip') {
    return {
      unlimitedLikes: true,
      dailyLikeLimit: Number.POSITIVE_INFINITY,
      seeWhoLikedYou: true,
      readReceipts: true,
      videoCalls: true,
      incognito: true,
      advancedFilters: true,
      rewind: true,
      hideAds: true,
      monthlyBoosts: 5,
      dailySuperLikes: 10,
      priorityRanking: true,
      travelMode: true,
    };
  }
  if (tier === 'plus') {
    return {
      unlimitedLikes: true,
      dailyLikeLimit: Number.POSITIVE_INFINITY,
      seeWhoLikedYou: true,
      readReceipts: true,
      videoCalls: false,
      incognito: false,
      advancedFilters: true,
      rewind: true,
      hideAds: true,
      monthlyBoosts: 1,
      dailySuperLikes: 5,
      priorityRanking: false,
      travelMode: false,
    };
  }
  return {
    unlimitedLikes: false,
    dailyLikeLimit: 15,
    seeWhoLikedYou: false,
    readReceipts: false,
    videoCalls: false,
    incognito: false,
    advancedFilters: false,
    rewind: false,
    hideAds: false,
    monthlyBoosts: 0,
    dailySuperLikes: 1,
    priorityRanking: false,
    travelMode: false,
  };
}

export const TIER_LABEL: Record<Tier, string> = {
  free: '免費會員',
  plus: 'JiMatch Plus',
  vip: 'JiMatch VIP',
};

interface SubscriptionState {
  tier: Tier;
  productId: string | null;
  renewsAt: number | null;
  autoRenew: boolean;
  coins: number;
  boostsLeft: number;
  superLikesLeft: number;
  purchasingId: string | null;
  lastMessage: string | null;
  buyPlan: (plan: SubscriptionPlan) => Promise<boolean>;
  buyCoins: (pack: CoinPack) => Promise<boolean>;
  restore: () => Promise<boolean>;
  setAutoRenew: (value: boolean) => void;
  cancelSubscription: () => void;
  spendCoins: (amount: number) => boolean;
  addCoins: (amount: number) => void;
  consumeSuperLike: () => boolean;
  consumeBoost: () => boolean;
  clearMessage: () => void;
}

const PERIOD_DAYS: Record<SubscriptionPlan['period'], number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      tier: 'free',
      productId: null,
      renewsAt: null,
      autoRenew: true,
      coins: 100,
      boostsLeft: 0,
      superLikesLeft: 1,
      purchasingId: null,
      lastMessage: null,

      buyPlan: async (plan) => {
        set({ purchasingId: plan.id, lastMessage: null });
        const result = await purchaseProduct(plan.productId);
        if (!result.ok) {
          set({ purchasingId: null, lastMessage: '購買未完成，請稍後再試' });
          return false;
        }
        const grants = entitlementsFor(plan.tier);
        set({
          purchasingId: null,
          tier: plan.tier,
          productId: plan.productId,
          autoRenew: true,
          renewsAt: Date.now() + PERIOD_DAYS[plan.period] * 24 * 60 * 60 * 1000,
          boostsLeft: grants.monthlyBoosts,
          superLikesLeft: grants.dailySuperLikes,
          lastMessage: `${plan.title} 已開通`,
        });
        return true;
      },

      buyCoins: async (pack) => {
        set({ purchasingId: pack.id, lastMessage: null });
        const result = await purchaseProduct(pack.productId);
        if (!result.ok) {
          set({ purchasingId: null, lastMessage: '購買未完成，請稍後再試' });
          return false;
        }
        set((state) => ({
          purchasingId: null,
          coins: state.coins + pack.coins + pack.bonus,
          lastMessage: `已加值 ${pack.coins + pack.bonus} 心動代幣`,
        }));
        return true;
      },

      restore: async () => {
        set({ purchasingId: 'restore', lastMessage: null });
        const restored = await restorePurchases();
        if (!restored) {
          set({ purchasingId: null, lastMessage: '找不到可回復的訂閱' });
          return false;
        }
        set({ purchasingId: null, lastMessage: '訂閱已回復' });
        return true;
      },

      setAutoRenew: (autoRenew) => set({ autoRenew }),

      cancelSubscription: () =>
        set({
          autoRenew: false,
          lastMessage: '已關閉自動續訂，到期後將回到免費會員',
        }),

      spendCoins: (amount) => {
        if (get().coins < amount) return false;
        set((state) => ({ coins: state.coins - amount }));
        return true;
      },

      /** 遊戲城獎勵發放。 */
      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),

      consumeSuperLike: () => {
        if (get().superLikesLeft <= 0) return false;
        set((state) => ({ superLikesLeft: state.superLikesLeft - 1 }));
        return true;
      },

      consumeBoost: () => {
        if (get().boostsLeft <= 0) return false;
        set((state) => ({ boostsLeft: state.boostsLeft - 1 }));
        return true;
      },

      clearMessage: () => set({ lastMessage: null }),
    }),
    {
      name: 'jimatch-subscription',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function useEntitlements() {
  const tier = useSubscriptionStore((state) => state.tier);
  return entitlementsFor(tier);
}
