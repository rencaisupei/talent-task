import type { Session } from '@biltme/backend';

import { getBiltClient } from '@/lib/bilt';
import { resetLocalUserData } from '@/lib/localData';

const NOT_CONFIGURED_MESSAGE = '尚未設定後端連線，暫時無法登入。';
const INVALID_CODE_MESSAGE = '驗證碼不正確或已過期，請重新取得。';
const ALREADY_REGISTERED_MESSAGE =
  '這個 Email 已經註冊過了，請改用密碼登入；忘記密碼可以用 Email 驗證碼重設。';
const WRONG_CREDENTIALS_MESSAGE = 'Email 或密碼不正確，請再確認一次。';

/** 密碼最少長度。比後端預設值嚴格，因此按下按鈕前就能擋掉太短的密碼。 */
export const MIN_PASSWORD_LENGTH = 8;

export type AuthOutcome = { ok: true } | { ok: false; message: string };

/** Email 驗證碼的用途：驗證碼登入、完成註冊、重設密碼。 */
export type EmailCodePurpose = 'email' | 'signup' | 'recovery';

/** 密碼登入結果；needsEmailVerification 代表帳號還沒完成 Email 驗證。 */
export type PasswordSignInOutcome =
  | { ok: true }
  | { ok: false; message: string; needsEmailVerification: boolean };

/** 註冊結果；needsEmailVerification 代表還要輸入 6 位數驗證碼才會登入。 */
export type PasswordSignUpOutcome =
  | { ok: true; needsEmailVerification: boolean }
  | { ok: false; message: string; alreadyRegistered: boolean };

/**
 * 把後端的英文錯誤訊息轉成使用者看得懂的中文，畫面不顯示原始技術訊息。
 *
 * 比對順序有意義：'invalid login credentials' 必須排在通用的 'invalid'（驗證碼過期）
 * 之前，否則密碼錯誤會被說成「驗證碼不正確」。
 */
function friendlyAuthMessage(raw: string): string {
  const text = raw.toLowerCase();
  if (text.includes('invalid login credentials') || text.includes('invalid_credentials')) {
    return WRONG_CREDENTIALS_MESSAGE;
  }
  if (text.includes('email not confirmed')) {
    return '這個帳號還沒完成 Email 驗證，請先輸入寄到信箱的驗證碼。';
  }
  if (text.includes('already registered') || text.includes('already been registered')) {
    return ALREADY_REGISTERED_MESSAGE;
  }
  if (text.includes('signups not allowed') || text.includes('signup is disabled')) {
    return '目前暫時不開放註冊新帳號，請稍後再試。';
  }
  if (
    text.includes('rate limit') ||
    text.includes('for security purposes') ||
    text.includes('too many requests')
  ) {
    return '嘗試太頻繁，請稍等一分鐘再試。';
  }
  if (text.includes('different from the old password') || text.includes('same as the old')) {
    return '新密碼不能與目前的密碼相同，請換一組。';
  }
  if (text.includes('password')) {
    return `密碼不符合要求，請改用至少 ${MIN_PASSWORD_LENGTH} 個字、不容易被猜到的密碼。`;
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

/** 密碼不符合要求時回傳中文說明，符合則回傳 null。 */
export function describePasswordProblem(password: string): string | null {
  if (password.length === 0) return '請設定密碼。';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `密碼還需要 ${MIN_PASSWORD_LENGTH - password.length} 個字（至少 ${MIN_PASSWORD_LENGTH} 個字）。`;
  }
  if (password.trim().length === 0) return '密碼不能只有空白。';
  return null;
}

export function isValidPassword(password: string): boolean {
  return describePasswordProblem(password) === null;
}

/**
 * 重設密碼流程進行中。
 *
 * 驗證重設碼成功的那一刻就已經建立 session，但使用者必須留在登入頁輸入新密碼，
 * 所以 AuthGate 的「已登入就離開登入頁」導向要在這段期間先讓路。
 * 登入頁卸載時會呼叫 setPasswordRecoveryInProgress(false) 收尾。
 */
let passwordRecoveryInProgress = false;

export function setPasswordRecoveryInProgress(active: boolean): void {
  passwordRecoveryInProgress = active;
}

export function isPasswordRecoveryInProgress(): boolean {
  return passwordRecoveryInProgress;
}

/** 以 Email＋密碼登入既有帳號。 */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<PasswordSignInOutcome> {
  const client = getBiltClient();
  if (!client) {
    return { ok: false, message: NOT_CONFIGURED_MESSAGE, needsEmailVerification: false };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });
  if (error) {
    return {
      ok: false,
      message: friendlyAuthMessage(error.message),
      needsEmailVerification: error.message.toLowerCase().includes('email not confirmed'),
    };
  }
  if (!data.session) {
    return { ok: false, message: WRONG_CREDENTIALS_MESSAGE, needsEmailVerification: false };
  }
  return { ok: true };
}

