import { create } from 'zustand';

import {
  addRemoteBlock,
  fetchRemoteBlocks,
  removeRemoteBlock,
  type BlockedUser,
} from '@/lib/remote/blocks';
import { isAccountId } from '@/lib/remote/shared';
import type { CloudLoadState } from '@/lib/stores/gigs';

export type BlockResult = { status: 'ok' } | { status: 'error'; message: string };

interface BlockState {
  /** 目前登入的帳號；空字串代表訪客（沒有封鎖名單可讀寫）。 */
  ownerId: string;
  blocked: BlockedUser[];
  /**
   * 與 blocked 同步的查找集合。
   *
   * 清單畫面每張卡片都要問「這個人被我封鎖了嗎」，用陣列 includes() 會變成
   * 每次渲染都線性搜尋，因此在寫入時就一次建好 Set。
   */
  blockedIds: Set<string>;
  loadState: CloudLoadState;
  errorMessage: string | null;

  setOwner: (ownerId: string) => void;
  refreshBlocks: () => Promise<void>;
  blockUser: (userId: string, name: string, reason?: string) => Promise<BlockResult>;
  unblockUser: (userId: string) => Promise<BlockResult>;
  reset: () => void;
}

function toIdSet(list: BlockedUser[]): Set<string> {
  return new Set(list.map((item) => item.id));
}

/**
 * 封鎖名單（blocked_users 資料表的快取）。
 *
 * 真正的效果由伺服器端套用：send_message 與 start_conversation 都會呼叫
 * is_blocked_pair()，任一方封鎖後雙方都無法再送訊息或開新對話。這個 store
 * 只負責畫面：隱藏被封鎖者的內容、以及提供解除封鎖的入口。
 */
export const useBlockStore = create<BlockState>()((set, get) => ({
  ownerId: '',
  blocked: [],
  blockedIds: new Set<string>(),
  loadState: 'idle',
  errorMessage: null,

  setOwner: (ownerId) => {
    if (get().ownerId === ownerId) return;

    set({
      ownerId,
      blocked: [],
      blockedIds: new Set<string>(),
      loadState: 'idle',
      errorMessage: null,
    });

    if (ownerId.length > 0) void get().refreshBlocks();
  },

  refreshBlocks: async () => {
    if (get().ownerId.length === 0) return;

    set((state) => ({ loadState: state.loadState === 'ready' ? 'ready' : 'loading' }));

    const result = await fetchRemoteBlocks();
    if (result.status === 'error') {
      set((state) => ({
        loadState: state.blocked.length > 0 ? 'ready' : 'error',
        errorMessage: result.message,
      }));
      return;
    }

    set({
      blocked: result.data,
      blockedIds: toIdSet(result.data),
      loadState: 'ready',
      errorMessage: null,
    });
  },

  blockUser: async (userId, name, reason) => {
    const ownerId = get().ownerId;
    if (ownerId.length === 0) return { status: 'error', message: '請先登入才能封鎖對方。' };
    if (userId === ownerId) return { status: 'error', message: '無法封鎖自己。' };
    // 示範內容沒有對應的真實帳號，封鎖沒有意義也寫不進資料表（外鍵指向 auth.users）。
    if (!isAccountId(userId)) {
      return { status: 'error', message: '這是平台的示範內容，沒有對應的真實帳號。' };
    }

    const result = await addRemoteBlock(ownerId, userId, name, reason ?? null);
    if (result.status === 'error') {
      set({ errorMessage: result.message });
      return { status: 'error', message: result.message };
    }

    set((state) => {
      const next = [result.data, ...state.blocked.filter((item) => item.id !== userId)];
      return { blocked: next, blockedIds: toIdSet(next), errorMessage: null };
    });

    return { status: 'ok' };
  },

  unblockUser: async (userId) => {
    const ownerId = get().ownerId;
    if (ownerId.length === 0) return { status: 'error', message: '請先登入。' };

    const result = await removeRemoteBlock(ownerId, userId);
    if (result.status === 'error') {
      set({ errorMessage: result.message });
      return { status: 'error', message: result.message };
    }

    set((state) => {
      const next = state.blocked.filter((item) => item.id !== userId);
      return { blocked: next, blockedIds: toIdSet(next), errorMessage: null };
    });

    return { status: 'ok' };
  },

  reset: () =>
    set({
      blocked: [],
      blockedIds: new Set<string>(),
      loadState: 'idle',
      errorMessage: null,
    }),
}));

/** 這個帳號是否在我的封鎖名單上。回傳布林值，不會造成不必要的重繪。 */
export function useIsBlocked(userId: string): boolean {
  return useBlockStore((state) => state.blockedIds.has(userId));
}

/** 封鎖名單的查找集合（清單過濾用）。 */
export function useBlockedIds(): Set<string> {
  return useBlockStore((state) => state.blockedIds);
}
