import { getBiltClient } from '@/lib/bilt';
import type { ReviewInsert, ReviewRow } from '@/lib/remote/rows';
import {
  REMOTE_OFFLINE_MESSAGE,
  REMOTE_UNCONFIGURED_MESSAGE,
  remoteError,
  type RemoteResult,
} from '@/lib/remote/shared';
import type { Review, UserRole } from '@/lib/types';

const REVIEW_FETCH_LIMIT = 500;

export const REVIEW_SAVE_FAILED_MESSAGE =
  '評價送出失敗。任務必須已標記完成，而且只有這筆任務的雙方能互相評價。';

export function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    gigId: row.gig_id,
    gigTitle: row.gig_title,
    tag: row.tag,
    authorId: row.author_id,
    authorName: row.author_name,
    targetId: row.target_id,
    targetName: row.target_name,
    targetRole: row.target_role,
    stars: row.stars,
    comment: row.comment,
    createdAt: Date.parse(row.created_at),
  };
}

/**
 * 讀取平台上的真實評價。
 *
 * 評價是公開資料（會顯示在對方的檔案並計入信任度），因此 RLS 的 SELECT 對所有人開放，
 * 訪客瀏覽人才檔案時也讀得到；寫入才需要登入並通過 can_review_gig() 檢查。
 */
export async function fetchRemoteReviews(): Promise<RemoteResult<Review[]>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { data, error } = await client
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(REVIEW_FETCH_LIMIT);

  if (error !== null || data === null) return remoteError(REMOTE_OFFLINE_MESSAGE);

  return { status: 'ok', data: data.map(rowToReview) };
}

export interface RemoteReviewDraft {
  gigId: string;
  gigTitle: string;
  tag: string;
  authorId: string;
  authorName: string;
  targetId: string;
  targetName: string;
  targetRole: UserRole;
  stars: number;
  comment: string;
}

/**
 * 送出（或覆蓋）我對這筆任務的評價。
 * (gig_id, author_id) 有唯一索引，重新評價會直接覆蓋原本那一則。
 */
export async function upsertRemoteReview(draft: RemoteReviewDraft): Promise<RemoteResult<Review>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const payload: ReviewInsert = {
    gig_id: draft.gigId,
    gig_title: draft.gigTitle,
    tag: draft.tag,
    author_id: draft.authorId,
    author_name: draft.authorName,
    target_id: draft.targetId,
    target_name: draft.targetName,
    target_role: draft.targetRole,
    stars: draft.stars,
    comment: draft.comment.trim(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('reviews')
    .upsert(payload, { onConflict: 'gig_id,author_id' })
    .select('*')
    .single();

  if (error !== null || data === null) return remoteError(REVIEW_SAVE_FAILED_MESSAGE);

  return { status: 'ok', data: rowToReview(data) };
}