/**
 * 用 Email＋密碼註冊新帳號。
 *
 * 後端開啟 Email 驗證時不會直接回傳 session，而是寄出 6 位數驗證碼；
 * 而且為了不洩漏「這個信箱是否已註冊」，重複註冊會回傳一個沒有 identities 的使用者
 * 而不是錯誤，所以要自己判斷這個情況並引導使用者去登入。
 */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<PasswordSignUpOutcome> {
  const client = getBiltClient();
  if (!client) {
    return { ok: false, message: NOT_CONFIGURED_MESSAGE, alreadyRegistered: false };
  }

  const { data, error } = await client.auth.signUp({ email: normalizeEmail(email), password });
  if (error) {
    const text = error.message.toLowerCase();
    const alreadyRegistered =
      text.includes('already registered') || text.includes('already been registered');
    return { ok: false, message: friendlyAuthMessage(error.message), alreadyRegistered };
  }
  if (data.session) return { ok: true, needsEmailVerification: false };
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return { ok: false, message: ALREADY_REGISTERED_MESSAGE, alreadyRegistered: true };
  }
  return { ok: true, needsEmailVerification: true };
}

/** 重新寄出註冊驗證碼（帳號已建立但還沒完成 Email 驗證）。 */
export async function resendSignUpCode(email: string): Promise<AuthOutcome> {
  const client = getBiltClient();
  if (!client) return { ok: false, message: NOT_CONFIGURED_MESSAGE };

  const { error } = await client.auth.resend({ type: 'signup', email: normalizeEmail(email) });
  if (error) return { ok: false, message: friendlyAuthMessage(error.message) };
  return { ok: true };
}

/** 寄出重設密碼的 6 位數驗證碼。 */
export async function sendPasswordResetCode(email: string): Promise<AuthOutcome> {
  const client = getBiltClient();
  if (!client) return { ok: false, message: NOT_CONFIGURED_MESSAGE };

  const { error } = await client.auth.resetPasswordForEmail(normalizeEmail(email));
  if (error) return { ok: false, message: friendlyAuthMessage(error.message) };
  return { ok: true };
}

/** 驗證重設密碼的驗證碼；成功後才有權限呼叫 updatePassword。 */
export async function verifyPasswordResetCode(email: string, code: string): Promise<AuthOutcome> {
  const client = getBiltClient();
  if (!client) return { ok: false, message: NOT_CONFIGURED_MESSAGE };

  const { data, error } = await client.auth.verifyOtp({
    email: normalizeEmail(email),
    token: code.trim(),
    type: 'recovery',
  });
  if (error) return { ok: false, message: friendlyAuthMessage(error.message) };
  if (!data.session) return { ok: false, message: INVALID_CODE_MESSAGE };
  return { ok: true };
}

/** 更新目前登入帳號的密碼（重設流程與日後的變更密碼共用）。 */
export async function updatePassword(password: string): Promise<AuthOutcome> {
  const client = getBiltClient();
  if (!client) return { ok: false, message: NOT_CONFIGURED_MESSAGE };

  const { error } = await client.auth.updateUser({ password });
  if (error) return { ok: false, message: friendlyAuthMessage(error.message) };
  return { ok: true };
}

/** 寄出 6 位數登入驗證碼；信箱沒註冊過會自動建立帳號。 */
export async function sendLoginCode(email: string): Promise<AuthOutcome> {
  const client = getBiltClient();
  if (!client) return { ok: false, message: NOT_CONFIGURED_MESSAGE };

  const { error } = await client.auth.signInWithOtp({ email: normalizeEmail(email) });
  if (error) return { ok: false, message: friendlyAuthMessage(error.message) };
  return { ok: true };
}

/**
 * 驗證 Email 驗證碼；成功後 onAuthStateChange 會通知 AuthGate 建立 session。
 * type 'email' 是驗證碼登入，'signup' 是完成密碼註冊的驗證。
 */
export async function verifyLoginCode(
  email: string,
  code: string,
  type: 'email' | 'signup' = 'email',
): Promise<AuthOutcome> {
  const client = getBiltClient();
  if (!client) return { ok: false, message: NOT_CONFIGURED_MESSAGE };

  const { data, error } = await client.auth.verifyOtp({
    email: normalizeEmail(email),
    token: code.trim(),
    type,
  });
  if (error) return { ok: false, message: friendlyAuthMessage(error.message) };
  if (!data.session) return { ok: false, message: INVALID_CODE_MESSAGE };
  return { ok: true };
}

/**
 * 主動登出並清掉這台裝置上的個人資料。
 *
 * 清除刻意放在這裡而不是 AuthGate 的狀態監聽：監聽只知道「session 不見了」，
 * 權杖過期也長得一樣，放在那裡會讓一次續期失敗就刪掉使用者的評價與收藏。
 */
export async function signOut(): Promise<void> {
  const client = getBiltClient();
  if (!client) return;
  await client.auth.signOut();
  resetLocalUserData();
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
