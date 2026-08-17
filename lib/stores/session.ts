import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MAX_TALENT_TAGS } from '@/lib/omniTags';
import { REGION_ANY } from '@/lib/regions';
import { useNotificationStore } from '@/lib/stores/notifications';
import {
  LOCAL_USER_ID,
  type AiReviewResult,
  type UserRole,
  type VerificationStatus,
} from '@/lib/types';

export const FREE_MONTHLY_CHAT_QUOTA = 2;
export const PREMIUM_PRICE_TWD = 399;

export type ChatRequestResult = 'unlimited' | 'allowed' | 'existing' | 'blocked';

export type UploadState = 'idle' | 'uploading' | 'done' | 'error';

/** unknown 代表還在確認裝置上的登入狀態，畫面此時應維持等待。 */
export type AuthStatus = 'unknown' | 'signedOut' | 'signedIn';

/** 後端 profiles 資料表負責同步的欄位。 */
export interface RemoteProfileFields {
  displayName: string;
  role: UserRole | null;
  region: string;
  skills: string[];
  privacyAccepted: boolean;
}

export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

interface SessionState {
  hydrated: boolean;
  /** 登入狀態；由 AuthGate 依 bilt auth session 寫入，不持久化。 */
  authStatus: AuthStatus;
  /**
   * 已登入使用者的 auth.users.id；訪客為空字串。
   * 任務與提案存在雲端（gigs / bids 資料表），擁有者就是這個 id。
   * 畫面請改用 useMyUserId()，它會在登入狀態確定前回傳空字串。
   */
  authUserId: string;
  email: string | null;
  /** 後端 profile 是否已套用，避免尚未載入就把預設值寫回後端。 */
  profileLoaded: boolean;
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
  /** 套用 bilt auth 的登入身分；回傳 'switched' 代表換了另一個帳號，呼叫端需清空本機資料。 */
  applySignedIn: (input: { authUserId: string; email: string | null }) => 'same' | 'switched';
  /** 失去登入狀態（主動登出或權杖失效）：清掉裝置上的身分資料，保留計費狀態。 */
  applySignedOut: () => void;
  /** 以後端 profiles 的內容覆寫本機身分欄位。 */
  applyRemoteProfile: (fields: RemoteProfileFields) => void;
  markProfileLoaded: () => void;
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
  /** 跨月時重置免費對話配額；回傳是否真的重置了。 */
  syncQuotaMonth: () => boolean;
  /** 與某位對象開啟新對話：客戶找人才、人才回覆客戶都會扣同一份配額。 */
  requestChatWith: (peerId: string) => ChatRequestResult;
  hasOpenedChatWith: (peerId: string) => boolean;
  resetSession: () => void;
}

/** 與使用者身分綁定的欄位；換帳號時整組重設。 */
const profileDefaults = {
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

const initialState = {
  hydrated: false,
  authStatus: 'unknown' as AuthStatus,
  authUserId: '',
  email: null as string | null,
  profileLoaded: false,
  ...profileDefaults,
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

  // v1：userId 曾經存 auth.users.id，現在改為固定的本機資料擁有者 id，
  // 舊值搬到 authUserId，並讓 userId 回到 initialState 的 LOCAL_USER_ID。
  if (from < 2) {
    const legacy = state.userId;
    if (
      state.authUserId === undefined &&
      typeof legacy === 'string' &&
      legacy.length > 0 &&
      legacy !== LOCAL_USER_ID
    ) {
      state.authUserId = legacy;
    }
    delete state.userId;
  }

  return state;
}

export const useSessionStore = create<SessionState>()(
  persist<SessionState, [], [], PersistedSession>(
    (set, get) => ({
      ...initialState,

      markHydrated: () => set({ hydrated: true }),

      applySignedIn: ({ authUserId, email }) => {
        const previous = get().authUserId;
        const switched = previous.length > 0 && previous !== authUserId;

        if (switched) {
          set({
            ...profileDefaults,
            quotaMonth: monthKey(),
            authUserId,
            email,
            authStatus: 'signedIn',
            profileLoaded: false,
          });
          return 'switched';
        }

        set({ authUserId, email, authStatus: 'signedIn' });
        return 'same';
      },

      applySignedOut: () => {
        const previous = get();

        // 本來就沒登入（例如冷啟動確認狀態）就只更新狀態，
        // 否則會把訪客自己選的身分、地區與技能標籤清掉。
        if (previous.authStatus !== 'signedIn') {
          set({ authStatus: 'signedOut', email: null, profileLoaded: false });
          return;
        }

        set({
          ...profileDefaults,
          // 訂閱與配額屬於帳號的計費狀態，留在裝置上：
          // 清掉的話登出再登入就能把免費對話配額重置成滿的。
          // 換成別的帳號時 applySignedIn 的 'switched' 分支才會重設。
          isPremium: previous.isPremium,
          premiumSince: previous.premiumSince,
          chatQuotaRemaining: previous.chatQuotaRemaining,
          quotaMonth: previous.quotaMonth,
          openedPeerIds: previous.openedPeerIds,
          // authUserId 保留：下次登入時用來判斷是不是換了另一個帳號。
          authUserId: previous.authUserId,
          hydrated: previous.hydrated,
          authStatus: 'signedOut',
          email: null,
          profileLoaded: false,
        });
      },

      applyRemoteProfile: (fields) =>
        set({
          displayName: fields.displayName,
          role: fields.role,
          region: fields.region,
          skills: fields.skills,
          privacyAccepted: fields.privacyAccepted,
          profileLoaded: true,
        }),

      markProfileLoaded: () => set({ profileLoaded: true }),

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
        if (get().quotaMonth === current) return false;

        set({
          quotaMonth: current,
          chatQuotaRemaining: FREE_MONTHLY_CHAT_QUOTA,
          openedPeerIds: [],
        });
        return true;
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

      // 只重設身分資料，登入狀態保留（登出是另一個動作）。
      resetSession: () =>
        set((state) => ({
          ...profileDefaults,
          quotaMonth: monthKey(),
          hydrated: true,
          authStatus: state.authStatus,
          authUserId: state.authUserId,
          email: state.email,
          profileLoaded: state.profileLoaded,
        })),
    }),
    {
      name: 'instantgig-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        authUserId: state.authUserId,
        email: state.email,
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
      version: 2,
      migrate: (persisted, version) => migrateSession(persisted, version),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
        state?.syncQuotaMonth();
      },
    },
  ),
);

/**
 * 目前登入身分的 id：雲端任務與提案的擁有者。
 * 訪客與尚未確認登入狀態時回傳空字串，因此「我的任務」「我的提案」不會誤判。
 */
export function useMyUserId(): string {
  return useSessionStore((state) => (state.authStatus === 'signedIn' ? state.authUserId : ''));
}

/** 目前是否已登入（發布任務、投遞提案、開啟對話都需要）。 */
export function useIsSignedIn(): boolean {
  return useSessionStore((state) => state.authStatus === 'signedIn');
}

/**
 * 是否享有進階版權益。
 * 訂閱狀態屬於帳號，登出後裝置上仍留著（同一個帳號回來才算數），
 * 因此訪客狀態一律視為免費版，不會把前一位使用者的訂閱狀態顯示給下一個人。
 */
export function useIsPremium(): boolean {
  return useSessionStore((state) => state.authStatus === 'signedIn' && state.isPremium);
}
