import { create } from 'zustand';

import { SEED_MOMENTS } from '@/lib/data/seed';
import type { Moment } from '@/lib/types';

let momentSeq = 500;

interface MomentsState {
  moments: Moment[];
  toggleLike: (id: string) => void;
  addComment: (id: string, text: string) => void;
  createMoment: (payload: {
    text: string;
    images: string[];
    place?: string;
    tags: string[];
  }) => string;
  deleteMoment: (id: string) => void;
}

export const useMomentsStore = create<MomentsState>((set) => ({
  moments: SEED_MOMENTS,

  toggleLike: (id) =>
    set((state) => ({
      moments: state.moments.map((moment) =>
        moment.id === id
          ? {
              ...moment,
              likedByMe: !moment.likedByMe,
              likes: moment.likes + (moment.likedByMe ? -1 : 1),
            }
          : moment,
      ),
    })),

  addComment: (id, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    momentSeq += 1;
    set((state) => ({
      moments: state.moments.map((moment) =>
        moment.id === id
          ? {
              ...moment,
              comments: [
                ...moment.comments,
                { id: `cm${momentSeq}`, userId: 'me', text: trimmed, createdAt: Date.now() },
              ],
            }
          : moment,
      ),
    }));
  },

  createMoment: ({ text, images, place, tags }) => {
    momentSeq += 1;
    const id = `p${momentSeq}`;
    set((state) => ({
      moments: [
        {
          id,
          userId: 'me',
          text,
          images,
          place,
          tags,
          likes: 0,
          likedByMe: false,
          comments: [],
          createdAt: Date.now(),
        },
        ...state.moments,
      ],
    }));
    return id;
  },

  deleteMoment: (id) =>
    set((state) => ({ moments: state.moments.filter((moment) => moment.id !== id) })),
}));
