import { create } from 'zustand';

import { SEED_NOTIFICATIONS } from '@/lib/data/seed';
import type { AppNotification, NotificationKind } from '@/lib/types';

let notificationSeq = 900;

interface NotificationPrefs {
  newMatches: boolean;
  messages: boolean;
  likes: boolean;
  calls: boolean;
  moments: boolean;
  promotions: boolean;
  quietHours: boolean;
}

interface NotificationsState {
  items: AppNotification[];
  prefs: NotificationPrefs;
  push: (payload: { kind: NotificationKind; title: string; body: string; userId?: string }) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  setPref: (key: keyof NotificationPrefs, value: boolean) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: SEED_NOTIFICATIONS,
  prefs: {
    newMatches: true,
    messages: true,
    likes: true,
    calls: true,
    moments: false,
    promotions: false,
    quietHours: true,
  },

  push: ({ kind, title, body, userId }) => {
    notificationSeq += 1;
    set((state) => ({
      items: [
        {
          id: `n${notificationSeq}`,
          kind,
          title,
          body,
          userId,
          createdAt: Date.now(),
          read: false,
        },
        ...state.items,
      ],
    }));
  },

  markRead: (id) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    })),

  markAllRead: () =>
    set((state) => ({ items: state.items.map((item) => ({ ...item, read: true })) })),

  remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

  setPref: (key, value) => set((state) => ({ prefs: { ...state.prefs, [key]: value } })),
}));

export function useUnreadNotificationCount() {
  const items = useNotificationsStore((state) => state.items);
  return items.filter((item) => !item.read).length;
}
