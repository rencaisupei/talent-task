import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useNotificationStore } from '@/lib/stores/notifications';
import type { CallOutcome, CallRecord, Conversation } from '@/lib/types';

export interface StartCallInput {
  conversation: Conversation;
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
}

interface CallState {
  calls: CallRecord[];
  startCall: (input: StartCallInput) => CallRecord;
  markConnected: (callId: string) => void;
  endCall: (callId: string, outcome: CallOutcome) => CallRecord | undefined;
}

export function callsForConversation(calls: CallRecord[], conversationId: string): CallRecord[] {
  return calls.filter((call) => call.conversationId === conversationId);
}

export function formatCallDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  if (minutes === 0) return `${rest} 秒`;
  return `${minutes} 分 ${String(rest).padStart(2, '0')} 秒`;
}

export const useCallStore = create<CallState>()(
  persist(
    (set, get) => ({
      calls: [],

      startCall: ({ conversation, callerId, callerName, calleeId, calleeName }) => {
        const call: CallRecord = {
          id: `call_${Date.now()}`,
          conversationId: conversation.id,
          gigId: conversation.gigId,
          gigTitle: conversation.gigTitle,
          callerId,
          callerName,
          calleeId,
          calleeName,
          startedAt: Date.now(),
          durationSeconds: 0,
          outcome: 'cancelled',
        };
        set((state) => ({ calls: [call, ...state.calls] }));
        return call;
      },

      markConnected: (callId) =>
        set((state) => ({
          calls: state.calls.map((call) =>
            call.id === callId && call.connectedAt === undefined
              ? { ...call, connectedAt: Date.now() }
              : call,
          ),
        })),

      endCall: (callId, outcome) => {
        const call = get().calls.find((item) => item.id === callId);
        if (!call || call.endedAt !== undefined) return call;

        const endedAt = Date.now();
        const durationSeconds =
          call.connectedAt === undefined ? 0 : Math.round((endedAt - call.connectedAt) / 1000);
        const finished: CallRecord = { ...call, endedAt, durationSeconds, outcome };

        set((state) => ({
          calls: state.calls.map((item) => (item.id === callId ? finished : item)),
        }));

        useNotificationStore.getState().pushNotification({
          kind: 'call',
          title: outcome === 'completed' ? '語音通話結束' : '語音通話未接通',
          body:
            outcome === 'completed'
              ? `與 ${finished.calleeName} 通話 ${formatCallDuration(durationSeconds)}（${finished.gigTitle}）`
              : `撥給 ${finished.calleeName} 的語音通話未接通，可稍後再試或改用文字訊息。`,
          conversationId: finished.conversationId,
          gigId: finished.gigId,
        });

        return finished;
      },
    }),
    {
      name: 'instantgig-calls',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
