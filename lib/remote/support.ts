import { getBiltClient } from '@/lib/bilt';
import {
  isSupportTicketRow,
  type SupportTicketInsert,
  type SupportTicketRow,
} from '@/lib/remote/rows';
import { REMOTE_OFFLINE_MESSAGE, remoteError, type RemoteResult } from '@/lib/remote/shared';
import type { SupportCategory, SupportTicket, SupportTicketStatus } from '@/lib/types';

const UNCONFIGURED_MESSAGE = '尚未設定後端連線，留言無法送出，請改用客服信箱與我們聯絡。';

const CATEGORIES: readonly SupportCategory[] = [
  'account',
  'gig',
  'payment',
  'report',
  'suggestion',
  'other',
];

function isSupportCategory(value: string): value is SupportCategory {
  return (CATEGORIES as readonly string[]).includes(value);
}

function readCategory(value: unknown): SupportCategory {
  return typeof value === 'string' && isSupportCategory(value) ? value : 'other';
}

function readStatus(value: unknown): SupportTicketStatus {
  return value === 'resolved' ? 'resolved' : 'open';
}

export function rowToSupportTicket(row: SupportTicketRow): SupportTicket {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    category: readCategory(row.category),
    message: row.message,
    status: readStatus(row.status),
    adminNote: row.admin_note,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at === null ? null : Date.parse(row.resolved_at),
    createdAt: Date.parse(row.created_at),
  };
}

export { isSupportTicketRow };

export interface SupportTicketInput {
  /** 已登入時帶入 auth.users.id；訪客留言為 null（RLS 只擋「替別人掛上 user_id」）。 */
  userId: string | null;
  name: string;
  email: string;
  category: SupportCategory;
  message: string;
}

export const SUPPORT_MESSAGE_MIN_LENGTH = 5;
export const SUPPORT_MESSAGE_MAX_LENGTH = 2000;

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** 送出站內留言。回傳寫入後的那一筆，畫面用它顯示受理時間。 */
export async function submitSupportTicket(
  input: SupportTicketInput,
): Promise<RemoteResult<SupportTicket>> {
  const email = input.email.trim();
  const message = input.message.trim();

  if (!EMAIL_PATTERN.test(email)) {
    return remoteError('請填寫可以聯絡到你的電子郵件。');
  }
  if (message.length < SUPPORT_MESSAGE_MIN_LENGTH) {
    return remoteError(`請至少描述 ${SUPPORT_MESSAGE_MIN_LENGTH} 個字，我們才查得到紀錄。`);
  }

  const client = getBiltClient();
  if (client === null) return remoteError(UNCONFIGURED_MESSAGE);

  const payload: SupportTicketInsert = {
    user_id: input.userId === null || input.userId.length === 0 ? null : input.userId,
    name: input.name.trim().slice(0, 60),
    email,
    category: input.category,
    message: message.slice(0, SUPPORT_MESSAGE_MAX_LENGTH),
  };

  const { data, error } = await client
    .from('support_tickets')
    .insert(payload)
    .select('*')
    .maybeSingle();

  if (error !== null) return remoteError(error.message);
  if (!isSupportTicketRow(data)) return remoteError(REMOTE_OFFLINE_MESSAGE);

  return { status: 'ok', data: rowToSupportTicket(data) };
}
