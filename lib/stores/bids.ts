import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SEED_BIDS } from '@/lib/seed';
import { useGigStore } from '@/lib/stores/gigs';
import { useNotificationStore } from '@/lib/stores/notifications';
import type { Bid, Gig } from '@/lib/types';

export interface SubmitBidInput {
  gig: Gig;
  talentId: string;
  talentName: string;
  talentRegion: string;
  quote: number | null;
  etaLabel: string;
  message: string;
}

interface BidState {
  bids: Bid[];
  submitBid: (input: SubmitBidInput) => Bid;
  withdrawBid: (bidId: string) => void;
  acceptBid: (bidId: string) => void;
}

export function bidsForGig(bids: Bid[], gigId: string): Bid[] {
  return bids
    .filter((bid) => bid.gigId === gigId && bid.status !== 'withdrawn')
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function myBidForGig(bids: Bid[], gigId: string, talentId: string): Bid | undefined {
  return bids.find(
    (bid) => bid.gigId === gigId && bid.talentId === talentId && bid.status !== 'withdrawn',
  );
}

export function bidsByTalent(bids: Bid[], talentId: string): Bid[] {
  return bids
    .filter((bid) => bid.talentId === talentId && bid.status !== 'withdrawn')
    .sort((a, b) => b.createdAt - a.createdAt);
}

export const useBidStore = create<BidState>()(
  persist(
    (set, get) => ({
      bids: SEED_BIDS,

      submitBid: ({ gig, talentId, talentName, talentRegion, quote, etaLabel, message }) => {
        const existing = myBidForGig(get().bids, gig.id, talentId);
        const bid: Bid = {
          id: existing?.id ?? `bid_${Date.now()}`,
          gigId: gig.id,
          gigTitle: gig.title,
          tag: gig.tag,
          clientId: gig.clientId,
          talentId,
          talentName,
          talentRegion,
          quote,
          etaLabel,
          message,
          createdAt: Date.now(),
          status: 'pending',
        };

        set((state) => ({
          bids: existing
            ? state.bids.map((item) => (item.id === existing.id ? bid : item))
            : [bid, ...state.bids],
        }));

        useNotificationStore.getState().pushNotification({
          kind: 'bid',
          title: existing ? '提案已更新' : '提案已送出',
          body: `已向「${gig.title}」送出${quote === null ? '面議' : `報價 NT$ ${quote.toLocaleString('zh-Hant-TW')}`}的提案，${etaLabel}可開始。`,
          gigId: gig.id,
        });

        return bid;
      },

      withdrawBid: (bidId) =>
        set((state) => ({
          bids: state.bids.map((bid) => (bid.id === bidId ? { ...bid, status: 'withdrawn' } : bid)),
        })),

      acceptBid: (bidId) => {
        const bid = get().bids.find((item) => item.id === bidId);
        if (!bid) return;

        set((state) => ({
          bids: state.bids.map((item) => {
            if (item.id === bidId) return { ...item, status: 'accepted' };
            if (item.gigId === bid.gigId && item.status === 'pending') {
              return { ...item, status: 'rejected' };
            }
            return item;
          }),
        }));

        useGigStore.getState().assignGig(bid.gigId, bid.talentId, bid.talentName);

        useNotificationStore.getState().pushNotification({
          kind: 'match',
          title: '媒合成功',
          body: `已選定 ${bid.talentName} 承接「${bid.gigTitle}」，任務進入進行中。`,
          gigId: bid.gigId,
          talentId: bid.talentId,
        });
      },
    }),
    {
      name: 'instantgig-bids',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
