import { create } from 'zustand';

import {
  acceptRemoteBid,
  fetchRemoteBids,
  upsertRemoteBid,
  withdrawRemoteBid,
} from '@/lib/remote/bids';
import { formatCurrency } from '@/lib/format';
import { notifyContentChanged } from '@/lib/remote/live';
import { type CloudLoadState, useGigStore } from '@/lib/stores/gigs';
import { useNotificationStore } from '@/lib/stores/notifications';
import type { Bid, Gig, PublishReview } from '@/lib/types';

export interface SubmitBidInput {
  gig: Gig;
  /** 人才的 auth.users.id；訪客無法投遞提案。 */
  talentId: string;
  talentName: string;
  talentRegion: string;
  /** 報價金額；null 代表價格面議。 */
  quote: number | null;
  etaLabel: string;
  message: string;
  /** 送出前的即時審核結果，未通過者不會顯示給客戶。 */
  review: PublishReview;
}

export type BidWriteResult = { status: 'ok'; bid: Bid } | { status: 'error'; message: string };

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
  if (talentId.length === 0) return undefined;
  return bids.find(
    (bid) => bid.gigId === gigId && bid.talentId === talentId && bid.status !== 'withdrawn',
  );
}

export function bidsByTalent(bids: Bid[], talentId: string): Bid[] {
  if (talentId.length === 0) return [];
  return bids
    .filter((bid) => bid.talentId === talentId && bid.status !== 'withdrawn')
    .sort((a, b) => b.createdAt - a.createdAt);
}

interface BidState {
  bids: Bid[];
  loadState: CloudLoadState;
  isRefreshing: boolean;
  errorMessage: string | null;

  /** 從雲端重新讀取可見的提案（示範提案、自己投的、自己任務收到的）。 */
  refreshBids: () => Promise<void>;
  submitBid: (input: SubmitBidInput) => Promise<BidWriteResult>;
  withdrawBid: (bidId: string) => Promise<boolean>;
  /** 客戶選定提案：後端一次完成接受、退回其他提案與任務指派。 */
  acceptBid: (bidId: string) => Promise<boolean>;
}

export const useBidStore = create<BidState>()((set, get) => ({
  bids: [],
  loadState: 'idle',
  isRefreshing: false,
  errorMessage: null,

  refreshBids: async () => {
    set((state) => ({
      isRefreshing: true,
      loadState: state.loadState === 'ready' ? 'ready' : 'loading',
    }));

    const result = await fetchRemoteBids();
    if (result.status === 'error') {
      set((state) => ({
        isRefreshing: false,
        loadState: state.bids.length > 0 ? 'ready' : 'error',
        errorMessage: result.message,
      }));
      return;
    }

    set({ bids: result.data, loadState: 'ready', isRefreshing: false, errorMessage: null });
  },

  submitBid: async ({
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
    const result = await upsertRemoteBid({
      existingId: existing?.id,
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
      review,
    });

    if (result.status === 'error') {
      set({ errorMessage: result.message });
      return { status: 'error', message: result.message };
    }

    const bid = result.data;
    set((state) => ({ bids: [bid, ...state.bids.filter((item) => item.id !== bid.id)] }));
    notifyContentChanged();

    const passed = review.state === 'approved';
    useNotificationStore.getState().pushNotification({
      kind: passed ? 'bid' : 'moderation',
      title: passed ? (existing ? '提案已更新' : '提案已送出') : '提案已送交管理員複審',
      body: passed
        ? `已向「${gig.title}」送出${quote === null ? '面議' : `報價 ${formatCurrency(quote)}`}的提案，${etaLabel}可開始。`
        : `提案未通過即時認證（${review.ai.reasons[0] ?? '內容需人工確認'}），複審通過後客戶才會看到。`,
      gigId: gig.id,
    });

    return { status: 'ok', bid };
  },

  withdrawBid: async (bidId) => {
    const result = await withdrawRemoteBid(bidId);
    if (result.status === 'error') {
      set({ errorMessage: result.message });
      return false;
    }

    const bid = result.data;
    set((state) => ({ bids: state.bids.map((item) => (item.id === bid.id ? bid : item)) }));
    notifyContentChanged();
    return true;
  },

  acceptBid: async (bidId) => {
    const target = get().bids.find((item) => item.id === bidId);
    const result = await acceptRemoteBid(bidId);
    if (result.status === 'error') {
      set({ errorMessage: result.message });
      return false;
    }

    // 接受提案會同時改動其他提案與任務狀態，直接重讀兩份資料最可靠。
    await Promise.all([get().refreshBids(), useGigStore.getState().refreshGigs()]);
    notifyContentChanged();

    if (target) {
      useNotificationStore.getState().pushNotification({
        kind: 'match',
        title: '媒合成功',
        body: `已選定 ${target.talentName} 承接「${target.gigTitle}」，任務進入進行中。`,
        gigId: target.gigId,
        talentId: target.talentId,
      });
    }

    return true;
  },
}));
