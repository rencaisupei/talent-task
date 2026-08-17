import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SEED_VERIFICATIONS } from '@/lib/seed';
import { useNotificationStore } from '@/lib/stores/notifications';
import { usePlatformUserStore } from '@/lib/stores/platformUsers';
import { useSessionStore } from '@/lib/stores/session';
import type { VerificationRequest } from '@/lib/types';

interface AdminState {
  verifications: VerificationRequest[];
  bannedUserIds: string[];
  submitVerification: (request: VerificationRequest) => void;
  approveVerification: (id: string) => void;
  rejectVerification: (id: string) => void;
  /** 證照人工驗證（信任度加分項，與能否接案無關）。 */
  verifyCredential: (id: string, verified: boolean) => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
}

function isPersistedAdminState(value: unknown): value is {
  verifications?: VerificationRequest[];
  bannedUserIds?: string[];
} {
  return typeof value === 'object' && value !== null;
}

function applySessionVerification(
  request: VerificationRequest | undefined,
  status: 'approved' | 'rejected',
) {
  if (!request) return;
  usePlatformUserStore.getState().setVerification(request.talentId, status);
  const session = useSessionStore.getState();
  if (request.talentId === session.authUserId) {
    session.setVerification(status);
    if (status === 'approved' && request.credentialUri !== undefined) {
      session.setCredentialVerified(true);
    }
    useNotificationStore.getState().pushNotification({
      kind: 'verification',
      title: status === 'approved' ? '人才資料複審通過' : '人才資料複審未通過',
      body:
        status === 'approved'
          ? request.credentialUri !== undefined
            ? '已通過複審，證照驗證徽章與信任度加分已套用於你的公開檔案。'
            : '已通過複審，你的公開檔案已顯示認證徽章，可開始接案。'
          : '資料含疑似不實或高風險內容，請修正技能與服務說明後重新送審。',
    });
  }
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      verifications: SEED_VERIFICATIONS,
      bannedUserIds: [],

      submitVerification: (request) =>
        set((state) => ({
          verifications: [
            request,
            ...state.verifications.filter((item) => item.talentId !== request.talentId),
          ],
        })),

      approveVerification: (id) => {
        const request = get().verifications.find((item) => item.id === id);
        applySessionVerification(request, 'approved');
        set((state) => ({
          verifications: state.verifications.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'approved',
                  credentialVerified: item.credentialUri !== undefined,
                }
              : item,
          ),
        }));
      },

      rejectVerification: (id) => {
        applySessionVerification(
          get().verifications.find((item) => item.id === id),
          'rejected',
        );
        set((state) => ({
          verifications: state.verifications.map((item) =>
            item.id === id ? { ...item, status: 'rejected' } : item,
          ),
        }));
      },

      verifyCredential: (id, verified) => {
        const request = get().verifications.find((item) => item.id === id);
        set((state) => ({
          verifications: state.verifications.map((item) =>
            item.id === id ? { ...item, credentialVerified: verified } : item,
          ),
        }));
        if (!request) return;

        const session = useSessionStore.getState();
        if (request.talentId !== session.authUserId) return;

        session.setCredentialVerified(verified);
        useNotificationStore.getState().pushNotification({
          kind: 'verification',
          title: verified ? '證照驗證通過' : '證照驗證未通過',
          body: verified
            ? '你的證照已驗證，信任度加分徽章已套用於公開檔案。'
            : '證照影像無法辨識，加分徽章未套用（仍可正常接案）。',
          talentId: request.talentId,
        });
      },

      banUser: (userId) =>
        set((state) => ({
          bannedUserIds: state.bannedUserIds.includes(userId)
            ? state.bannedUserIds
            : [...state.bannedUserIds, userId],
        })),

      unbanUser: (userId) =>
        set((state) => ({
          bannedUserIds: state.bannedUserIds.filter((item) => item !== userId),
        })),
    }),
    {
      name: 'instantgig-admin',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      // 檢舉紀錄已改存雲端的 conversations，本機只保留人才複審與封禁清單。
      partialize: (state) => ({
        verifications: state.verifications,
        bannedUserIds: state.bannedUserIds,
      }),
      migrate: (persisted, version) => {
        const state = isPersistedAdminState(persisted) ? persisted : undefined;
        const existing = state?.verifications ?? [];
        const banned = state?.bannedUserIds ?? [];
        if (version >= 2) return { verifications: existing, bannedUserIds: banned };

        const seedIds = new Set(SEED_VERIFICATIONS.map((item) => item.id));
        // 舊示範資料沒有 AI 判定紀錄，改用新版示範資料，使用者自行送審的紀錄保留。
        const kept = existing.filter((item) => !seedIds.has(item.id));
        return { verifications: [...kept, ...SEED_VERIFICATIONS], bannedUserIds: banned };
      },
    },
  ),
);
