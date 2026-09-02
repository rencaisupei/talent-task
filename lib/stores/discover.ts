import { create } from 'zustand';

import { DEFAULT_FILTERS, SEED_PROFILES } from '@/lib/data/seed';
import { useMatchesStore } from '@/lib/stores/matches';
import { entitlementsFor, useSubscriptionStore } from '@/lib/stores/subscription';
import type { DiscoverFilters, Profile, SwipeDirection } from '@/lib/types';

export type SwipeOutcome =
  | { kind: 'ok'; matched: boolean; profile: Profile }
  | { kind: 'limit' }
  | { kind: 'no-superlike' }
  | { kind: 'empty' };

interface DiscoverState {
  filters: DiscoverFilters;
  index: number;
  likedIds: string[];
  passedIds: string[];
  superLikedIds: string[];
  likesUsedToday: number;
  history: { id: string; direction: SwipeDirection }[];
  boostUntil: number | null;
  setFilters: (filters: DiscoverFilters) => void;
  resetFilters: () => void;
  swipe: (direction: SwipeDirection) => SwipeOutcome;
  rewind: () => boolean;
  reshuffle: () => void;
  startBoost: () => boolean;
}

export function matchesFilters(profile: Profile, filters: DiscoverFilters) {
  if (profile.age < filters.ageRange[0] || profile.age > filters.ageRange[1]) return false;
  if (profile.distanceKm > filters.maxDistanceKm) return false;
  if (filters.genders.length > 0 && !filters.genders.includes(profile.gender)) return false;
  if (filters.onlineOnly && !profile.online) return false;
  if (filters.verifiedOnly && !profile.verified) return false;
  if (filters.withPhotoOnly && profile.photos.length === 0) return false;
  if (filters.lookingFor !== '不限' && profile.lookingFor !== filters.lookingFor) return false;
  if (
    filters.interests.length > 0 &&
    !filters.interests.some((interest) => profile.interests.includes(interest))
  ) {
    return false;
  }
  return true;
}

export const useDiscoverStore = create<DiscoverState>((set, get) => ({
  filters: DEFAULT_FILTERS,
  index: 0,
  likedIds: [],
  passedIds: [],
  superLikedIds: [],
  likesUsedToday: 0,
  history: [],
  boostUntil: null,

  setFilters: (filters) => set({ filters, index: 0 }),

  resetFilters: () => set({ filters: DEFAULT_FILTERS, index: 0 }),

  swipe: (direction) => {
    const state = get();
    const queue = selectQueue(state);
    const profile = queue[0];
    if (!profile) return { kind: 'empty' };

    const subscription = useSubscriptionStore.getState();
    const grants = entitlementsFor(subscription.tier);

    if (
      direction === 'right' &&
      !grants.unlimitedLikes &&
      state.likesUsedToday >= grants.dailyLikeLimit
    ) {
      return { kind: 'limit' };
    }

    if (direction === 'up' && !subscription.consumeSuperLike()) {
      return { kind: 'no-superlike' };
    }

    const history = [{ id: profile.id, direction }, ...state.history].slice(0, 20);

    if (direction === 'left') {
      set({ passedIds: [...state.passedIds, profile.id], history });
      return { kind: 'ok', matched: false, profile };
    }

    const isSuper = direction === 'up';
    set({
      likedIds: [...state.likedIds, profile.id],
      superLikedIds: isSuper ? [...state.superLikedIds, profile.id] : state.superLikedIds,
      likesUsedToday: state.likesUsedToday + 1,
      history,
    });

    const matchesState = useMatchesStore.getState();
    const matched = isSuper || matchesState.likedYouIds.includes(profile.id);
    if (matched) matchesState.addMatch(profile.id);

    return { kind: 'ok', matched, profile };
  },

  rewind: () => {
    const state = get();
    const last = state.history[0];
    if (!last) return false;
    set({
      history: state.history.slice(1),
      likedIds: state.likedIds.filter((id) => id !== last.id),
      passedIds: state.passedIds.filter((id) => id !== last.id),
      superLikedIds: state.superLikedIds.filter((id) => id !== last.id),
      likesUsedToday:
        last.direction === 'left' ? state.likesUsedToday : Math.max(0, state.likesUsedToday - 1),
    });
    return true;
  },

  reshuffle: () => set({ likedIds: [], passedIds: [], superLikedIds: [], history: [], index: 0 }),

  startBoost: () => {
    if (!useSubscriptionStore.getState().consumeBoost()) return false;
    set({ boostUntil: Date.now() + 30 * 60 * 1000 });
    return true;
  },
}));

function selectQueue(state: DiscoverState) {
  const decided = new Set([...state.likedIds, ...state.passedIds]);
  return SEED_PROFILES.filter(
    (profile) => !decided.has(profile.id) && matchesFilters(profile, state.filters),
  );
}

export function useDiscoverQueue() {
  const filters = useDiscoverStore((state) => state.filters);
  const likedIds = useDiscoverStore((state) => state.likedIds);
  const passedIds = useDiscoverStore((state) => state.passedIds);

  const decided = new Set([...likedIds, ...passedIds]);
  return SEED_PROFILES.filter(
    (profile) => !decided.has(profile.id) && matchesFilters(profile, filters),
  );
}

export function useFilteredCount() {
  const filters = useDiscoverStore((state) => state.filters);
  return SEED_PROFILES.filter((profile) => matchesFilters(profile, filters)).length;
}
