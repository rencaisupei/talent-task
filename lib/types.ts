export type Gender = 'female' | 'male' | 'nonbinary';

export type LookingFor = '認真交往' | '輕鬆約會' | '先聊聊看' | '找活動夥伴';

export interface ProfilePrompt {
  question: string;
  answer: string;
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  city: string;
  district: string;
  distanceKm: number;
  job: string;
  school?: string;
  heightCm: number;
  zodiac: string;
  bio: string;
  photos: string[];
  interests: string[];
  languages: string[];
  lookingFor: LookingFor;
  verified: boolean;
  online: boolean;
  lastActiveMinutes: number;
  vibeScore: number;
  isPlus: boolean;
  coords: { latitude: number; longitude: number };
  prompts: ProfilePrompt[];
}

export type MessageKind = 'text' | 'image' | 'voice' | 'gift' | 'call' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  kind: MessageKind;
  text?: string;
  imageUri?: string;
  durationSec?: number;
  giftId?: string;
  callKind?: CallKind;
  callDurationSec?: number;
  callMissed?: boolean;
  createdAt: number;
  read: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  matchedAt: number;
  lastMessageAt: number;
  pinned: boolean;
  muted: boolean;
  unread: number;
  typing: boolean;
}

export type CallKind = 'voice' | 'video';
export type CallDirection = 'incoming' | 'outgoing';
export type CallResult = 'completed' | 'missed' | 'declined' | 'canceled';

export interface CallRecord {
  id: string;
  userId: string;
  kind: CallKind;
  direction: CallDirection;
  result: CallResult;
  durationSec: number;
  createdAt: number;
}

export type CallStatus = 'idle' | 'dialing' | 'ringing' | 'connecting' | 'active' | 'ended';

export interface MomentComment {
  id: string;
  userId: string;
  text: string;
  createdAt: number;
}

export interface Moment {
  id: string;
  userId: string;
  text: string;
  images: string[];
  place?: string;
  tags: string[];
  likes: number;
  likedByMe: boolean;
  comments: MomentComment[];
  createdAt: number;
}

export type GiftIcon =
  | 'rose'
  | 'coffee'
  | 'cake'
  | 'diamond'
  | 'music'
  | 'star'
  | 'sparkle'
  | 'crown';

export interface Gift {
  id: string;
  name: string;
  coins: number;
  icon: GiftIcon;
  tint: string;
}

export type NotificationKind =
  | 'like'
  | 'superlike'
  | 'match'
  | 'message'
  | 'visit'
  | 'call'
  | 'system';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  userId?: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
}

export type Tier = 'free' | 'plus' | 'vip';

export type BillingPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface SubscriptionPlan {
  id: string;
  tier: Exclude<Tier, 'free'>;
  period: BillingPeriod;
  title: string;
  priceLabel: string;
  perMonthLabel: string;
  savingLabel?: string;
  /** App Store / Google Play subscription product id. */
  productId: string;
  popular?: boolean;
}

export interface CoinPack {
  id: string;
  coins: number;
  bonus: number;
  priceLabel: string;
  productId: string;
  popular?: boolean;
}

export interface DiscoverFilters {
  ageRange: [number, number];
  maxDistanceKm: number;
  genders: Gender[];
  onlineOnly: boolean;
  verifiedOnly: boolean;
  withPhotoOnly: boolean;
  interests: string[];
  lookingFor: LookingFor | '不限';
}

export type SwipeDirection = 'left' | 'right' | 'up';

/* ---------------------------------------------------------------- 遊戲城 */

export type PartyGame = 'truth-dare' | 'werewolf';

export interface GameRoom {
  id: string;
  game: PartyGame;
  /** 房間主題標籤，例如 #真心話大冒險 */
  tag: string;
  title: string;
  hostId: string;
  playerIds: string[];
  males: number;
  females: number;
  capacity: number;
  rewardCoins: number;
  hot: boolean;
}

export type BoardTileKind =
  | 'start'
  | 'truth'
  | 'dare'
  | 'coins'
  | 'stamina'
  | 'heart'
  | 'trap'
  | 'chance'
  | 'date';

export interface BoardTile {
  index: number;
  kind: BoardTileKind;
  label: string;
}

export interface QuickQuestion {
  id: string;
  question: string;
  options: [string, string];
}

export interface LeaderboardEntry {
  userId: string;
  score: number;
  wins: number;
  title: string;
}

export type WerewolfRole = 'wolf' | 'seer' | 'villager';

/* ------------------------------------------------------------ 管理員平台 */

export type AdminRole = 'owner' | 'moderator' | 'support' | 'finance';

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  lastActiveAt: number;
}

export type AdminUserStatus = 'active' | 'muted' | 'suspended' | 'banned';

export interface AdminUserRecord {
  status: AdminUserStatus;
  /** 累積警告次數。 */
  warnings: number;
  verified: boolean;
  /** 後台備註（僅管理員可見）。 */
  note: string;
  /** 後台調整的代幣總量（正為發放、負為扣除）。 */
  coinAdjust: number;
  /** 手動指定的會員等級，null 代表沿用原本狀態。 */
  tierOverride: Tier | null;
  updatedAt: number;
}

