import { asyncStorage, createClient } from '@biltme/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  BidInsert,
  BidRow,
  BidUpdate,
  ConversationRow,
  GigInsert,
  GigRow,
  GigUpdate,
  MessageRow,
  NotificationInsert,
  NotificationRow,
  NotificationUpdate,
  ReviewInsert,
  ReviewRow,
  SavedGigInsert,
  SavedGigRow,
  UnreadCountRow,
} from '@/lib/remote/rows';

/**
 * profiles 資料表的最小 schema 型別。沒有這個型別時，supabase-js 的
 * `Database` 泛型預設為 `any`，會讓 `.from('profiles').upsert(...)` 之類的
 * 呼叫被推論成 `never`（已知的 supabase-js 型別行為），因此明確標註欄位型別。
 */
type ProfilesRow = {
  id: string;
  display_name: string | null;
  role: string | null;
  region: string | null;
  skills: string[] | null;
  privacy_accepted: boolean | null;
  updated_at: string | null;
};

type ProfilesTable = {
  Row: ProfilesRow;
  Insert: {
    id: string;
    display_name?: string | null;
    role?: string | null;
    region?: string | null;
    skills?: string[] | null;
    privacy_accepted?: boolean | null;
    updated_at?: string | null;
  };
  Update: Partial<ProfilesRow>;
  Relationships: [];
};

type GigsTable = {
  Row: GigRow;
  Insert: GigInsert;
  Update: GigUpdate;
  Relationships: [];
};

type BidsTable = {
  Row: BidRow;
  Insert: BidInsert;
  Update: BidUpdate;
  Relationships: [];
};

/**
 * 對話與訊息只讀不寫：這兩張表沒有 INSERT / UPDATE / DELETE 政策，
 * 所有寫入都經由 send_message 等 SECURITY DEFINER 函式（見 Functions）。
 * Insert / Update 仍需標型別，否則 supabase-js 的泛型會退回 never。
 */
type ConversationsTable = {
  Row: ConversationRow;
  Insert: Partial<ConversationRow>;
  Update: Partial<ConversationRow>;
  Relationships: [];
};

type MessagesTable = {
  Row: MessageRow;
  Insert: Partial<MessageRow>;
  Update: Partial<MessageRow>;
  Relationships: [];
};

/**
 * 評價、收藏與通知中心：擁有者是帳號而不是裝置，因此登出再登入還在。
 * 評價公開可讀（信任度分數的依據），收藏與通知只有本人讀得到。
 */
type ReviewsTable = {
  Row: ReviewRow;
  Insert: ReviewInsert;
  Update: Partial<ReviewInsert>;
  Relationships: [];
};

type SavedGigsTable = {
  Row: SavedGigRow;
  Insert: SavedGigInsert;
  Update: Partial<SavedGigInsert>;
  Relationships: [];
};

type NotificationsTable = {
  Row: NotificationRow;
  Insert: NotificationInsert;
  Update: NotificationUpdate;
  Relationships: [];
};

type BiltDatabase = {
  public: {
    Tables: {
      profiles: ProfilesTable;
      gigs: GigsTable;
      bids: BidsTable;
      conversations: ConversationsTable;
      messages: MessagesTable;
      reviews: ReviewsTable;
      saved_gigs: SavedGigsTable;
      notifications: NotificationsTable;
    };
    Views: Record<string, never>;
    Functions: {
      /** 客戶選定提案：接受該提案、退回其他待處理提案並指派任務。 */
      accept_bid: {
        Args: { bid_id: string };
        Returns: boolean;
      };
      /**
       * 人才開啟對話時把任務推進到「對話中」（他不是發案者，無法直接更新）。
       * 只有與該任務有關的人可以推進，其他帳號回傳 false。
       */
      mark_gig_talking: {
        Args: { gid: string };
        Returns: boolean;
      };
      /**
       * 每日維護：逾期未成交的任務自動結案，回傳結案筆數。
       * 裝置端呼叫只影響自己發布的任務；全平台清理需要 service_role 金鑰。
       */
      close_stale_gigs: {
        Args: { max_age_days: number };
        Returns: number;
      };
      /** 開啟或取回一組對話；示範任務與非相關人一律回傳 null。 */
      start_conversation: {
        Args: { gid: string; tid: string };
        Returns: string | null;
      };
      /** 傳送訊息：sender_id 與審核判定由伺服器決定，回傳寫入的訊息列。 */
      send_message: {
        Args: { cid: string; body: string };
        Returns: MessageRow[];
      };
      /** 把自己那一側的已讀時間推到現在。 */
      mark_conversation_read: {
        Args: { cid: string };
        Returns: boolean;
      };
      /** 檢舉對話（只有對話雙方可呼叫）。 */
      report_conversation: {
        Args: { cid: string; reason: string };
        Returns: boolean;
      };
      /** 我的未讀訊息數，依對話分組。 */
      chat_unread_counts: {
        Args: Record<PropertyKey, never>;
        Returns: UnreadCountRow[];
      };
      /** 每日維護：每則對話只保留最近 keep 條訊息，回傳刪除筆數。 */
      prune_chat_messages: {
        Args: { keep: number };
        Returns: number;
      };
    };
  };
};

type BiltClient = ReturnType<typeof createClient<BiltDatabase>>;

const BILT_URL = process.env.EXPO_PUBLIC_BILT_URL ?? '';
const BILT_ANON_KEY = process.env.EXPO_PUBLIC_BILT_ANON_KEY ?? '';

/**
 * 後端連線資訊是在建置時寫進 bundle 的。部署時若沒提供，
 * 應用仍必須能正常啟動（AI 審核自動退回裝置端規則），因此不在模組載入時建立用戶端。
 */
export const IS_BILT_CONFIGURED = BILT_URL.length > 0 && BILT_ANON_KEY.length > 0;

let client: BiltClient | null = null;

/** 取得 bilt-cloud 用戶端；缺少連線設定時回傳 null，呼叫端須自行備援。 */
export function getBiltClient(): BiltClient | null {
  if (!IS_BILT_CONFIGURED) return null;

  client ??= createClient<BiltDatabase>(BILT_URL, BILT_ANON_KEY, {
    auth: {
      storage: asyncStorage(AsyncStorage),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  return client;
}
