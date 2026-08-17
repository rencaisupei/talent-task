import { getBiltClient } from '@/lib/bilt';
import type { NotificationInsert, NotificationRow } from '@/lib/remote/rows';
import { REMOTE_UNCONFIGURED_MESSAGE, remoteError, type RemoteResult } from '@/lib/remote/shared';
import type { AppNotification, NotificationKind } from '@/lib/types';

const NOTIFICATION_FETCH_LIMIT = 120;
/** 一次最多清掉多少筆超額通知（維護每天都會跑，不需要一次掃完）。 */
const OVERFLOW_SCAN_LIMIT = 200;

export const NOTIFICATION_OFFLINE_MESSAGE = '無法讀取通知中心，請確認網路後重新整理。';

export function rowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    createdAt: Date.parse(row.created_at),
    isRead: row.is_read,
    gigId: row.gig_id ?? undefined,
    conversationId: row.conversation_id ?? undefined,
    talentId: row.talent_ref ?? undefined,
  };
}

/** 讀取我的通知（RLS 只回傳自己的列）。 */
export async function fetchRemoteNotifications(): Promise<RemoteResult<AppNotification[]>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { data, error } = await client
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(NOTIFICATION_FETCH_LIMIT);

  if (error !== null || data === null) return remoteError(NOTIFICATION_OFFLINE_MESSAGE);

  return { status: 'ok', data: data.map(rowToNotification) };
}

export interface RemoteNotificationDraft {
  kind: NotificationKind;
  title: string;
  body: string;
  gigId?: string;
  conversationId?: string;
  talentId?: string;
}

/** 寫入一則通知。收件人只會是自己（RLS 要求 user_id = auth.uid()）。 */
export async function insertRemoteNotification(
  userId: string,
  draft: RemoteNotificationDraft,
): Promise<RemoteResult<AppNotification>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const payload: NotificationInsert = {
    user_id: userId,
    kind: draft.kind,
    title: draft.title,
    body: draft.body,
    gig_id: draft.gigId ?? null,
    conversation_id: draft.conversationId ?? null,
    talent_ref: draft.talentId ?? null,
  };

  const { data, error } = await client.from('notifications').insert(payload).select('*').single();
  if (error !== null || data === null) return remoteError(NOTIFICATION_OFFLINE_MESSAGE);

  return { status: 'ok', data: rowToNotification(data) };
}

export async function markRemoteNotificationRead(id: string): Promise<boolean> {
  const client = getBiltClient();
  if (client === null) return false;

  const { error } = await client.from('notifications').update({ is_read: true }).eq('id', id);
  return error === null;
}

export async function markAllRemoteNotificationsRead(userId: string): Promise<boolean> {
  const client = getBiltClient();
  if (client === null) return false;

  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  return error === null;
}

export async function clearRemoteNotifications(userId: string): Promise<boolean> {
  const client = getBiltClient();
  if (client === null) return false;

  const { error } = await client.from('notifications').delete().eq('user_id', userId);
  return error === null;
}

/**
 * 每日維護：刪掉已讀且過舊的通知，再把總量壓回保留上限。
 * 未讀通知不會因為時間被刪除，只有超出總量上限時才會。
 * 回傳刪除筆數，連不上雲端時回傳 null。
 */
export async function pruneRemoteNotifications(options: {
  userId: string;
  maxAgeMs: number;
  keep: number;
}): Promise<number | null> {
  const client = getBiltClient();
  if (client === null) return null;

  const cutoff = new Date(Date.now() - options.maxAgeMs).toISOString();

  const aged = await client
    .from('notifications')
    .delete()
    .eq('user_id', options.userId)
    .eq('is_read', true)
    .lt('created_at', cutoff)
    .select('id');

  if (aged.error !== null) return null;
  let removed = aged.data?.length ?? 0;

  const overflow = await client
    .from('notifications')
    .select('id')
    .eq('user_id', options.userId)
    .order('created_at', { ascending: false })
    .range(options.keep, options.keep + OVERFLOW_SCAN_LIMIT - 1);

  if (overflow.error !== null || overflow.data === null || overflow.data.length === 0) {
    return removed;
  }

  const dropped = await client
    .from('notifications')
    .delete()
    .in(
      'id',
      overflow.data.map((row) => row.id),
    )
    .select('id');

  if (dropped.error === null) removed += dropped.data?.length ?? 0;

  return removed;
}
