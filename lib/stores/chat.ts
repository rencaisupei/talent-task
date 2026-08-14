import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { moderateText } from '@/lib/moderation';
import { useAdminStore } from '@/lib/stores/admin';
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
