import { PLATFORM_BASELINE, SEED_GIGS, SEED_TALENTS } from '@/lib/seed';
import { PREMIUM_PRICE_TWD } from '@/lib/stores/session';
import {
  type AdminAccount,
  type AdminAuditEntry,
  type Announcement,
  type AnnouncementAudience,
  LOCAL_USER_ID,
  type PlatformUser,
  type SubscriptionRecord,
  type WeeklyPoint,
} from '@/lib/types';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = Date.UTC(2026, 7, 14, 4, 0, 0);

/**
 * 管理員專屬平台的示範帳號（本機驗證）。
 * 接後端後改為伺服器端帳號與雜湊密碼，畫面不需調整。
 */
export const SEED_ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 'admin_owner',
    email: 'admin@instantgig.tw',
    password: 'Instant2026!',
    name: '平台總管理員',
    role: 'owner',
    createdAt: NOW - 400 * DAY,
  },
  {
    id: 'admin_reviewer',
    email: 'review@instantgig.tw',
    password: 'Review2026!',
    name: '審核專員 林昀',
    role: 'moderator',
    createdAt: NOW - 180 * DAY,
  },
  {
    id: 'admin_analyst',
    email: 'data@instantgig.tw',
    password: 'Data2026!',
    name: '數據分析員 何柏',
    role: 'analyst',
    createdAt: NOW - 96 * DAY,
  },
];

/** 客戶列：由示範任務推導（同一客戶累計發布件數與最早發布時間）。 */
const CLIENT_USERS: PlatformUser[] = (() => {
  const map = new Map<
    string,
    { name: string; region: string; gigs: number; completed: number; firstAt: number }
  >();

  for (const gig of SEED_GIGS) {
    if (gig.clientId === LOCAL_USER_ID) continue;
    const entry = map.get(gig.clientId);
    if (entry) {
      entry.gigs += 1;
      entry.completed += gig.status === 'completed' ? 1 : 0;
      entry.firstAt = Math.min(entry.firstAt, gig.createdAt);
    } else {
      map.set(gig.clientId, {
        name: gig.clientName,
        region: gig.location.region,
        gigs: 1,
        completed: gig.status === 'completed' ? 1 : 0,
        firstAt: gig.createdAt,
      });
    }
  }

  return [...map.entries()].map(([id, entry], index) => ({
    id,
    name: entry.name,
    role: 'client' as const,
    region: entry.region,
    joinedAt: entry.firstAt - (index + 2) * 9 * DAY,
    tags: [],
    isPremium: false,
    verification: 'none' as const,
    completedJobs: entry.completed,
    rating: 0,
    responseMinutes: 18 + index * 3,
    publishedGigs: entry.gigs,
  }));
})();

/** 人才列：沿用人才示範檔案，補上加入時間與訂閱起算日。 */
const TALENT_USERS: PlatformUser[] = SEED_TALENTS.map((talent, index) => ({
  id: talent.id,
  name: talent.name,
  role: 'talent' as const,
  region: talent.region,
  joinedAt: NOW - (index + 3) * 11 * DAY,
  tags: talent.tags,
  isPremium: talent.isPremium,
  premiumSince: talent.isPremium ? NOW - (index + 1) * 23 * DAY : undefined,
  verification: talent.verification,
  completedJobs: talent.completedJobs,
  rating: talent.rating,
  responseMinutes: talent.responseMinutes,
  publishedGigs: 0,
}));

export const SEED_PLATFORM_USERS: PlatformUser[] = [...TALENT_USERS, ...CLIENT_USERS];

/** 進階版訂閱帳務明細（示範抽樣，含退款與取消各一筆）。 */
export const SEED_SUBSCRIPTIONS: SubscriptionRecord[] = TALENT_USERS.filter(
  (user) => user.isPremium,
).map((user, index) => {
  const startedAt = user.premiumSince ?? NOW - (index + 1) * 23 * DAY;
  const status = index === 1 ? 'refunded' : index === 3 ? 'cancelled' : 'active';
  return {
    id: `sub_seed_${index + 1}`,
    userId: user.id,
    userName: user.name,
    amount: PREMIUM_PRICE_TWD,
    status,
    channel: index % 2 === 0 ? 'apple' : 'google',
    invoiceNo: `IG-2026-${String(4200 + index * 17)}`,
    startedAt,
    renewsAt: NOW + ((index * 7) % 28) * DAY + 2 * DAY,
    refundedAt: status === 'refunded' ? NOW - 6 * DAY : undefined,
  } satisfies SubscriptionRecord;
});

