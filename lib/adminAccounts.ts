import type { AdminAccount } from '@/lib/types';

/**
 * 管理員帳密清單 —— 唯一來源，登入驗證只認這裡的內容。
 *
 * 新增管理員：在陣列尾端加一筆，`id` 不可與現有重複。
 * 移除管理員：刪掉該筆即可；下次載入頁面時，該帳號原本已登入的瀏覽器也會被登出。
 *
 * 安全性提醒：網頁版是靜態匯出，這些字串會被打包進 JS bundle，
 * 任何人打開開發者工具都能讀到，客戶端驗證只能擋住隨手點進來的人。
 * 真正的防線是 Cloudflare Access（README 第 7 節）或改為伺服器端驗證。
 */
export const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 'admin_owner',
    email: 'admin@instantgig.tw',
    password: 'Instant2026!',
    name: '平台總管理員',
    role: 'owner',
    createdAt: Date.UTC(2025, 6, 10),
  },
  {
    id: 'admin_reviewer',
    email: 'review@instantgig.tw',
    password: 'Review2026!',
    name: '審核專員 林昀',
    role: 'moderator',
    createdAt: Date.UTC(2026, 1, 15),
  },
  {
    id: 'admin_analyst',
    email: 'data@instantgig.tw',
    password: 'Data2026!',
    name: '數據分析員 何柏',
    role: 'analyst',
    createdAt: Date.UTC(2026, 4, 9),
  },
];

/** 依 id 與帳密比對，回傳程式碼清單中對應的帳號（找不到回 null）。 */
export function findAdminAccount(email: string, password: string): AdminAccount | null {
  const normalized = email.trim().toLowerCase();
  return (
    ADMIN_ACCOUNTS.find(
      (item) => item.email.toLowerCase() === normalized && item.password === password,
    ) ?? null
  );
}

/** 判斷已登入（持久化）的帳號是否仍存在於程式碼清單，且帳密未被更動。 */
export function isAdminAccountStillValid(account: AdminAccount): boolean {
  return ADMIN_ACCOUNTS.some(
    (item) =>
      item.id === account.id && item.email === account.email && item.password === account.password,
  );
}
