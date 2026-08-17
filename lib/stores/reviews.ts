import { create } from 'zustand';

import { fetchRemoteReviews, upsertRemoteReview } from '@/lib/remote/reviews';
import { SEED_REVIEWS } from '@/lib/seed';
import type { CloudLoadState } from '@/lib/stores/gigs';
import { useNotificationStore } from '@/lib/stores/notifications';
import type { Gig, Review, UserRole } from '@/lib/types';

export interface AddReviewInput {
  gig: Gig;
  authorId: string;
  authorName: string;
  targetId: string;
  targetName: string;
  targetRole: UserRole;
  stars: number;
  comment: string;
}

export type ReviewWriteResult =
  | { status: 'ok'; review: Review }
  | { status: 'error'; message: string };

interface ReviewState {
  /** 雲端的真實評價，加上示範人才的歷史評價（唯讀，見下方說明）。 */
  reviews: Review[];
  loadState: CloudLoadState;
  isRefreshing: boolean;
  errorMessage: string | null;

  refreshReviews: () => Promise<void>;
  addReview: (input: AddReviewInput) => Promise<ReviewWriteResult>;
}

export function findReview(reviews: Review[], gigId: string, authorId: string): Review | undefined {
  if (authorId.length === 0) return undefined;
  return reviews.find((review) => review.gigId === gigId && review.authorId === authorId);
}

/**
 * 評價存在 bilt-cloud 的 reviews 資料表，這個 store 是雲端資料的快取。
 *
 * 評價公開可讀（會顯示在對方的檔案並計入信任度），因此訪客也讀得到；
 * 寫入時由 RLS 的 can_review_gig() 確認「任務已完成，而且你是這筆任務的當事人」，
 * 所以無法對陌生人留下評價。擁有者是帳號，登出再登入評價都還在。
 *
 * SEED_REVIEWS 是示範人才（talent_seed_*）的歷史評價。示範人才不是帳號、
 * 也沒有對應的任務，寫進資料庫就必須讓 gig_id 與雙方 id 可為空並加上示範旗標，
 * 那會削弱上面那道寫入檢查，因此這些評價留在 App 的示範資料裡合併顯示。
 */
export const useReviewStore = create<ReviewState>()((set) => ({
  reviews: SEED_REVIEWS,
  loadState: 'idle',
  isRefreshing: false,
  errorMessage: null,

  refreshReviews: async () => {
    set((state) => ({
      isRefreshing: true,
      loadState: state.loadState === 'ready' ? 'ready' : 'loading',
    }));

    const result = await fetchRemoteReviews();
    if (result.status === 'error') {
      set((state) => ({
        isRefreshing: false,
        loadState: state.loadState === 'ready' ? 'ready' : 'error',
        errorMessage: result.message,
      }));
      return;
    }

    set({
      reviews: [...result.data, ...SEED_REVIEWS],
      loadState: 'ready',
      isRefreshing: false,
      errorMessage: null,
    });
  },

  addReview: async (input) => {
    const result = await upsertRemoteReview({
      gigId: input.gig.id,
      gigTitle: input.gig.title,
      tag: input.gig.tag,
      authorId: input.authorId,
      authorName: input.authorName,
      targetId: input.targetId,
      targetName: input.targetName,
      targetRole: input.targetRole,
      stars: input.stars,
      comment: input.comment,
    });

    if (result.status === 'error') {
      set({ errorMessage: result.message });
      return result;
    }

    const review = result.data;
    set((state) => ({
      reviews: [
        review,
        ...state.reviews.filter(
          (item) => !(item.gigId === review.gigId && item.authorId === review.authorId),
        ),
      ],
      errorMessage: null,
    }));

    useNotificationStore.getState().pushNotification({
      kind: 'review',
      title: '評價已送出',
      body: `已給 ${review.targetName} ${review.stars} 星評價，將計入平台信任度分數。`,
      gigId: review.gigId,
      talentId: review.targetRole === 'talent' ? review.targetId : undefined,
    });

    return { status: 'ok', review };
  },
}));
