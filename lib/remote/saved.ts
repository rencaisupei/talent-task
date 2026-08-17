import { getBiltClient } from '@/lib/bilt';
import type { SavedGigInsert } from '@/lib/remote/rows';
import { REMOTE_UNCONFIGURED_MESSAGE, remoteError, type RemoteResult } from '@/lib/remote/shared';

const SAVED_FETCH_LIMIT = 500;

export const SAVED_OFFLINE_MESSAGE = '無法讀取收藏清單，請確認網路後重新整理。';
export const SAVED_WRITE_FAILED_MESSAGE = '收藏更新失敗，請稍後再試。';

/**
 * 讀取我的收藏。
 * RLS 只回傳自己的列，因此查詢不需要（也不應該）再加身分條件。
 */
export async function fetchRemoteSavedGigIds(): Promise<RemoteResult<string[]>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { data, error } = await client
    .from('saved_gigs')
    .select('gig_id')
    .order('created_at', { ascending: false })
    .limit(SAVED_FETCH_LIMIT);

  if (error !== null || data === null) return remoteError(SAVED_OFFLINE_MESSAGE);

  return { status: 'ok', data: data.map((row) => row.gig_id) };
}

export async function addRemoteSavedGig(
  userId: string,
  gigId: string,
): Promise<RemoteResult<true>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const payload: SavedGigInsert = { user_id: userId, gig_id: gigId };
  // 主鍵是 (user_id, gig_id)。刻意用「忽略重複」而不是覆寫：saved_gigs 沒有 UPDATE 政策，
  // ON CONFLICT DO UPDATE 會被 RLS 擋下，重複收藏同一筆任務也不該算錯誤。
  const { error } = await client
    .from('saved_gigs')
    .upsert(payload, { onConflict: 'user_id,gig_id', ignoreDuplicates: true });

  if (error !== null) return remoteError(SAVED_WRITE_FAILED_MESSAGE);

  return { status: 'ok', data: true };
}

export async function removeRemoteSavedGig(gigId: string): Promise<RemoteResult<true>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { error } = await client.from('saved_gigs').delete().eq('gig_id', gigId);
  if (error !== null) return remoteError(SAVED_WRITE_FAILED_MESSAGE);

  return { status: 'ok', data: true };
}
