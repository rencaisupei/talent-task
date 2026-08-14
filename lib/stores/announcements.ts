import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { estimateRecipients, SEED_ANNOUNCEMENTS } from '@/lib/adminSeed';
import { useNotificationStore } from '@/lib/stores/notifications';
import { useSessionStore } from '@/lib/stores/session';
import type { Announcement, AnnouncementAudience } from '@/lib/types';

export interface PublishAnnouncementInput {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  adminName: string;
}

interface AnnouncementState {
  announcements: Announcement[];
  publish: (input: PublishAnnouncementInput) => Announcement;
  remove: (id: string) => void;
}

/** 判斷本機示範帳號是否落在此次推播的受眾內。 */
function matchesLocalUser(audience: AnnouncementAudience): boolean {
  const { role, isPremium } = useSessionStore.getState();
  const table: Record<AnnouncementAudience, boolean> = {
    all: true,
    client: role === 'client',
    talent: role === 'talent',
    premium: role === 'talent' && isPremium,
    free: role === 'talent' && !isPremium,
  };
  return table[audience];
}

export const useAnnouncementStore = create<AnnouncementState>()(
  persist(
    (set) => ({
      announcements: SEED_ANNOUNCEMENTS,

      publish: (input) => {
        const announcement: Announcement = {
          id: `ann_${Date.now()}`,
          title: input.title.trim(),
          body: input.body.trim(),
          audience: input.audience,
          createdAt: Date.now(),
          adminName: input.adminName,
          recipientCount: estimateRecipients(input.audience),
        };

        set((state) => ({ announcements: [announcement, ...state.announcements] }));

        if (matchesLocalUser(input.audience)) {
          useNotificationStore.getState().pushNotification({
            kind: 'system',
            title: announcement.title,
            body: announcement.body,
          });
        }

        return announcement;
      },

      remove: (id) =>
        set((state) => ({
          announcements: state.announcements.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'instantgig-announcements',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