/** 近 6 個月營收（進階版人數 × 399）。 */
const MONTHLY_PREMIUM_COUNTS = [178, 192, 205, 214, 226, PLATFORM_BASELINE.premiumTalents];

export const MONTHLY_REVENUE: WeeklyPoint[] = MONTHLY_PREMIUM_COUNTS.map((count, index) => ({
  weekLabel: `${index + 3}月`,
  value: count * PREMIUM_PRICE_TWD,
}));

/** 依受眾估算推播人數（沿用平台基準值）。 */
export function estimateRecipients(audience: AnnouncementAudience): number {
  const { totalClients, totalTalents, premiumTalents } = PLATFORM_BASELINE;
  const table: Record<AnnouncementAudience, number> = {
    all: totalClients + totalTalents,
    client: totalClients,
    talent: totalTalents,
    premium: premiumTalents,
    free: totalTalents - premiumTalents,
  };
  return table[audience];
}

export const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_seed_1',
    title: '中秋連假急件加給提醒',
    body: '連假期間急件量預估成長 40%，人才可提前更新可到場時段，客戶建議提高預算等級以加速媒合。',
    audience: 'all',
    createdAt: NOW - 2 * DAY,
    adminName: '平台總管理員',
    recipientCount: estimateRecipients('all'),
  },
  {
    id: 'ann_seed_2',
    title: '請勿在對話中索取金融資訊',
    body: '所有訊息皆經伺服器端審核，索取銀行帳號、身分證影本或要求離開平台交易將直接封禁帳號。',
    audience: 'talent',
    createdAt: NOW - 9 * DAY,
    adminName: '審核專員 林昀',
    recipientCount: estimateRecipients('talent'),
  },
];

export const SEED_AUDIT_LOG: AdminAuditEntry[] = [
  {
    id: 'audit_seed_1',
    at: NOW - 3 * HOUR,
    adminId: 'admin_reviewer',
    adminName: '審核專員 林昀',
    kind: 'verification',
    summary: '核准技能認證：甲級技術士證照比對通過',
    targetId: 'talent_seed_2',
    targetLabel: '李冠廷',
  },
  {
    id: 'audit_seed_2',
    at: NOW - 8 * HOUR,
    adminId: 'admin_reviewer',
    adminName: '審核專員 林昀',
    kind: 'ban',
    summary: '封禁帳號：對話要求離開平台匯款',
    targetId: 'talent_seed_13',
    targetLabel: '田宗翰',
  },
  {
    id: 'audit_seed_3',
    at: NOW - 26 * HOUR,
    adminId: 'admin_owner',
    adminName: '平台總管理員',
    kind: 'gig',
    summary: '下架任務：重複張貼且內容與標籤不符',
    targetId: 'gig_seed_18',
    targetLabel: '重複張貼任務',
  },
  {
    id: 'audit_seed_4',
    at: NOW - 2 * DAY,
    adminId: 'admin_owner',
    adminName: '平台總管理員',
    kind: 'announcement',
    summary: '發布系統公告：中秋連假急件加給提醒',
  },
  {
    id: 'audit_seed_5',
    at: NOW - 6 * DAY,
    adminId: 'admin_owner',
    adminName: '平台總管理員',
    kind: 'subscription',
    summary: '標記退款：進階版訂閱 IG-2026-4217',
    targetId: 'sub_seed_2',
  },
  {
    id: 'audit_seed_6',
    at: NOW - 7 * DAY,
    adminId: 'admin_analyst',
    adminName: '數據分析員 何柏',
    kind: 'auth',
    summary: '管理員登入平台',
  },
];
