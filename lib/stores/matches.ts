import { create } from 'zustand';

import {
  LIKED_YOU_IDS,
  SEED_CONVERSATIONS,
  SUPER_LIKED_YOU_IDS,
  VISITOR_IDS,
} from '@/lib/data/seed';

interface MatchesState {
  matchedIds: string[];
  likedYouIds: string[];
  superLikedYouIds: string[];
  visitorIds: string[];
  addMatch: (id: string) => void;
  removeLikedYou: (id: string) => void;
  unmatch: (id: string) => void;
}

export const useMatchesStore = create<MatchesState>((set) => ({
  matchedIds: SEED_CONVERSATIONS.map((conversation) => conversation.userId),
  likedYouIds: LIKED_YOU_IDS,
  superLikedYouIds: SUPER_LIKED_YOU_IDS,
  visitorIds: VISITOR_IDS,

  addMatch: (id) =>
    set((state) => ({
      matchedIds: state.matchedIds.includes(id) ? state.matchedIds : [id, ...state.matchedIds],
      likedYouIds: state.likedYouIds.filter((item) => item !== id),
    })),

  removeLikedYou: (id) =>
    set((state) => ({ likedYouIds: state.likedYouIds.filter((item) => item !== id) })),

  unmatch: (id) => set((state) => ({ matchedIds: state.matchedIds.filter((item) => item !== id) })),
}));
