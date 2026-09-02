import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { AFFINITY_UNLOCK, BOARD_ROLLS, STAMINA_MAX, titleForScore } from '@/lib/data/games';
import { useAdminStore } from '@/lib/stores/admin';

interface GameState {
  /** 目前體力（上限 STAMINA_MAX），時間到自動回復。 */
  stamina: number;
  /** 上次結算體力回復的時間戳。 */
  regenAt: number;
  /** 排行榜積分。 */
  score: number;
  played: number;
  wins: number;
  streak: number;
  /** 每個對象累積的心動值（0 – 100）。 */
  affinity: Record<string, number>;
  /** 心動值滿而解鎖真愛的對象。 */
  unlockedIds: string[];
  /** 大富翁進行中的對手。 */
  boardPartnerId: string | null;
  boardPosition: number;
  boardRollsLeft: number;

  tick: () => void;
  spendStamina: (amount: number) => boolean;
  grantStamina: (amount: number) => void;
  addScore: (amount: number) => void;
  recordGame: (payload: { win: boolean; score: number }) => void;
  addAffinity: (userId: string, delta: number) => number;
  markUnlocked: (userId: string) => void;
  startBoard: (partnerId: string) => void;
  moveBoard: (steps: number) => number;
  endBoard: () => void;
}

/** 體力回復間隔由管理員平台的系統設定控制，預設 12 分鐘。 */
function regenIntervalMs() {
  const minutes = useAdminStore.getState().flags.staminaRegenMinutes;
  return Math.max(1, minutes) * 60 * 1000;
}

/** 遊戲積分獎勵倍率，可在管理員平台調整。 */
function rewardMultiplier() {
  const value = useAdminStore.getState().flags.rewardMultiplier;
  return value > 0 ? value : 1;
}

function regenerate(stamina: number, regenAt: number, now: number) {
  if (stamina >= STAMINA_MAX) return { stamina, regenAt: now };
  const interval = regenIntervalMs();
  const elapsed = now - regenAt;
  if (elapsed < interval) return { stamina, regenAt };
  const gained = Math.floor(elapsed / interval);
  const next = Math.min(STAMINA_MAX, stamina + gained);
  return {
    stamina: next,
    regenAt: next >= STAMINA_MAX ? now : regenAt + gained * interval,
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      stamina: STAMINA_MAX,
      regenAt: Date.now(),
      score: 640,
      played: 12,
      wins: 7,
      streak: 2,
      affinity: {},
      unlockedIds: [],
      boardPartnerId: null,
      boardPosition: 0,
      boardRollsLeft: 0,

      tick: () => {
        const { stamina, regenAt } = get();
        const next = regenerate(stamina, regenAt, Date.now());
        if (next.stamina !== stamina || next.regenAt !== regenAt) set(next);
      },

      spendStamina: (amount) => {
        get().tick();
        if (get().stamina < amount) return false;
        set((state) => ({
          stamina: state.stamina - amount,
          regenAt: state.stamina >= STAMINA_MAX ? Date.now() : state.regenAt,
        }));
        return true;
      },

      grantStamina: (amount) =>
        set((state) => ({ stamina: Math.min(STAMINA_MAX, state.stamina + amount) })),

      addScore: (amount) =>
        set((state) => ({ score: state.score + Math.round(amount * rewardMultiplier()) })),

      recordGame: ({ win, score }) =>
        set((state) => ({
          played: state.played + 1,
          wins: win ? state.wins + 1 : state.wins,
          streak: win ? state.streak + 1 : 0,
          score: state.score + Math.round(score * rewardMultiplier()),
        })),

      addAffinity: (userId, delta) => {
        const current = get().affinity[userId] ?? 0;
        const next = Math.max(0, Math.min(AFFINITY_UNLOCK, current + delta));
        set((state) => ({ affinity: { ...state.affinity, [userId]: next } }));
        return next;
      },

      markUnlocked: (userId) =>
        set((state) =>
          state.unlockedIds.includes(userId)
            ? state
            : { unlockedIds: [...state.unlockedIds, userId] },
        ),

      startBoard: (partnerId) =>
        set({ boardPartnerId: partnerId, boardPosition: 0, boardRollsLeft: BOARD_ROLLS }),

      moveBoard: (steps) => {
        const { boardPosition, boardRollsLeft } = get();
        const next = (boardPosition + steps) % 24;
        set({ boardPosition: next, boardRollsLeft: Math.max(0, boardRollsLeft - 1) });
        return next;
      },

      endBoard: () => set({ boardPartnerId: null, boardPosition: 0, boardRollsLeft: 0 }),
    }),
    {
      name: 'jimatch-game',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        stamina: state.stamina,
        regenAt: state.regenAt,
        score: state.score,
        played: state.played,
        wins: state.wins,
        streak: state.streak,
        affinity: state.affinity,
        unlockedIds: state.unlockedIds,
      }),
    },
  ),
);

export function useGameHydrated() {
  const [hydrated, setHydrated] = useState(() => useGameStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return undefined;
    return useGameStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  return hydrated;
}

/** 每 30 秒結算一次體力回復，並回傳下一點體力還要多久（毫秒）。 */
export function useStaminaTimer() {
  const tick = useGameStore((state) => state.tick);
  const stamina = useGameStore((state) => state.stamina);
  const regenAt = useGameStore((state) => state.regenAt);
  const regenMinutes = useAdminStore((state) => state.flags.staminaRegenMinutes);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    tick();
    const timer = setInterval(() => {
      tick();
      setNow(Date.now());
    }, 30_000);
    return () => clearInterval(timer);
  }, [tick]);

  if (stamina >= STAMINA_MAX) return null;
  return Math.max(0, regenAt + Math.max(1, regenMinutes) * 60 * 1000 - now);
}

export function usePlayerTitle() {
  const score = useGameStore((state) => state.score);
  return titleForScore(score);
}

export function formatEta(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60_000);
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    return `${hours} 小時 ${totalMinutes % 60} 分`;
  }
  return `${Math.max(1, totalMinutes)} 分鐘`;
}
