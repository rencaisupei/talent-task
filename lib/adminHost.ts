import { Platform } from 'react-native';

/**
 * 管理平台專屬網域。預設 admin.instantgig.tw，可用 EXPO_PUBLIC_ADMIN_HOST
 * 覆寫（多個網域以逗號分隔），方便同一份匯出掛在不同環境的子網域上。
 */
const DEFAULT_ADMIN_HOSTS = ['admin.instantgig.tw'];

function readConfiguredHosts(): string[] {
  const raw = process.env.EXPO_PUBLIC_ADMIN_HOST;
  if (typeof raw !== 'string' || raw.trim().length === 0) return DEFAULT_ADMIN_HOSTS;

  const hosts = raw
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter((host) => host.length > 0);

  return hosts.length > 0 ? hosts : DEFAULT_ADMIN_HOSTS;
}

/** 目前設定為管理平台的網域清單。 */
export const ADMIN_HOSTS = readConfiguredHosts();

/** 管理入口路徑；管理網域的任何其他路徑都會被導回這裡。 */
export const ADMIN_ENTRY_PATH = '/admin';

/**
 * 是否為管理網域。除了設定清單之外，也接受任何 `admin.` 開頭的主機名稱，
 * 這樣本機用 admin.localhost:8081 或預覽子網域也能驗證同一套行為。
 */
export function isAdminHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (host.length === 0) return false;
  return ADMIN_HOSTS.includes(host) || host.startsWith('admin.');
}

/** 路徑是否屬於管理平台（含舊路徑 /admin-dashboard）。 */
export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

function detectAdminHost(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return isAdminHostname(window.location.hostname);
}

/** 這次載入是否來自管理專屬網域；原生 App 永遠為 false。 */
export const IS_ADMIN_HOST = detectAdminHost();

/**
 * Cloudflare Access（Zero Trust）在受保護網域上提供的端點。
 * 管理網域由 Cloudflare 代理並掛上 Access 應用程式後，這兩個路徑
 * 由 Cloudflare 邊緣直接處理，不會進到 Vercel。
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

/** 結束 Cloudflare Access 連線；下次進入管理網域會重新要求驗證。 */
export function endAccessSession(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  window.location.assign(ACCESS_LOGOUT_PATH);
}
