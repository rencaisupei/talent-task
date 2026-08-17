import { ADMIN_ROLE_PERMISSIONS, type AdminPermission } from '@/lib/adminPermissions';
import { getBiltClient } from '@/lib/bilt';
import type { AdminAccount, AdminRole, ManagedAdminAccount } from '@/lib/types';

/** 管理員驗證與帳號管理都走這個後端函式，前端不持有任何密碼或雜湊。 */
const ADMIN_AUTH_FUNCTION = 'admin-auth';

/** 每日系統維護排程（伺服器端），與管理員登入共用同一組 session token。 */
const MAINTENANCE_FUNCTION = 'daily-maintenance';

const BACKEND_UNAVAILABLE_MESSAGE =
  '尚未設定後端連線（EXPO_PUBLIC_BILT_URL 與 EXPO_PUBLIC_BILT_ANON_KEY），無法驗證管理員身分。';
const NETWORK_MESSAGE = '無法連線到驗證服務，請確認網路後再試。';

/* ------------------------------------------------------------------ */
/* 回應解析                                                            */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readRole(value: unknown): AdminRole | null {
  return value === 'owner' || value === 'moderator' || value === 'analyst' ? value : null;
}

function readPermissions(role: AdminRole): readonly AdminPermission[] {
  return ADMIN_ROLE_PERMISSIONS[role];
}

function parseAdmin(value: unknown): AdminAccount | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  const email = readString(value.email);
  const name = readString(value.name);
  const role = readRole(value.role);
  const createdAt = readNumber(value.createdAt);
  if (id === null || email === null || name === null || role === null || createdAt === null) {
    return null;
  }

  return {
    id,
    email,
    name,
    role,
    isActive: value.isActive !== false,
    createdAt,
    lastLoginAt: readNumber(value.lastLoginAt),
  };
}

