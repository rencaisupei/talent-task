import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { moderateText } from '@/lib/moderation';
import { useAdminStore } from '@/lib/stores/admin';
import { useNotificationStore } from '@/lib/stores/notifications';
import type { ChatMessage, Conversation, Gig } from '@/lib/types';

export interface StartConversationInput {
  gig: Gig;
  talentId: string;
  talentName: string;
  openingMessage?: string;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  startConversation: (input: StartConversationInput) => string;
  sendMessage: (
    conversationId: string,
    sender: { id: string; name: string },
    text: string,
  ) => ChatMessage | null;
  reportConversation: (conversationId: string, reason: string, reporterName: string) => void;
  findConversationForGig: (gigId: string, talentId: string) => Conversation | undefined;
  /** 每日維護：每則對話只保留最近 N 條訊息，並清掉沒有對應對話的訊息，回傳清掉的訊息數。 */
  pruneMessages: (keepPerConversation: number) => number;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},

      findConversationForGig: (gigId, talentId) =>
        get().conversations.find(
          (conversation) => conversation.gigId === gigId && conversation.talentId === talentId,
        ),

      startConversation: ({ gig, talentId, talentName, openingMessage }) => {
        const existing = get().findConversationForGig(gig.id, talentId);
        if (existing) return existing.id;

        const id = `conv_${Date.now()}`;
        const now = Date.now();
        const conversation: Conversation = {
          id,
          gigId: gig.id,
          gigTitle: gig.title,
          tag: gig.tag,
          clientId: gig.clientId,
          clientName: gig.clientName,
          talentId,
          talentName,
          createdAt: now,
          lastMessageAt: now,
          isReported: false,
        };

        set((state) => ({
          conversations: [conversation, ...state.conversations],
          messages: { ...state.messages, [id]: [] },
        }));

        if (openingMessage && openingMessage.trim().length > 0) {
          get().sendMessage(id, { id: talentId, name: talentName }, openingMessage.trim());
        }

        return id;
      },

      sendMessage: (conversationId, sender, text) => {
        const trimmed = text.trim();
        if (trimmed.length === 0) return null;

        const moderated = moderateText(trimmed);
        const message: ChatMessage = {
          id: `msg_${Date.now()}_${Math.round(Math.random() * 1000)}`,
          conversationId,
          senderId: sender.id,
          senderName: sender.name,
          text: trimmed,
          at: Date.now(),
          moderation: moderated.moderation,
          flaggedTerms: moderated.flaggedTerms,
        };

        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [...(state.messages[conversationId] ?? []), message],
          },
          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, lastMessageAt: message.at }
              : conversation,
          ),
        }));

        return message;
      },

      reportConversation: (conversationId, reason, reporterName) => {
        const conversation = get().conversations.find((item) => item.id === conversationId);
        if (!conversation) return;

        set((state) => ({
          conversations: state.conversations.map((item) =>
            item.id === conversationId ? { ...item, isReported: true } : item,
          ),
        }));

        useAdminStore.getState().addReport({
          id: `report_${Date.now()}`,
          conversationId,
          reportedUserId: conversation.clientId,
          reportedUserName: conversation.clientName,
          reporterName,
          reason,
          createdAt: Date.now(),
          transcript: get().messages[conversationId] ?? [],
          resolved: false,
        });

        useNotificationStore.getState().pushNotification({
          kind: 'system',
          title: '檢舉已受理',
          body: `已將與 ${conversation.clientName} 的對話送交安全審核，處理結果會在此通知。`,
          conversationId,
        });
      },

      pruneMessages: (keepPerConversation) => {
        const { conversations, messages } = get();
        const liveIds = new Set(conversations.map((conversation) => conversation.id));
        const next: Record<string, ChatMessage[]> = {};
        let removed = 0;

        for (const [conversationId, list] of Object.entries(messages)) {
          if (!liveIds.has(conversationId)) {
            removed += list.length;
            continue;
          }
          if (list.length <= keepPerConversation) {
            next[conversationId] = list;
            continue;
          }
          removed += list.length - keepPerConversation;
          next[conversationId] = list.slice(list.length - keepPerConversation);
        }

        if (removed > 0) set({ messages: next });
        return removed;
      },
    }),
    {
      name: 'instantgig-chat',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        messages: state.messages,
      }),
      version: 1,
    },
  ),
);
