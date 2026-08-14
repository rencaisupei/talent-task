import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SEED_REVIEWS } from '@/lib/seed';
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

interface ReviewState {
  reviews: Review[];
  addReview: (input: AddReviewInput) => Review;
}

export function findReview(reviews: Review[], gigId: string, authorId: string): Review | undefined {
  return reviews.find((review) => review.gigId === gigId && review.authorId === authorId);
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
      reviews: SEED_REVIEWS,

      addReview: ({
        gig,
        authorId,
        authorName,
        targetId,
        targetName,
        targetRole,
        stars,
        comment,
      }) => {
        const review: Review = {
          id: `review_${Date.now()}`,
          gigId: gig.id,
          gigTitle: gig.title,
          tag: gig.tag,
          authorId,
          authorName,
          targetId,
          targetName,
          targetRole,
          stars,
          comment: comment.trim(),
          createdAt: Date.now(),
        };

        set((state) => ({
          reviews: [
            review,
            ...state.reviews.filter(
              (item) => !(item.gigId === review.gigId && item.authorId === review.authorId),
            ),
          ],
        }));

        useNotificationStore.getState().pushNotification({
          kind: 'review',
          title: '評價已送出',
          body: `已給 ${targetName} ${stars} 星評價，將計入平台信任度分數。`,
          gigId: gig.id,
          talentId: targetRole === 'talent' ? targetId : undefined,
        });

        return review;
      },
    }),
    {
      name: 'instantgig-reviews',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