function parseManagedAdmin(value: unknown): ManagedAdminAccount | null {
  const base = parseAdmin(value);
  if (base === null || !isRecord(value)) return null;

  return {
    ...base,
    hasPassword: value.hasPassword === true,
    setupCodeExpiresAt: readNumber(value.setupCodeExpiresAt),
    lockedUntil: readNumber(value.lockedUntil),
    failedAttempts: readNumber(value.failedAttempts) ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/* 呼叫封裝                                                            */
/* ------------------------------------------------------------------ */

type Envelope =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; unconfigured: boolean; message: string };

async function call(
  body: Record<string, unknown>,
  functionName: string = ADMIN_AUTH_FUNCTION,
): Promise<Envelope> {
  const client = getBiltClient();
  if (client === null) {
    return { ok: false, unconfigured: true, message: BACKEND_UNAVAILABLE_MESSAGE };
  }

  try {
    const { data, error } = await client.functions.invoke(functionName, { body });
    if (error !== null || !isRecord(data)) {
      return { ok: false, unconfigured: false, message: NETWORK_MESSAGE };
    }
    return { ok: true, payload: data };
  } catch {
    return { ok: false, unconfigured: false, message: NETWORK_MESSAGE };
  }
}

function serverMessage(payload: Record<string, unknown>, fallback: string): string {
  return readString(payload.message) ?? fallback;
}

/* ------------------------------------------------------------------ */
/* 登入與工作階段                                                      */
/* ------------------------------------------------------------------ */

export interface AdminSessionPayload {
  token: string;
  expiresAt: number;
  admin: AdminAccount;
  /** 由伺服器回傳的角色推導，介面依此顯示可用模組。 */
  permissions: readonly AdminPermission[];
}

export type AdminAuthOutcome =
  | { kind: 'ok'; session: AdminSessionPayload }
  /** 帳號尚未設定密碼：使用者輸入的是一次性啟用碼，需接著設定新密碼。 */
  | { kind: 'setup-required'; email: string; name: string }
  | { kind: 'locked'; lockedUntil: number }
  | { kind: 'rejected'; message: string }
  | { kind: 'unavailable'; message: string; unconfigured: boolean };

function parseSessionPayload(payload: Record<string, unknown>): AdminSessionPayload | null {
  const token = readString(payload.token);
  const expiresAt = readNumber(payload.expiresAt);
  const admin = parseAdmin(payload.admin);
  if (token === null || expiresAt === null || admin === null) return null;

  return { token, expiresAt, admin, permissions: readPermissions(admin.role) };
}

function toAuthOutcome(envelope: Envelope): AdminAuthOutcome {
  if (!envelope.ok) {
    return { kind: 'unavailable', message: envelope.message, unconfigured: envelope.unconfigured };
  }

  const { payload } = envelope;
  switch (payload.status) {
    case 'ok': {
      const session = parseSessionPayload(payload);
      return session === null
        ? { kind: 'unavailable', message: NETWORK_MESSAGE, unconfigured: false }
        : { kind: 'ok', session };
    }
    case 'setup_required': {
      const email = readString(payload.email);
      return email === null
        ? { kind: 'rejected', message: '啟用碼不正確或已過期。' }
        : { kind: 'setup-required', email, name: readString(payload.name) ?? email };
    }
    case 'locked':
      return { kind: 'locked', lockedUntil: readNumber(payload.lockedUntil) ?? Date.now() };
    case 'invalid': {
      const remaining = readNumber(payload.remainingAttempts);
      const base = serverMessage(payload, '帳號或密碼不正確。');
      return {
        kind: 'rejected',
        message: remaining === null ? base : `${base}還可嘗試 ${remaining} 次。`,
      };
    }
    case 'weak_password':
      return { kind: 'rejected', message: serverMessage(payload, '密碼強度不足。') };
    case 'disabled':
      return { kind: 'rejected', message: serverMessage(payload, '此管理員帳號已停用。') };
    case 'expired':
      return { kind: 'rejected', message: '登入狀態已過期，請重新登入。' };
    default:
      return {
        kind: 'unavailable',
        message: serverMessage(payload, NETWORK_MESSAGE),
        unconfigured: false,
      };
  }
}

export async function adminLogin(email: string, password: string): Promise<AdminAuthOutcome> {
  return toAuthOutcome(await call({ action: 'login', email, password }));
}

/** 首次登入（或被重設密碼後）以一次性啟用碼設定專屬密碼，成功即直接建立工作階段。 */
export async function adminCompleteSetup(
  email: string,
  setupCode: string,
  newPassword: string,
): Promise<AdminAuthOutcome> {
  return toAuthOutcome(await call({ action: 'set-password', email, setupCode, newPassword }));
}

export async function adminChangePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<AdminAuthOutcome> {
  return toAuthOutcome(
    await call({ action: 'change-password', token, currentPassword, newPassword }),
  );
}

export type AdminSessionOutcome =
  | {
      kind: 'ok';
      admin: AdminAccount;
      permissions: readonly AdminPermission[];
      expiresAt: number;
    }
  | { kind: 'expired' }
  | { kind: 'unavailable'; message: string; unconfigured: boolean };

export async function adminFetchSession(token: string): Promise<AdminSessionOutcome> {
  const envelope = await call({ action: 'session', token });
  if (!envelope.ok) {
    return { kind: 'unavailable', message: envelope.message, unconfigured: envelope.unconfigured };
  }

  const { payload } = envelope;
  if (payload.status !== 'ok') return { kind: 'expired' };

  const admin = parseAdmin(payload.admin);
  const expiresAt = readNumber(payload.expiresAt);
  if (admin === null || expiresAt === null) return { kind: 'expired' };

  return { kind: 'ok', admin, permissions: readPermissions(admin.role), expiresAt };
}

export async function adminLogout(token: string): Promise<void> {
  await call({ action: 'logout', token });
}

/* ------------------------------------------------------------------ */
/* 帳號管理（需要 admins:manage）                                       */
/* ------------------------------------------------------------------ */

export type AdminListOutcome =
  | { kind: 'ok'; accounts: ManagedAdminAccount[] }
  | { kind: 'expired' }
  | { kind: 'forbidden' }
  | { kind: 'failed'; message: string };

export type AdminMutationOutcome =
  | { kind: 'ok'; account: ManagedAdminAccount; setupCode: string | null }
  | { kind: 'expired' }
  | { kind: 'forbidden' }
  | { kind: 'failed'; message: string };

export type AdminDeleteOutcome =
  | { kind: 'ok' }
  | { kind: 'expired' }
  | { kind: 'forbidden' }
  | { kind: 'failed'; message: string };

function statusFailure(
  envelope: Envelope,
): { kind: 'expired' } | { kind: 'forbidden' } | { kind: 'failed'; message: string } | null {
  if (!envelope.ok) return { kind: 'failed', message: envelope.message };

  const { payload } = envelope;
  if (payload.status === 'expired') return { kind: 'expired' };
  if (payload.status === 'forbidden') return { kind: 'forbidden' };
  if (payload.status !== 'ok') {
    return { kind: 'failed', message: serverMessage(payload, '操作失敗，請稍後再試。') };
  }
  return null;
}

export async function adminListAccounts(token: string): Promise<AdminListOutcome> {
  const envelope = await call({ action: 'list-admins', token });
  const failure = statusFailure(envelope);
  if (failure !== null) return failure;
  if (!envelope.ok) return { kind: 'failed', message: NETWORK_MESSAGE };

  const raw = envelope.payload.accounts;
  const accounts = Array.isArray(raw)
    ? raw.map(parseManagedAdmin).filter((item): item is ManagedAdminAccount => item !== null)
    : [];

  return { kind: 'ok', accounts };
}

function toMutationOutcome(envelope: Envelope): AdminMutationOutcome {
  const failure = statusFailure(envelope);
  if (failure !== null) return failure;
  if (!envelope.ok) return { kind: 'failed', message: NETWORK_MESSAGE };

  const account = parseManagedAdmin(envelope.payload.account);
  if (account === null) return { kind: 'failed', message: '伺服器回應格式不正確。' };

  return { kind: 'ok', account, setupCode: readString(envelope.payload.setupCode) };
}

export interface CreateAdminInput {
  email: string;
  name: string;
  role: AdminRole;
  /** 留空則由伺服器發一次性啟用碼，對方首次登入時自行設定密碼。 */
  password?: string;
}

export async function adminCreateAccount(
  token: string,
  input: CreateAdminInput,
): Promise<AdminMutationOutcome> {
  return toMutationOutcome(
    await call({
      action: 'create-admin',
      token,
      email: input.email,
      name: input.name,
      role: input.role,
      password: input.password ?? '',
    }),
  );
}

export interface UpdateAdminInput {
  id: string;
  name?: string;
  role?: AdminRole;
  isActive?: boolean;
}

export async function adminUpdateAccount(
  token: string,
  input: UpdateAdminInput,
): Promise<AdminMutationOutcome> {
  return toMutationOutcome(await call({ action: 'update-admin', token, ...input }));
}

/** 清掉對方的密碼與所有工作階段，改發一次性啟用碼。 */
export async function adminResetAccountPassword(
  token: string,
  id: string,
): Promise<AdminMutationOutcome> {
  return toMutationOutcome(await call({ action: 'reset-admin-password', token, id }));
}

export async function adminDeleteAccount(token: string, id: string): Promise<AdminDeleteOutcome> {
  const envelope = await call({ action: 'delete-admin', token, id });
  const failure = statusFailure(envelope);
  return failure ?? { kind: 'ok' };
}

/* ------------------------------------------------------------------ */
/* 登入事件紀錄                                                        */
/* ------------------------------------------------------------------ */

export const ADMIN_LOGIN_OUTCOME_LABEL: Record<string, string> = {
  success: '登入成功',
  invalid_password: '密碼錯誤',
  unknown_email: '帳號不存在',
  locked: '嘗試登入被鎖定的帳號',
  disabled: '嘗試登入停用帳號',
  setup_required: '以啟用碼進入設定密碼',
  password_set: '完成首次密碼設定',
  password_changed: '自行變更密碼',
  signed_out: '登出',
  session_expired: '工作階段過期',
};

export interface AdminLoginEvent {
  id: string;
  email: string;
  outcome: string;
  at: number;
}

export type AdminLoginEventsOutcome =
  | { kind: 'ok'; events: AdminLoginEvent[] }
  | { kind: 'expired' }
  | { kind: 'forbidden' }
  | { kind: 'failed'; message: string };

function parseLoginEvent(value: unknown): AdminLoginEvent | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  const email = readString(value.email);
  const outcome = readString(value.outcome);
  const at = readNumber(value.at);
  if (id === null || email === null || outcome === null || at === null) return null;

  return { id, email, outcome, at };
}

