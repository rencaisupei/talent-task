import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MAX_TALENT_TAGS } from '@/lib/omniTags';
import { REGION_ANY } from '@/lib/regions';
import { useNotificationStore } from '@/lib/stores/notifications';
import {
  type AiReviewResult,
  LOCAL_USER_ID,
  type UserRole,
  type VerificationStatus,
} from '@/lib/types';

export const FREE_MONTHLY_CHAT_QUOTA = 2;
export const PREMIUM_PRICE_TWD = 399;

export type ChatRequestResult = 'unlimited' | 'allowed' | 'existing' | 'blocked';

export type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

interface SessionState {
  hydrated: boolean;
  userId: string;
  displayName: string;
  role: UserRole | null;
  region: string;
  privacyAccepted: boolean;
  skills: string[];
  credentialUri: string | null;
  credentialUploadState: UploadState;
  /** 證照經人工驗證通過（信任度加分，非接案必要條件）。 */
  credentialVerified: boolean;
  verification: VerificationStatus;
  /** 最近一次人才資料的即時認證結果。 */
  profileReview: AiReviewResult | null;
  isPremium: boolean;
  premiumSince: number | null;
  chatQuotaRemaining: number;
  quotaMonth: string;
  /** 本月已用配額開啟過對話的對象（客戶與人才雙向計算，同一對象只計一次）。 */
  openedPeerIds: string[];

  markHydrated: () => void;
  chooseRole: (role: UserRole) => void;
  switchRole: () => void;
  setPrivacyAccepted: (accepted: boolean) => void;
  setDisplayName: (name: string) => void;
  setRegion: (region: string) => void;
  toggleSkill: (tag: string) => 'added' | 'removed' | 'limit';
  setCredentialUri: (uri: string | null) => void;
  setCredentialUploadState: (state: UploadState) => void;
  setCredentialVerified: (verified: boolean) => void;
  setVerification: (status: VerificationStatus) => void;
  setProfileReview: (result: AiReviewResult | null) => void;
  activatePremium: () => void;
  cancelPremium: () => void;
  syncQuotaMonth: () => void;
  /** 與某位對象開啟新對話：客戶找人才、人才回覆客戶都會扣同一份配額。 */
  requestChatWith: (peerId: string) => ChatRequestResult;
  hasOpenedChatWith: (peerId: string) => boolean;
  resetSession: () => void;
}

const initialState = {
  hydrated: false,
  userId: LOCAL_USER_ID,
  displayName: '我',
  role: null as UserRole | null,
  region: REGION_ANY,
  privacyAccepted: false,
  skills: [] as string[],
  credentialUri: null as string | null,
  credentialUploadState: 'idle' as UploadState,
  credentialVerified: false,
  verification: 'none' as VerificationStatus,
  profileReview: null as AiReviewResult | null,
  isPremium: false,
  premiumSince: null as number | null,
  chatQuotaRemaining: FREE_MONTHLY_CHAT_QUOTA,
  quotaMonth: monthKey(),
  openedPeerIds: [] as string[],
};

/** 持久化欄位（partialize 的形狀），migrate 以此為輸出型別。 */
type PersistedSession = Partial<Omit<SessionState, keyof SessionActions>>;

type SessionActions = {
  [K in keyof SessionState as SessionState[K] extends (...args: never[]) => unknown
    ? K
    : never]: SessionState[K];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function migrateSession(persisted: unknown, version: number | undefined): PersistedSession {
  if (!isRecord(persisted)) return {};
  const state: Record<string, unknown> = { ...persisted };
  // 舊版沒有寫入 version 欄位，zustand 會傳 undefined，視為 v0。
  const from = typeof version === 'number' ? version : 0;

  // v0：openedClientIds 只記錄人才開給客戶的對話，改名為雙向計算的 openedPeerIds。
  if (from < 1) {
    const legacy = state.openedClientIds;
    if (state.openedPeerIds === undefined && Array.isArray(legacy)) {
      state.openedPeerIds = legacy.filter((id): id is string => typeof id === 'string');
    }
    delete state.openedClientIds;
  }

  return state;
}

export const useSessionStore = create<SessionState>()(
  persist<SessionState, [], [], PersistedSession>(
    (set, get) => ({
      ...initialState,

      markHydrated: () => set({ hydrated: true }),

      chooseRole: (role) => set({ role }),

      switchRole: () => set({ role: get().role === 'client' ? 'talent' : 'client' }),

      setPrivacyAccepted: (accepted) => set({ privacyAccepted: accepted }),

      setDisplayName: (name) => set({ displayName: name }),

      setRegion: (region) => set({ region }),

      toggleSkill: (tag) => {
        const { skills } = get();
        if (skills.includes(tag)) {
          set({ skills: skills.filter((item) => item !== tag) });
          return 'removed';
        }
        if (skills.length >= MAX_TALENT_TAGS) return 'limit';
        set({ skills: [...skills, tag] });
        return 'added';
      },

      setCredentialUri: (uri) => set({ credentialUri: uri }),

      setCredentialUploadState: (state) => set({ credentialUploadState: state }),

      setCredentialVerified: (verified) => set({ credentialVerified: verified }),

      setVerification: (status) => set({ verification: status }),

      setProfileReview: (result) => set({ profileReview: result }),

      activatePremium: () => {
        set({ isPremium: true, premiumSince: Date.now() });
        useNotificationStore.getState().pushNotification({
          kind: 'system',
          title: '進階版已啟用',
          body: `每月 NT$ ${PREMIUM_PRICE_TWD} 方案已生效，本月可無限開啟新對話。`,
        });
      },

      cancelPremium: () => set({ isPremium: false, premiumSince: null }),

      syncQuotaMonth: () => {
        const current = monthKey();
        if (get().quotaMonth !== current) {
          set({
            quotaMonth: current,
            chatQuotaRemaining: FREE_MONTHLY_CHAT_QUOTA,
            openedPeerIds: [],
          });
        }
      },

      hasOpenedChatWith: (peerId) => get().openedPeerIds.includes(peerId),

      requestChatWith: (peerId) => {
        get().syncQuotaMonth();
        const { isPremium, openedPeerIds, chatQuotaRemaining } = get();

        if (isPremium) return 'unlimited';
        if (openedPeerIds.includes(peerId)) return 'existing';
        if (chatQuotaRemaining <= 0) return 'blocked';

        set({
          chatQuotaRemaining: chatQuotaRemaining - 1,
          openedPeerIds: [...openedPeerIds, peerId],
        });
        return 'allowed';
      },

      resetSession: () => set({ ...initialState, hydrated: true }),
    }),
    {
      name: 'instantgig-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userId: state.userId,
        displayName: state.displayName,
        role: state.role,
        region: state.region,
        privacyAccepted: state.privacyAccepted,
        skills: state.skills,
        credentialUri: state.credentialUri,
        credentialUploadState: state.credentialUploadState,
        credentialVerified: state.credentialVerified,
        verification: state.verification,
        profileReview: state.profileReview,
        isPremium: state.isPremium,
        premiumSince: state.premiumSince,
        chatQuotaRemaining: state.chatQuotaRemaining,
        quotaMonth: state.quotaMonth,
        openedPeerIds: state.openedPeerIds,
      }),
      version: 1,
      migrate: (persisted, version) => migrateSession(persisted, version),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
        state?.syncQuotaMonth();
      },
    },
  ),
);
