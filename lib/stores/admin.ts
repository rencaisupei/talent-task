import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SEED_REPORTS, SEED_VERIFICATIONS } from '@/lib/seed';
import { useSessionStore } from '@/lib/stores/session';
import type { AbuseReport, VerificationRequest } from '@/lib/types';

interface AdminState {
  verifications: VerificationRequest[];
  reports: AbuseReport[];
  bannedUserIds: string[];
  submitVerification: (request: VerificationRequest) => void;
  addReport: (report: AbuseReport) => void;
  approveVerification: (id: string) => void;
  rejectVerification: (id: string) => void;
  resolveReport: (id: string) => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
}

function applySessionVerification(
  request: VerificationRequest | undefined,
  status: 'approved' | 'rejected',
) {
  if (!request) return;
  const session = useSessionStore.getState();
  if (request.talentId === session.userId) session.setVerification(status);
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      verifications: SEED_VERIFICATIONS,
      reports: SEED_REPORTS,
      bannedUserIds: [],

      submitVerification: (request) =>
        set((state) => ({
          verifications: [
            request,
            ...state.verifications.filter((item) => item.talentId !== request.talentId),
          ],
        })),

      addReport: (report) => set((state) => ({ reports: [report, ...state.reports] })),

      approveVerification: (id) => {
        applySessionVerification(
          get().verifications.find((item) => item.id === id),
          'approved',
        );
        set((state) => ({
          verifications: state.verifications.map((item) =>
            item.id === id ? { ...item, status: 'approved' } : item,
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

      resolveReport: (id) =>
        set((state) => ({
          reports: state.reports.map((item) =>
            item.id === id ? { ...item, resolved: true } : item,
          ),
        })),

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
      version: 1,
    },
  ),
);
