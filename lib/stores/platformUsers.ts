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
      version: 1,
    },
  ),
);

export function findPlatformUser(users: PlatformUser[], userId: string): PlatformUser | undefined {
  return users.find((user) => user.id === userId);
}
