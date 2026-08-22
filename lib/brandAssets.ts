import { Image, type ImageSourcePropType } from 'react-native';

/**
 * 品牌圖檔的單一來源（原生版）。圖檔打包進 App，走本機路徑。
 *
 * 這裡刻意用縮小版而不是 App 圖示的原始大圖：原始檔是 1024×1024／1380×752，但畫面
 * 上最大只顯示到 64pt 與 272pt，解碼一張百萬像素的位圖就是「標誌晚一步才跳出來」
 * 的最後一段成本。縮小版由 scripts/generate-brand-assets.mjs 產生（npm run
 * assets:brand），尺寸是「最大顯示尺寸 × 3」，在 3x 裝置上仍然銳利。
 *
 * 網頁版是另一份實作（brandAssets.web.ts）：標誌改用 public/ 的固定 URL，才能在
 * index.html 以 <link rel="preload"> 在 App bundle 之前就開始下載。
 */
export const BRAND_MARK_SOURCE: ImageSourcePropType = require('../public/icons/talentmatch-mark-192.png');

export const BRAND_WORDMARK_SOURCE: ImageSourcePropType = require('../assets/talentmatch-wordmark-816.png');

/**
 * 預先載入的等待上限。原生啟動畫面會等這件事完成，所以不能等太久 —— 逾時就直接進 App，
 * 標誌照樣會顯示，只是可能晚一步。
 */
const PRELOAD_TIMEOUT_MS = 1200;

function prefetchSource(source: ImageSourcePropType): Promise<void> {
  const uri = Image.resolveAssetSource(source)?.uri;
  if (!uri) return Promise.resolve();
  // 打包後的本機檔案在部分平台不支援 prefetch（Android release 拿到的是 drawable 名稱），
  // 失敗只代表沒有預熱到，不是錯誤，所以吞掉。
  return Image.prefetch(uri).then(
    () => undefined,
    () => undefined,
  );
}

/**
 * 讓品牌圖在第一次顯示前就進到圖片快取，避免「其他內容都出現了，標誌晚一步才跳出來」。
 * 開發模式（Expo Go）的資源是從 Metro 以 HTTP 取得，這一步的效果最明顯。
 */
export function preloadBrandAssets(): Promise<void> {
  const work = Promise.all([
    prefetchSource(BRAND_MARK_SOURCE),
    prefetchSource(BRAND_WORDMARK_SOURCE),
  ]).then(() => undefined);

  const timeout = new Promise<void>((resolve) => {
    setTimeout(resolve, PRELOAD_TIMEOUT_MS);
  });

  return Promise.race([work, timeout]);
}
