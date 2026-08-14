import { REGION_ANY } from '@/lib/regions';
import type { BudgetLevelId, Gig } from '@/lib/types';

export type GigSort = 'urgent' | 'newest' | 'budgetHigh';

export const GIG_SORT_OPTIONS: { id: GigSort; label: string }[] = [
  { id: 'urgent', label: '急件優先' },
  { id: 'newest', label: '最新發布' },
  { id: 'budgetHigh', label: '預算高至低' },
];

export interface GigFilters {
  keyword: string;
  region: string;
  categoryId: string | null;
  budgetLevels: BudgetLevelId[];
  urgentOnly: boolean;
  /** 僅顯示符合我的認證標籤的任務。 */
  skillOnly: boolean;
  sort: GigSort;
}

export const DEFAULT_GIG_FILTERS: GigFilters = {
  keyword: '',
  region: REGION_ANY,
  categoryId: null,
  budgetLevels: [],
  urgentOnly: false,
  skillOnly: true,
  sort: 'urgent',
};

const BUDGET_RANK: Record<BudgetLevelId, number> = { B4: 4, B3: 3, B2: 2, B1: 1, B5: 0 };

/** 已套用的篩選條件數量（關鍵字不計入，會另外顯示）。 */
export function activeFilterCount(filters: GigFilters): number {
  let count = 0;
  if (filters.region !== REGION_ANY) count += 1;
  if (filters.categoryId) count += 1;
  if (filters.budgetLevels.length > 0) count += 1;
  if (filters.urgentOnly) count += 1;
  if (filters.skillOnly) count += 1;
  if (filters.sort !== DEFAULT_GIG_FILTERS.sort) count += 1;
  return count;
}

function matchesKeyword(gig: Gig, keyword: string): boolean {
  if (keyword.length === 0) return true;
  const haystack = `${gig.title} ${gig.tag} ${gig.detail} ${gig.location.region} ${gig.clientName}`;
  return haystack.toLowerCase().includes(keyword);
}

export interface GigFilterContext {
  skills: string[];
}

export function applyGigFilters(
  gigs: Gig[],
  filters: GigFilters,
  context: GigFilterContext,
): Gig[] {
  const keyword = filters.keyword.trim().toLowerCase();

  const scoped = gigs.filter((gig) => {
    if (!matchesKeyword(gig, keyword)) return false;
    if (filters.region !== REGION_ANY && gig.location.region !== filters.region) return false;
    if (filters.categoryId && gig.categoryId !== filters.categoryId) return false;
    if (filters.budgetLevels.length > 0 && !filters.budgetLevels.includes(gig.budgetLevel)) {
      return false;
    }
    if (filters.urgentOnly && !gig.isUrgent) return false;
    if (filters.skillOnly && !context.skills.includes(gig.tag)) return false;
    return true;
  });

  return [...scoped].sort((a, b) => {
    if (filters.sort === 'budgetHigh') {
      const diff = BUDGET_RANK[b.budgetLevel] - BUDGET_RANK[a.budgetLevel];
      if (diff !== 0) return diff;
    }
    if (filters.sort === 'urgent' && a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
    return b.createdAt - a.createdAt;
  });
}
