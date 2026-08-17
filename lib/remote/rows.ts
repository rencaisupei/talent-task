import type {
  BidStatus,
  BudgetLevelId,
  ConversationReportState,
  GigStatus,
  ModerationState,
  PublishReview,
  PublishReviewState,
} from '@/lib/types';

/**
 * gigs 與 bids 資料表的列型別。
 *
 * 這裡是 snake_case 的資料庫形狀，畫面一律使用 lib/types.ts 的 Gig / Bid，
 * 轉換集中在 lib/remote/gigs.ts 與 lib/remote/bids.ts。
 *
 * 共用示範資料（is_demo = true）不屬於任何帳號：client_id / talent_id 為 null，
 * 原始的示範 id 放在 demo_client_ref / demo_talent_ref，只用於顯示與比對。
 *
 * 這些型別一律用 type 而不是 interface：supabase-js 的 `GenericTable` 要求
 * Row / Insert / Update 可指派給 `Record<string, unknown>`，而 interface 沒有
 * 隱含索引簽章，會讓整個 Database 泛型退回 never，所有 insert/update/rpc
 * 都會變成無法呼叫。
 */
export type GigRow = {
  id: string;
  client_id: string | null;
  demo_client_ref: string | null;
  client_name: string;
  title: string;
  category_id: string;
  tag: string;
  detail: string;
  region: string;
  location_detail: string | null;
  latitude: number | null;
  longitude: number | null;
  location_source: 'gps' | 'manual';
  budget_level: BudgetLevelId;
  is_urgent: boolean;
  status: GigStatus;
  assigned_talent_id: string | null;
  assigned_talent_name: string | null;
  completed_at: string | null;
  takedown_reason: string | null;
  takedown_at: string | null;
  auto_closed_at: string | null;
  review_state: PublishReviewState;
  review: PublishReview | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type GigInsert = {
  client_id: string;
  client_name: string;
  title: string;
  category_id: string;
  tag: string;
  detail: string;
  region: string;
  location_detail?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_source: 'gps' | 'manual';
  budget_level: BudgetLevelId;
  is_urgent: boolean;
  status?: GigStatus;
  review_state: PublishReviewState;
  review: PublishReview;
};

export type GigUpdate = {
  status?: GigStatus;
  completed_at?: string | null;
  updated_at?: string;
};

export type BidRow = {
  id: string;
  gig_id: string;
  gig_title: string;
  tag: string;
  client_id: string | null;
  talent_id: string | null;
  demo_talent_ref: string | null;
  talent_name: string;
  talent_region: string;
  quote: number | null;
  eta_label: string;
  message: string;
  status: BidStatus;
  review_state: PublishReviewState;
  review: PublishReview | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type BidInsert = {
  id?: string;
  gig_id: string;
  gig_title: string;
  tag: string;
  client_id: string | null;
  talent_id: string;
  talent_name: string;
  talent_region: string;
  quote: number | null;
  eta_label: string;
  message: string;
  status: BidStatus;
  review_state: PublishReviewState;
  review: PublishReview;
  updated_at?: string;
};

export type BidUpdate = {
  status?: BidStatus;
  updated_at?: string;
};

/**
 * conversations / messages 資料表的列型別。
 *
 * 這兩張表**不接受直接寫入**（沒有 INSERT / UPDATE / DELETE 政策）：
 * 所有寫入都走 SECURITY DEFINER 函式（start_conversation / send_message /
 * mark_conversation_read / report_conversation），因為 RLS 無法限制欄位值，
 * 開放直接寫入就能偽造 sender_id 或把命中關鍵字的訊息標成 clean。
 */
export type ConversationRow = {
  id: string;
  gig_id: string;
  gig_title: string;
  tag: string;
  client_id: string;
  client_name: string;
  talent_id: string;
  talent_name: string;
  created_at: string;
  last_message_at: string;
  last_message_text: string;
  last_message_sender_id: string | null;
  client_last_read_at: string;
  talent_last_read_at: string;
  message_count: number;
  flagged_count: number;
  report_state: ConversationReportState;
  report_reason: string | null;
  reporter_id: string | null;
  reporter_name: string | null;
  reported_at: string | null;
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  client_id: string;
  talent_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  moderation: ModerationState;
  flagged_terms: string[];
  at: string;
};

export type UnreadCountRow = {
  conversation_id: string;
  unread: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * 管理平台的內容清單是由 admin-content 函式以 service key 讀出的原始資料列，
 * 型別無法由 supabase-js 推導，因此用型別守衛檢查關鍵欄位。
 * 其餘欄位由資料表的 not null 與 check 約束保證，不再逐欄驗證。
 */
export function isGigRow(value: unknown): value is GigRow {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.status === 'string' &&
    typeof value.created_at === 'string'
  );
}

export function isBidRow(value: unknown): value is BidRow {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.gig_id === 'string' &&
    typeof value.status === 'string' &&
    typeof value.created_at === 'string'
  );
}

export function isConversationRow(value: unknown): value is ConversationRow {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.gig_id === 'string' &&
    typeof value.client_id === 'string' &&
    typeof value.talent_id === 'string' &&
    typeof value.last_message_at === 'string'
  );
}

export function isMessageRow(value: unknown): value is MessageRow {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.conversation_id === 'string' &&
    typeof value.sender_id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.at === 'string'
  );
}
