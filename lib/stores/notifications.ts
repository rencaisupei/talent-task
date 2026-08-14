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
}

export function countUnread(items: AppNotification[]): number {
  return items.reduce((total, item) => (item.isRead ? total : total + 1), 0);
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'instantgig-notifications',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
