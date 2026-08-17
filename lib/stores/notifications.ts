import { create } from 'zustand';

import { deliverPush } from '@/lib/push';
import {
  clearRemoteNotifications,
  fetchRemoteNotifications,
  insertRemoteNotification,
  markAllRemoteNotificationsRead,
  markRemoteNotificationRead,
  pruneRemoteNotifications,
} from '@/lib/remote/notifications';
import type { CloudLoadState } from '@/lib/stores/gigs';
import type { AppNotification } from '@/lib/types';

export type PushNotificationInput = Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>;

/** 本機快取的上限；伺服器端的保留規則見 lib/maintenance.ts。 */
const MAX_CACHED_ITEMS = 120;

interface NotificationState {
  /**
   * 通知的擁有者（auth.users.id），由 components/CloudSync 依登入狀態寫入。
   * 訪客是空字串：通知中心屬於帳號，沒有登入就沒有可讀寫的通知。
   */
  ownerId: string;
  items: AppNotification[];
  loadState: CloudLoadState;
  isRefreshing: boolean;
  errorMessage: string | null;

  /** 切換擁有者（登入、登出、換帳號）：先清掉快取再讀新身分的通知。 */
  setOwner: (userId: string) => void;
  refreshNotifications: () => Promise<void>;
  pushNotification: (input: PushNotificationInput) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  /** 每日維護：清掉已讀的過舊通知並壓回保留上限，回傳清掉的筆數。 */
  pruneNotifications: (options: { maxAgeMs: number; keep: number }) => Promise<number>;
  reset: () => void;
}

export function countUnread(items: AppNotification[]): number {
  return items.reduce((total, item) => (item.isRead ? total : total + 1), 0);
}

/**
 * 通知中心存在 bilt-cloud 的 notifications 資料表，這個 store 是雲端資料的快取。
 *
 * 每則通知都由收件人自己的裝置寫入（RLS 要求 user_id = auth.uid()），
 * 因此登出再登入、或換一支手機登入同一個帳號，通知中心都還在。
 */
export const useNotificationStore = create<NotificationState>()((set, get) => ({
  ownerId: '',
  items: [],
  loadState: 'idle',
  isRefreshing: false,
  errorMessage: null,

  setOwner: (userId) => {
    if (get().ownerId === userId) return;

    set({
      ownerId: userId,
      items: [],
      loadState: userId.length > 0 ? 'idle' : 'ready',
      isRefreshing: false,
      errorMessage: null,
    });

    if (userId.length > 0) void get().refreshNotifications();
  },

  refreshNotifications: async () => {
    if (get().ownerId.length === 0) return;

    set((state) => ({
      isRefreshing: true,
      loadState: state.loadState === 'ready' ? 'ready' : 'loading',
    }));

    const result = await fetchRemoteNotifications();
    if (result.status === 'error') {
      set((state) => ({
        isRefreshing: false,
        loadState: state.items.length > 0 ? 'ready' : 'error',
        errorMessage: result.message,
      }));
      return;
    }

    set({
      items: result.data,
      loadState: 'ready',
      isRefreshing: false,
      errorMessage: null,
    });
  },

  pushNotification: (input) => {
    const { ownerId } = get();
    // 訪客沒有帳號可以收通知；需要通知的動作（發布、投標、對話）本來就要先登入。
    if (ownerId.length === 0) return;

    // 先顯示在畫面上，寫入雲端後換成伺服器的那一列（id 與時間以伺服器為準）。
    const pendingId = `pending_${Date.now()}_${Math.round(Math.random() * 1000)}`;
    const optimistic: AppNotification = {
      ...input,
      id: pendingId,
      createdAt: Date.now(),
      isRead: false,
    };
    set((state) => ({ items: [optimistic, ...state.items].slice(0, MAX_CACHED_ITEMS) }));

    deliverPush({
      kind: input.kind,
      title: input.title,
      body: input.body,
      route: {
        gigId: input.gigId,
        conversationId: input.conversationId,
        talentId: input.talentId,
      },
    });

    void insertRemoteNotification(ownerId, {
      kind: input.kind,
      title: input.title,
      body: input.body,
      gigId: input.gigId,
      conversationId: input.conversationId,
      talentId: input.talentId,
    }).then((result) => {
      set((state) => {
        const rest = state.items.filter((item) => item.id !== pendingId);
        if (result.status === 'error') return { items: rest, errorMessage: result.message };
        return {
          items: [result.data, ...rest.filter((item) => item.id !== result.data.id)].slice(
            0,
            MAX_CACHED_ITEMS,
          ),
          errorMessage: null,
        };
      });
    });
  },

  markRead: (id) => {
    const target = get().items.find((item) => item.id === id);
    if (target === undefined || target.isRead) return;

    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    }));

    void markRemoteNotificationRead(id).then((ok) => {
      // 寫入失敗就以雲端狀態為準，避免畫面顯示成已讀但下次又變回未讀。
      if (!ok) void get().refreshNotifications();
    });
  },

  markAllRead: () => {
    const { ownerId, items } = get();
    if (ownerId.length === 0 || countUnread(items) === 0) return;

    set((state) => ({ items: state.items.map((item) => ({ ...item, isRead: true })) }));

    void markAllRemoteNotificationsRead(ownerId).then((ok) => {
      if (!ok) void get().refreshNotifications();
    });
  },

  clearAll: () => {
    const { ownerId, items } = get();
    if (ownerId.length === 0 || items.length === 0) return;

    set({ items: [] });

    void clearRemoteNotifications(ownerId).then((ok) => {
      if (!ok) void get().refreshNotifications();
    });
  },

  pruneNotifications: async ({ maxAgeMs, keep }) => {
    const { ownerId } = get();
    if (ownerId.length === 0) return 0;

    const removed = await pruneRemoteNotifications({ userId: ownerId, maxAgeMs, keep });
    if (removed === null) throw new Error('prune-failed');
    if (removed > 0) await get().refreshNotifications();

    return removed;
  },

  reset: () =>
    set({
      items: [],
      loadState: 'idle',
      isRefreshing: false,
      errorMessage: null,
    }),
}));
