import { checkForAppUpdate } from '@/lib/appUpdate';
import { useChatStore } from '@/lib/stores/chat';
import { useGigStore } from '@/lib/stores/gigs';
import {
  type DeviceMaintenanceRun,
  type DeviceMaintenanceTask,
  type MaintenanceTaskStatus,
  type MaintenanceTrigger,
  useMaintenanceStore,
} from '@/lib/stores/maintenance';
import { useNotificationStore } from '@/lib/stores/notifications';
import { useSessionStore } from '@/lib/stores/session';

const DAY = 24 * 60 * 60 * 1000;

/** 逾期未成交的任務自動結案的天數。 */
export const STALE_GIG_DAYS = 14;
/** 已讀通知保留天數。 */
export const NOTIFICATION_RETENTION_DAYS = 30;
/** 通知中心最多保留的筆數。 */
export const NOTIFICATION_KEEP = 80;
/** 每則對話保留的訊息數。 */
export const MESSAGES_KEEP_PER_CONVERSATION = 200;

/** 台北時區（UTC+8，無日光節約）的 YYYY-MM-DD，維護每日去重就靠這個。 */
export function taipeiDayKey(at: number = Date.now()): string {
  return new Date(at + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

interface TaskOutcome {
  affected: number;
  message: string;
  status?: MaintenanceTaskStatus;
}

function safeTask(key: string, label: string, run: () => TaskOutcome): DeviceMaintenanceTask {
  try {
    const outcome = run();
    return {
      key,
      label,
      status: outcome.status ?? 'done',
      affected: outcome.affected,
      message: outcome.message,
    };
  } catch {
    return { key, label, status: 'failed', affected: 0, message: '這項維護執行失敗，下次會再試。' };
  }
}

interface HydratableStore {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
}

function whenHydrated(store: HydratableStore): Promise<void> {
  return new Promise((resolve) => {
    if (store.persist.hasHydrated()) {
      resolve();
      return;
    }
    const unsubscribe = store.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

/**
 * 等本機資料從 AsyncStorage 讀回來再開始維護，
 * 否則會對種子預設值做清理，數量與結果都不正確。
 */
export async function waitForLocalData(): Promise<void> {
  await Promise.all([
    whenHydrated(useGigStore),
    whenHydrated(useNotificationStore),
    whenHydrated(useChatStore),
    whenHydrated(useSessionStore),
  ]);
}

/** 執行一次裝置端維護（不判斷今天是否已跑過）。 */
export async function runDeviceMaintenance(
  trigger: MaintenanceTrigger,
): Promise<DeviceMaintenanceRun> {
  const store = useMaintenanceStore.getState();
  store.setRunning(true);

  const started = Date.now();
  const tasks: DeviceMaintenanceTask[] = [];

  const staleGigs = safeTask('stale-gigs', `逾期 ${STALE_GIG_DAYS} 天未成交的任務自動結案`, () => {
    const expired = useGigStore.getState().expireStaleGigs(STALE_GIG_DAYS * DAY);
    if (expired.length === 0) {
      return { affected: 0, message: '沒有逾期任務。', status: 'skipped' };
    }

    const { userId } = useSessionStore.getState();
    const mine = expired.filter((gig) => gig.clientId === userId);
    if (mine.length > 0) {
      useNotificationStore.getState().pushNotification({
        kind: 'system',
        title: `${mine.length} 件任務已自動結案`,
        body: `超過 ${STALE_GIG_DAYS} 天仍未成交的任務已停止曝光，需要的話可重新發布。`,
        gigId: mine[0].id,
      });
    }

    return { affected: expired.length, message: `已結案 ${expired.length} 件逾期任務。` };
  });
  tasks.push(staleGigs);

  tasks.push(
    safeTask('chat-quota', '對話配額月度重置檢查', () => {
      const reset = useSessionStore.getState().syncQuotaMonth();
      return reset
        ? { affected: 1, message: '已進入新月份，免費對話配額已重置。' }
        : { affected: 0, message: '本月配額無需重置。', status: 'skipped' };
    }),
  );

  tasks.push(
    safeTask('notifications', `通知中心保留最近 ${NOTIFICATION_RETENTION_DAYS} 天`, () => {
      const removed = useNotificationStore.getState().pruneNotifications({
        maxAgeMs: NOTIFICATION_RETENTION_DAYS * DAY,
        keep: NOTIFICATION_KEEP,
      });
      return removed === 0
        ? { affected: 0, message: '沒有需要清理的通知。', status: 'skipped' }
        : { affected: removed, message: `已清理 ${removed} 則過舊通知。` };
    }),
  );

  tasks.push(
    safeTask('chat-history', `每則對話保留最近 ${MESSAGES_KEEP_PER_CONVERSATION} 條訊息`, () => {
      const removed = useChatStore.getState().pruneMessages(MESSAGES_KEEP_PER_CONVERSATION);
      return removed === 0
        ? { affected: 0, message: '沒有需要修剪的對話紀錄。', status: 'skipped' }
        : { affected: removed, message: `已修剪 ${removed} 條舊訊息。` };
    }),
  );

  const update = await checkForAppUpdate();
  tasks.push({
    key: 'app-update',
    label: 'App 版本更新檢查',
    status: update.status === 'unavailable' ? 'skipped' : 'done',
    affected: update.status === 'available' ? 1 : 0,
    message: update.detail,
  });

  const run: DeviceMaintenanceRun = {
    id: `maint_${started}`,
    at: started,
    dayKey: taipeiDayKey(started),
    trigger,
    durationMs: Date.now() - started,
    tasks,
    updateStatus: update.status,
  };

  const latest = useMaintenanceStore.getState();
  latest.recordRun(run);
  latest.setUpdateStatus(update.status);
  latest.setRunning(false);

  return run;
}

/** 每日一次：今天已維護過就不做事，回傳 null。 */
export async function ensureDailyMaintenance(
  trigger: MaintenanceTrigger,
): Promise<DeviceMaintenanceRun | null> {
  const { hydrated, running, lastDayKey } = useMaintenanceStore.getState();
  if (!hydrated || running) return null;
  if (lastDayKey === taipeiDayKey()) return null;

  await waitForLocalData();

  // 等待期間可能已有另一次維護完成（例如同時開 App 又回到前景）。
  const current = useMaintenanceStore.getState();
  if (current.running || current.lastDayKey === taipeiDayKey()) return null;

  return runDeviceMaintenance(trigger);
}
