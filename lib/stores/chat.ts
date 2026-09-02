import { create } from 'zustand';

import { REPLY_POOL, SEED_CONVERSATIONS, SEED_MESSAGES } from '@/lib/data/seed';
import type { CallKind, Conversation, Message } from '@/lib/types';

let messageSeq = 1000;
let conversationSeq = 100;

function nextId(prefix: string) {
  messageSeq += 1;
  return `${prefix}${messageSeq}`;
}

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  drafts: Record<string, string>;
  ensureConversation: (userId: string) => string;
  conversationForUser: (userId: string) => Conversation | undefined;
  setDraft: (conversationId: string, value: string) => void;
  sendText: (conversationId: string, text: string) => void;
  sendImage: (conversationId: string, imageUri: string) => void;
  sendVoice: (conversationId: string, durationSec: number) => void;
  sendGift: (conversationId: string, giftId: string) => void;
  logCall: (
    conversationId: string,
    payload: { kind: CallKind; durationSec: number; missed: boolean; fromMe: boolean },
  ) => void;
  markRead: (conversationId: string) => void;
  togglePin: (conversationId: string) => void;
  toggleMute: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
}

function touch(
  conversations: Conversation[],
  conversationId: string,
  patch: Partial<Conversation>,
) {
  return conversations.map((conversation) =>
    conversation.id === conversationId
      ? { ...conversation, lastMessageAt: Date.now(), ...patch }
      : conversation,
  );
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: SEED_CONVERSATIONS,
  messages: SEED_MESSAGES,
  drafts: {},

  ensureConversation: (userId) => {
    const existing = get().conversations.find((conversation) => conversation.userId === userId);
    if (existing) return existing.id;

    conversationSeq += 1;
    const id = `c${conversationSeq}`;
    const now = Date.now();
    set((state) => ({
      conversations: [
        {
          id,
          userId,
          matchedAt: now,
          lastMessageAt: now,
          pinned: false,
          muted: false,
          unread: 0,
          typing: false,
        },
        ...state.conversations,
      ],
      messages: [
        ...state.messages,
        {
          id: nextId('m'),
          conversationId: id,
          senderId: userId,
          kind: 'system',
          text: '你們互相喜歡了，打個招呼吧',
          createdAt: now,
          read: true,
        },
      ],
    }));
    return id;
  },

  conversationForUser: (userId) =>
    get().conversations.find((conversation) => conversation.userId === userId),

  setDraft: (conversationId, value) =>
    set((state) => ({ drafts: { ...state.drafts, [conversationId]: value } })),

  sendText: (conversationId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    pushOutgoing(set, conversationId, { kind: 'text', text: trimmed });
    scheduleReply(set, get, conversationId);
  },

  sendImage: (conversationId, imageUri) => {
    pushOutgoing(set, conversationId, { kind: 'image', imageUri });
    scheduleReply(set, get, conversationId);
  },

  sendVoice: (conversationId, durationSec) => {
    pushOutgoing(set, conversationId, { kind: 'voice', durationSec });
    scheduleReply(set, get, conversationId);
  },

  sendGift: (conversationId, giftId) => {
    pushOutgoing(set, conversationId, { kind: 'gift', giftId });
    scheduleReply(set, get, conversationId);
  },

  logCall: (conversationId, payload) => {
    const conversation = get().conversations.find((item) => item.id === conversationId);
    if (!conversation) return;
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: nextId('m'),
          conversationId,
          senderId: payload.fromMe ? 'me' : conversation.userId,
          kind: 'call',
          callKind: payload.kind,
          callDurationSec: payload.durationSec,
          callMissed: payload.missed,
          createdAt: Date.now(),
          read: true,
        },
      ],
      conversations: touch(state.conversations, conversationId, {}),
    }));
  },

  markRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation,
      ),
      messages: state.messages.map((message) =>
        message.conversationId === conversationId ? { ...message, read: true } : message,
      ),
    })),

  togglePin: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, pinned: !conversation.pinned }
          : conversation,
      ),
    })),

  toggleMute: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, muted: !conversation.muted }
          : conversation,
      ),
    })),

  deleteConversation: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.filter(
        (conversation) => conversation.id !== conversationId,
      ),
      messages: state.messages.filter((message) => message.conversationId !== conversationId),
    })),
}));

type SetState = (
  partial: ChatState | Partial<ChatState> | ((state: ChatState) => ChatState | Partial<ChatState>),
) => void;

function pushOutgoing(
  set: SetState,
  conversationId: string,
  payload: Pick<Message, 'kind' | 'text' | 'imageUri' | 'durationSec' | 'giftId'>,
) {
  set((state) => ({
    messages: [
      ...state.messages,
      {
        id: nextId('m'),
        conversationId,
        senderId: 'me',
        createdAt: Date.now(),
        read: false,
        ...payload,
      },
    ],
    conversations: touch(state.conversations, conversationId, {}),
  }));
}

function scheduleReply(set: SetState, get: () => ChatState, conversationId: string) {
  const conversation = get().conversations.find((item) => item.id === conversationId);
  if (!conversation) return;

  setTimeout(() => {
    if (!get().conversations.some((item) => item.id === conversationId)) return;
    set((state) => ({
      conversations: state.conversations.map((item) =>
        item.id === conversationId ? { ...item, typing: true } : item,
      ),
    }));
  }, 900);

  setTimeout(() => {
    if (!get().conversations.some((item) => item.id === conversationId)) return;
    const reply = REPLY_POOL[Math.floor(Math.random() * REPLY_POOL.length)] ?? '好啊';
    set((state) => ({
      conversations: state.conversations.map((item) =>
        item.id === conversationId ? { ...item, typing: false, lastMessageAt: Date.now() } : item,
      ),
      messages: [
        ...state.messages,
        {
          id: nextId('m'),
          conversationId,
          senderId: conversation.userId,
          kind: 'text',
          text: reply,
          createdAt: Date.now(),
          read: true,
        },
      ],
    }));
  }, 2800);
}

export function useConversationMessages(conversationId: string) {
  const messages = useChatStore((state) => state.messages);
  return messages
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function useSortedConversations() {
  const conversations = useChatStore((state) => state.conversations);
  return [...conversations].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.lastMessageAt - a.lastMessageAt;
  });
}

export function useTotalUnread() {
  const conversations = useChatStore((state) => state.conversations);
  return conversations.reduce((total, conversation) => total + conversation.unread, 0);
}

export function lastMessageOf(messages: Message[], conversationId: string) {
  let latest: Message | undefined;
  for (const message of messages) {
    if (message.conversationId !== conversationId) continue;
    if (!latest || message.createdAt > latest.createdAt) latest = message;
  }
  return latest;
}
