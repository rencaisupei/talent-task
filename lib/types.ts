export type UserRole = 'client' | 'talent';

/** 本機示範帳號 ID（未接後端前的單一使用者）。 */
export const LOCAL_USER_ID = 'user_local';

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

/** 即時審核判定：approved 立即上架、review 需管理員複審、rejected 高風險擋下並複審。 */
export type AiReviewDecision = 'approved' | 'review' | 'rejected';

export type AiReviewTarget = 'gig' | 'talent';

/** 審核引擎來源：model 為 AI 模型、rules 為伺服器風險引擎、offline 為裝置端規則備援。 */
export type AiReviewEngine = 'model' | 'rules' | 'offline';

export const AI_ENGINE_LABEL: Record<AiReviewEngine, string> = {
  model: 'AI 模型即時審核',
  rules: '伺服器風險引擎',
  offline: '離線規則備援',
};

export const AI_DECISION_LABEL: Record<AiReviewDecision, string> = {
  approved: 'AI 已認證',
  review: '待管理員複審',
  rejected: '高風險已擋下',
};

export interface AiReviewResult {
  target: AiReviewTarget;
  decision: AiReviewDecision;
  /** 0 至 100 的風險分數，越高越可疑。 */
  riskScore: number;
  reasons: string[];
  flaggedTerms: string[];
  engine: AiReviewEngine;
  reviewedAt: number;
}

/** 上架狀態：approved 已公開、pending 等待管理員複審、rejected 複審退回。 */
export type PublishReviewState = 'approved' | 'pending' | 'rejected';

export interface PublishReview {
  state: PublishReviewState;
  ai: AiReviewResult;
  adminId?: string;
  adminName?: string;
  adminNote?: string;
  decidedAt?: number;
}

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
  /** 發布前的即時審核結果；未帶值代表示範資料（視為已通過）。 */
  review?: PublishReview;
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
  /** 送出前的即時審核結果；未帶值代表示範資料（視為已通過）。 */
  review?: PublishReview;
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

export type NotificationKind =
  | 'bid'
  | 'match'
  | 'review'
  | 'chat'
  | 'verification'
  | 'system'
  | 'call'
  | 'moderation';

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
  /** 證照經人工驗證通過（信任度加分項，非接案必要條件）。 */
  credentialVerified?: boolean;
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
  /** 送審時的即時審核結果；有值代表已跑過 AI 認證。 */
  aiReview?: AiReviewResult;
  /** 證照是否經管理員人工驗證（加分項）。 */
  credentialVerified?: boolean;
}

export type CallOutcome = 'completed' | 'cancelled' | 'declined' | 'missed';

export const CALL_OUTCOME_LABEL: Record<CallOutcome, string> = {
  completed: '通話結束',
  cancelled: '已取消撥號',
  declined: '對方拒接',
  missed: '未接來電',
};

/** 平台語音通話紀錄（通話建立於既有對話之上，不佔用對話配額）。 */
export interface CallRecord {
  id: string;
  conversationId: string;
  gigId: string;
  gigTitle: string;
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  startedAt: number;
  connectedAt?: number;
  endedAt?: number;
  durationSeconds: number;
  outcome: CallOutcome;
}

/** 推播分類開關。 */
export type PushChannel = 'chat' | 'call' | 'bid' | 'match' | 'review' | 'moderation' | 'system';

export const PUSH_CHANNEL_LABEL: Record<PushChannel, { title: string; caption: string }> = {
  chat: { title: '新訊息', caption: '對方在對話中傳送訊息時推播' },
  call: { title: '語音通話', caption: '有人撥打語音電話或未接來電時推播' },
  bid: { title: '提案動態', caption: '收到新提案或提案被修改時推播' },
  match: { title: '媒合結果', caption: '被選定承接或任務完成時推播' },
  review: { title: '評價提醒', caption: '任務完成後的評價提醒' },
  moderation: { title: '審核結果', caption: '發布內容的認證與複審結果' },
  system: { title: '系統公告', caption: '平台公告與帳號重要通知' },
};

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
  | 'report'
  | 'moderation';

export const ADMIN_ACTION_LABEL: Record<AdminActionKind, string> = {
  auth: '登入登出',
  verification: '身分驗證',
  ban: '帳號封禁',
  gig: '任務內容',
  subscription: '訂閱營收',
  announcement: '公告推播',
  report: '檢舉處理',
  moderation: '發布複審',
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
