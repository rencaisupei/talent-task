import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SEED_AUDIT_LOG } from '@/lib/adminSeed';
import type { AdminAuditEntry } from '@/lib/types';

export type AuditLogInput = Omit<AdminAuditEntry, 'id' | 'at'>;

interface AdminAuditState {
  entries: AdminAuditEntry[];
  log: (input: AuditLogInput) => void;
}

/** 管理員操作稽核紀錄：所有管理動作都會寫入這裡。 */
export const useAdminAuditStore = create<AdminAuditState>()(
  persist(
    (set) => ({
      entries: SEED_AUDIT_LOG,

      log: (input) =>
        set((state) => ({
          entries: [
            {
              ...input,
              id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              at: Date.now(),
            },
            ...state.entries,
          ].slice(0, 300),
        })),
    }),
    {
      name: 'instantgig-admin-audit',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
