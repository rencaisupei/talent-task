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

export interface TrustProfileInput {
  summary: RatingSummary;
  completedJobs: number;
  /** 已通過發布內容的即時認證。 */
  aiVerified: boolean;
  /** 證照經人工驗證（加分項）。 */
  credentialVerified: boolean;
}

/**
 * 信任度總分（0 至 100）。
 * AI 認證為基礎門檻，證照僅作為加分，其餘由完成件數與評價決定。
 */
export function trustScore({
  summary,
  completedJobs,
  aiVerified,
  credentialVerified,
}: TrustProfileInput): number {
  const base = aiVerified ? 35 : 0;
  const credential = credentialVerified ? 10 : 0;
  const experience = Math.min(25, completedJobs * 0.8);
  const rating = summary.count > 0 ? (summary.average / 5) * 30 : 0;
  return Math.min(100, Math.round(base + credential + experience + rating));
}

/** 公開檔案上的信任標籤清單（含 AI 認證與證照加分）。 */
export function trustSignals(input: TrustProfileInput): TrustBadge[] {
  const signals: TrustBadge[] = [];
  signals.push(
    input.aiVerified
      ? { label: 'AI 已認證', tone: 'brand' }
      : { label: '認證複審中', tone: 'coral' },
  );
  if (input.credentialVerified) signals.push({ label: '證照已驗證（加分）', tone: 'brand' });
  signals.push(trustBadge(input.summary, input.completedJobs));
  return signals;
}
