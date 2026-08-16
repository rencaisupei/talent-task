import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PushChannel } from '@/lib/types';

export type PushPermission = 'unknown' | 'granted' | 'denied' | 'unsupported';

const DEFAULT_CHANNELS: Record<PushChannel, boolean> = {
  chat: true,
  bid: true,
  match: true,
  review: true,
  moderation: true,
  system: true,
};

const CHANNEL_KEYS: PushChannel[] = ['chat', 'bid', 'match', 'review', 'moderation', 'system'];

/** 型別守衛：以執行期檢查取代型別斷言，避免直接把持久化的 unknown 資料斷言成較窄型別。 */
function isPartialPushPrefsState(value: unknown): value is Partial<PushPrefsState> {
  return typeof value === 'object' && value !== null;
}

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
      version: 2,
      migrate: (persisted, version) => {
        if (version >= 2 || !isPartialPushPrefsState(persisted)) return persisted;
        // v1 有語音通話分類，功能已移除，僅保留現有分類。
        const legacy = persisted.channels ?? DEFAULT_CHANNELS;
        const channels = { ...DEFAULT_CHANNELS };
        for (const channel of CHANNEL_KEYS) {
          if (typeof legacy[channel] === 'boolean') channels[channel] = legacy[channel];
        }
        return { ...persisted, channels };
      },
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
