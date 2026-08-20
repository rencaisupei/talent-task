/*
  網頁版的執行階段後端連線設定。

  這個檔案會被 `expo export -p web` 原樣複製進 dist/，並由 index.html 以同步
  <script> 在 App bundle 之前載入，因此改完這裡只要重新上傳靜態資產就生效，
  不需要重新建置 JS bundle。

  兩個值都保持 __BILT_URL__ / __BILT_ANON_KEY__ 這種佔位字串時，這個來源會被忽略，
  App 會退回讀取建置時的 EXPO_PUBLIC_BILT_URL 與 EXPO_PUBLIC_BILT_ANON_KEY。

  填值時的規則（lib/biltConfig.ts 的解析條件）：
  - 兩個都要填。只填一個時整個來源被跳過，等於沒設。
  - 前後包 __ 的字串一律視為未設定，所以不能只改中間的字。
  - url 形狀是 https://<project-id>.cloud.bilt.me，不要帶結尾斜線、
    也不要帶 /rest/v1 或 /functions/v1 這種路徑。
  - anonKey 是一整串不換行的字串，不要加 "Bearer " 前綴。
  - 保持這是合法 JS：單引號、逗號、globalThis.__BILT_CONFIG__ 這個名字都不要改。

  anonKey 是公開金鑰（publishable key），本來就會出現在前端 bundle 裡，
  資料保護靠資料庫的 RLS 政策，不要放 service key。
*/
globalThis.__BILT_CONFIG__ = {
  url: '__BILT_URL__',
  anonKey: '__BILT_ANON_KEY__',
};
