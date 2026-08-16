import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { findAdminAccount, isAdminAccountStillValid } from '@/lib/adminAccounts';
import { useAdminAuditStore } from '@/lib/stores/adminAudit';
import { ADMIN_ROLE_LABEL, type AdminAccount } from '@/lib/types';

const ADMIN_ROLE_STRINGS: ReadonlySet<string> = new Set(['owner', 'moderator', 'analyst']);

/** 驗證持久化的資料形狀是否符合 AdminAccount，避免對不明資料做不安全的型別斷言。 */
function isAdminAccountShape(value: unknown): value is AdminAccount {
  if (typeof value !== 'object' || value === null) return false;
  if (!('id' in value) || typeof value.id !== 'string') return false;
  if (!('email' in value) || typeof value.email !== 'string') return false;
  if (!('password' in value) || typeof value.password !== 'string') return false;
  if (!('name' in value) || typeof value.name !== 'string') return false;
  if (!('role' in value) || typeof value.role !== 'string' || !ADMIN_ROLE_STRINGS.has(value.role)) {
    return false;
  }
  if (!('createdAt' in value) || typeof value.createdAt !== 'number') return false;
  return true;
}

/** 從持久化資料中安全取出 currentAdmin（形狀不符則視為未登入）。 */
function readPersistedCurrentAdmin(persisted: unknown): AdminAccount | null {
  if (typeof persisted !== 'object' || persisted === null || !('currentAdmin' in persisted)) {
    return null;
  }
  const { currentAdmin } = persisted;
  return isAdminAccountShape(currentAdmin) ? currentAdmin : null;
}

export type AdminSignInResult = 'ok' | 'invalid' | 'locked';

/** 連續失敗次數上限與鎖定時間（本機驗證的基本防護）。 */
export const ADMIN_LOCK_THRESHOLD = 5;
export const ADMIN_LOCK_MS = 60_000;

interface AdminAuthState {
  hydrated: boolean;
  currentAdmin: AdminAccount | null;
  failedAttempts: number;
  lockedUntil: number | null;
  markHydrated: () => void;
  signIn: (email: string, password: string) => AdminSignInResult;
  signOut: () => void;
}

/**
 * 管理員登入狀態。帳密清單來自 lib/adminAccounts.ts（程式碼即唯一來源），
 * 這裡只持久化「目前登入的是誰」，因此改動清單後立即生效。
 */
export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      currentAdmin: null,
      failedAttempts: 0,
      lockedUntil: null,

      markHydrated: () => set({ hydrated: true }),

      signIn: (email, password) => {
        const { failedAttempts, lockedUntil } = get();
        if (lockedUntil !== null && lockedUntil > Date.now()) return 'locked';

        const account = findAdminAccount(email, password);

        if (account === null) {
          const attempts = failedAttempts + 1;
          set({
            failedAttempts: attempts,
            lockedUntil: attempts >= ADMIN_LOCK_THRESHOLD ? Date.now() + ADMIN_LOCK_MS : null,
          });
          return attempts >= ADMIN_LOCK_THRESHOLD ? 'locked' : 'invalid';
        }

        const signedIn: AdminAccount = { ...account, lastLoginAt: Date.now() };
        set({ currentAdmin: signedIn, failedAttempts: 0, lockedUntil: null });

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
      version: 2,
      partialize: (state) => ({ currentAdmin: state.currentAdmin }),
      migrate: (persisted) => {
        return { currentAdmin: readPersistedCurrentAdmin(persisted) };
      },
      /** 已登入的帳號若已從程式碼清單移除或改過密碼，重新載入時一律登出。 */
      merge: (persisted, current) => {
        const restored = readPersistedCurrentAdmin(persisted);
        const stillValid = restored != null && isAdminAccountStillValid(restored);
        return { ...current, currentAdmin: stillValid ? restored : null };
      },
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
