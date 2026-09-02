import type {
  AdminAccount,
  AdminAnnouncement,
  AdminEvent,
  AdminFlags,
  AdminMetricDay,
  AdminOrder,
  AdminOrderStatus,
  AdminReport,
  AdminReportKind,
  AdminReportStatus,
  AdminReviewItem,
  AdminReviewKind,
  AdminReviewStatus,
  AdminRole,
  AdminUserStatus,
  PushAudience,
} from '@/lib/types';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const NOW = Date.now();

/**
 * 管理員平台的進入密碼。目前沒有後端，因此以本機常數驗證；
 * 接上後端後改成呼叫管理員登入 API 即可，畫面不需要調整。
 */
export const ADMIN_PASSCODE = 'jimatch2026';

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  owner: '總管理員',
  moderator: '審核人員',
  support: '客服',
  finance: '財務',
};

export const ADMIN_STATUS_LABEL: Record<AdminUserStatus, string> = {
  active: '正常',
  muted: '禁言中',
  suspended: '暫時停權',
  banned: '永久封鎖',
};

export const AUDIENCE_LABEL: Record<PushAudience, string> = {
  all: '全部使用者',
  free: '免費會員',
  plus: 'Plus 會員',
  vip: 'VIP 會員',
  inactive: '7 天未登入',
  players: '近期玩過遊戲',
};

export const AUDIENCE_REACH: Record<PushAudience, number> = {
  all: 18420,
  free: 14260,
  plus: 3180,
  vip: 980,
  inactive: 5210,
  players: 9640,
};

export type AdminTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export const ADMIN_STATUS_TONE: Record<AdminUserStatus, AdminTone> = {
  active: 'success',
  muted: 'warning',
  suspended: 'warning',
  banned: 'danger',
};

export const REPORT_STATUS_LABEL: Record<AdminReportStatus, string> = {
  pending: '待處理',
  resolved: '已處理',
  dismissed: '已駁回',
};

export const REPORT_STATUS_TONE: Record<AdminReportStatus, AdminTone> = {
  pending: 'warning',
  resolved: 'success',
  dismissed: 'neutral',
};

export const REPORT_KIND_LABEL: Record<AdminReportKind, string> = {
  profile: '個人檔案',
  message: '聊天訊息',
  moment: '動態',
  room: '遊戲房',
  call: '通話',
};

export const SEVERITY_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: '低風險',
  medium: '中風險',
  high: '高風險',
};

export const SEVERITY_TONE: Record<'low' | 'medium' | 'high', AdminTone> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
};

export const REVIEW_STATUS_LABEL: Record<AdminReviewStatus, string> = {
  pending: '待審核',
  approved: '已通過',
  removed: '已下架',
};

export const REVIEW_STATUS_TONE: Record<AdminReviewStatus, AdminTone> = {
  pending: 'warning',
  approved: 'success',
  removed: 'danger',
};

export const REVIEW_KIND_LABEL: Record<AdminReviewKind, string> = {
  moment: '動態內容',
  photo: '個人照片',
  bio: '自我介紹',
};

export const ORDER_STATUS_LABEL: Record<AdminOrderStatus, string> = {
  paid: '已付款',
  refunded: '已退款',
  failed: '付款失敗',
  pending: '處理中',
};

export const ORDER_STATUS_TONE: Record<AdminOrderStatus, AdminTone> = {
  paid: 'success',
  refunded: 'warning',
  failed: 'danger',
  pending: 'info',
};

export const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 'a1',
    name: '林建豪',
    email: 'owner@jimatch.app',
    role: 'owner',
    lastActiveAt: NOW - 8 * MINUTE,
  },
  {
    id: 'a2',
    name: '陳怡君',
    email: 'moderation@jimatch.app',
    role: 'moderator',
    lastActiveAt: NOW - 42 * MINUTE,
  },
  {
    id: 'a3',
    name: '黃梓睿',
    email: 'support@jimatch.app',
    role: 'support',
    lastActiveAt: NOW - 3 * HOUR,
  },
  {
    id: 'a4',
    name: '吳品彤',
    email: 'finance@jimatch.app',
    role: 'finance',
    lastActiveAt: NOW - 26 * HOUR,
  },
];

