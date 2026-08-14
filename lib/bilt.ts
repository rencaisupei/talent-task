import { asyncStorage, createClient } from '@biltme/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * bilt-cloud 用戶端。
 * 目前僅用於呼叫發布內容的即時審核函式（ai-review），其餘資料仍為本機持久化。
 */
export const bilt = createClient(
  process.env.EXPO_PUBLIC_BILT_URL ?? '',
  process.env.EXPO_PUBLIC_BILT_ANON_KEY ?? '',
  {
    auth: {
      storage: asyncStorage(AsyncStorage),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
