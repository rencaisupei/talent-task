declare module '*.css';

/**
 * 網頁版的執行階段後端連線設定，由 public/bilt-config.js 在 App bundle 之前寫入。
 * 原生版沒有這個變數（值為 undefined），連線資訊改由 app.config.ts 的 extra.bilt
 * 或建置時的 EXPO_PUBLIC_* 環境變數提供。解析邏輯見 lib/biltConfig.ts。
 */
declare var __BILT_CONFIG__: { url?: unknown; anonKey?: unknown } | undefined;
