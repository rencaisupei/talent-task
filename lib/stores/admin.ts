import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  ADMIN_PASSCODE,
  AUDIENCE_LABEL,
  AUDIENCE_REACH,
  DEFAULT_FLAGS,
  SEED_ANNOUNCEMENTS,
  SEED_EVENTS,
  SEED_ORDERS,
  SEED_REPORTS,
  SEED_REVIEWS,
} from '@/lib/data/admin';
import { displayName } from '@/lib/data/profiles';
import { useMomentsStore } from '@/lib/stores/moments';
import { useNotificationsStore } from '@/lib/stores/notifications';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import type {
  AdminAnnouncement,
  AdminAuditEntry,
  AdminEvent,
  AdminFlags,
  AdminOrder,
  AdminReport,
  AdminReviewItem,
  AdminReviewKind,
  AdminReviewStatus,
  AdminUserRecord,
  AdminUserStatus,
  PushAudience,
  PushCampaign,
  Tier,
} from '@/lib/types';

export const DEFAULT_USER_RECORD: AdminUserRecord = {
  status: 'active',
  warnings: 0,
  verified: true,
  note: '',
  coinAdjust: 0,
  tierOverride: null,
  updatedAt: 0,
};

interface AdminState {
  authed: boolean;
  actor: string;
  loginError: string | null;
  users: Record<string, AdminUserRecord>;
  reports: AdminReport[];
  reviews: AdminReviewItem[];
  orders: AdminOrder[];
  campaigns: PushCampaign[];
  events: AdminEvent[];
  announcements: AdminAnnouncement[];
  audit: AdminAuditEntry[];
  flags: AdminFlags;
  closedRoomIds: string[];
  pinnedRoomIds: string[];
  roomRewards: Record<string, number>;

  login: (passcode: string) => boolean;
  logout: () => void;
  clearLoginError: () => void;

  setUserStatus: (userId: string, status: AdminUserStatus) => void;
  warnUser: (userId: string) => void;
  setUserVerified: (userId: string, verified: boolean) => void;
  setUserNote: (userId: string, note: string) => void;
  adjustUserCoins: (userId: string, delta: number) => void;
  setUserTier: (userId: string, tier: Tier | null) => void;

  resolveReport: (reportId: string, resolution: string, status: AdminUserStatus | null) => void;
  dismissReport: (reportId: string) => void;

  decideReview: (reviewId: string, status: Exclude<AdminReviewStatus, 'pending'>) => void;
  /** AI 巡邏命中的內容排進待審佇列。 */
  enqueueReview: (payload: {
    kind: AdminReviewKind;
    userId: string;
    content: string;
    flags: string[];
    momentId?: string;
  }) => void;
  /** 由自動化流程（例如 AI 巡邏員）寫入稽核紀錄。 */
  logAgent: (actor: string, action: string, target?: string) => void;

  closeRoom: (roomId: string) => void;
  reopenRoom: (roomId: string) => void;
  toggleRoomPin: (roomId: string) => void;
  setRoomReward: (roomId: string, coins: number) => void;

  refundOrder: (orderId: string) => void;

  sendCampaign: (payload: { title: string; body: string; audience: PushAudience }) => number;

  addEvent: (payload: {
    name: string;
    tag: string;
    description: string;
    multiplier: number;
  }) => void;
  toggleEvent: (eventId: string) => void;
  removeEvent: (eventId: string) => void;

  addAnnouncement: (payload: { title: string; body: string }) => void;
  toggleAnnouncement: (announcementId: string) => void;
  toggleAnnouncementPin: (announcementId: string) => void;
  removeAnnouncement: (announcementId: string) => void;

  setFlag: <K extends keyof AdminFlags>(key: K, value: AdminFlags[K]) => void;
  addBannedWord: (word: string) => void;
  removeBannedWord: (word: string) => void;

