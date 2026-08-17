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

/* ------------------------------------------------------------------ */
/* 對話與訊息                                                          */
/* ------------------------------------------------------------------ */

const CHAT_CHANNEL_NAME = 'instantgig-chat';
const CHAT_EVENT = 'chat-changed';
/** 對話清單的保底輪詢。 */
const CHAT_INBOX_POLL_MS = 20_000;
/** 開著的那則對話輪詢得更密，讀起來才像即時通訊。 */
const CHAT_THREAD_POLL_MS = 6_000;

export interface ChatChangedPayload {
  conversationId: string;
  clientId: string;
  talentId: string;
}

export interface ChatSyncHandlers {
  /** 我的 auth.users.id：用來判斷廣播是不是我參與的對話。 */
  userId: string;
  onInboxRefresh: () => void;
  onThreadRefresh: (conversationId: string) => void;
}

let chatChannel: RealtimeChannel | null = null;
let activeConversationId: string | null = null;

/** 目前打開的對話（進入聊天畫面時登記，離開時清掉）。 */
export function setActiveConversation(conversationId: string | null): void {
  activeConversationId = conversationId;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readChatPayload(value: unknown): ChatChangedPayload | null {
  if (!isRecord(value)) return null;
  const record = value;
  const conversationId = record.conversationId;
  const clientId = record.clientId;
  const talentId = record.talentId;
  if (
    typeof conversationId !== 'string' ||
    typeof clientId !== 'string' ||
    typeof talentId !== 'string'
  ) {
    return null;
  }
  return { conversationId, clientId, talentId };
}

/**
 * 對話的即時同步。
 *
 * broadcast 不需要邏輯複製，所以這裡才是真的「立刻收到」：
 * 送出訊息的裝置廣播一則事件，其他裝置收到後**回資料庫重讀**
 * （廣播內容可被偽造，絕不能直接當成訊息顯示；重讀會經過 RLS 檢查）。
 * postgres_changes 訂閱一併保留，等資料庫改成 wal_level = logical 就自動生效。
 */
export function startChatLiveSync({
  userId,
  onInboxRefresh,
  onThreadRefresh,
}: ChatSyncHandlers): () => void {
  const client = getBiltClient();
  if (client === null || userId.length === 0) return () => undefined;

  let disposed = false;

  const refreshInbox = () => {
    if (!disposed) onInboxRefresh();
  };
  const refreshThread = () => {
    const conversationId = activeConversationId;
    if (!disposed && conversationId !== null) onThreadRefresh(conversationId);
  };
  const refreshAll = () => {
    refreshInbox();
    refreshThread();
  };

  refreshAll();

  const channel = client
    .channel(CHAT_CHANNEL_NAME)
    .on('broadcast', { event: CHAT_EVENT }, (message: { payload?: unknown }) => {
      const payload = readChatPayload(message.payload);
      if (payload === null) {
        refreshAll();
        return;
      }
      // 與我無關的對話不重讀，避免每個人的裝置都被別人的訊息喚醒。
      if (payload.clientId !== userId && payload.talentId !== userId) return;
      refreshInbox();
      if (payload.conversationId === activeConversationId) refreshThread();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, refreshAll)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, refreshInbox)
    .subscribe();

  chatChannel = channel;

  const inboxTimer = setInterval(() => {
    if (AppState.currentState === 'active') refreshInbox();
  }, CHAT_INBOX_POLL_MS);
  const threadTimer = setInterval(() => {
    if (AppState.currentState === 'active') refreshThread();
  }, CHAT_THREAD_POLL_MS);

  const appState = AppState.addEventListener('change', (next: AppStateStatus) => {
    if (next === 'active') refreshAll();
  });

  return () => {
    disposed = true;
    clearInterval(inboxTimer);
    clearInterval(threadTimer);
    appState.remove();
    if (chatChannel === channel) chatChannel = null;
    void client.removeChannel(channel);
  };
}

/** 送出訊息或開啟對話後，通知對方的裝置立刻重讀。 */
export function notifyChatChanged(payload: ChatChangedPayload): void {
  const channel = chatChannel;
  if (channel === null) return;

  void Promise.resolve(channel.send({ type: 'broadcast', event: CHAT_EVENT, payload })).catch(
    () => undefined,
  );
}
