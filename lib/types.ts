export type UserRole = 'client' | 'talent';

/** 本機示範帳號 ID（未接後端前的單一使用者）。 */
export const LOCAL_USER_ID = 'user_local';

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type BudgetLevelId = 'B1' | 'B2' | 'B3' | 'B4' | 'B5';

export interface BudgetLevel {
  id: BudgetLevelId;
  label: string;
  hint: string;
}

export const BUDGET_LEVELS: BudgetLevel[] = [
  { id: 'B1', label: '1,000 元以下', hint: '小型急件' },
  { id: 'B2', label: '1,000 – 5,000 元', hint: '單次到府' },
  { id: 'B3', label: '5,000 – 20,000 元', hint: '標準專案' },
  { id: 'B4', label: '20,000 元以上', hint: '大型委託' },
  { id: 'B5', label: '價格面議', hint: '討論後報價' },
];

export interface GigLocation {
  region: string;
  detail?: string;
  latitude?: number;
  longitude?: number;
  source: 'gps' | 'manual';
}

/**
 * 任務狀態流程：
 * open 等待媒合 → talking 對話中 → assigned 進行中 → completed 已完成；closed 為客戶主動結束。
 */
export type GigStatus = 'open' | 'talking' | 'assigned' | 'completed' | 'closed';

export interface Gig {
  id: string;
  title: string;
  categoryId: string;
  tag: string;
  detail: string;
  location: GigLocation;
  budgetLevel: BudgetLevelId;
  isUrgent: boolean;
  clientId: string;
  clientName: string;
  createdAt: number;
  status: GigStatus;
  assignedTalentId?: string;
  assignedTalentName?: string;
  completedAt?: number;
  /** 管理員下架原因（有值代表由管理員強制下架）。 */
  takedownReason?: string;
  takedownAt?: number;
}

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

/** 人才對任務投遞的提案。 */
export interface Bid {
  id: string;
  gigId: string;
  gigTitle: string;
  tag: string;
  clientId: string;
  talentId: string;
  talentName: string;
  talentRegion: string;
  /** 報價金額；null 代表價格面議。 */
  quote: number | null;
  etaLabel: string;
  message: string;
  createdAt: number;
  status: BidStatus;
}

export const BID_ETA_OPTIONS = ['今天可到', '24 小時內', '3 天內', '一週內', '時間可再議'] as const;

/** 任務完成後的雙向評價。 */
export interface Review {
  id: string;
  gigId: string;
  gigTitle: string;
  tag: string;
  authorId: string;
  authorName: string;
  targetId: string;
  targetName: string;
  targetRole: UserRole;
  stars: number;
  comment: string;
  createdAt: number;
}

export type NotificationKind = 'bid' | 'match' | 'review' | 'chat' | 'verification' | 'system';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: number;
  isRead: boolean;
  gigId?: string;
  conversationId?: string;
  talentId?: string;
}

export type ModerationState = 'clean' | 'flagged';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  at: number;
  moderation: ModerationState;
  flaggedTerms: string[];
}

export interface Conversation {
  id: string;
  gigId: string;
  gigTitle: string;
  tag: string;
  clientId: string;
  clientName: string;
  talentId: string;
  talentName: string;
  createdAt: number;
  lastMessageAt: number;
  isReported: boolean;
}

export interface TalentProfile {
  id: string;
  name: string;
  region: string;
  tags: string[];
  isPremium: boolean;
  verification: VerificationStatus;
  credentialUri?: string;
  completedJobs: number;
  rating: number;
  /** 平均回應時間（分鐘），用於信任度評估。 */
  responseMinutes: number;
}

export interface VerificationRequest {
  id: string;
  talentId: string;
  talentName: string;
  region: string;
  tags: string[];
  credentialUri?: string;
  submittedAt: number;
  status: VerificationStatus;
  note?: string;
}

export interface AbuseReport {
  id: string;
  conversationId: string;
  reportedUserId: string;
  reportedUserName: string;
  reporterName: string;
  reason: string;
  createdAt: number;
  transcript: ChatMessage[];
  resolved: boolean;
}

export interface WeeklyPoint {
  weekLabel: string;
  value: number;
}

/** 管理員角色：owner 可執行全部動作，moderator 負責審核與封禁，analyst 僅檢視營運數據。 */
export type AdminRole = 'owner' | 'moderator' | 'analyst';

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  owner: '總管理員',
  moderator: '審核專員',
  analyst: '數據分析員',
};

export interface AdminAccount {
  id: string;
  email: string;
  /** 本機示範驗證用；接後端後改為伺服器端雜湊驗證。 */
  password: string;
  name: string;
  role: AdminRole;
  createdAt: number;
  lastLoginAt?: number;
}

/** 管理端使用者總表的一列（客戶與人才共用）。 */
export interface PlatformUser {
  id: string;
  name: string;
  role: UserRole;
  region: string;
  joinedAt: number;
  tags: string[];
  isPremium: boolean;
  premiumSince?: number;
  verification: VerificationStatus;
  completedJobs: number;
  rating: number;
  responseMinutes: number;
  publishedGigs: number;
  note?: string;
}

export type AdminActionKind =
  | 'auth'
  | 'verification'
  | 'ban'
  | 'gig'
  | 'subscription'
  | 'announcement'
  | 'report';

export const ADMIN_ACTION_LABEL: Record<AdminActionKind, string> = {
  auth: '登入登出',
  verification: '身分驗證',
  ban: '帳號封禁',
  gig: '任務內容',
  subscription: '訂閱營收',
  announcement: '公告推播',
  report: '檢舉處理',
};

export interface AdminAuditEntry {
  id: string;
  at: number;
  adminId: string;
  adminName: string;
  kind: AdminActionKind;
  summary: string;
  targetId?: string;
  targetLabel?: string;
}

export type AnnouncementAudience = 'all' | 'client' | 'talent' | 'premium' | 'free';

export const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  all: '全部使用者',
  client: '僅客戶',
  talent: '僅人才',
  premium: '僅進階版人才',
  free: '僅免費版人才',
};

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  createdAt: number;
  adminName: string;
  recipientCount: number;
}

export type SubscriptionStatus = 'active' | 'refunded' | 'cancelled';

export type SubscriptionChannel = 'apple' | 'google' | 'manual';

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: '使用中',
  refunded: '已退款',
  cancelled: '已取消',
};

export const SUBSCRIPTION_CHANNEL_LABEL: Record<SubscriptionChannel, string> = {
  apple: 'App Store',
  google: 'Google Play',
  manual: '管理員開通',
};

/** 進階版訂閱帳務紀錄。 */
export interface SubscriptionRecord {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: SubscriptionStatus;
  channel: SubscriptionChannel;
  invoiceNo: string;
  startedAt: number;
  renewsAt: number;
  refundedAt?: number;
}
