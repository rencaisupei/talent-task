import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { regionCoordinate } from '@/lib/regions';
import { SEED_GIGS } from '@/lib/seed';
import { useNotificationStore } from '@/lib/stores/notifications';
import {
  type BudgetLevelId,
  type Gig,
  type GigLocation,
  LOCAL_USER_ID,
  type PublishReview,
} from '@/lib/types';

export interface PublishGigInput {
  categoryId: string;
  tag: string;
  detail: string;
  location: GigLocation;
  budgetLevel: BudgetLevelId;
  isUrgent: boolean;
  clientId: string;
  clientName: string;
  /** 發布前的即時審核結果，未通過者不會出現在任務牆。 */
  review: PublishReview;
}

export interface ReviewDecisionInput {
  adminId: string;
  adminName: string;
  note?: string;
}

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
  publishGig: (input: PublishGigInput) => Gig;
  /** 管理員複審放行，任務開始曝光。 */
  approveGigReview: (gigId: string, input: ReviewDecisionInput) => void;
  /** 管理員複審退回，任務不予上架。 */
  rejectGigReview: (gigId: string, input: ReviewDecisionInput) => void;
  markTalking: (gigId: string) => void;
  assignGig: (gigId: string, talentId: string, talentName: string) => void;
  completeGig: (gigId: string) => void;
  closeGig: (gigId: string) => void;
  /** 管理員強制下架任務（記錄下架原因）。 */
  takedownGig: (gigId: string, reason: string) => void;
  /** 管理員恢復上架，任務回到等待媒合。 */
  restoreGig: (gigId: string) => void;
}

function isPersistedGigState(value: unknown): value is { gigs?: Gig[] } {
  return typeof value === 'object' && value !== null;
}

/** 補齊地圖模式需要的座標（沿用縣市中心點）。 */
function withCoordinate(gig: Gig): Gig {
  if (gig.location.latitude !== undefined && gig.location.longitude !== undefined) return gig;
  const coordinate = regionCoordinate(gig.location.region);
  return { ...gig, location: { ...gig.location, ...coordinate } };
}

