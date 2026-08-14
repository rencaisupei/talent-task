import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SEED_PLATFORM_USERS } from '@/lib/adminSeed';
import type { PlatformUser, VerificationStatus } from '@/lib/types';

interface PlatformUserState {
  users: PlatformUser[];
  setPremium: (userId: string, isPremium: boolean) => void;
  setVerification: (userId: string, status: VerificationStatus) => void;
  setNote: (userId: string, note: string) => void;
}

function isPersistedUserState(value: unknown): value is { users?: PlatformUser[] } {
  return typeof value === 'object' && value !== null;
}

/** 管理端使用者總表（客戶 + 人才）。 */
export const usePlatformUserStore = create<PlatformUserState>()(
  persist(
    (set) => ({
      users: SEED_PLATFORM_USERS,

      setPremium: (userId, isPremium) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  isPremium,
                  premiumSince: isPremium ? (user.premiumSince ?? Date.now()) : undefined,
                }
              : user,
          ),
        })),

      setVerification: (userId, status) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.id === userId ? { ...user, verification: status } : user,
          ),
        })),

      setNote: (userId, note) =>
        set((state) => ({
          users: state.users.map((user) => (user.id === userId ? { ...user, note } : user)),
        })),
    }),
    {
      name: 'instantgig-platform-users',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted, version) => {
        const state = isPersistedUserState(persisted) ? persisted : undefined;
        if (version < 2) {
          // 補上新增專業領域帶來的人才與客戶帳號，保留既有管理備註與訂閱狀態。
          const existing = state?.users ?? [];
          const existingIds = new Set(existing.map((user) => user.id));
          const missing = SEED_PLATFORM_USERS.filter((user) => !existingIds.has(user.id));
          return { ...state, users: [...existing, ...missing] };
        }
        return persisted;
      },
    },
  ),
);

export function findPlatformUser(users: PlatformUser[], userId: string): PlatformUser | undefined {
  return users.find((user) => user.id === userId);
}
