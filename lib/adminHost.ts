import { Platform } from 'react-native';

/**
 * 網頁版只提供管理員專屬平台：任何非 /admin 路徑都會被導到管理入口。
 * 一般使用者介面只在手機 App（原生）上執行，因此原生永遠為 false。
 */
export const IS_ADMIN_WEB = Platform.OS === 'web';

/** 管理入口路徑；網頁版的任何其他路徑都會被導回這裡。 */
export const ADMIN_ENTRY_PATH = '/admin';

/** 路徑是否屬於管理平台（含舊路徑 /admin-dashboard）。 */
export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

/**
 * Cloudflare Access（Zero Trust）在受保護網域上提供的端點。
 * 網站掛上 Access 應用程式後，這兩個路徑由 Cloudflare 邊緣直接處理，
 * 不會進到靜態資源服務與 SPA fallback。
 */
export const ACCESS_IDENTITY_PATH = '/cdn-cgi/access/get-identity';
export const ACCESS_LOGOUT_PATH = '/cdn-cgi/access/logout';

/** Cloudflare Access 已驗證的身分。 */
export interface AccessIdentity {
  email: string;
  name?: string;
}

function readIdentityField(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * 讀取 Cloudflare Access 已驗證的身分。網域沒有掛 Access 時端點不存在，
 * 此時回傳 null，畫面維持只靠管理員帳密驗證的行為。
 */
export async function fetchAccessIdentity(): Promise<AccessIdentity | null> {
  if (Platform.OS !== 'web' || typeof fetch !== 'function') return null;

  try {
    const response = await fetch(ACCESS_IDENTITY_PATH, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) return null;

    const payload: unknown = await response.json();
    if (!isRecord(payload)) return null;

    const email = readIdentityField(payload.email);
    if (email === undefined) return null;

    return { email, name: readIdentityField(payload.name) };
  } catch {
    return null;
  }
}

/** 結束 Cloudflare Access 連線；下次進入管理網站會重新要求驗證。 */
export function endAccessSession(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  window.location.assign(ACCESS_LOGOUT_PATH);
}
