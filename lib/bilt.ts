import { asyncStorage, createClient } from '@biltme/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';

type BiltClient = ReturnType<typeof createClient>;

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

  client ??= createClient(BILT_URL, BILT_ANON_KEY, {
    auth: {
      storage: asyncStorage(AsyncStorage),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  return client;
}
