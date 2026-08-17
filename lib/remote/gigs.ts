import { getBiltClient } from '@/lib/bilt';
import type { GigInsert, GigRow, GigUpdate } from '@/lib/remote/rows';
import {
  REMOTE_OFFLINE_MESSAGE,
  REMOTE_UNCONFIGURED_MESSAGE,
  remoteError,
  type RemoteResult,
  stableSeed,
} from '@/lib/remote/shared';
import { regionCoordinate } from '@/lib/regions';
import type { Gig, GigLocation, PublishReview } from '@/lib/types';

/** 一次最多帶回的任務數；任務牆以建立時間新到舊排序。 */
const GIG_FETCH_LIMIT = 300;

/**
 * 示範資料沒有座標，改用縣市中心點加上依 id 決定的固定偏移，
 * 讓地圖標記不會完全重疊，而且每次載入的位置都一致。
 */
function coordinatesFor(row: GigRow): { latitude: number; longitude: number } {
  if (row.latitude !== null && row.longitude !== null) {
    return { latitude: row.latitude, longitude: row.longitude };
  }

  const base = regionCoordinate(row.region);
  const seed = stableSeed(row.id);
  return {
    latitude: base.latitude + ((((seed % 1000) / 1000) * 2 - 1) * 8) / 100,
    longitude: base.longitude + (((((seed >> 7) % 1000) / 1000) * 2 - 1) * 8) / 100,
  };
}

function reviewFromRow(row: GigRow): PublishReview | undefined {
  if (row.review === null) return undefined;
  // review_state 欄位才是真相來源（管理員複審會直接改它）。
  return { ...row.review, state: row.review_state };
}

export function rowToGig(row: GigRow): Gig {
  const location: GigLocation = {
    region: row.region,
    detail: row.location_detail ?? undefined,
    source: row.location_source,
    ...coordinatesFor(row),
  };

  return {
    id: row.id,
    title: row.title,
    categoryId: row.category_id,
    tag: row.tag,
    detail: row.detail,
    location,
    budgetLevel: row.budget_level,
    isUrgent: row.is_urgent,
    clientId: row.client_id ?? row.demo_client_ref ?? '',
    clientName: row.client_name,
    createdAt: Date.parse(row.created_at),
    status: row.status,
    assignedTalentId: row.assigned_talent_id ?? undefined,
    assignedTalentName: row.assigned_talent_name ?? undefined,
    completedAt: row.completed_at === null ? undefined : Date.parse(row.completed_at),
    takedownReason: row.takedown_reason ?? undefined,
    takedownAt: row.takedown_at === null ? undefined : Date.parse(row.takedown_at),
    autoClosedAt: row.auto_closed_at === null ? undefined : Date.parse(row.auto_closed_at),
    review: reviewFromRow(row),
  };
}

/**
 * 讀取目前身分可見的任務。
 *
 * RLS 決定可見範圍：已通過認證且未下架的任務所有人（含訪客）都看得到，
 * 發案者與承接人才另外看得到自己的待複審、被退回與已下架任務。
 */
export async function fetchRemoteGigs(): Promise<RemoteResult<Gig[]>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { data, error } = await client
    .from('gigs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(GIG_FETCH_LIMIT);

  if (error !== null || data === null) return remoteError(REMOTE_OFFLINE_MESSAGE);

  return { status: 'ok', data: data.map(rowToGig) };
}

export interface RemoteGigDraft {
  clientId: string;
  clientName: string;
  title: string;
  categoryId: string;
  tag: string;
  detail: string;
  location: GigLocation;
  budgetLevel: Gig['budgetLevel'];
  isUrgent: boolean;
  review: PublishReview;
}

export async function insertRemoteGig(draft: RemoteGigDraft): Promise<RemoteResult<Gig>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const payload: GigInsert = {
    client_id: draft.clientId,
    client_name: draft.clientName,
    title: draft.title,
    category_id: draft.categoryId,
    tag: draft.tag,
    detail: draft.detail,
    region: draft.location.region,
    location_detail: draft.location.detail ?? null,
    latitude: draft.location.latitude ?? null,
    longitude: draft.location.longitude ?? null,
    location_source: draft.location.source,
    budget_level: draft.budgetLevel,
    is_urgent: draft.isUrgent,
    status: 'open',
    review_state: draft.review.state,
    review: draft.review,
  };

  const { data, error } = await client.from('gigs').insert(payload).select('*').single();
  if (error !== null || data === null) return remoteError('任務發布失敗，請稍後再試。');

  return { status: 'ok', data: rowToGig(data) };
}

export async function updateRemoteGig(
  gigId: string,
  patch: GigUpdate,
  failureMessage: string,
): Promise<RemoteResult<Gig>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { data, error } = await client
    .from('gigs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', gigId)
    .select('*')
    .single();

  if (error !== null || data === null) return remoteError(failureMessage);

  return { status: 'ok', data: rowToGig(data) };
}

/**
 * 人才開啟對話時把任務推進到「對話中」。
 * 他不是發案者，RLS 不允許直接更新，因此走 SECURITY DEFINER 的 RPC。
 * 函式只允許與該任務有關的人（發案者、投標的人才、已有對話的一方）推進，
 * 其他帳號一律回傳 false 且不會改到資料。
 */
export async function markGigTalkingRemote(gigId: string): Promise<boolean> {
  const client = getBiltClient();
  if (client === null) return false;

  const { data, error } = await client.rpc('mark_gig_talking', { gid: gigId });
  return error === null && data;
}

/**
 * 每日維護：把逾期未成交的任務自動結案，回傳結案筆數（無法連線時回傳 null）。
 *
 * 規則寫在資料庫函式裡，但**裝置端呼叫只會結掉自己發布的任務**：
 * 全平台清理保留給帶 service_role 金鑰的伺服器排程，
 * 否則未登入的訪客也能一次結案全平台的任務。
 */
export async function closeStaleGigsRemote(maxAgeDays: number): Promise<number | null> {
  const client = getBiltClient();
  if (client === null) return null;

  const { data, error } = await client.rpc('close_stale_gigs', { max_age_days: maxAgeDays });
  if (error !== null || typeof data !== 'number') return null;
  return data;
}
