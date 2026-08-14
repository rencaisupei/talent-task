import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MAX_TALENT_TAGS } from '@/lib/omniTags';
import { REGION_ANY } from '@/lib/regions';
import type { UserRole, VerificationStatus } from '@/lib/types';

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
  verification: VerificationStatus;
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
  setVerification: (status: VerificationStatus) => void;
  activatePremium: () => void;
  cancelPremium: () => void;
  syncQuotaMonth: () => void;
  requestChatWith: (clientId: string) => ChatRequestResult;
  resetSession: () => void;
}

const initialState = {
  hydrated: false,
  userId: 'user_local',
  displayName: '我',
  role: null as UserRole | null,
  region: REGION_ANY,
  privacyAccepted: false,
  skills: [] as string[],
  credentialUri: null as string | null,
  credentialUploadState: 'idle' as UploadState,
  verification: 'none' as VerificationStatus,
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

      setVerification: (status) => set({ verification: status }),

      activatePremium: () => set({ isPremium: true, premiumSince: Date.now() }),

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
        verification: state.verification,
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