const METRIC_BASE = [
  { dau: 3120, signups: 186, matches: 940, messages: 12400, revenue: 41200 },
  { dau: 3260, signups: 204, matches: 1012, messages: 13100, revenue: 43850 },
  { dau: 3410, signups: 221, matches: 1084, messages: 13980, revenue: 46120 },
  { dau: 3180, signups: 172, matches: 968, messages: 12760, revenue: 39980 },
  { dau: 3520, signups: 248, matches: 1146, messages: 14620, revenue: 50240 },
  { dau: 4120, signups: 312, matches: 1394, messages: 17240, revenue: 61380 },
  { dau: 4380, signups: 338, matches: 1462, messages: 18150, revenue: 64720 },
];

/** 近 7 日營運數據（假資料，接後端後換成報表 API）。 */
export const METRIC_DAYS: AdminMetricDay[] = METRIC_BASE.map((row, index) => {
  const date = new Date(NOW - (METRIC_BASE.length - 1 - index) * DAY);
  return {
    label: `${date.getMonth() + 1}/${date.getDate()}`,
    ...row,
  };
});

export const REPORT_REASONS = [
  '不當照片',
  '騷擾訊息',
  '疑似詐騙',
  '商業廣告',
  '未成年',
  '假冒他人',
  '遊戲內言語攻擊',
] as const;

export const SEED_REPORTS: AdminReport[] = [
  {
    id: 'r1',
    targetId: 'u7',
    reporterId: 'u5',
    kind: 'message',
    reason: '疑似詐騙',
    detail: '在聊天中要求加通訊軟體並提到投資群組。',
    status: 'pending',
    severity: 'high',
    createdAt: NOW - 22 * MINUTE,
  },
  {
    id: 'r2',
    targetId: 'u12',
    reporterId: 'u2',
    kind: 'profile',
    reason: '假冒他人',
    detail: '照片與某位公開帳號完全相同。',
    status: 'pending',
    severity: 'medium',
    createdAt: NOW - 3 * HOUR,
  },
  {
    id: 'r3',
    targetId: 'u9',
    reporterId: 'u11',
    kind: 'room',
    reason: '遊戲內言語攻擊',
    detail: '在「天黑請閉眼」房間內辱罵其他玩家。',
    status: 'pending',
    severity: 'medium',
    createdAt: NOW - 6 * HOUR,
  },
  {
    id: 'r4',
    targetId: 'u3',
    reporterId: 'u14',
    kind: 'moment',
    reason: '商業廣告',
    detail: '動態內容附帶外部購物連結。',
    status: 'pending',
    severity: 'low',
    createdAt: NOW - 9 * HOUR,
  },
  {
    id: 'r5',
    targetId: 'u6',
    reporterId: 'u8',
    kind: 'message',
    reason: '騷擾訊息',
    detail: '連續傳送不當內容，對方已封鎖。',
    status: 'resolved',
    severity: 'high',
    createdAt: NOW - 2 * DAY,
    handledBy: '陳怡君',
    resolution: '暫時停權 7 天並發出警告',
  },
  {
    id: 'r6',
    targetId: 'u13',
    reporterId: 'u4',
    kind: 'call',
    reason: '不當照片',
    detail: '視訊過程出現不當畫面。',
    status: 'resolved',
    severity: 'high',
    createdAt: NOW - 3 * DAY,
    handledBy: '陳怡君',
    resolution: '永久封鎖',
  },
  {
    id: 'r7',
    targetId: 'u10',
    reporterId: 'u1',
    kind: 'profile',
    reason: '未成年',
    detail: '自我介紹提到還在讀高中。',
    status: 'dismissed',
    severity: 'medium',
    createdAt: NOW - 4 * DAY,
    handledBy: '黃梓睿',
    resolution: '已完成年齡驗證，檢舉不成立',
  },
];

