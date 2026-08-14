import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PushChannel } from '@/lib/types';

export type PushPermission = 'unknown' | 'granted' | 'denied' | 'unsupported';

const DEFAULT_CHANNELS: Record<PushChannel, boolean> = {
  chat: true,
  call: true,
  bid: true,
  match: true,
  review: true,
  moderation: true,
  system: true,
};

interface PushPrefsState {
  hydrated: boolean;
  enabled: boolean;
  permission: PushPermission;
  channels: Record<PushChannel, boolean>;
  /** 關閉時推播只顯示標題，不帶訊息內容。 */
  showPreview: boolean;

  markHydrated: () => void;
  setEnabled: (enabled: boolean) => void;
  setPermission: (permission: PushPermission) => void;
  toggleChannel: (channel: PushChannel) => void;
  setShowPreview: (show: boolean) => void;
}

export const usePushPrefsStore = create<PushPrefsState>()(
  persist(
    (set) => ({
      hydrated: false,
      enabled: true,
      permission: 'unknown',
      channels: DEFAULT_CHANNELS,
      showPreview: true,

      markHydrated: () => set({ hydrated: true }),

      setEnabled: (enabled) => set({ enabled }),

      setPermission: (permission) => set({ permission }),

      toggleChannel: (channel) =>
        set((state) => ({
          channels: { ...state.channels, [channel]: !state.channels[channel] },
        })),

      setShowPreview: (showPreview) => set({ showPreview }),
    }),
    {
      name: 'instantgig-push-prefs',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        enabled: state.enabled,
        permission: state.permission,
        channels: state.channels,
        showPreview: state.showPreview,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
