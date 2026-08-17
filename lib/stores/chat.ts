import { create } from 'zustand';

import {
  fetchRemoteChatInbox,
  fetchRemoteMessages,
  markRemoteConversationRead,
  reportRemoteConversation,
  sendRemoteMessage,
  startRemoteConversation,
} from '@/lib/remote/chat';
import { notifyChatChanged, setActiveConversation } from '@/lib/remote/live';
import type { CloudLoadState } from '@/lib/stores/gigs';
import { useNotificationStore } from '@/lib/stores/notifications';
import { useSessionStore } from '@/lib/stores/session';
import { conversationCounterpart, type ChatMessage, type Conversation } from '@/lib/types';

export type ChatResult<T> = { status: 'ok'; data: T } | { status: 'error'; message: string };

export interface OpenConversationInput {
  gigId: string;
  /** 人才的 auth.users.id（客戶找人才、人才回覆客戶都用同一個入口）。 */
  talentId: string;
  openingMessage?: string;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  /** 依對話 id 的未讀數（伺服器依雙方已讀時間計算）。 */
  unread: Record<string, number>;
  loadState: CloudLoadState;
  isRefreshing: boolean;
  errorMessage: string | null;
  threadState: Record<string, CloudLoadState>;
  /** 目前打開的對話：開著的時候不對它發本機通知。 */
  openConversationId: string | null;
  /** 已通知過的最後訊息時間，避免同一則新訊息重複通知。 */
  notifiedAt: Record<string, number>;

  refreshConversations: () => Promise<void>;
  refreshMessages: (conversationId: string) => Promise<void>;
  /** 開啟（或取回）對話；同一組任務與人才只會有一則對話。 */
  openConversation: (input: OpenConversationInput) => Promise<ChatResult<string>>;
  sendMessage: (conversationId: string, text: string) => Promise<ChatResult<ChatMessage>>;
  markRead: (conversationId: string) => Promise<void>;
  setOpenConversation: (conversationId: string | null) => void;
  reportConversation: (conversationId: string, reason: string) => Promise<ChatResult<true>>;
  /** 換帳號或登出時清空這台裝置上的快取。 */
  reset: () => void;
}

/** 我在這則對話的未讀數。 */
export function unreadFor(unread: Record<string, number>, conversationId: string): number {
  return unread[conversationId] ?? 0;
}

/**
 * 對話與訊息存在 bilt-cloud（conversations / messages 資料表），
 * 這個 store 只是雲端資料的快取：讀取由 components/CloudSync 觸發，
 * 寫入一律先送到伺服器函式，成功後才更新本機陣列。
 */
