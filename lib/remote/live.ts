import { AppState, type AppStateStatus } from 'react-native';

import { getBiltClient } from '@/lib/bilt';

type BiltClient = NonNullable<ReturnType<typeof getBiltClient>>;
type RealtimeChannel = ReturnType<BiltClient['channel']>;

const CHANNEL_NAME = 'instantgig-content';
const BROADCAST_EVENT = 'content-changed';

/**
 * 輪詢間隔。這是保證機制，不是備胎而已：
 * 這個專案的資料庫 wal_level 是 replica，Realtime 的 postgres_changes（靠邏輯複製）
 * 不會推送資料列變更，因此訂閱只在 Realtime 服務可用時提供「立刻更新」，
 * 其餘情況靠這裡的輪詢與回到前景時的重新讀取。
 */
const POLL_INTERVAL_MS = 20_000;

export type LiveSyncMode = 'connecting' | 'live' | 'polling';

export interface LiveSyncHandlers {
  /** 重新讀取雲端資料。 */
  onRefresh: () => void;
  onModeChange?: (mode: LiveSyncMode) => void;
}

let activeChannel: RealtimeChannel | null = null;

/**
 * 建立內容即時同步：訂閱 gigs / bids 的變更，並以輪詢與前景回歸作為保證機制。
 * 回傳解除訂閱的函式。
 */
export function startContentLiveSync({ onRefresh, onModeChange }: LiveSyncHandlers): () => void {
  const client = getBiltClient();
  if (client === null) return () => undefined;

  let disposed = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const refresh = () => {
    if (!disposed) onRefresh();
  };

  refresh();
  onModeChange?.('connecting');

  const channel = client
    .channel(CHANNEL_NAME)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gigs' }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, refresh)
    // 廣播事件不需要邏輯複製：有人發布任務或送出提案時主動通知其他裝置。
    .on('broadcast', { event: BROADCAST_EVENT }, refresh)
    .subscribe((status: string) => {
      if (disposed) return;
      onModeChange?.(status === 'SUBSCRIBED' ? 'live' : 'polling');
    });

  activeChannel = channel;

  pollTimer = setInterval(() => {
    // 背景時不打 API，回到前景會立刻補一次。
    if (AppState.currentState === 'active') refresh();
  }, POLL_INTERVAL_MS);

  const appState = AppState.addEventListener('change', (next: AppStateStatus) => {
    if (next === 'active') refresh();
  });

  return () => {
    disposed = true;
    if (pollTimer !== null) clearInterval(pollTimer);
    pollTimer = null;
    appState.remove();
    if (activeChannel === channel) activeChannel = null;
    void client.removeChannel(channel);
  };
}

/** 本機寫入成功後通知其他裝置立刻重新讀取（Realtime 服務不可用時自動失效）。 */
export function notifyContentChanged(): void {
  const channel = activeChannel;
  if (channel === null) return;

  void Promise.resolve(
    channel.send({ type: 'broadcast', event: BROADCAST_EVENT, payload: {} }),
  ).catch(() => undefined);
}