export const SEED_REVIEWS: AdminReviewItem[] = [
  {
    id: 'v1',
    kind: 'moment',
    userId: 'u3',
    content: '週末快閃市集，全館五折，私訊我拿優惠碼 → shop.example.com',
    flags: ['疑似廣告', '外部連結'],
    status: 'pending',
    createdAt: NOW - 35 * MINUTE,
    momentId: 'p3',
  },
  {
    id: 'v2',
    kind: 'bio',
    userId: 'u7',
    content: '想認識人可以先加我 LINE：jimatch_love_888',
    flags: ['聯絡資訊'],
    status: 'pending',
    createdAt: NOW - 2 * HOUR,
  },
  {
    id: 'v3',
    kind: 'photo',
    userId: 'u12',
    content: '第 2 張個人照片',
    imageUri: 'https://randomuser.me/api/portraits/women/68.jpg',
    flags: ['疑似非本人'],
    status: 'pending',
    createdAt: NOW - 5 * HOUR,
  },
  {
    id: 'v4',
    kind: 'moment',
    userId: 'u6',
    content: '半夜的居酒屋，喝到第三杯才敢說真心話。',
    flags: ['酒精內容'],
    status: 'pending',
    createdAt: NOW - 8 * HOUR,
    momentId: 'p6',
  },
  {
    id: 'v5',
    kind: 'photo',
    userId: 'u9',
    content: '第 1 張個人照片',
    imageUri: 'https://randomuser.me/api/portraits/men/24.jpg',
    flags: ['需人工確認'],
    status: 'approved',
    createdAt: NOW - 26 * HOUR,
  },
  {
    id: 'v6',
    kind: 'moment',
    userId: 'u13',
    content: '徵求一起投資的夥伴，保證月收 20%。',
    flags: ['疑似詐騙', '投資字眼'],
    status: 'removed',
    createdAt: NOW - 2 * DAY,
  },
];

export const SEED_ORDERS: AdminOrder[] = [
  {
    id: 'o1',
    userId: 'u5',
    productId: 'me.bilt.jimatch.vip.yearly',
    title: 'VIP 年付',
    kind: 'subscription',
    amountTwd: 5880,
    platform: 'ios',
    status: 'paid',
    createdAt: NOW - 18 * MINUTE,
  },
  {
    id: 'o2',
    userId: 'u2',
    productId: 'me.bilt.jimatch.coins.800',
    title: '800 心動代幣',
    kind: 'coins',
    amountTwd: 630,
    platform: 'android',
    status: 'paid',
    createdAt: NOW - 52 * MINUTE,
  },
  {
    id: 'o3',
    userId: 'u8',
    productId: 'me.bilt.jimatch.plus.quarterly',
    title: 'Plus 三個月',
    kind: 'subscription',
    amountTwd: 840,
    platform: 'ios',
    status: 'paid',
    createdAt: NOW - 4 * HOUR,
  },
  {
    id: 'o4',
    userId: 'u11',
    productId: 'me.bilt.jimatch.coins.2000',
    title: '2000 心動代幣',
    kind: 'coins',
    amountTwd: 1490,
    platform: 'ios',
    status: 'paid',
    createdAt: NOW - 7 * HOUR,
  },
  {
    id: 'o5',
    userId: 'u14',
    productId: 'me.bilt.jimatch.plus.monthly',
    title: 'Plus 月付',
    kind: 'subscription',
    amountTwd: 330,
    platform: 'android',
    status: 'failed',
    createdAt: NOW - 11 * HOUR,
  },
  {
    id: 'o6',
    userId: 'u4',
    productId: 'me.bilt.jimatch.coins.300',
    title: '300 心動代幣',
    kind: 'coins',
    amountTwd: 250,
    platform: 'android',
    status: 'paid',
    createdAt: NOW - 20 * HOUR,
  },
  {
    id: 'o7',
    userId: 'u13',
    productId: 'me.bilt.jimatch.vip.monthly',
    title: 'VIP 月付',
    kind: 'subscription',
    amountTwd: 690,
    platform: 'ios',
    status: 'refunded',
    createdAt: NOW - 2 * DAY,
  },
  {
    id: 'o8',
    userId: 'u1',
    productId: 'me.bilt.jimatch.coins.100',
    title: '100 心動代幣',
    kind: 'coins',
    amountTwd: 90,
    platform: 'ios',
    status: 'paid',
    createdAt: NOW - 2 * DAY - 3 * HOUR,
  },
  {
    id: 'o9',
    userId: 'u10',
    productId: 'me.bilt.jimatch.plus.monthly',
    title: 'Plus 月付',
    kind: 'subscription',
    amountTwd: 330,
    platform: 'android',
    status: 'paid',
    createdAt: NOW - 3 * DAY,
  },
  {
    id: 'o10',
    userId: 'u6',
    productId: 'me.bilt.jimatch.coins.800',
    title: '800 心動代幣',
    kind: 'coins',
    amountTwd: 630,
    platform: 'ios',
    status: 'pending',
    createdAt: NOW - 3 * DAY - 5 * HOUR,
  },
];

