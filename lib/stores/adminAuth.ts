import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  adminChangePassword,
  adminCompleteSetup,
  adminFetchSession,
  adminLogin,
  adminLogout,
  type AdminAuthOutcome,
  type AdminSessionPayload,
} from '@/lib/adminApi';
import type { AdminPermission } from '@/lib/adminPermissions';
import { IS_BILT_CONFIGURED } from '@/lib/bilt';
import { useAdminAuditStore } from '@/lib/stores/adminAudit';
import { ADMIN_ROLE_LABEL, type AdminAccount } from '@/lib/types';

/** checking = 正在向後端確認持久化的 token，畫面應顯示載入狀態。 */
export type AdminAuthStatus = 'checking' | 'signed-out' | 'signed-in';

const EMPTY_PERMISSIONS: readonly AdminPermission[] = [];

function readPersistedToken(persisted: unknown): string | null {
  if (typeof persisted !== 'object' || persisted === null || !('token' in persisted)) return null;
  const { token } = persisted;
  return typeof token === 'string' && token.length >= 32 ? token : null;
}

interface AdminAuthState {
  hydrated: boolean;
  status: AdminAuthStatus;
  /** 隨機 session token；資料庫只存它的 SHA-256，前端從不持有密碼或雜湊。 */
  token: string | null;
  currentAdmin: AdminAccount | null;
  permissions: readonly AdminPermission[];
  /** 後端無法連線或未設定時的說明，供登入頁顯示。 */
  connectionError: string | null;
  markHydrated: () => void;
  refreshSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AdminAuthOutcome>;
  completeSetup: (
    email: string,
    setupCode: string,
    newPassword: string,
  ) => Promise<AdminAuthOutcome>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AdminAuthOutcome>;
  signOut: () => Promise<void>;
}

/**
 * 管理員登入狀態。帳密驗證全部在 admin-auth 後端函式進行：
 * 帳號存在 admin_accounts、密碼以 PBKDF2 雜湊，前端只持久化一組 session token。
 */
export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => {
      const applySession = (session: AdminSessionPayload) => {
        set({
          status: 'signed-in',
          token: session.token,
          currentAdmin: session.admin,
          permissions: session.permissions,
          connectionError: null,
        });
      };

      const clearSession = (connectionError: string | null) => {
        set({
          status: 'signed-out',
          token: null,
          currentAdmin: null,
          permissions: EMPTY_PERMISSIONS,
          connectionError,
        });
      };

      const handleOutcome = (outcome: AdminAuthOutcome): AdminAuthOutcome => {
        if (outcome.kind === 'ok') {
          applySession(outcome.session);
          useAdminAuditStore.getState().log({
            adminId: outcome.session.admin.id,
            adminName: outcome.session.admin.name,
            kind: 'auth',
            summary: `管理員登入平台（${ADMIN_ROLE_LABEL[outcome.session.admin.role]}）`,
          });
        } else if (outcome.kind === 'unavailable') {
          set({ connectionError: outcome.message });
        }
        return outcome;
      };

      return {
        hydrated: false,
        status: 'checking',
        token: null,
        currentAdmin: null,
        permissions: EMPTY_PERMISSIONS,
        connectionError: null,

        markHydrated: () => set({ hydrated: true }),

        refreshSession: async () => {
          if (!IS_BILT_CONFIGURED) {
            clearSession(
              '尚未設定後端連線（EXPO_PUBLIC_BILT_URL 與 EXPO_PUBLIC_BILT_ANON_KEY），無法驗證管理員身分。',
            );
            return;
          }

          const token = get().token;
          if (token === null) {
            clearSession(null);
            return;
          }

          const result = await adminFetchSession(token);
          if (result.kind === 'ok') {
            set({
              status: 'signed-in',
              currentAdmin: result.admin,
              permissions: result.permissions,
              connectionError: null,
            });
            return;
          }

          if (result.kind === 'expired') {
            clearSession(null);
            return;
          }

          // 連線問題不清掉 token，恢復連線後重新驗證即可繼續。
          set({
            status: 'signed-out',
            currentAdmin: null,
            permissions: EMPTY_PERMISSIONS,
            connectionError: result.message,
          });
        },

        signIn: async (email, password) => handleOutcome(await adminLogin(email, password)),

        completeSetup: async (email, setupCode, newPassword) =>
          handleOutcome(await adminCompleteSetup(email, setupCode, newPassword)),

        changePassword: async (currentPassword, newPassword) => {
          const token = get().token;
          if (token === null) {
            return { kind: 'rejected', message: '登入狀態已過期，請重新登入。' };
          }

          const outcome = await adminChangePassword(token, currentPassword, newPassword);
          if (outcome.kind === 'ok') {
            // 變更密碼會撤銷其他工作階段，這裡換成伺服器新發的 token。
            set({ token: outcome.session.token, connectionError: null });
            useAdminAuditStore.getState().log({
              adminId: outcome.session.admin.id,
              adminName: outcome.session.admin.name,
              kind: 'account',
              summary: '變更自己的管理員密碼（其他裝置已強制登出）',
            });
          }
          return outcome;
        },

        signOut: async () => {
          const { token, currentAdmin } = get();
          if (currentAdmin !== null) {
            useAdminAuditStore.getState().log({
              adminId: currentAdmin.id,
              adminName: currentAdmin.name,
              kind: 'auth',
              summary: '管理員登出平台',
            });
          }

          clearSession(null);
          if (token !== null) await adminLogout(token);
        },
      };
    },
    {
      name: 'instantgig-admin-auth',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      partialize: (state) => ({ token: state.token }),
      /** v2 以前把帳號（含明文密碼）存在瀏覽器，一律作廢並要求重新登入。 */
      migrate: () => ({ token: null }),
      merge: (persisted, current) => ({ ...current, token: readPersistedToken(persisted) }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

/** 目前登入的管理員是否具備某項權限（介面顯示用；授權由後端再檢查一次）。 */
export function useAdminCan(permission: AdminPermission): boolean {
  return useAdminAuthStore((state) => state.permissions.includes(permission));
}
