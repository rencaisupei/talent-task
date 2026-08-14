import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SEED_BIDS } from '@/lib/seed';
import { useGigStore } from '@/lib/stores/gigs';
import { useNotificationStore } from '@/lib/stores/notifications';
import type { Bid, Gig, PublishReview } from '@/lib/types';

export interface SubmitBidInput {
  gig: Gig;
  talentId: string;
  talentName: string;
  talentRegion: string;
  quote: number | null;
  etaLabel: string;
  message: string;
  /** 送出前的即時審核結果，未通過者不會顯示給客戶。 */
  review: PublishReview;
}

export interface BidReviewDecisionInput {
  adminId: string;
  adminName: string;
  note?: string;
}

interface BidState {
  bids: Bid[];
  submitBid: (input: SubmitBidInput) => Bid;
  withdrawBid: (bidId: string) => void;
  acceptBid: (bidId: string) => void;
  /** 管理員複審放行，提案開始對客戶顯示。 */
  approveBidReview: (bidId: string, input: BidReviewDecisionInput) => void;
  /** 管理員複審退回，提案作廢，人才可修正後重新投遞。 */
  rejectBidReview: (bidId: string, input: BidReviewDecisionInput) => void;
}

/** 提案是否可對客戶顯示（示範資料沒有審核紀錄，視為已通過）。 */
export function isBidVisible(bid: Bid): boolean {
  return bid.review === undefined || bid.review.state === 'approved';
}

/** 客戶可見的提案（已通過即時認證或管理員複審）。 */
export function bidsForGig(bids: Bid[], gigId: string): Bid[] {
  return bids
    .filter((bid) => bid.gigId === gigId && bid.status !== 'withdrawn' && isBidVisible(bid))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** 等待管理員複審的提案。 */
export function bidsAwaitingReview(bids: Bid[]): Bid[] {
  return bids.filter((bid) => bid.status !== 'withdrawn' && bid.review?.state === 'pending');
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

      submitBid: ({
        gig,
        talentId,
        talentName,
        talentRegion,
        quote,
        etaLabel,
        message,
        review,
      }) => {
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
          review,
        };

        set((state) => ({
          bids: existing
            ? state.bids.map((item) => (item.id === existing.id ? bid : item))
            : [bid, ...state.bids],
        }));

        const passed = review.state === 'approved';
        useNotificationStore.getState().pushNotification({
          kind: passed ? 'bid' : 'moderation',
          title: passed
            ? existing
              ? '提案已更新'
              : '提案已送出'
            : '提案已送交管理員複審',
          body: passed
            ? `已向「${gig.title}」送出${quote === null ? '面議' : `報價 NT$ ${quote.toLocaleString('zh-Hant-TW')}`}的提案，${etaLabel}可開始。`
            : `提案未通過即時認證（${review.ai.reasons[0] ?? '內容需人工確認'}），複審通過後客戶才會看到。`,
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

      approveBidReview: (bidId, { adminId, adminName, note }) => {
        const bid = get().bids.find((item) => item.id === bidId);
        set((state) => ({
          bids: state.bids.map((item) =>
            item.id === bidId && item.review
              ? {
                  ...item,
                  review: {
                    ...item.review,
                    state: 'approved',
                    adminId,
                    adminName,
                    adminNote: note,
                    decidedAt: Date.now(),
                  },
                }
              : item,
          ),
        }));
        if (bid) {
          useNotificationStore.getState().pushNotification({
            kind: 'moderation',
            title: '提案複審通過',
            body: `對「${bid.gigTitle}」的提案已通過複審，客戶現在可以看到你的報價。`,
            gigId: bid.gigId,
          });
        }
      },

      rejectBidReview: (bidId, { adminId, adminName, note }) => {
        const bid = get().bids.find((item) => item.id === bidId);
        set((state) => ({
          bids: state.bids.map((item) =>
            item.id === bidId && item.review
              ? {
                  ...item,
                  status: 'withdrawn',
                  review: {
                    ...item.review,
                    state: 'rejected',
                    adminId,
                    adminName,
                    adminNote: note,
                    decidedAt: Date.now(),
                  },
                }
              : item,
          ),
        }));
        if (bid) {
          useNotificationStore.getState().pushNotification({
            kind: 'moderation',
            title: '提案複審未通過',
            body: `對「${bid.gigTitle}」的提案因「${note ?? '內容有風險'}」未通過複審，請修正後重新投遞。`,
            gigId: bid.gigId,
          });
        }
      },
    }),
    {
      name: 'instantgig-bids',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
