import { Image, type ImageSourcePropType } from 'react-native';

/**
 * 網頁版的品牌標誌路徑。刻意不用 require()：
 * - 這個 URL 與 favicon、apple-touch-icon、manifest 圖示完全相同，瀏覽器解析 <head>
 *   時就已經在下載，畫面第一次繪製時通常已在快取。
 * - index.html 的 <link rel="preload" as="image"> 必須指向同一個 URL 才有作用；
 *   require() 產生的是帶雜湊的另一份複本（同一張圖會被下載兩次）。
 *
 * public/ 的檔案在開發伺服器與 `expo export -p web` 的輸出都位於網站根目錄。
 */
export const BRAND_MARK_URL = '/icons/talentmatch-icon.png';

export const BRAND_MARK_SOURCE: ImageSourcePropType = { uri: BRAND_MARK_URL };

export const BRAND_WORDMARK_SOURCE: ImageSourcePropType = require('../assets/talentmatch-wordmark.png');

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
