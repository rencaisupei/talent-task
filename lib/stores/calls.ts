import { create } from 'zustand';

import { SEED_CALLS } from '@/lib/data/seed';
import { useChatStore } from '@/lib/stores/chat';
import type { CallDirection, CallKind, CallRecord, CallResult, CallStatus } from '@/lib/types';

export interface ActiveCall {
  id: string;
  userId: string;
  kind: CallKind;
  direction: CallDirection;
  status: CallStatus;
  startedAt: number | null;
  muted: boolean;
  speaker: boolean;
  cameraOn: boolean;
  frontCamera: boolean;
}

interface CallsState {
  history: CallRecord[];
  active: ActiveCall | null;
  lastEnded: { result: CallResult; durationSec: number; userId: string } | null;
  startOutgoing: (userId: string, kind: CallKind) => void;
  simulateIncoming: (userId: string, kind: CallKind) => void;
  acceptIncoming: () => void;
  declineIncoming: () => void;
  hangUp: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleCamera: () => void;
  flipCamera: () => void;
  switchToVideo: () => void;
  dismiss: () => void;
  clearHistory: () => void;
}

let callSeq = 100;
let generation = 0;

function nextCallId() {
  callSeq += 1;
  return `call${callSeq}`;
}

function logToChat(
  userId: string,
  kind: CallKind,
  durationSec: number,
  missed: boolean,
  fromMe: boolean,
) {
  const chat = useChatStore.getState();
  const conversation = chat.conversationForUser(userId);
  if (!conversation) return;
  chat.logCall(conversation.id, { kind, durationSec, missed, fromMe });
}

export const useCallsStore = create<CallsState>((set, get) => ({
  history: SEED_CALLS,
  active: null,
  lastEnded: null,

  startOutgoing: (userId, kind) => {
    generation += 1;
    const current = generation;
    set({
      lastEnded: null,
      active: {
        id: nextCallId(),
        userId,
        kind,
        direction: 'outgoing',
        status: 'dialing',
        startedAt: null,
        muted: false,
        speaker: false,
        cameraOn: kind === 'video',
        frontCamera: true,
      },
    });

    setTimeout(() => {
      if (generation !== current) return;
      const active = get().active;
      if (!active || active.status !== 'dialing') return;
      set({ active: { ...active, status: 'ringing' } });
    }, 1200);

    setTimeout(() => {
      if (generation !== current) return;
      const active = get().active;
      if (!active || active.status !== 'ringing') return;
      set({ active: { ...active, status: 'connecting' } });
    }, 3800);

    setTimeout(() => {
      if (generation !== current) return;
      const active = get().active;
      if (!active || active.status !== 'connecting') return;
      set({ active: { ...active, status: 'active', startedAt: Date.now() } });
    }, 4900);
  },

  simulateIncoming: (userId, kind) => {
    generation += 1;
    set({
      lastEnded: null,
      active: {
        id: nextCallId(),
        userId,
        kind,
        direction: 'incoming',
        status: 'ringing',
        startedAt: null,
        muted: false,
        speaker: false,
        cameraOn: kind === 'video',
        frontCamera: true,
      },
    });
  },

  acceptIncoming: () => {
    generation += 1;
    const current = generation;
    const active = get().active;
    if (!active) return;
    set({ active: { ...active, status: 'connecting' } });
    setTimeout(() => {
      if (generation !== current) return;
      const next = get().active;
      if (!next || next.status !== 'connecting') return;
      set({ active: { ...next, status: 'active', startedAt: Date.now() } });
    }, 1100);
  },

  declineIncoming: () => {
    const active = get().active;
    if (!active) return;
    generation += 1;
    const record: CallRecord = {
      id: active.id,
      userId: active.userId,
      kind: active.kind,
      direction: active.direction,
      result: 'declined',
      durationSec: 0,
      createdAt: Date.now(),
    };
    logToChat(active.userId, active.kind, 0, true, false);
    set((state) => ({
      history: [record, ...state.history],
      active: { ...active, status: 'ended' },
      lastEnded: { result: 'declined', durationSec: 0, userId: active.userId },
    }));
  },

  hangUp: () => {
    const active = get().active;
    if (!active) return;
    generation += 1;

    const durationSec = active.startedAt ? Math.round((Date.now() - active.startedAt) / 1000) : 0;
    const result: CallResult =
      active.status === 'active'
        ? 'completed'
        : active.direction === 'outgoing'
          ? 'canceled'
          : 'missed';

    const record: CallRecord = {
      id: active.id,
      userId: active.userId,
      kind: active.kind,
      direction: active.direction,
      result,
      durationSec,
      createdAt: Date.now(),
    };

    logToChat(
      active.userId,
      active.kind,
      durationSec,
      result !== 'completed',
      active.direction === 'outgoing',
    );

    set((state) => ({
      history: [record, ...state.history],
      active: { ...active, status: 'ended' },
      lastEnded: { result, durationSec, userId: active.userId },
    }));
  },

  toggleMute: () => {
    const active = get().active;
    if (!active) return;
    set({ active: { ...active, muted: !active.muted } });
  },

  toggleSpeaker: () => {
    const active = get().active;
    if (!active) return;
    set({ active: { ...active, speaker: !active.speaker } });
  },

  toggleCamera: () => {
    const active = get().active;
    if (!active) return;
    set({ active: { ...active, cameraOn: !active.cameraOn } });
  },

  flipCamera: () => {
    const active = get().active;
    if (!active) return;
    set({ active: { ...active, frontCamera: !active.frontCamera } });
  },

  switchToVideo: () => {
    const active = get().active;
    if (!active) return;
    set({ active: { ...active, kind: 'video', cameraOn: true } });
  },

  dismiss: () => set({ active: null }),

  clearHistory: () => set({ history: [] }),
}));

export const CALL_RESULT_LABEL: Record<CallResult, string> = {
  completed: '已接通',
  missed: '未接',
  declined: '已拒接',
  canceled: '已取消',
};

export const CALL_STATUS_LABEL: Record<CallStatus, string> = {
  idle: '',
  dialing: '正在撥號…',
  ringing: '響鈴中…',
  connecting: '連線中…',
  active: '通話中',
  ended: '通話結束',
};
