import { getBiltClient } from '@/lib/bilt';
import type { BidInsert, BidRow } from '@/lib/remote/rows';
import {
  REMOTE_OFFLINE_MESSAGE,
  REMOTE_UNCONFIGURED_MESSAGE,
  remoteError,
  type RemoteResult,
} from '@/lib/remote/shared';
import type { Bid, PublishReview } from '@/lib/types';

const BID_FETCH_LIMIT = 300;

function reviewFromRow(row: BidRow): PublishReview | undefined {
  if (row.review === null) return undefined;
  return { ...row.review, state: row.review_state };
}

export function rowToBid(row: BidRow): Bid {
  return {
    id: row.id,
    gigId: row.gig_id,
    gigTitle: row.gig_title,
    tag: row.tag,
    clientId: row.client_id ?? '',
    talentId: row.talent_id ?? row.demo_talent_ref ?? '',
    talentName: row.talent_name,
    talentRegion: row.talent_region,
    quote: row.quote,
    etaLabel: row.eta_label,
    message: row.message,
    createdAt: Date.parse(row.created_at),
    status: row.status,
    review: reviewFromRow(row),
  };
}

/**
 * 讀取目前身分可見的提案。
 *
 * RLS 決定可見範圍：示範提案所有人都看得到，其餘只有投標的人才本人
 * 與該任務的發案者看得到（不會外流其他人的報價）。
 */
export async function fetchRemoteBids(): Promise<RemoteResult<Bid[]>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { data, error } = await client
    .from('bids')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(BID_FETCH_LIMIT);

  if (error !== null || data === null) return remoteError(REMOTE_OFFLINE_MESSAGE);

  return { status: 'ok', data: data.map(rowToBid) };
}

export interface RemoteBidDraft {
  /** 有值代表修改既有提案（同一個人才對同一任務只會有一份）。 */
  existingId?: string;
  gigId: string;
  gigTitle: string;
  tag: string;
  /** 發案者的 auth.users.id；示範任務沒有帳號，會存成 null。 */
  clientId: string;
  talentId: string;
  talentName: string;
  talentRegion: string;
  quote: number | null;
  etaLabel: string;
  message: string;
  review: PublishReview;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 示範任務的發案者是示範字串而不是帳號 id，寫入時必須換成 null。 */
function accountIdOrNull(value: string): string | null {
  return UUID_PATTERN.test(value) ? value : null;
}

export async function upsertRemoteBid(draft: RemoteBidDraft): Promise<RemoteResult<Bid>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const payload: BidInsert = {
    gig_id: draft.gigId,
    gig_title: draft.gigTitle,
    tag: draft.tag,
    client_id: accountIdOrNull(draft.clientId),
    talent_id: draft.talentId,
    talent_name: draft.talentName,
    talent_region: draft.talentRegion,
    quote: draft.quote,
    eta_label: draft.etaLabel,
    message: draft.message,
    status: 'pending',
    review_state: draft.review.state,
    review: draft.review,
    updated_at: new Date().toISOString(),
  };

  // (gig_id, talent_id) 有唯一索引，重新投遞會直接覆蓋原本那一份。
  const { data, error } = await client
    .from('bids')
    .upsert(payload, { onConflict: 'gig_id,talent_id' })
    .select('*')
    .single();

  if (error !== null || data === null) return remoteError('提案送出失敗，請稍後再試。');

  return { status: 'ok', data: rowToBid(data) };
}

export async function withdrawRemoteBid(bidId: string): Promise<RemoteResult<Bid>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { data, error } = await client
    .from('bids')
    .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
    .eq('id', bidId)
    .select('*')
    .single();

  if (error !== null || data === null) return remoteError('撤回提案失敗，請稍後再試。');

  return { status: 'ok', data: rowToBid(data) };
}

/**
 * 客戶選定提案。這一步要同時改別人的提案與任務指派，
 * RLS 無法限制「只能改哪些欄位」，因此交給 SECURITY DEFINER 的 accept_bid。
 */
export async function acceptRemoteBid(bidId: string): Promise<RemoteResult<true>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { data, error } = await client.rpc('accept_bid', { bid_id: bidId });
  if (error !== null || !data) return remoteError('選定人才失敗，請稍後再試。');

  return { status: 'ok', data: true };
}
