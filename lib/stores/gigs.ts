import { create } from 'zustand';

import {
  fetchRemoteGigs,
  insertRemoteGig,
  markGigTalkingRemote,
  updateRemoteGig,
} from '@/lib/remote/gigs';
import { notifyContentChanged } from '@/lib/remote/live';
import { useNotificationStore } from '@/lib/stores/notifications';
import type { BudgetLevelId, Gig, GigLocation, PublishReview } from '@/lib/types';

/** 雲端資料的載入狀態；畫面用它決定顯示骨架、空狀態或錯誤。 */
export type CloudLoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface PublishGigInput {
  categoryId: string;
  tag: string;
  detail: string;
  location: GigLocation;
  budgetLevel: BudgetLevelId;
  isUrgent: boolean;
  /** 發案者的 auth.users.id；訪客無法發布。 */
  clientId: string;
  clientName: string;
  /** 發布前的即時審核結果，未通過者不會出現在任務牆。 */
  review: PublishReview;
}

export type GigWriteResult = { status: 'ok'; gig: Gig } | { status: 'error'; message: string };

/** 是否可公開曝光（示範資料沒有審核紀錄，視為已通過）。 */
export function isGigVisible(gig: Gig): boolean {
  return gig.review === undefined || gig.review.state === 'approved';
}

/** 等待管理員複審的任務。 */
export function gigsAwaitingReview(gigs: Gig[]): Gig[] {
  return gigs.filter((gig) => gig.review?.state === 'pending');
}

interface GigState {
  gigs: Gig[];
  loadState: CloudLoadState;
  isRefreshing: boolean;
  errorMessage: string | null;
  lastSyncedAt: number | null;

  /** 從雲端重新讀取可見的任務（RLS 決定範圍）。 */
  refreshGigs: () => Promise<void>;
  publishGig: (input: PublishGigInput) => Promise<GigWriteResult>;
  /** 人才開啟對話時把任務推進到「對話中」。 */
  markTalking: (gigId: string) => Promise<void>;
  completeGig: (gigId: string) => Promise<GigWriteResult>;
  closeGig: (gigId: string) => Promise<GigWriteResult>;
}

/**
 * 任務資料存在 bilt-cloud 的 gigs 資料表，這個 store 是雲端資料的快取：
 * 讀取靠 refreshGigs（由 components/CloudSync 定期與即時觸發），
 * 寫入一律先送到雲端，成功後才更新本機陣列。
 */
export const useGigStore = create<GigState>()((set) => ({
  gigs: [],
  loadState: 'idle',
  isRefreshing: false,
  errorMessage: null,
  lastSyncedAt: null,

  refreshGigs: async () => {
    set((state) => ({
      isRefreshing: true,
      loadState: state.loadState === 'ready' ? 'ready' : 'loading',
    }));

    const result = await fetchRemoteGigs();
    if (result.status === 'error') {
      set((state) => ({
        isRefreshing: false,
        // 已經有資料時保留畫面，只提示同步失敗。
        loadState: state.gigs.length > 0 ? 'ready' : 'error',
        errorMessage: result.message,
      }));
      return;
    }

    set({
      gigs: result.data,
      loadState: 'ready',
      isRefreshing: false,
      errorMessage: null,
      lastSyncedAt: Date.now(),
    });
  },

  publishGig: async (input) => {
    const title = `${input.tag}｜${input.isUrgent ? '急件立即處理' : '徵求專業協助'}`;
    const result = await insertRemoteGig({
      clientId: input.clientId,
      clientName: input.clientName,
      title,
      categoryId: input.categoryId,
      tag: input.tag,
      detail: input.detail,
      location: input.location,
      budgetLevel: input.budgetLevel,
      isUrgent: input.isUrgent,
      review: input.review,
    });

    if (result.status === 'error') {
      set({ errorMessage: result.message });
      return { status: 'error', message: result.message };
    }

    const gig = result.data;
    set((state) => ({ gigs: [gig, ...state.gigs.filter((item) => item.id !== gig.id)] }));
    notifyContentChanged();

    const passed = input.review.state === 'approved';
    useNotificationStore.getState().pushNotification({
      kind: passed ? 'system' : 'moderation',
      title: passed ? '認證通過，任務已廣播' : '任務已送交管理員複審',
      body: passed
        ? `「${gig.title}」通過即時認證，已發送給全台符合「${gig.tag}」的人才。`
        : `「${gig.title}」未通過即時認證（${input.review.ai.reasons[0] ?? '內容需人工確認'}），管理員複審通過後才會曝光。`,
      gigId: gig.id,
    });

    return { status: 'ok', gig };
  },

  markTalking: async (gigId) => {
    const changed = await markGigTalkingRemote(gigId);
    if (!changed) return;

    set((state) => ({
      gigs: state.gigs.map((gig) =>
        gig.id === gigId && gig.status === 'open' ? { ...gig, status: 'talking' } : gig,
      ),
    }));
    notifyContentChanged();
  },

  completeGig: async (gigId) => {
    const completedAt = new Date().toISOString();
    const result = await updateRemoteGig(
      gigId,
      { status: 'completed', completed_at: completedAt },
      '標記完成失敗，請稍後再試。',
    );

    if (result.status === 'error') {
      set({ errorMessage: result.message });
      return { status: 'error', message: result.message };
    }

    const gig = result.data;
    set((state) => ({ gigs: state.gigs.map((item) => (item.id === gig.id ? gig : item)) }));
    notifyContentChanged();

    useNotificationStore.getState().pushNotification({
      kind: 'review',
      title: '任務已完成，等待你的評價',
      body: `「${gig.title}」已標記完成，留下評價協助建立平台信任度。`,
      gigId: gig.id,
    });

    return { status: 'ok', gig };
  },

  closeGig: async (gigId) => {
    const result = await updateRemoteGig(gigId, { status: 'closed' }, '結束任務失敗，請稍後再試。');
    if (result.status === 'error') {
      set({ errorMessage: result.message });
      return { status: 'error', message: result.message };
    }

    const gig = result.data;
    set((state) => ({ gigs: state.gigs.map((item) => (item.id === gig.id ? gig : item)) }));
    notifyContentChanged();

    return { status: 'ok', gig };
  },
}));