export async function adminFetchLoginEvents(
  token: string,
  limit = 25,
): Promise<AdminLoginEventsOutcome> {
  const envelope = await call({ action: 'login-events', token, limit });
  const failure = statusFailure(envelope);
  if (failure !== null) return failure;
  if (!envelope.ok) return { kind: 'failed', message: NETWORK_MESSAGE };

  const raw = envelope.payload.events;
  const events = Array.isArray(raw)
    ? raw.map(parseLoginEvent).filter((item): item is AdminLoginEvent => item !== null)
    : [];

  return { kind: 'ok', events };
}

/* ------------------------------------------------------------------ */
/* 每日系統維護排程                                                    */
/* ------------------------------------------------------------------ */

export type MaintenanceTaskStatus = 'done' | 'failed';

export type MaintenanceRunStatus = 'ok' | 'partial' | 'failed';

export type MaintenanceSource = 'cron' | 'manual';

export const MAINTENANCE_SOURCE_LABEL: Record<MaintenanceSource, string> = {
  cron: '排程自動',
  manual: '管理員手動',
};

export const MAINTENANCE_RUN_STATUS_LABEL: Record<MaintenanceRunStatus, string> = {
  ok: '全部完成',
  partial: '部分失敗',
  failed: '執行失敗',
};

export interface MaintenanceTaskReport {
  key: string;
  label: string;
  status: MaintenanceTaskStatus;
  affected: number;
  message: string;
}

