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
  openedClientIds: string[];

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
  requestChatWith: (clientId: string) => ChatRequestResult;
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
  openedClientIds: [] as string[],
};

export const useSessionStore = create<SessionState>()(
  persist(
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
            openedClientIds: [],
          });
        }
      },

      requestChatWith: (clientId) => {
        get().syncQuotaMonth();
        const { isPremium, openedClientIds, chatQuotaRemaining } = get();

        if (isPremium) return 'unlimited';
        if (openedClientIds.includes(clientId)) return 'existing';
        if (chatQuotaRemaining <= 0) return 'blocked';

        set({
          chatQuotaRemaining: chatQuotaRemaining - 1,
          openedClientIds: [...openedClientIds, clientId],
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
        openedClientIds: state.openedClientIds,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
        state?.syncQuotaMonth();
      },
    },
  ),
);