export const SEED_EVENTS: AdminEvent[] = [
  {
    id: 'e1',
    name: '心動雙倍週',
    tag: '#雙倍代幣',
    description: '活動期間所有遊戲獎勵代幣 ×2，大富翁心動值加成 20%。',
    multiplier: 2,
    startAt: NOW - 2 * DAY,
    endAt: NOW + 5 * DAY,
    active: true,
  },
  {
    id: 'e2',
    name: '午夜狼人祭',
    tag: '#天黑請閉眼',
    description: '每晚 22:00–02:00 開放限定房間，勝場積分 ×1.5。',
    multiplier: 1.5,
    startAt: NOW - 6 * HOUR,
    endAt: NOW + 20 * DAY,
    active: true,
  },
  {
    id: 'e3',
    name: '新人七日禮',
    tag: '#新手任務',
    description: '註冊 7 天內完成每日一局，累積可領 300 心動代幣。',
    multiplier: 1,
    startAt: NOW - 30 * DAY,
    endAt: NOW + 60 * DAY,
    active: false,
  },
];

export const SEED_ANNOUNCEMENTS: AdminAnnouncement[] = [
  {
    id: 'n1',
    title: '版本 1.0.1 更新說明',
    body: '修正大富翁棋盤在部分裝置的顯示問題，並優化派對房連線穩定度。',
    pinned: true,
    active: true,
    createdAt: NOW - 6 * HOUR,
  },
  {
    id: 'n2',
    title: '防詐宣導',
    body: '請勿在聊天中提供金融帳號。任何要求投資、代收款的對象請立即檢舉。',
    pinned: false,
    active: true,
    createdAt: NOW - 4 * DAY,
  },
];

export const DEFAULT_FLAGS: AdminFlags = {
  maintenance: false,
  maintenanceNotice: '系統維護中，預計 30 分鐘後恢復，期間無法配對與開局。',
  registrationOpen: true,
  gameQuick: true,
  gameMonopoly: true,
  gameParty: true,
  momentsEnabled: true,
  callsEnabled: true,
  giftsEnabled: true,
  autoModeration: true,
  requireIdVerification: false,
  minVersion: '1.0.0',
  staminaRegenMinutes: 12,
  rewardMultiplier: 1,
  coinRate: 1.2,
  bannedWords: ['加賴', '投資群', '外約', '匯款', '博弈'],
};
