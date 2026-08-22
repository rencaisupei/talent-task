import { Image, type ImageSourcePropType } from 'react-native';

/**
 * 網頁版的品牌標誌路徑。刻意不用 require()：固定 URL 才能讓 index.html 的
 * <link rel="preload" as="image"> 命中同一個檔案，在 App bundle 之前就開始下載。
 *
 * 這是 App 內 UI 專用的 192px 版本（由 scripts/generate-brand-assets.mjs 產生），
 * 不是 favicon／apple-touch-icon 的 1024px 原始檔：
 * - 20 KB vs 777 KB，而且瀏覽器只要解碼 192×192 而不是 1024×1024。
 * - favicon 那份仍會由瀏覽器自己抓，但它是低優先、不擋這一頁的繪製。
 *
 * 改路徑時 index.html 的 preload 要一起改，否則預先下載會落在別的檔案上。
 * public/ 的檔案在開發伺服器與 `expo export -p web` 的輸出都位於網站根目錄。
 */
export const BRAND_MARK_URL = '/icons/talentmatch-mark-192.png';

export const BRAND_MARK_SOURCE: ImageSourcePropType = { uri: BRAND_MARK_URL };

export const BRAND_WORDMARK_SOURCE: ImageSourcePropType = require('../assets/talentmatch-wordmark-816.png');

/**
 * 橫式標誌只出現在登入頁，用 rel="prefetch"（低優先、瀏覽器閒置時才抓）而不是 preload：
 * 不跟目前這一頁的資源搶頻寬，但使用者真的開登入頁時已經在快取裡。
 */
function addPrefetchLink(href: string): void {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'image';
  link.href = href;
  document.head.appendChild(link);
}

/** 見 brandAssets.ts。網頁版的標誌已由 index.html 預先下載，這裡只補橫式標誌。 */
export function preloadBrandAssets(): Promise<void> {
  const uri = Image.resolveAssetSource(BRAND_WORDMARK_SOURCE)?.uri;
  if (uri) addPrefetchLink(uri);
  return Promise.resolve();
}
