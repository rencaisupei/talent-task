import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * 後端連線資訊（bilt-cloud 的網址與公開金鑰）的唯一解析點。
 *
 * 三個來源依序嘗試，第一個「兩個值都齊全」的來源勝出：
 *
 * 1. **網頁執行階段設定檔**（`public/bilt-config.js` → `globalThis.__BILT_CONFIG__`）。
 *    它是同步 script，會在 App bundle 之前執行，所以部署後只要改這個檔案就能換連線
 *    設定，不必重新建置 JS bundle。原生版沒有這個來源。
 * 2. **Expo 設定的 extra**（`app.config.ts` 的 `extra.bilt`）。原生版與 Expo Go 走這條：
 *    manifest 是啟動時才取得的，不會被 Metro 的轉譯快取凍結成舊值。
 * 3. **建置時環境變數** `EXPO_PUBLIC_BILT_URL` / `EXPO_PUBLIC_BILT_ANON_KEY`，
 *    由 Babel 直接內嵌進 bundle。
 *
 * 三個來源缺一不可地成對取用：不會用 A 來源的網址搭 B 來源的金鑰，否則換專案時
 * 會出現「網址是新的、金鑰是舊的」這種只在執行期才炸開的組合。
 */
export type BiltConnection = {
  url: string;
  anonKey: string;
};

const EMPTY: BiltConnection = { url: '', anonKey: '' };

/** `public/bilt-config.js` 的預設佔位字串（例如 `__BILT_URL__`）不算已設定。 */
function isPlaceholder(text: string): boolean {
  return text.startsWith('__') && text.endsWith('__');
}

function readText(value: unknown): string {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  return text.length === 0 || isPlaceholder(text) ? '' : text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readPair(source: unknown): BiltConnection {
  if (!isRecord(source)) return EMPTY;
  return { url: readText(source.url), anonKey: readText(source.anonKey) };
}

/** 1. 網頁部署的執行階段設定檔。 */
function fromWebRuntimeFile(): BiltConnection {
  if (Platform.OS !== 'web') return EMPTY;
  return readPair(globalThis.__BILT_CONFIG__);
}

/** 2. app.config.ts 寫進 manifest 的 extra.bilt。 */
function fromExpoConfig(): BiltConnection {
  const extra: unknown = Constants.expoConfig?.extra;
  if (!isRecord(extra)) return EMPTY;
  return readPair(extra.bilt);
}

/** 3. 建置時內嵌的環境變數。 */
function fromBuildTimeEnv(): BiltConnection {
  return {
    url: readText(process.env.EXPO_PUBLIC_BILT_URL),
    anonKey: readText(process.env.EXPO_PUBLIC_BILT_ANON_KEY),
  };
}

function resolveConnection(): BiltConnection {
  const sources = [fromWebRuntimeFile(), fromExpoConfig(), fromBuildTimeEnv()];

  for (const source of sources) {
    if (source.url.length > 0 && source.anonKey.length > 0) {
      // 尾斜線會讓 supabase-js 組出 `//rest/v1` 這種路徑，先去掉。
      return { url: source.url.replace(/\/+$/, ''), anonKey: source.anonKey };
    }
  }

  return EMPTY;
}

export const BILT_CONNECTION: BiltConnection = resolveConnection();

/** false 代表這個版本沒有可用的後端連線資訊，呼叫端必須自行備援或顯示提示。 */
export const IS_BILT_CONFIGURED =
  BILT_CONNECTION.url.length > 0 && BILT_CONNECTION.anonKey.length > 0;
