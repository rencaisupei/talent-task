import type { Session } from '@biltme/backend';

import { getBiltClient } from '@/lib/bilt';

const NOT_CONFIGURED_MESSAGE = '尚未設定後端連線，暫時無法登入。';
const INVALID_CODE_MESSAGE = '驗證碼不正確或已過期，請重新取得。';

export type AuthOutcome = { ok: true } | { ok: false; message: string };

/** 把後端的英文錯誤訊息轉成使用者看得懂的中文，畫面不顯示原始技術訊息。 */
function friendlyAuthMessage(raw: string): string {
  const text = raw.toLowerCase();
  if (text.includes('rate limit') || text.includes('for security purposes')) {
    return '取得驗證碼太頻繁，請稍等一分鐘再試。';
  }
  if (text.includes('expired') || text.includes('invalid') || text.includes('token')) {
    return INVALID_CODE_MESSAGE;
  }
  if (text.includes('email')) return '這個 Email 無法使用，請確認是否拼寫正確。';
  return '登入時發生問題，請稍後再試。';
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));
}

/** 寄出 6 位數登入驗證碼；信箱沒註冊過會自動建立帳號。 */
export async function sendLoginCode(email: string): Promise<AuthOutcome> {
  const client = getBiltClient();
  if (!client) return { ok: false, message: NOT_CONFIGURED_MESSAGE };

  const { error } = await client.auth.signInWithOtp({ email: normalizeEmail(email) });
  if (error) return { ok: false, message: friendlyAuthMessage(error.message) };
  return { ok: true };
}

/** 驗證 6 位數登入碼；成功後 onAuthStateChange 會通知 AuthGate 建立 session。 */
export async function verifyLoginCode(email: string, code: string): Promise<AuthOutcome> {
  const client = getBiltClient();
  if (!client) return { ok: false, message: NOT_CONFIGURED_MESSAGE };

  const { data, error } = await client.auth.verifyOtp({
    email: normalizeEmail(email),
    token: code.trim(),
    type: 'email',
  });
  if (error) return { ok: false, message: friendlyAuthMessage(error.message) };
  if (!data.session) return { ok: false, message: INVALID_CODE_MESSAGE };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const client = getBiltClient();
  if (!client) return;
  await client.auth.signOut();
}

/** 讀取裝置上已保存的登入狀態（冷啟動時用）。 */
export async function getStoredSession(): Promise<Session | null> {
  const client = getBiltClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

/** 訂閱登入狀態變化（登入、登出、權杖續期）。 */
export function subscribeToAuthChanges(handler: (session: Session | null) => void): () => void {
  const client = getBiltClient();
  if (!client) return () => undefined;

  const { data } = client.auth.onAuthStateChange((_event, session) => handler(session));
  return () => data.subscription.unsubscribe();
}
