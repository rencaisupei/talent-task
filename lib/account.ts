import { getBiltClient } from '@/lib/bilt';
import { resetLocalUserData } from '@/lib/localData';
import { useSessionStore } from '@/lib/stores/session';

export type DeleteAccountOutcome = { ok: true } | { ok: false; message: string };

const NOT_CONFIGURED_MESSAGE = '尚未設定後端連線，暫時無法刪除帳號。';
const FAILED_MESSAGE = '刪除帳號時發生問題，請稍後再試，或寄信給客服協助處理。';
const NOT_SIGNED_IN_MESSAGE = '登入狀態已過期，請重新登入後再刪除帳號。';

function isOkPayload(value: unknown): boolean {
  return typeof value === 'object' && value !== null && (value as { ok?: unknown }).ok === true;
}

/**
 * 永久刪除帳號（App Store 指南 5.1.1(v)：有註冊功能就必須提供 App 內刪除入口）。
 *
 * 實際刪除由 delete-account 邊緣函式以 service key 執行，並且**只刪它自己從
 * 存取權杖換出來的那個帳號**，裝置端無法指定要刪誰。任務、提案、對話、訊息、
 * 評價、收藏、通知與個人檔案都以 auth.users(id) 為外鍵並設 cascade，因此帳號
 * 一刪就一併清除；客服留言只把姓名與信箱換成佔位值（爭議紀錄要保留）。
 */
export async function deleteAccount(): Promise<DeleteAccountOutcome> {
  const client = getBiltClient();
  if (client === null) return { ok: false, message: NOT_CONFIGURED_MESSAGE };

  const { data: sessionData } = await client.auth.getSession();
  if (sessionData.session === null) return { ok: false, message: NOT_SIGNED_IN_MESSAGE };

  const { data, error } = await client.functions.invoke('delete-account', { body: {} });
  if (error !== null || !isOkPayload(data)) return { ok: false, message: FAILED_MESSAGE };

  // 帳號已經不存在，伺服器端的登出會失敗，但本機權杖一定要清掉。
  try {
    await client.auth.signOut();
  } catch {
    // 忽略：帳號已刪除，後續的本機重設才是關鍵。
  }

  resetLocalUserData();
  // 刪除帳號與登出不同：身分、技能、地區與訂閱狀態都不該留在這台裝置上。
  useSessionStore.getState().resetSession();

  return { ok: true };
}
