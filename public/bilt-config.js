/*
  網頁版的執行階段後端連線設定。

  這個檔案會被 `expo export -p web` 原樣複製進 dist/，並由 index.html 以同步
  <script> 在 App bundle 之前載入，因此改完這裡只要重新上傳靜態資產就生效，
  不需要重新建置 JS bundle。

  兩個值都保持 __BILT_URL__ / __BILT_ANON_KEY__ 這種佔位字串時，這個來源會被忽略，
  App 會退回讀取建置時的 EXPO_PUBLIC_BILT_URL 與 EXPO_PUBLIC_BILT_ANON_KEY。

  anonKey 是公開金鑰（publishable key），本來就會出現在前端 bundle 裡，
  資料保護靠資料庫的 RLS 政策，不要放 service key。
*/
globalThis.__BILT_CONFIG__ = {
  url: '__BILT_URL__',
  anonKey: '__BILT_ANON_KEY__',
};
