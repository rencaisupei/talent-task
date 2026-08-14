import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SEED_GIGS } from '@/lib/seed';
import type { BudgetLevelId, Gig, GigLocation } from '@/lib/types';

export interface PublishGigInput {
  categoryId: string;
  tag: string;
  detail: string;
  location: GigLocation;
  budgetLevel: BudgetLevelId;
  isUrgent: boolean;
  clientId: string;
  clientName: string;
}

interface GigState {
  gigs: Gig[];
  publishGig: (input: PublishGigInput) => Gig;
  markTalking: (gigId: string) => void;
  closeGig: (gigId: string) => void;
}

export const useGigStore = create<GigState>()(
  persist(
    (set) => ({
      gigs: SEED_GIGS,

      publishGig: (input) => {
        const gig: Gig = {
          id: `gig_${Date.now()}`,
          title: `${input.tag}｜${input.isUrgent ? '急件立即處理' : '徵求專業協助'}`,
          categoryId: input.categoryId,
          tag: input.tag,
          detail: input.detail,
          location: input.location,
          budgetLevel: input.budgetLevel,
          isUrgent: input.isUrgent,
          clientId: input.clientId,
          clientName: input.clientName,
          createdAt: Date.now(),
          status: 'open',
        };
        set((state) => ({ gigs: [gig, ...state.gigs] }));
        return gig;
      },

      markTalking: (gigId) =>
        set((state) => ({
          gigs: state.gigs.map((gig) =>
            gig.id === gigId && gig.status === 'open' ? { ...gig, status: 'talking' } : gig,
          ),
        })),

      closeGig: (gigId) =>
        set((state) => ({
          gigs: state.gigs.map((gig) => (gig.id === gigId ? { ...gig, status: 'closed' } : gig)),
        })),
    }),
    {
      name: 'instantgig-gigs',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