  clearAudit: () => void;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => {
      /** 每個後台動作都寫進稽核紀錄。 */
      const log = (action: string, target?: string) =>
        set((state) => ({
          audit: [
            {
              id: makeId('log'),
              actor: state.actor,
              action,
              target,
              createdAt: Date.now(),
            },
            ...state.audit,
          ].slice(0, 200),
        }));

      const patchUser = (userId: string, patch: Partial<AdminUserRecord>) =>
        set((state) => ({
          users: {
            ...state.users,
            [userId]: {
              ...DEFAULT_USER_RECORD,
              ...state.users[userId],
              ...patch,
              updatedAt: Date.now(),
            },
          },
        }));

      return {
        authed: false,
        actor: '林建豪',
        loginError: null,
        users: {},
        reports: SEED_REPORTS,
        reviews: SEED_REVIEWS,
        orders: SEED_ORDERS,
        campaigns: [],
        events: SEED_EVENTS,
        announcements: SEED_ANNOUNCEMENTS,
        audit: [],
        flags: DEFAULT_FLAGS,
        closedRoomIds: [],
        pinnedRoomIds: [],
        roomRewards: {},

        login: (passcode) => {
          if (passcode.trim() !== ADMIN_PASSCODE) {
            set({ loginError: '密碼不正確，請再試一次' });
            return false;
          }
          set({ authed: true, loginError: null });
          log('登入管理員平台');
          return true;
        },

        logout: () => {
          log('登出管理員平台');
          set({ authed: false });
        },

        clearLoginError: () => set({ loginError: null }),

        setUserStatus: (userId, status) => {
          patchUser(userId, { status });
          log(`將帳號狀態改為「${status}」`, displayName(userId, userId));
        },

        warnUser: (userId) => {
          const current = get().users[userId] ?? DEFAULT_USER_RECORD;
          patchUser(userId, { warnings: current.warnings + 1 });
          log('發出違規警告', displayName(userId, userId));
        },

        setUserVerified: (userId, verified) => {
          patchUser(userId, { verified });
          log(verified ? '通過真人認證' : '取消真人認證', displayName(userId, userId));
        },

        setUserNote: (userId, note) => {
          patchUser(userId, { note });
          log('更新後台備註', displayName(userId, userId));
        },

        adjustUserCoins: (userId, delta) => {
          const current = get().users[userId] ?? DEFAULT_USER_RECORD;
          patchUser(userId, { coinAdjust: current.coinAdjust + delta });
          if (userId === 'me') {
            const subscription = useSubscriptionStore.getState();
            if (delta >= 0) subscription.addCoins(delta);
            else subscription.spendCoins(Math.abs(delta));
          }
          log(
            `${delta >= 0 ? '發放' : '扣除'} ${Math.abs(delta)} 心動代幣`,
            displayName(userId, userId),
          );
        },

        setUserTier: (userId, tier) => {
          patchUser(userId, { tierOverride: tier });
          if (userId === 'me' && tier) {
            useSubscriptionStore.setState({ tier });
          }
          log(tier ? `會員等級調整為 ${tier}` : '取消會員等級指定', displayName(userId, userId));
        },

        resolveReport: (reportId, resolution, status) => {
          const report = get().reports.find((item) => item.id === reportId);
          set((state) => ({
            reports: state.reports.map((item) =>
              item.id === reportId
                ? { ...item, status: 'resolved', resolution, handledBy: state.actor }
                : item,
            ),
          }));
          if (report && status) {
            patchUser(report.targetId, {
              status,
              warnings: (get().users[report.targetId]?.warnings ?? 0) + 1,
            });
          }
          log(
            `檢舉處理完成：${resolution}`,
            report ? displayName(report.targetId, report.targetId) : undefined,
          );
        },

        dismissReport: (reportId) => {
          const report = get().reports.find((item) => item.id === reportId);
          set((state) => ({
            reports: state.reports.map((item) =>
              item.id === reportId
                ? { ...item, status: 'dismissed', resolution: '檢舉不成立', handledBy: state.actor }
                : item,
            ),
          }));
          log('駁回檢舉', report ? displayName(report.targetId, report.targetId) : undefined);
        },

        decideReview: (reviewId, status) => {
          const review = get().reviews.find((item) => item.id === reviewId);
          set((state) => ({
            reviews: state.reviews.map((item) =>
              item.id === reviewId ? { ...item, status } : item,
            ),
          }));
          if (status === 'removed' && review?.momentId) {
            useMomentsStore.getState().deleteMoment(review.momentId);
          }
          log(
            status === 'removed' ? '內容下架' : '內容審核通過',
            review ? displayName(review.userId, review.userId) : undefined,
          );
        },

        enqueueReview: ({ kind, userId, content, flags, momentId }) => {
          const item: AdminReviewItem = {
            id: makeId('review'),
            kind,
            userId,
            content,
            flags,
            status: 'pending',
            createdAt: Date.now(),
            momentId,
          };
          set((state) => ({ reviews: [item, ...state.reviews].slice(0, 120) }));
        },

        logAgent: (actor, action, target) =>
          set((state) => ({
            audit: [
              { id: makeId('log'), actor, action, target, createdAt: Date.now() },
              ...state.audit,
            ].slice(0, 200),
          })),

        closeRoom: (roomId) => {
          set((state) => ({
            closedRoomIds: state.closedRoomIds.includes(roomId)
              ? state.closedRoomIds
              : [...state.closedRoomIds, roomId],
          }));
          log('關閉遊戲房', roomId);
        },

        reopenRoom: (roomId) => {
          set((state) => ({
            closedRoomIds: state.closedRoomIds.filter((item) => item !== roomId),
          }));
          log('重新開放遊戲房', roomId);
        },

        toggleRoomPin: (roomId) => {
          const pinned = get().pinnedRoomIds.includes(roomId);
          set((state) => ({
            pinnedRoomIds: pinned
              ? state.pinnedRoomIds.filter((item) => item !== roomId)
              : [...state.pinnedRoomIds, roomId],
          }));
          log(pinned ? '取消置頂遊戲房' : '置頂遊戲房', roomId);
        },

        setRoomReward: (roomId, coins) => {
          set((state) => ({ roomRewards: { ...state.roomRewards, [roomId]: coins } }));
          log(`調整獎池為 ${coins} 心動代幣`, roomId);
        },

        refundOrder: (orderId) => {
          const order = get().orders.find((item) => item.id === orderId);
          set((state) => ({
            orders: state.orders.map((item) =>
              item.id === orderId ? { ...item, status: 'refunded' } : item,
            ),
          }));
          log(
            `退款 NT$${order?.amountTwd ?? 0}`,
            order ? displayName(order.userId, order.userId) : orderId,
          );
        },

        sendCampaign: ({ title, body, audience }) => {
          const reach = AUDIENCE_REACH[audience];
          set((state) => ({
            campaigns: [
              {
                id: makeId('push'),
                title,
                body,
                audience,
                reach,
                sentAt: Date.now(),
                sentBy: state.actor,
              },
              ...state.campaigns,
            ],
          }));
          useNotificationsStore.getState().push({ kind: 'system', title, body });
          log(`發送推播給${AUDIENCE_LABEL[audience]}（${reach} 人）`, title);
          return reach;
        },

        addEvent: ({ name, tag, description, multiplier }) => {
          const now = Date.now();
          set((state) => ({
            events: [
              {
                id: makeId('event'),
                name,
                tag,
                description,
                multiplier,
                startAt: now,
                endAt: now + 7 * 24 * 60 * 60 * 1000,
                active: true,
              },
              ...state.events,
            ],
          }));
          log('建立活動', name);
        },

        toggleEvent: (eventId) => {
          const event = get().events.find((item) => item.id === eventId);
          set((state) => ({
            events: state.events.map((item) =>
              item.id === eventId ? { ...item, active: !item.active } : item,
            ),
          }));
          log(event?.active ? '暫停活動' : '啟用活動', event?.name);
        },

        removeEvent: (eventId) => {
          const event = get().events.find((item) => item.id === eventId);
          set((state) => ({ events: state.events.filter((item) => item.id !== eventId) }));
          log('刪除活動', event?.name);
        },

        addAnnouncement: ({ title, body }) => {
          set((state) => ({
            announcements: [
              {
                id: makeId('notice'),
                title,
                body,
                pinned: false,
                active: true,
                createdAt: Date.now(),
              },
              ...state.announcements,
            ],
          }));
          log('發佈公告', title);
        },

        toggleAnnouncement: (announcementId) => {
          const notice = get().announcements.find((item) => item.id === announcementId);
          set((state) => ({
            announcements: state.announcements.map((item) =>
              item.id === announcementId ? { ...item, active: !item.active } : item,
            ),
          }));
          log(notice?.active ? '下架公告' : '上架公告', notice?.title);
        },

        toggleAnnouncementPin: (announcementId) => {
          const notice = get().announcements.find((item) => item.id === announcementId);
          set((state) => ({
            announcements: state.announcements.map((item) =>
              item.id === announcementId ? { ...item, pinned: !item.pinned } : item,
            ),
          }));
          log(notice?.pinned ? '取消置頂公告' : '置頂公告', notice?.title);
        },

        removeAnnouncement: (announcementId) => {
          const notice = get().announcements.find((item) => item.id === announcementId);
          set((state) => ({
            announcements: state.announcements.filter((item) => item.id !== announcementId),
          }));
          log('刪除公告', notice?.title);
        },

        setFlag: (key, value) => {
          set((state) => ({ flags: { ...state.flags, [key]: value } }));
          log(`更新系統設定 ${key}`, String(value));
        },

        addBannedWord: (word) => {
          const trimmed = word.trim();
          if (!trimmed) return;
          set((state) => ({
            flags: {
              ...state.flags,
              bannedWords: state.flags.bannedWords.includes(trimmed)
                ? state.flags.bannedWords
                : [...state.flags.bannedWords, trimmed],
            },
          }));
          log('新增敏感詞', trimmed);
        },

        removeBannedWord: (word) => {
          set((state) => ({
            flags: {
              ...state.flags,
              bannedWords: state.flags.bannedWords.filter((item) => item !== word),
            },
          }));
          log('移除敏感詞', word);
        },

        clearAudit: () => set({ audit: [] }),
      };
    },
    {
      name: 'jimatch-admin',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        users: state.users,
        reports: state.reports,
        reviews: state.reviews,
        orders: state.orders,
        campaigns: state.campaigns,
        events: state.events,
        announcements: state.announcements,
        audit: state.audit,
        flags: state.flags,
        closedRoomIds: state.closedRoomIds,
        pinnedRoomIds: state.pinnedRoomIds,
        roomRewards: state.roomRewards,
      }),
    },
  ),
);

/** 取得某位使用者的後台紀錄（含預設值）。 */
export function useAdminUserRecord(userId: string): AdminUserRecord {
  const record = useAdminStore((state) => state.users[userId]);
  return record ?? DEFAULT_USER_RECORD;
}

export function adminUserRecord(userId: string): AdminUserRecord {
  return useAdminStore.getState().users[userId] ?? DEFAULT_USER_RECORD;
}

export function usePendingReportCount() {
  return useAdminStore(
    (state) => state.reports.filter((report) => report.status === 'pending').length,
  );
}

export function usePendingReviewCount() {
  return useAdminStore(
    (state) => state.reviews.filter((review) => review.status === 'pending').length,
  );
}