export interface MaintenanceRunRecord {
  id: string;
  at: number;
  /** 台北時區日期（YYYY-MM-DD）；每日去重就靠這個欄位。 */
  dayKey: string;
  source: MaintenanceSource;
  triggeredBy: string | null;
  status: MaintenanceRunStatus;
  tasks: MaintenanceTaskReport[];
  durationMs: number;
  note: string | null;
}

export type MaintenanceRunOutcome =
  | { kind: 'ok'; run: MaintenanceRunRecord }
  /** 今天已經執行過，回傳當天那一筆紀錄。 */
  | { kind: 'skipped'; run: MaintenanceRunRecord | null; message: string }
  | { kind: 'expired' }
  | { kind: 'forbidden' }
  | { kind: 'failed'; message: string };

export type MaintenanceListOutcome =
  | { kind: 'ok'; runs: MaintenanceRunRecord[] }
  | { kind: 'expired' }
  | { kind: 'forbidden' }
  | { kind: 'failed'; message: string };

export interface MaintenanceScheduleConfig {
  cronKey: string;
  rotatedAt: number;
  /** 排程服務要呼叫的網址。 */
  endpoint: string;
  /** 後端另外設了 MAINTENANCE_CRON_KEY 環境變數。 */
  envKeyConfigured: boolean;
}

export type MaintenanceConfigOutcome =
  | { kind: 'ok'; config: MaintenanceScheduleConfig }
  | { kind: 'expired' }
  | { kind: 'forbidden' }
  | { kind: 'failed'; message: string };

function readTaskStatus(value: unknown): MaintenanceTaskStatus | null {
  return value === 'done' || value === 'failed' ? value : null;
}

function readRunStatus(value: unknown): MaintenanceRunStatus | null {
  return value === 'ok' || value === 'partial' || value === 'failed' ? value : null;
}

function readSource(value: unknown): MaintenanceSource | null {
  return value === 'cron' || value === 'manual' ? value : null;
}

function parseMaintenanceTask(value: unknown): MaintenanceTaskReport | null {
  if (!isRecord(value)) return null;

  const key = readString(value.key);
  const label = readString(value.label);
  const status = readTaskStatus(value.status);
  if (key === null || label === null || status === null) return null;

  return {
    key,
    label,
    status,
    affected: readNumber(value.affected) ?? 0,
    message: readString(value.message) ?? '',
  };
}

