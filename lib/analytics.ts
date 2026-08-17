import { useMemo } from 'react';

import { findCategoryByTag, OMNI_INDUSTRY_TAGS } from '@/lib/omniTags';
import {
  PLATFORM_BASELINE,
  SEED_TAG_HEAT,
  WEEK_LABELS,
  WEEKLY_TREND_ALL,
  WEEKLY_TREND_BY_CATEGORY,
} from '@/lib/seed';
import { useAdminContentStore } from '@/lib/stores/adminContent';
import { PREMIUM_PRICE_TWD, useSessionStore } from '@/lib/stores/session';
import type { WeeklyPoint } from '@/lib/types';

export const CATEGORY_FILTER_ALL = 'ALL';

export interface PlatformAnalytics {
  totalUsers: number;
  activePremiumTalents: number;
  mrrEstimate: number;
  totalBroadcastedGigs: number;
  conversationMatchRate: number;
  trend: WeeklyPoint[];
  topTags: { tag: string; categoryName: string; activity: number }[];
}

export function usePlatformAnalytics(categoryId: string): PlatformAnalytics {
  // 分析只在管理平台使用，因此讀的是管理端的完整任務清單（含待複審與已下架）。
  const gigs = useAdminContentStore((state) => state.gigs);
  const isPremium = useSessionStore((state) => state.isPremium);

  return useMemo(() => {
    const totalUsers = PLATFORM_BASELINE.totalClients + PLATFORM_BASELINE.totalTalents + 1;
    const activePremiumTalents = PLATFORM_BASELINE.premiumTalents + (isPremium ? 1 : 0);
    const totalBroadcastedGigs = PLATFORM_BASELINE.broadcastedGigs + gigs.length;

    // 對話受 RLS 保護（管理平台只讀得到被檢舉或命中關鍵字的那些），
    // 因此媒合率改以任務狀態判斷：離開 open 就代表已進入對話或媒合。
    const localMatched = gigs.filter((gig) => gig.status !== 'open').length;
    const matchedGigs = PLATFORM_BASELINE.matchedGigs + localMatched;

    const baseTrend =
      categoryId === CATEGORY_FILTER_ALL
        ? WEEKLY_TREND_ALL
        : (WEEKLY_TREND_BY_CATEGORY[categoryId] ?? WEEKLY_TREND_ALL);

    const liveThisWeek = gigs.filter(
      (gig) =>
        (categoryId === CATEGORY_FILTER_ALL || gig.categoryId === categoryId) &&
        Date.now() - gig.createdAt < 7 * 24 * 60 * 60 * 1000,
    ).length;

    const trend = baseTrend.map((point, index) =>
      index === WEEK_LABELS.length - 1 ? { ...point, value: point.value + liveThisWeek } : point,
    );

    const heatBoost = new Map<string, number>();
    for (const gig of gigs) {
      heatBoost.set(gig.tag, (heatBoost.get(gig.tag) ?? 0) + 6);
    }

    const scopedHeat = SEED_TAG_HEAT.filter(
      (entry) => categoryId === CATEGORY_FILTER_ALL || entry.categoryId === categoryId,
    );

    const topTags = [...scopedHeat]
      .map((entry) => ({
        tag: entry.tag,
        categoryName: findCategoryByTag(entry.tag)?.name ?? '',
        activity: entry.activity + (heatBoost.get(entry.tag) ?? 0),
      }))
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 10);

    return {
      totalUsers,
      activePremiumTalents,
      mrrEstimate: activePremiumTalents * PREMIUM_PRICE_TWD,
      totalBroadcastedGigs,
      conversationMatchRate:
        totalBroadcastedGigs === 0 ? 0 : (matchedGigs / totalBroadcastedGigs) * 100,
      trend,
      topTags,
    };
  }, [categoryId, gigs, isPremium]);
}

export const FLAGSHIP_CATEGORIES = OMNI_INDUSTRY_TAGS;
