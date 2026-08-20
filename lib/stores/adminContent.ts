import { create } from 'zustand';

import {
  adminDecideBidReview,
  adminDecideGigReview,
  adminFetchChats,
  adminFetchContent,
  adminFetchTickets,
  adminResolveConversationReport,
  adminResolveTicket,
  adminRestoreGig,
  adminTakedownGig,
  type AdminReviewDecision,
} from '@/lib/adminApi';
import { useAdminAuthStore } from '@/lib/stores/adminAuth';
import type { Bid, ChatMessage, Conversation, Gig, SupportTicket } from '@/lib/types';

export type AdminContentLoadState = 'idle' | 'loading' | 'ready' | 'error';

const EXPIRED_MESSAGE = '管理員登入狀態已過期，請重新登入後再試。';
const FORBIDDEN_MESSAGE = '你的角色沒有這項權限。';
const NO_TOKEN_MESSAGE = '尚未登入管理平台。';

interface AdminContentState {
  gigs: Gig[];
  bids: Bid[];
  /** 被檢舉或命中詐騙關鍵字的對話（一般對話不會外流到管理端）。 */
  conversations: Conversation[];
  chatMessages: Record<string, ChatMessage[]>;
  chatLoadState: AdminContentLoadState;
  /** 聯絡我們的站內留言（訪客留言只有 service key 讀得到）。 */
  tickets: SupportTicket[];
  ticketLoadState: AdminContentLoadState;
  loadState: AdminContentLoadState;
  isMutating: boolean;
  errorMessage: string | null;
  lastSyncedAt: number | null;

  /** 讀取全部任務與提案（含待複審、被退回與已下架）。 */
  refresh: () => Promise<void>;
  /** 讀取需要處理的對話與其完整紀錄。 */
  refreshChats: () => Promise<void>;
  /** 讀取客服留言（含訪客留言）。 */
  refreshTickets: () => Promise<void>;
  resolveTicket: (ticketId: string, note?: string) => Promise<boolean>;
  resolveReport: (conversationId: string, note?: string) => Promise<boolean>;
  takedownGig: (gigId: string, reason: string) => Promise<boolean>;
  restoreGig: (gigId: string) => Promise<boolean>;
  decideGigReview: (
    gigId: string,
    decision: AdminReviewDecision,
    note?: string,
  ) => Promise<boolean>;
  decideBidReview: (
    bidId: string,
    decision: AdminReviewDecision,
    note?: string,
  ) => Promise<boolean>;
}

function currentToken(): string | null {
  return useAdminAuthStore.getState().token;
}

/**
 * 管理平台看到的任務與提案。
 *
 * 一般使用者的用戶端受 RLS 限制，只讀得到已通過認證且未下架的內容，
 * 因此管理端另外走 admin-content 函式（service key）取得完整資料，
 * 下架、恢復上架與複審決定也都在那裡執行並寫入稽核紀錄。
 */
