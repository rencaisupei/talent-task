import { create } from 'zustand';

import {
  addRemoteSavedGig,
  fetchRemoteSavedGigIds,
  removeRemoteSavedGig,
} from '@/lib/remote/saved';
import type { CloudLoadState } from '@/lib/stores/gigs';

/** signedOut 代表訪客按了收藏，畫面要引導登入。 */
export type SavedToggleResult = 'added' | 'removed' | 'signedOut' | 'error';

interface SavedState {
  /** 收藏的擁有者（auth.users.id），由 components/CloudSync 依登入狀態寫入。 */
  ownerId: string;
  savedGigIds: string[];
  loadState: CloudLoadState;
  errorMessage: string | null;

  setOwner: (userId: string) => void;
  refreshSaved: () => Promise<void>;
  toggleSaved: (gigId: string) => Promise<SavedToggleResult>;
  reset: () => void;
}

/**
 * 收藏存在 bilt-cloud 的 saved_gigs 資料表（每列只有本人讀得到），
 * 這個 store 是雲端資料的快取：切換動作先樂觀更新畫面，寫入失敗再退回原狀。
 */
export const useSavedStore = create<SavedState>()((set, get) => ({
  ownerId: '',
  savedGigIds: [],
  loadState: 'idle',
  errorMessage: null,

  setOwner: (userId) => {
    if (get().ownerId === userId) return;

    set({
      ownerId: userId,
      savedGigIds: [],
      loadState: userId.length > 0 ? 'idle' : 'ready',
      errorMessage: null,
    });

    if (userId.length > 0) void get().refreshSaved();
  },

  refreshSaved: async () => {
    if (get().ownerId.length === 0) return;

    set((state) => ({ loadState: state.loadState === 'ready' ? 'ready' : 'loading' }));

    const result = await fetchRemoteSavedGigIds();
    if (result.status === 'error') {
      set((state) => ({
        loadState: state.savedGigIds.length > 0 ? 'ready' : 'error',
        errorMessage: result.message,
      }));
      return;
    }

    set({ savedGigIds: result.data, loadState: 'ready', errorMessage: null });
  },

  toggleSaved: async (gigId) => {
    const { ownerId, savedGigIds } = get();
    if (ownerId.length === 0) return 'signedOut';

    const wasSaved = savedGigIds.includes(gigId);
    set({
      savedGigIds: wasSaved
        ? savedGigIds.filter((id) => id !== gigId)
        : [gigId, ...savedGigIds.filter((id) => id !== gigId)],
    });

    const result = wasSaved
      ? await removeRemoteSavedGig(gigId)
      : await addRemoteSavedGig(ownerId, gigId);

    if (result.status === 'error') {
      set({ savedGigIds, errorMessage: result.message });
      return 'error';
    }

    set({ errorMessage: null });
    return wasSaved ? 'removed' : 'added';
  },

  reset: () => set({ savedGigIds: [], loadState: 'idle', errorMessage: null }),
}));