function parseMaintenanceRun(value: unknown): MaintenanceRunRecord | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  const at = readNumber(value.at);
  const dayKey = readString(value.dayKey);
  const source = readSource(value.source);
  const status = readRunStatus(value.status);
  if (id === null || at === null || dayKey === null || source === null || status === null) {
    return null;
  }

  const rawTasks = value.tasks;
  const tasks = Array.isArray(rawTasks)
    ? rawTasks
        .map(parseMaintenanceTask)
        .filter((item): item is MaintenanceTaskReport => item !== null)
    : [];

  return {
    id,
    at,
    dayKey,
    source,
    triggeredBy: readString(value.triggeredBy),
    status,
    tasks,
    durationMs: readNumber(value.durationMs) ?? 0,
    note: readString(value.note),
  };
}

/** 手動觸發伺服器端維護；force 為 true 時忽略「今天已執行過」。 */
export async function adminRunMaintenance(
  token: string,
  force = false,
): Promise<MaintenanceRunOutcome> {
  const envelope = await call({ action: 'run', token, force }, MAINTENANCE_FUNCTION);
  if (!envelope.ok) return { kind: 'failed', message: envelope.message };

  const { payload } = envelope;
  if (payload.status === 'expired') return { kind: 'expired' };
  if (payload.status === 'forbidden') return { kind: 'forbidden' };
  if (payload.status === 'skipped') {
    return {
      kind: 'skipped',
      run: parseMaintenanceRun(payload.run),
      message: serverMessage(payload, '今天已經執行過每日維護。'),
    };
  }
  if (payload.status !== 'ok') {
    return { kind: 'failed', message: serverMessage(payload, '維護執行失敗，請稍後再試。') };
  }

  const run = parseMaintenanceRun(payload.run);
  return run === null ? { kind: 'failed', message: '伺服器回應格式不正確。' } : { kind: 'ok', run };
}

export async function adminFetchMaintenanceRuns(
  token: string,
  limit = 20,
): Promise<MaintenanceListOutcome> {
  const envelope = await call({ action: 'runs', token, limit }, MAINTENANCE_FUNCTION);
  const failure = statusFailure(envelope);
  if (failure !== null) return failure;
  if (!envelope.ok) return { kind: 'failed', message: NETWORK_MESSAGE };

  const raw = envelope.payload.runs;
  const runs = Array.isArray(raw)
    ? raw.map(parseMaintenanceRun).filter((item): item is MaintenanceRunRecord => item !== null)
    : [];

  return { kind: 'ok', runs };
}

function toConfigOutcome(envelope: Envelope): MaintenanceConfigOutcome {
  const failure = statusFailure(envelope);
  if (failure !== null) return failure;
  if (!envelope.ok) return { kind: 'failed', message: NETWORK_MESSAGE };

  const { payload } = envelope;
  const cronKey = readString(payload.cronKey);
  const endpoint = readString(payload.endpoint);
  if (cronKey === null || endpoint === null) {
    return { kind: 'failed', message: '伺服器回應格式不正確。' };
  }

  return {
    kind: 'ok',
    config: {
      cronKey,
      endpoint,
      rotatedAt: readNumber(payload.rotatedAt) ?? Date.now(),
      envKeyConfigured: payload.envKeyConfigured === true,
    },
  };
}

/** 取得排程呼叫網址與金鑰（需要管理員帳號管理權限）。 */
export async function adminFetchMaintenanceConfig(
  token: string,
): Promise<MaintenanceConfigOutcome> {
  return toConfigOutcome(await call({ action: 'config', token }, MAINTENANCE_FUNCTION));
}

/** 重新產生排程金鑰，舊金鑰立即失效。 */
export async function adminRotateMaintenanceKey(token: string): Promise<MaintenanceConfigOutcome> {
  return toConfigOutcome(await call({ action: 'rotate-key', token }, MAINTENANCE_FUNCTION));
}