export const useGigStore = create<GigState>()(
  persist(
    (set, get) => ({
      gigs: SEED_GIGS,

      publishGig: (input) => {
        const coordinate =
          input.location.latitude !== undefined && input.location.longitude !== undefined
            ? {}
            : regionCoordinate(input.location.region);
        const gig: Gig = {
          id: `gig_${Date.now()}`,
          title: `${input.tag}｜${input.isUrgent ? '急件立即處理' : '徵求專業協助'}`,
          categoryId: input.categoryId,
          tag: input.tag,
          detail: input.detail,
          location: { ...input.location, ...coordinate },
          budgetLevel: input.budgetLevel,
          isUrgent: input.isUrgent,
          clientId: input.clientId,
          clientName: input.clientName,
          createdAt: Date.now(),
          status: 'open',
          review: input.review,
        };
        set((state) => ({ gigs: [gig, ...state.gigs] }));

        const passed = input.review.state === 'approved';
        useNotificationStore.getState().pushNotification({
          kind: passed ? 'system' : 'moderation',
          title: passed ? '認證通過，任務已廣播' : '任務已送交管理員複審',
          body: passed
            ? `「${gig.title}」通過即時認證，已發送給全台符合「${gig.tag}」的人才。`
            : `「${gig.title}」未通過即時認證（${input.review.ai.reasons[0] ?? '內容需人工確認'}），管理員複審通過後才會曝光。`,
          gigId: gig.id,
        });
        return gig;
      },

      approveGigReview: (gigId, { adminId, adminName, note }) => {
        const gig = get().gigs.find((item) => item.id === gigId);
        set((state) => ({
          gigs: state.gigs.map((item) =>
            item.id === gigId && item.review
              ? {
                  ...item,
                  status: item.status === 'closed' ? 'open' : item.status,
                  review: {
                    ...item.review,
                    state: 'approved',
                    adminId,
                    adminName,
                    adminNote: note,
                    decidedAt: Date.now(),
                  },
                }
              : item,
          ),
        }));
        if (gig && gig.clientId === LOCAL_USER_ID) {
          useNotificationStore.getState().pushNotification({
            kind: 'moderation',
            title: '複審通過，任務已上架',
            body: `「${gig.title}」經管理員複審確認無詐騙風險，已開始推播給符合標籤的人才。`,
            gigId: gig.id,
          });
        }
      },

      rejectGigReview: (gigId, { adminId, adminName, note }) => {
        const gig = get().gigs.find((item) => item.id === gigId);
        set((state) => ({
          gigs: state.gigs.map((item) =>
            item.id === gigId && item.review
              ? {
                  ...item,
                  status: 'closed',
                  review: {
                    ...item.review,
                    state: 'rejected',
                    adminId,
                    adminName,
                    adminNote: note,
                    decidedAt: Date.now(),
                  },
                }
              : item,
          ),
        }));
        if (gig && gig.clientId === LOCAL_USER_ID) {
          useNotificationStore.getState().pushNotification({
            kind: 'moderation',
            title: '複審未通過，任務未上架',
            body: `「${gig.title}」因「${note ?? '內容有詐騙風險'}」未通過複審，請修正內容後重新發布。`,
            gigId: gig.id,
          });
        }
      },

      markTalking: (gigId) =>
        set((state) => ({
          gigs: state.gigs.map((gig) =>
            gig.id === gigId && gig.status === 'open' ? { ...gig, status: 'talking' } : gig,
          ),
        })),

      assignGig: (gigId, talentId, talentName) =>
        set((state) => ({
          gigs: state.gigs.map((gig) =>
            gig.id === gigId
              ? {
                  ...gig,
                  status: 'assigned',
                  assignedTalentId: talentId,
                  assignedTalentName: talentName,
                }
              : gig,
          ),
        })),

      completeGig: (gigId) => {
        const gig = get().gigs.find((item) => item.id === gigId);
        set((state) => ({
          gigs: state.gigs.map((item) =>
            item.id === gigId ? { ...item, status: 'completed', completedAt: Date.now() } : item,
          ),
        }));
        if (gig) {
          useNotificationStore.getState().pushNotification({
            kind: 'review',
            title: '任務已完成，等待你的評價',
            body: `「${gig.title}」已標記完成，留下評價協助建立平台信任度。`,
            gigId: gig.id,
          });
        }
      },

      closeGig: (gigId) =>
        set((state) => ({
          gigs: state.gigs.map((gig) => (gig.id === gigId ? { ...gig, status: 'closed' } : gig)),
        })),

      takedownGig: (gigId, reason) => {
        const gig = get().gigs.find((item) => item.id === gigId);
        set((state) => ({
          gigs: state.gigs.map((item) =>
            item.id === gigId
              ? { ...item, status: 'closed', takedownReason: reason, takedownAt: Date.now() }
              : item,
          ),
        }));
        if (gig && gig.clientId === LOCAL_USER_ID) {
          useNotificationStore.getState().pushNotification({
            kind: 'system',
            title: '任務已被管理員下架',
            body: `「${gig.title}」因「${reason}」暫停曝光，修正後可聯繫客服恢復上架。`,
            gigId: gig.id,
          });
        }
      },

      restoreGig: (gigId) =>
        set((state) => ({
          gigs: state.gigs.map((gig) =>
            gig.id === gigId
              ? { ...gig, status: 'open', takedownReason: undefined, takedownAt: undefined }
              : gig,
          ),
        })),
    }),
    {
      name: 'instantgig-gigs',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: (persisted, version) => {
        const state = isPersistedGigState(persisted) ? persisted : undefined;
        if (version < 3) {
          const existing = (state?.gigs ?? []).map(withCoordinate);
          const existingIds = new Set(existing.map((gig) => gig.id));
          const missingSeeds = SEED_GIGS.filter((gig) => !existingIds.has(gig.id));
          return { ...state, gigs: [...missingSeeds, ...existing] };
        }
        return persisted;
      },
    },
  ),
);