export const useAdminContentStore = create<AdminContentState>()((set) => ({
  gigs: [],
  bids: [],
  conversations: [],
  chatMessages: {},
  chatLoadState: 'idle',
  tickets: [],
  ticketLoadState: 'idle',
  loadState: 'idle',
  isMutating: false,
  errorMessage: null,
  lastSyncedAt: null,

  refresh: async () => {
    const token = currentToken();
    if (token === null) {
      set({ loadState: 'error', errorMessage: NO_TOKEN_MESSAGE });
      return;
    }

    set((state) => ({ loadState: state.loadState === 'ready' ? 'ready' : 'loading' }));

    const outcome = await adminFetchContent(token);
    if (outcome.kind !== 'ok') {
      set((state) => ({
        loadState: state.gigs.length > 0 ? 'ready' : 'error',
        errorMessage:
          outcome.kind === 'expired'
            ? EXPIRED_MESSAGE
            : outcome.kind === 'forbidden'
              ? FORBIDDEN_MESSAGE
              : outcome.message,
      }));
      return;
    }

    set({
      gigs: outcome.content.gigs,
      bids: outcome.content.bids,
      loadState: 'ready',
      errorMessage: null,
      lastSyncedAt: Date.now(),
    });
  },

  refreshChats: async () => {
    const token = currentToken();
    if (token === null) {
      set({ chatLoadState: 'error', errorMessage: NO_TOKEN_MESSAGE });
      return;
    }

    set((state) => ({ chatLoadState: state.chatLoadState === 'ready' ? 'ready' : 'loading' }));

    const outcome = await adminFetchChats(token);
    if (outcome.kind !== 'ok') {
      set((state) => ({
        chatLoadState: state.conversations.length > 0 ? 'ready' : 'error',
        errorMessage: failureMessage(outcome.kind, outcome),
      }));
      return;
    }

    set({
      conversations: outcome.content.conversations,
      chatMessages: outcome.content.messages,
      chatLoadState: 'ready',
      errorMessage: null,
    });
  },

  refreshTickets: async () => {
    const token = currentToken();
    if (token === null) {
      set({ ticketLoadState: 'error', errorMessage: NO_TOKEN_MESSAGE });
      return;
    }

    set((state) => ({ ticketLoadState: state.ticketLoadState === 'ready' ? 'ready' : 'loading' }));

    const outcome = await adminFetchTickets(token);
    if (outcome.kind !== 'ok') {
      set((state) => ({
        ticketLoadState: state.tickets.length > 0 ? 'ready' : 'error',
        errorMessage: failureMessage(outcome.kind, outcome),
      }));
      return;
    }

    set({ tickets: outcome.tickets, ticketLoadState: 'ready', errorMessage: null });
  },

  resolveTicket: async (ticketId, note) => {
    const token = currentToken();
    if (token === null) {
      set({ errorMessage: NO_TOKEN_MESSAGE });
      return false;
    }

    set({ isMutating: true, errorMessage: null });
    const outcome = await adminResolveTicket(token, ticketId, note);
    if (outcome.kind !== 'ok') {
      set({ isMutating: false, errorMessage: failureMessage(outcome.kind, outcome) });
      return false;
    }

    const ticket = outcome.ticket;
    set((state) => ({
      isMutating: false,
      tickets: state.tickets.map((item) => (item.id === ticket.id ? ticket : item)),
    }));
    return true;
  },

  resolveReport: async (conversationId, note) => {
    const token = currentToken();
    if (token === null) {
      set({ errorMessage: NO_TOKEN_MESSAGE });
      return false;
    }

    set({ isMutating: true, errorMessage: null });
    const outcome = await adminResolveConversationReport(token, conversationId, note);
    if (outcome.kind !== 'ok') {
      set({ isMutating: false, errorMessage: failureMessage(outcome.kind, outcome) });
      return false;
    }

    const conversation = outcome.conversation;
    set((state) => ({
      isMutating: false,
      conversations: state.conversations.map((item) =>
        item.id === conversation.id ? conversation : item,
      ),
    }));
    return true;
  },

  takedownGig: async (gigId, reason) => {
    const token = currentToken();
    if (token === null) {
      set({ errorMessage: NO_TOKEN_MESSAGE });
      return false;
    }

    set({ isMutating: true, errorMessage: null });
    const outcome = await adminTakedownGig(token, gigId, reason);
    if (outcome.kind !== 'ok') {
      set({ isMutating: false, errorMessage: failureMessage(outcome.kind, outcome) });
      return false;
    }

    const gig = outcome.gig;
    set((state) => ({
      isMutating: false,
      gigs: state.gigs.map((item) => (item.id === gig.id ? gig : item)),
    }));
    return true;
  },

  restoreGig: async (gigId) => {
    const token = currentToken();
    if (token === null) {
      set({ errorMessage: NO_TOKEN_MESSAGE });
      return false;
    }

    set({ isMutating: true, errorMessage: null });
    const outcome = await adminRestoreGig(token, gigId);
    if (outcome.kind !== 'ok') {
      set({ isMutating: false, errorMessage: failureMessage(outcome.kind, outcome) });
      return false;
    }

    const gig = outcome.gig;
    set((state) => ({
      isMutating: false,
      gigs: state.gigs.map((item) => (item.id === gig.id ? gig : item)),
    }));
    return true;
  },

  decideGigReview: async (gigId, decision, note) => {
    const token = currentToken();
    if (token === null) {
      set({ errorMessage: NO_TOKEN_MESSAGE });
      return false;
    }

    set({ isMutating: true, errorMessage: null });
    const outcome = await adminDecideGigReview(token, gigId, decision, note);
    if (outcome.kind !== 'ok') {
      set({ isMutating: false, errorMessage: failureMessage(outcome.kind, outcome) });
      return false;
    }

    const gig = outcome.gig;
    set((state) => ({
      isMutating: false,
      gigs: state.gigs.map((item) => (item.id === gig.id ? gig : item)),
    }));
    return true;
  },

  decideBidReview: async (bidId, decision, note) => {
    const token = currentToken();
    if (token === null) {
      set({ errorMessage: NO_TOKEN_MESSAGE });
      return false;
    }

    set({ isMutating: true, errorMessage: null });
    const outcome = await adminDecideBidReview(token, bidId, decision, note);
    if (outcome.kind !== 'ok') {
      set({ isMutating: false, errorMessage: failureMessage(outcome.kind, outcome) });
      return false;
    }

    const bid = outcome.bid;
    set((state) => ({
      isMutating: false,
      bids: state.bids.map((item) => (item.id === bid.id ? bid : item)),
    }));
    return true;
  },
}));

function failureMessage(
  kind: 'expired' | 'forbidden' | 'failed',
  outcome: { kind: string; message?: string },
): string {
  if (kind === 'expired') return EXPIRED_MESSAGE;
  if (kind === 'forbidden') return FORBIDDEN_MESSAGE;
  return outcome.message ?? '操作失敗，請稍後再試。';
}

/** 等待管理員複審的任務與提案數量（主控台與複審頁共用）。 */
export function useAdminReviewCounts(): { gigs: number; bids: number } {
  const gigs = useAdminContentStore((state) => state.gigs);
  const bids = useAdminContentStore((state) => state.bids);

  return {
    gigs: gigs.filter((gig) => gig.review?.state === 'pending').length,
    bids: bids.filter((bid) => bid.status !== 'withdrawn' && bid.review?.state === 'pending')
      .length,
  };
}
