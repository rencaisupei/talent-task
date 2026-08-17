import { asyncStorage, createClient } from '@biltme/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * profiles 資料表的最小 schema 型別。沒有這個型別時，supabase-js 的
 * `Database` 泛型預設為 `any`，會讓 `.from('profiles').upsert(...)` 之類的
 * 呼叫被推論成 `never`（已知的 supabase-js 型別行為），因此明確標註欄位型別。
 */
interface ProfilesTable {
  Row: {
    id: string;
    display_name: string | null;
    role: string | null;
    region: string | null;
    skills: string[] | null;
    privacy_accepted: boolean | null;
    updated_at: string | null;
  };
  Insert: {
    id: string;
    display_name?: string | null;
    role?: string | null;
    region?: string | null;
    skills?: string[] | null;
    privacy_accepted?: boolean | null;
    updated_at?: string | null;
  };
  Update: Partial<ProfilesTable['Row']>;
  Relationships: [];
}

interface BiltDatabase {
  public: {
    Tables: {
      profiles: ProfilesTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

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
