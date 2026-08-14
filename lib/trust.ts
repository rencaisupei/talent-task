import type { Review } from '@/lib/types';

export interface RatingSummary {
  average: number;
  count: number;
  /** 1 至 5 星的評價筆數（索引 0 為 1 星）。 */
  distribution: number[];
}

export const EMPTY_RATING: RatingSummary = { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] };

export function reviewsForUser(reviews: Review[], userId: string): Review[] {
  return reviews.filter((review) => review.targetId === userId);
}

export function reviewsByUser(reviews: Review[], userId: string): Review[] {
  return reviews.filter((review) => review.authorId === userId);
}

export function summarizeReviews(reviews: Review[]): RatingSummary {
  if (reviews.length === 0) return EMPTY_RATING;
  const distribution = [0, 0, 0, 0, 0];
  let total = 0;
  for (const review of reviews) {
    const stars = Math.min(5, Math.max(1, Math.round(review.stars)));
    distribution[stars - 1] += 1;
    total += stars;
  }
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
    distribution,
  };
}

/** 平均回應時間文案。 */
export function formatResponseTime(minutes: number): string {
  if (minutes < 60) return `平均 ${minutes} 分鐘回覆`;
  const hours = Math.round(minutes / 60);
  return `平均 ${hours} 小時回覆`;
}

export interface TrustBadge {
  label: string;
  tone: 'brand' | 'coral' | 'neutral';
}

/** 依評價平均與完成件數換算信任等級。 */
export function trustBadge(summary: RatingSummary, completedJobs: number): TrustBadge {
  if (summary.count >= 3 && summary.average >= 4.8 && completedJobs >= 30) {
    return { label: '頂級口碑', tone: 'brand' };
  }
  if (summary.count >= 2 && summary.average >= 4.5) return { label: '高評價', tone: 'brand' };
  if (summary.count === 0) return { label: '新加入', tone: 'coral' };
  return { label: '穩定合作', tone: 'neutral' };
}
