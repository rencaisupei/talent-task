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
