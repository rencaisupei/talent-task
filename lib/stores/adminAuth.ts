import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SEED_ADMIN_ACCOUNTS } from '@/lib/adminSeed';
import { useAdminAuditStore } from '@/lib/stores/adminAudit';
import { ADMIN_ROLE_LABEL, type AdminAccount } from '@/lib/types';

export type AdminSignInResult = 'ok' | 'invalid' | 'locked';

/** 連續失敗次數上限與鎖定時間（本機驗證的基本防護）。 */
export const ADMIN_LOCK_THRESHOLD = 5;
export const ADMIN_LOCK_MS = 60_000;

interface AdminAuthState {
  hydrated: boolean;
  accounts: AdminAccount[];
  currentAdmin: AdminAccount | null;
  failedAttempts: number;
  lockedUntil: number | null;
  markHydrated: () => void;
  signIn: (email: string, password: string) => AdminSignInResult;
  signOut: () => void;
}

/** 管理員登入狀態（本機驗證；接後端後改為伺服器端簽發權杖）。 */
export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      accounts: SEED_ADMIN_ACCOUNTS,
      currentAdmin: null,
      failedAttempts: 0,
      lockedUntil: null,

      markHydrated: () => set({ hydrated: true }),

      signIn: (email, password) => {
        const { accounts, failedAttempts, lockedUntil } = get();
        if (lockedUntil !== null && lockedUntil > Date.now()) return 'locked';

        const normalized = email.trim().toLowerCase();
        const account = accounts.find(
          (item) => item.email.toLowerCase() === normalized && item.password === password,
        );

        if (!account) {
          const attempts = failedAttempts + 1;
          set({
            failedAttempts: attempts,
            lockedUntil: attempts >= ADMIN_LOCK_THRESHOLD ? Date.now() + ADMIN_LOCK_MS : null,
          });
          return attempts >= ADMIN_LOCK_THRESHOLD ? 'locked' : 'invalid';
        }

        const signedIn: AdminAccount = { ...account, lastLoginAt: Date.now() };
        set((state) => ({
          currentAdmin: signedIn,
          accounts: state.accounts.map((item) => (item.id === signedIn.id ? signedIn : item)),
          failedAttempts: 0,
          lockedUntil: null,
        }));

        useAdminAuditStore.getState().log({
          adminId: signedIn.id,
          adminName: signedIn.name,
          kind: 'auth',
          summary: `管理員登入平台（${ADMIN_ROLE_LABEL[signedIn.role]}）`,
        });

        return 'ok';
      },

      signOut: () => {
        const admin = get().currentAdmin;
        if (admin) {
          useAdminAuditStore.getState().log({
            adminId: admin.id,
            adminName: admin.name,
            kind: 'auth',
            summary: '管理員登出平台',
          });
        }
        set({ currentAdmin: null, failedAttempts: 0, lockedUntil: null });
      },
    }),
    {
      name: 'instantgig-admin-auth',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({ accounts: state.accounts, currentAdmin: state.currentAdmin }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