export type AdminReportKind = 'profile' | 'message' | 'moment' | 'room' | 'call';
export type AdminReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface AdminReport {
  id: string;
  targetId: string;
  reporterId: string;
  kind: AdminReportKind;
  reason: string;
  detail: string;
  status: AdminReportStatus;
  severity: 'low' | 'medium' | 'high';
  createdAt: number;
  handledBy?: string;
  resolution?: string;
}

export type AdminReviewKind = 'moment' | 'photo' | 'bio';
export type AdminReviewStatus = 'pending' | 'approved' | 'removed';

export interface AdminReviewItem {
  id: string;
  kind: AdminReviewKind;
  userId: string;
  content: string;
  imageUri?: string;
  /** 自動偵測命中的標籤，例如「聯絡資訊」「疑似廣告」。 */
  flags: string[];
  status: AdminReviewStatus;
  createdAt: number;
  /** 對應動態 id，下架時會同步從動態列表移除。 */
  momentId?: string;
}

export type AdminOrderKind = 'subscription' | 'coins';
export type AdminOrderStatus = 'paid' | 'refunded' | 'failed' | 'pending';

export interface AdminOrder {
  id: string;
  userId: string;
  productId: string;
  title: string;
  kind: AdminOrderKind;
  amountTwd: number;
  platform: 'ios' | 'android';
  status: AdminOrderStatus;
  createdAt: number;
}

export type PushAudience = 'all' | 'free' | 'plus' | 'vip' | 'inactive' | 'players';

export interface PushCampaign {
  id: string;
  title: string;
  body: string;
  audience: PushAudience;
  reach: number;
  sentAt: number;
  sentBy: string;
}

export interface AdminEvent {
  id: string;
  name: string;
  tag: string;
  description: string;
  /** 活動期間的獎勵倍率。 */
  multiplier: number;
  startAt: number;
  endAt: number;
  active: boolean;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  active: boolean;
  createdAt: number;
}

export interface AdminAuditEntry {
  id: string;
  actor: string;
  action: string;
  target?: string;
  createdAt: number;
}

export interface AdminFlags {
  /** 維護模式：App 內顯示維護橫幅。 */
  maintenance: boolean;
  maintenanceNotice: string;
  registrationOpen: boolean;
  gameQuick: boolean;
  gameMonopoly: boolean;
  gameParty: boolean;
  momentsEnabled: boolean;
  callsEnabled: boolean;
  giftsEnabled: boolean;
  /** 自動審核：命中敏感詞的內容直接排入待審。 */
  autoModeration: boolean;
  requireIdVerification: boolean;
  minVersion: string;
  staminaRegenMinutes: number;
  rewardMultiplier: number;
  /** 1 元新台幣可換得的心動代幣。 */
  coinRate: number;
  bannedWords: string[];
}

export interface AdminMetricDay {
  label: string;
  dau: number;
  signups: number;
  matches: number;
  messages: number;
  revenue: number;
}

export interface WerewolfPlayer {
  userId: string;
  role: WerewolfRole;
  alive: boolean;
}

/* --------------------------------------------------------- AI 自動化 */

export type AiSeverity = 'low' | 'medium' | 'high';
/** 巡邏嚴格度：寬鬆只抓高風險，嚴格連輕微擦邊都抓。 */
export type AiSensitivity = 'loose' | 'standard' | 'strict';
export type AiPatrolScope = 'moments' | 'comments' | 'chats' | 'profiles';
/** 命中後的處理方式：只記錄／送人工待審／立即隱藏並待覆核。 */
export type AiPatrolAction = 'log' | 'queue' | 'hide';

export interface AiPatrolConfig {
  enabled: boolean;
  /** 自動巡邏間隔（分鐘）。 */
  intervalMinutes: number;
  sensitivity: AiSensitivity;
  scopes: AiPatrolScope[];
  action: AiPatrolAction;
  /** 命中時推播通知管理員。 */
  notifyAdmin: boolean;
}

export type AiFindingStatus = 'pending' | 'kept' | 'removed';

export interface AiFinding {
  id: string;
  scope: AiPatrolScope;
  userId: string;
  excerpt: string;
  /** 命中的規則名稱，例如「聯絡資訊外流」。 */
  rule: string;
  severity: AiSeverity;
  status: AiFindingStatus;
  createdAt: number;
  momentId?: string;
  /** 掃描來源唯一鍵，避免同一段內容重複命中。 */
  sourceKey: string;
}

export interface AiPatrolRun {
  id: string;
  trigger: 'auto' | 'manual';
  scanned: number;
  flagged: number;
  startedAt: number;
}

/** AI 可以自動產生的遊戲內容類型。 */
export type AiContentKind = 'quick' | 'truth' | 'dare';
export type AiCadence = 'manual' | 'daily' | 'weekly';
export type AiTone = 'warm' | 'balanced' | 'bold';

export interface AiContentConfig {
  enabled: boolean;
  cadence: AiCadence;
  /** 產生後直接上線，不用人工按發佈。 */
  autoPublish: boolean;
  kinds: AiContentKind[];
  tone: AiTone;
  batchSize: number;
}

export type AiDraftStatus = 'draft' | 'published' | 'rejected';

export interface AiDraft {
  id: string;
  kind: AiContentKind;
  text: string;
  /** 快問快答的兩個選項。 */
  options?: [string, string];
  status: AiDraftStatus;
  createdAt: number;
}

export interface AiUpdateEntry {
  id: string;
  version: number;
  counts: Record<AiContentKind, number>;
  trigger: 'auto' | 'manual';
  createdAt: number;
}
