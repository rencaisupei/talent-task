import type { ImageSourcePropType } from 'react-native';

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
 * 網頁版沒有啟動畫面可等，而且每個畫面都會用到的標誌已由 index.html 的 preload
 * 在 bundle 之前下載，所以這裡不需要做任何事，直接回傳已完成的 promise。
 *
 * 為什麼不順手預抓橫式標誌（只出現在登入頁）：
 * react-native-web 的 Image **沒有** resolveAssetSource（只有 getSize / prefetch /
 * queryCache），而 Metro 打包後 require() 一張圖回傳的是數字資源 ID，不是網址 ——
 * 呼叫 Image.resolveAssetSource 在網頁版會直接以 TypeError 讓 App 開不起來。
 * 要拿到帶雜湊的實際網址只能碰 react-native-web 的私有模組，不值得為一次低優先
 * 預抓承擔這個風險；橫式標誌就在登入頁渲染時載入。
 *
 * 原生版的實作（brandAssets.ts）才會真的預抓，並由啟動畫面等它完成。
 */
export function preloadBrandAssets(): Promise<void> {
  return Promise.resolve();
}
