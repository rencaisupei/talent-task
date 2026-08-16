import type { AdminRole } from '@/lib/types';

/**
 * 管理平台的權限單位。角色對應的權限表在前後端各有一份：
 * - 這份負責介面顯示（隱藏模組、停用按鈕）。
 * - admin-auth 後端函式那份負責真正的授權（帳號管理動作會再檢查一次）。
 * 兩份必須同步修改。
 */
export type AdminPermission =
  | 'review:manage'
  | 'users:view'
  | 'users:manage'
  | 'gigs:manage'
  | 'revenue:view'
  | 'revenue:manage'
  | 'announcements:send'
  | 'audit:view'
  | 'admins:manage';

export const ADMIN_PERMISSIONS: readonly AdminPermission[] = [
  'review:manage',
  'users:view',
  'users:manage',
  'gigs:manage',
  'revenue:view',
  'revenue:manage',
  'announcements:send',
  'audit:view',
  'admins:manage',
];

export const ADMIN_PERMISSION_LABEL: Record<AdminPermission, string> = {
  'review:manage': 'AI 認證複審與檢舉處理',
  'users:view': '檢視使用者總表',
  'users:manage': '封禁、解禁與帳號備註',
  'gigs:manage': '任務下架與內容管理',
  'revenue:view': '檢視訂閱與營收帳務',
  'revenue:manage': '開通、取消與退款訂閱',
  'announcements:send': '系統公告與推播',
  'audit:view': '稽核與登入紀錄',
  'admins:manage': '管理員帳號管理',
};

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  owner: [
    'review:manage',
    'users:view',
    'users:manage',
    'gigs:manage',
    'revenue:view',
    'revenue:manage',
    'announcements:send',
    'audit:view',
    'admins:manage',
  ],
  moderator: ['review:manage', 'users:view', 'users:manage', 'gigs:manage', 'audit:view'],
  analyst: ['users:view', 'revenue:view', 'audit:view'],
};

export const ADMIN_ROLE_SUMMARY: Record<AdminRole, string> = {
  owner: '全部管理模組，並可新增、停用與重設其他管理員',
  moderator: '審核複審、封禁處置、任務下架與稽核紀錄（不含營收與帳號管理）',
  analyst: '唯讀：使用者總表、營收帳務與稽核紀錄',
};

export function isAdminPermission(value: unknown): value is AdminPermission {
  return typeof value === 'string' && (ADMIN_PERMISSIONS as readonly string[]).includes(value);
}

export function roleHasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return ADMIN_ROLE_PERMISSIONS[role].includes(permission);
}
