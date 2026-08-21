import { getBiltClient } from '@/lib/bilt';
import type { BlockedUserRow } from '@/lib/remote/rows';
import { REMOTE_UNCONFIGURED_MESSAGE, remoteError, type RemoteResult } from '@/lib/remote/shared';

/** 一筆封鎖紀錄（我封鎖了誰）。 */
export interface BlockedUser {
  id: string;
  name: string;
  reason: string | null;
  at: number;
}

export const BLOCK_OFFLINE_MESSAGE = '無法連線到雲端，封鎖設定尚未儲存。';
export const BLOCK_FAILED_MESSAGE = '封鎖失敗，請稍後再試。';
export const UNBLOCK_FAILED_MESSAGE = '解除封鎖失敗，請稍後再試。';

const BLOCK_FETCH_LIMIT = 200;

export function rowToBlockedUser(row: BlockedUserRow): BlockedUser {
  return {
    id: row.blocked_id,
    name: row.blocked_name.length > 0 ? row.blocked_name : '已封鎖的使用者',
    reason: row.reason,
    at: Date.parse(row.created_at),
  };
}

/**
 * 讀取我的封鎖名單。
 *
 * RLS 只回傳 blocker_id = auth.uid() 的列，所以查詢不加身分條件；
 * 別人是否封鎖了我永遠讀不到（避免變成偵測工具），封鎖的效果由伺服器端的
 * send_message / start_conversation 以 is_blocked_pair() 雙向套用。
 */
export async function fetchRemoteBlocks(): Promise<RemoteResult<BlockedUser[]>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { data, error } = await client
    .from('blocked_users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(BLOCK_FETCH_LIMIT);

  if (error !== null || data === null) return remoteError(BLOCK_OFFLINE_MESSAGE);

  return { status: 'ok', data: data.map(rowToBlockedUser) };
}

/** 封鎖一個帳號。重複封鎖同一個人視為成功（upsert 同一組主鍵）。 */
export async function addRemoteBlock(
  blockerId: string,
  blockedId: string,
  blockedName: string,
  reason: string | null,
): Promise<RemoteResult<BlockedUser>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { data, error } = await client
    .from('blocked_users')
    .upsert(
      {
        blocker_id: blockerId,
        blocked_id: blockedId,
        blocked_name: blockedName,
        reason,
      },
      { onConflict: 'blocker_id,blocked_id' },
    )
    .select('*')
    .maybeSingle();

  if (error !== null || data === null) return remoteError(BLOCK_FAILED_MESSAGE);

  return { status: 'ok', data: rowToBlockedUser(data) };
}

/** 解除封鎖。 */
export async function removeRemoteBlock(
  blockerId: string,
  blockedId: string,
): Promise<RemoteResult<true>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { error } = await client
    .from('blocked_users')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);

  if (error !== null) return remoteError(UNBLOCK_FAILED_MESSAGE);

  return { status: 'ok', data: true };
}
