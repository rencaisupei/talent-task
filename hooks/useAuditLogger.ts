import { useCallback } from 'react';

import { useAdminAuthStore } from '@/lib/stores/adminAuth';
import { type AuditLogInput, useAdminAuditStore } from '@/lib/stores/adminAudit';
import type { AdminActionKind } from '@/lib/types';

export interface AuditActionInput {
  kind: AdminActionKind;
  summary: string;
  targetId?: string;
  targetLabel?: string;
}

/** 以目前登入的管理員身分寫入操作稽核紀錄。 */
export function useAuditLogger() {
  const currentAdmin = useAdminAuthStore((state) => state.currentAdmin);
  const log = useAdminAuditStore((state) => state.log);

  return useCallback(
    (input: AuditActionInput) => {
      const entry: AuditLogInput = {
        ...input,
        adminId: currentAdmin?.id ?? 'admin_system',
        adminName: currentAdmin?.name ?? '系統',
      };
      log(entry);
    },
    [currentAdmin, log],
  );
}
