import { getBiltClient } from '@/lib/bilt';
import type { ConversationRow, MessageRow } from '@/lib/remote/rows';
import { REMOTE_UNCONFIGURED_MESSAGE, remoteError, type RemoteResult } from '@/lib/remote/shared';
import type { ChatMessage, Conversation } from '@/lib/types';

const CONVERSATION_FETCH_LIMIT = 200;
/** 與伺服器維護保留的訊息數一致（prune_chat_messages）。 */
const MESSAGE_FETCH_LIMIT = 200;

export const CHAT_OFFLINE_MESSAGE = '無法連線到雲端對話，請確認網路後重新整理。';
export const CHAT_SEND_FAILED_MESSAGE = '訊息傳送失敗，請稍後再試。';
export const CHAT_DEMO_MESSAGE =
  '這是平台的示範內容，沒有對應的真實帳號，因此無法開啟對話。請對真實發布的任務投遞提案或聯繫對方。';
export const CHAT_START_FAILED_MESSAGE =
  '無法開啟對話。任務可能已下架、尚未通過認證，或你不是這筆任務的相關人。';

export function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    gigId: row.gig_id,
    gigTitle: row.gig_title,
    tag: row.tag,
    clientId: row.client_id,
    clientName: row.client_name,
    talentId: row.talent_id,
    talentName: row.talent_name,
    createdAt: Date.parse(row.created_at),
    lastMessageAt: Date.parse(row.last_message_at),
    lastMessageText: row.last_message_text,
    lastMessageSenderId: row.last_message_sender_id,
    clientLastReadAt: Date.parse(row.client_last_read_at),
    talentLastReadAt: Date.parse(row.talent_last_read_at),
    messageCount: row.message_count,
    flaggedCount: row.flagged_count,
    reportState: row.report_state,
    reportReason: row.report_reason ?? undefined,
    reporterName: row.reporter_name ?? undefined,
    reportedAt: row.reported_at === null ? undefined : Date.parse(row.reported_at),
    resolutionNote: row.resolution_note ?? undefined,
    resolvedBy: row.resolved_by ?? undefined,
    resolvedAt: row.resolved_at === null ? undefined : Date.parse(row.resolved_at),
  };
}

export function rowToMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    text: row.text,
    at: Date.parse(row.at),
    moderation: row.moderation,
    flaggedTerms: row.flagged_terms,
  };
}

export interface RemoteChatInbox {
  conversations: Conversation[];
  /** 依對話 id 的未讀數（對方送出且晚於我的已讀時間）。 */
  unread: Record<string, number>;
}

/**
 * 讀取我的對話清單。
 *
 * RLS 只會回傳我是客戶或人才的那些對話，因此不需要（也不應該）在查詢加上身分條件。
 */
export async function fetchRemoteChatInbox(): Promise<RemoteResult<RemoteChatInbox>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const [list, counts] = await Promise.all([
    client
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(CONVERSATION_FETCH_LIMIT),
    client.rpc('chat_unread_counts'),
  ]);

  if (list.error !== null || list.data === null) return remoteError(CHAT_OFFLINE_MESSAGE);

  const unread: Record<string, number> = {};
  if (counts.error === null && counts.data !== null) {
    for (const row of counts.data) unread[row.conversation_id] = row.unread;
  }

  return {
    status: 'ok',
    data: { conversations: list.data.map(rowToConversation), unread },
  };
}

/** 讀取一則對話最近的訊息（時間由舊到新）。 */
export async function fetchRemoteMessages(
  conversationId: string,
): Promise<RemoteResult<ChatMessage[]>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { data, error } = await client
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('at', { ascending: false })
    .limit(MESSAGE_FETCH_LIMIT);

  if (error !== null || data === null) return remoteError(CHAT_OFFLINE_MESSAGE);

  // 查詢取的是「最新 200 條」（時間由新到舊），畫面需要由舊到新，
  // 因此反向走訪；不用 toReversed()，Hermes 沒有這個方法。
  const ordered: ChatMessage[] = [];
  for (let index = data.length - 1; index >= 0; index -= 1) {
    ordered.push(rowToMessage(data[index]));
  }

  return { status: 'ok', data: ordered };
}

/**
 * 開啟（或取回）對話。
 *
 * 由 start_conversation 函式驗證呼叫者是發案者或該人才本人並帶出雙方資料，
 * 因此裝置端無法替別人開對話，也無法對示範任務開對話。
 */
export async function startRemoteConversation(
  gigId: string,
  talentId: string,
): Promise<RemoteResult<string>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { data, error } = await client.rpc('start_conversation', { gid: gigId, tid: talentId });
  if (error !== null) return remoteError(CHAT_OFFLINE_MESSAGE);
  if (typeof data !== 'string' || data.length === 0) return remoteError(CHAT_START_FAILED_MESSAGE);

  return { status: 'ok', data };
}

/** 傳送訊息。審核判定與送出者身分都由伺服器決定。 */
export async function sendRemoteMessage(
  conversationId: string,
  text: string,
): Promise<RemoteResult<ChatMessage>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { data, error } = await client.rpc('send_message', { cid: conversationId, body: text });
  if (error !== null) return remoteError(CHAT_SEND_FAILED_MESSAGE);

  const row = data?.[0];
  if (row === undefined) return remoteError(CHAT_SEND_FAILED_MESSAGE);

  return { status: 'ok', data: rowToMessage(row) };
}

/** 把我這一側的已讀時間推到現在。 */
export async function markRemoteConversationRead(conversationId: string): Promise<boolean> {
  const client = getBiltClient();
  if (client === null) return false;

  const { data, error } = await client.rpc('mark_conversation_read', { cid: conversationId });
  return error === null && data;
}

export async function reportRemoteConversation(
  conversationId: string,
  reason: string,
): Promise<RemoteResult<true>> {
  const client = getBiltClient();
  if (client === null) return remoteError(REMOTE_UNCONFIGURED_MESSAGE);

  const { data, error } = await client.rpc('report_conversation', {
    cid: conversationId,
    reason,
  });
  if (error !== null || !data) return remoteError('檢舉送出失敗，請稍後再試。');

  return { status: 'ok', data: true };
}
