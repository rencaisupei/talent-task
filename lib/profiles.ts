import { getBiltClient } from '@/lib/bilt';
import { REGION_ANY } from '@/lib/regions';
import { useSessionStore } from '@/lib/stores/session';
import type { UserRole } from '@/lib/types';

/**
 * profiles 資料表是使用者身分的真相來源：同一個 Email 在任何裝置登入，
 * 顯示名稱、身分、地區與技能標籤都會一致。RLS 只允許本人寫入自己的那一列。
 */
export interface ProfileFields {
  displayName: string;
  role: UserRole | null;
  region: string;
  skills: string[];
  privacyAccepted: boolean;
}

const SELECT_COLUMNS = 'display_name, role, region, skills, privacy_accepted';
const SYNC_DEBOUNCE_MS = 700;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readRole(value: unknown): UserRole | null {
  return value === 'client' || value === 'talent' ? value : null;
}

function readSkills(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

/** 從 session store 目前狀態取出要同步到後端的欄位。 */
function fieldsFromSession(): ProfileFields {
  const state = useSessionStore.getState();
  return {
    displayName: state.displayName,
    role: state.role,
    region: state.region,
    skills: state.skills,
    privacyAccepted: state.privacyAccepted,
  };
}

function signature(fields: ProfileFields): string {
  return JSON.stringify([
    fields.displayName,
    fields.role,
    fields.region,
    [...fields.skills],
    fields.privacyAccepted,
  ]);
}

/** 區分「後端沒有這一列」與「讀取失敗」：讀取失敗時不可用本機預設值覆寫後端。 */
export type ProfileFetchResult =
  | { status: 'ok'; profile: ProfileFields }
  | { status: 'missing' }
  | { status: 'error' };

export async function fetchProfile(userId: string): Promise<ProfileFetchResult> {
  const client = getBiltClient();
  if (!client) return { status: 'error' };

  const { data, error } = await client
    .from('profiles')
    .select(SELECT_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) return { status: 'error' };

  const raw: unknown = data;
  if (!isRecord(raw)) return { status: 'missing' };

  const region = readText(raw.region);
  return {
    status: 'ok',
    profile: {
      displayName: readText(raw.display_name),
      role: readRole(raw.role),
      region: region.length > 0 ? region : REGION_ANY,
      skills: readSkills(raw.skills),
      privacyAccepted: raw.privacy_accepted === true,
    },
  };
}

export async function saveProfile(userId: string, fields: ProfileFields): Promise<boolean> {
  const client = getBiltClient();
  if (!client) return false;

  const { error } = await client.from('profiles').upsert({
    id: userId,
    display_name: fields.displayName,
    role: fields.role,
    region: fields.region,
    skills: fields.skills,
    privacy_accepted: fields.privacyAccepted,
    updated_at: new Date().toISOString(),
  });
  return error === null;
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncedSignature: string | null = null;

/**
 * 登入後把後端 profile 套進 session store。
 *
 * - 後端沒有這一列（首次登入）：以裝置上的預設值建立。
 * - 讀取失敗（例如離線）：只放行畫面，不寫入任何東西，避免用預設值覆寫後端資料。
 * - 後端欄位是空的但本機有值：以本機為準並補寫回後端。
 */
export async function loadProfileIntoSession(userId: string): Promise<void> {
  const local = fieldsFromSession();
  const result = await fetchProfile(userId);

  if (result.status === 'error') {
    useSessionStore.getState().markProfileLoaded();
    return;
  }

  if (result.status === 'missing') {
    syncedSignature = signature(local);
    useSessionStore.getState().markProfileLoaded();
    const saved = await saveProfile(userId, local);
    if (!saved) syncedSignature = null;
    return;
  }

  const remote = result.profile;
  const merged: ProfileFields = {
    displayName: remote.displayName.length > 0 ? remote.displayName : local.displayName,
    role: remote.role ?? local.role,
    region: remote.region,
    skills: remote.skills.length > 0 ? remote.skills : local.skills,
    privacyAccepted: remote.privacyAccepted || local.privacyAccepted,
  };

  syncedSignature = signature(merged);
  useSessionStore.getState().applyRemoteProfile(merged);

  if (signature(merged) !== signature(remote)) {
    const saved = await saveProfile(userId, merged);
    if (!saved) syncedSignature = null;
  }
}

/**
 * 監聽 session store，把身分相關欄位的變動去彈跳後寫回後端。
 * 畫面照舊只操作 store，不需要知道同步這件事。
 */
export function startProfileSync(): () => void {
  const unsubscribe = useSessionStore.subscribe((state) => {
    if (state.authStatus !== 'signedIn' || state.userId.length === 0 || !state.profileLoaded)
      return;

    const fields = fieldsFromSession();
    const next = signature(fields);
    if (next === syncedSignature) return;

    syncedSignature = next;
    const userId = state.userId;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      void saveProfile(userId, fields).then((saved) => {
        // 寫入失敗就清掉指紋，下一次變動會重試。
        if (!saved && syncedSignature === next) syncedSignature = null;
      });
    }, SYNC_DEBOUNCE_MS);
  });

  return () => {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = null;
    unsubscribe();
  };
}

/** 登出時清掉同步指紋，避免下一個帳號誤判為已同步。 */
export function resetProfileSyncState(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = null;
  syncedSignature = null;
}
