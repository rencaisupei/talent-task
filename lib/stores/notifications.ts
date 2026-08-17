import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { deliverPush } from '@/lib/push';
import { SEED_NOTIFICATIONS } from '@/lib/seed';
import type { AppNotification } from '@/lib/types';

export type PushNotificationInput = Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>;

interface NotificationState {
  items: AppNotification[];
  pushNotification: (input: PushNotificationInput) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  /** 每日維護：清掉已讀的過舊通知，並限制保留筆數，回傳清掉的筆數。 */
  pruneNotifications: (options: { maxAgeMs: number; keep: number }) => number;
}

export function countUnread(items: AppNotification[]): number {
  return items.reduce((total, item) => (item.isRead ? total : total + 1), 0);
}

/** 型別守衛：以執行期檢查取代型別斷言，避免直接把持久化的 unknown 資料斷言成較窄型別。 */
function hasNotificationItems(value: unknown): value is { items?: AppNotification[] } {
  return typeof value === 'object' && value !== null;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      items: SEED_NOTIFICATIONS,

      pushNotification: (input) => {
        set((state) => ({
          items: [
            {
              ...input,
              id: `noti_${Date.now()}_${Math.round(Math.random() * 1000)}`,
              createdAt: Date.now(),
              isRead: false,
            },
            ...state.items,
          ].slice(0, 120),
        }));

        deliverPush({
          kind: input.kind,
          title: input.title,
          body: input.body,
          route: {
            gigId: input.gigId,
            conversationId: input.conversationId,
            talentId: input.talentId,
          },
        });
      },

      markRead: (id) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
        })),

      markAllRead: () =>
        set((state) => ({ items: state.items.map((item) => ({ ...item, isRead: true })) })),

      clearAll: () => set({ items: [] }),

      pruneNotifications: ({ maxAgeMs, keep }) => {
        const cutoff = Date.now() - maxAgeMs;
        const { items } = get();
        const kept = items
          .filter((item) => !item.isRead || item.createdAt >= cutoff)
          .slice(0, Math.max(keep, 0));

        const removed = items.length - kept.length;
        if (removed > 0) set({ items: kept });
        return removed;
      },
    }),
    {
      name: 'instantgig-notifications',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted, version) => {
        if (version >= 2 || !hasNotificationItems(persisted)) return persisted;
        // 語音通話功能已移除，清掉舊的通話通知。
        const items = (persisted.items ?? []).filter((item) => (item.kind as string) !== 'call');
        return { ...persisted, items };
      },
    },
  ),
);