export const useChatStore = create<ChatState>()((set, get) => ({
  conversations: [],
  messages: {},
  unread: {},
  loadState: 'idle',
  isRefreshing: false,
  errorMessage: null,
  threadState: {},
  openConversationId: null,
  notifiedAt: {},

  refreshConversations: async () => {
    const before = get();
    set((state) => ({
      isRefreshing: true,
      loadState: state.loadState === 'ready' ? 'ready' : 'loading',
    }));

    const result = await fetchRemoteChatInbox();
    if (result.status === 'error') {
      set((state) => ({
        isRefreshing: false,
        loadState: state.conversations.length > 0 ? 'ready' : 'error',
        errorMessage: result.message,
      }));
      return;
    }

    const myUserId = useSessionStore.getState().authUserId;
    const notifiedAt = { ...before.notifiedAt };
    const isFirstLoad = before.loadState !== 'ready';

    for (const conversation of result.data.conversations) {
      const unread = result.data.unread[conversation.id] ?? 0;
      const alreadyNotified = notifiedAt[conversation.id] ?? 0;
      if (unread === 0 || conversation.lastMessageAt <= alreadyNotified) continue;

      notifiedAt[conversation.id] = conversation.lastMessageAt;

      // 第一次載入只記錄基準時間，不把既有未讀補成一堆通知。
      if (isFirstLoad) continue;
      if (conversation.lastMessageSenderId === myUserId) continue;
      if (conversation.id === before.openConversationId) continue;

      const peer = conversationCounterpart(conversation, myUserId);
      useNotificationStore.getState().pushNotification({
        kind: 'chat',
        title: `${peer.name} 傳來新訊息`,
        body:
          conversation.lastMessageText.length > 0
            ? conversation.lastMessageText
            : `關於「${conversation.gigTitle}」的新訊息。`,
        conversationId: conversation.id,
        gigId: conversation.gigId,
      });
    }

    set({
      conversations: result.data.conversations,
      unread: result.data.unread,
      notifiedAt,
      loadState: 'ready',
      isRefreshing: false,
      errorMessage: null,
    });
  },

  refreshMessages: async (conversationId) => {
    if (conversationId.length === 0) return;

    set((state) => ({
      threadState: {
        ...state.threadState,
        [conversationId]: state.threadState[conversationId] === 'ready' ? 'ready' : 'loading',
      },
    }));

    const result = await fetchRemoteMessages(conversationId);
    if (result.status === 'error') {
      set((state) => ({
        threadState: {
          ...state.threadState,
          [conversationId]:
            (state.messages[conversationId]?.length ?? 0) > 0 ? 'ready' : ('error' as const),
        },
        errorMessage: result.message,
      }));
      return;
    }

    set((state) => ({
      messages: { ...state.messages, [conversationId]: result.data },
      threadState: { ...state.threadState, [conversationId]: 'ready' },
      errorMessage: null,
    }));
  },

  openConversation: async ({ gigId, talentId, openingMessage }) => {
    const started = await startRemoteConversation(gigId, talentId);
    if (started.status === 'error') {
      set({ errorMessage: started.message });
      return started;
    }

    const conversationId = started.data;
    await get().refreshConversations();

    if (openingMessage !== undefined && openingMessage.trim().length > 0) {
      await get().sendMessage(conversationId, openingMessage);
    } else {
      const conversation = get().conversations.find((item) => item.id === conversationId);
      if (conversation) {
        notifyChatChanged({
          conversationId,
          clientId: conversation.clientId,
          talentId: conversation.talentId,
        });
      }
    }

    return { status: 'ok', data: conversationId };
  },

  sendMessage: async (conversationId, text) => {
    if (text.trim().length === 0) {
      return { status: 'error', message: '請先輸入訊息內容。' };
    }

    const result = await sendRemoteMessage(conversationId, text);
    if (result.status === 'error') {
      set({ errorMessage: result.message });
      return result;
    }

    const message = result.data;
    set((state) => {
      const thread = state.messages[conversationId] ?? [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...thread.filter((item) => item.id !== message.id), message],
        },
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                lastMessageAt: message.at,
                lastMessageText: message.text,
                lastMessageSenderId: message.senderId,
                messageCount: conversation.messageCount + 1,
                flaggedCount:
                  conversation.flaggedCount + (message.moderation === 'flagged' ? 1 : 0),
              }
            : conversation,
        ),
        errorMessage: null,
      };
    });

    const conversation = get().conversations.find((item) => item.id === conversationId);
    if (conversation) {
      notifyChatChanged({
        conversationId,
        clientId: conversation.clientId,
        talentId: conversation.talentId,
      });
    }

    return { status: 'ok', data: message };
  },

  markRead: async (conversationId) => {
    if ((get().unread[conversationId] ?? 0) === 0) return;

    const ok = await markRemoteConversationRead(conversationId);
    if (!ok) return;

    const myUserId = useSessionStore.getState().authUserId;
    const now = Date.now();
    set((state) => ({
      unread: { ...state.unread, [conversationId]: 0 },
      conversations: state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              clientLastReadAt:
                conversation.clientId === myUserId ? now : conversation.clientLastReadAt,
              talentLastReadAt:
                conversation.talentId === myUserId ? now : conversation.talentLastReadAt,
            }
          : conversation,
      ),
    }));
  },

  setOpenConversation: (conversationId) => {
    // 讓即時同步知道要不要多讀這一則對話的訊息。
    setActiveConversation(conversationId);
    set({ openConversationId: conversationId });
  },

  reportConversation: async (conversationId, reason) => {
    const result = await reportRemoteConversation(conversationId, reason);
    if (result.status === 'error') {
      set({ errorMessage: result.message });
      return result;
    }

    const conversation = get().conversations.find((item) => item.id === conversationId);
    set((state) => ({
      conversations: state.conversations.map((item) =>
        item.id === conversationId
          ? { ...item, reportState: 'open', reportReason: reason, reportedAt: Date.now() }
          : item,
      ),
    }));

    const myUserId = useSessionStore.getState().authUserId;
    const peerName =
      conversation === undefined ? '對方' : conversationCounterpart(conversation, myUserId).name;

    useNotificationStore.getState().pushNotification({
      kind: 'moderation',
      title: '檢舉已受理',
      body: `已將與 ${peerName} 的對話送交安全審核，處理結果會在此通知。`,
      conversationId,
    });

    return { status: 'ok', data: true };
  },

  reset: () => {
    setActiveConversation(null);
    set({
      conversations: [],
      messages: {},
      unread: {},
      loadState: 'idle',
      isRefreshing: false,
      errorMessage: null,
      threadState: {},
      openConversationId: null,
      notifiedAt: {},
    });
  },
}));

/** 全部對話的未讀總數（分頁紅點用）。 */
export function useTotalUnread(): number {
  return useChatStore((state) =>
    Object.values(state.unread).reduce((total, count) => total + count, 0),
  );
}
