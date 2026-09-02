import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  CADENCE_MS,
  DEFAULT_CONTENT,
  DEFAULT_PATROL,
  KIND_LABEL,
  SCOPE_LABEL,
  generateContent,
  matchText,
} from '@/lib/data/ai';
import { DARE_CARDS, QUICK_QUESTIONS, TRUTH_CARDS } from '@/lib/data/games';
import { displayName } from '@/lib/data/profiles';
import { SEED_PROFILES } from '@/lib/data/seed';
import { useAdminStore } from '@/lib/stores/admin';
import { useChatStore } from '@/lib/stores/chat';
import { useMomentsStore } from '@/lib/stores/moments';
import { useNotificationsStore } from '@/lib/stores/notifications';
import type {
  AiContentConfig,
  AiContentKind,
  AiDraft,
  AiFinding,
  AiPatrolConfig,
  AiPatrolRun,
  AiPatrolScope,
  AiUpdateEntry,
  QuickQuestion,
} from '@/lib/types';

/** 稽核紀錄裡顯示的自動化執行者。 */
export const AI_ACTOR = 'AI 巡邏員';

/** 題目類型的固定顯示順序。 */
const KIND_ORDER: AiContentKind[] = ['quick', 'truth', 'dare'];

interface PublishedContent {
  quick: QuickQuestion[];
  truth: string[];
  dare: string[];
}

interface ScanTarget {
  scope: AiPatrolScope;
  userId: string;
  text: string;
  sourceKey: string;
  momentId?: string;
}

interface AiState {
  patrol: AiPatrolConfig;
  findings: AiFinding[];
  runs: AiPatrolRun[];
  lastPatrolAt: number | null;

  content: AiContentConfig;
  drafts: AiDraft[];
  published: PublishedContent;
  contentVersion: number;
  lastGenerateAt: number | null;
  lastPublishAt: number | null;
  updates: AiUpdateEntry[];

  setPatrol: (patch: Partial<AiPatrolConfig>) => void;
  togglePatrolScope: (scope: AiPatrolScope) => void;
  runPatrol: (trigger: 'auto' | 'manual') => { scanned: number; flagged: number };
  resolveFinding: (findingId: string, keep: boolean) => void;
  clearFindings: () => void;

  setContent: (patch: Partial<AiContentConfig>) => void;
  toggleContentKind: (kind: AiContentKind) => void;
  generateDrafts: (trigger: 'auto' | 'manual') => string[];
  publishDrafts: (draftIds: string[], trigger: 'auto' | 'manual') => number;
  rejectDraft: (draftId: string) => void;
}

let seq = 0;
function makeId(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

function excerptOf(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 70 ? `${clean.slice(0, 70)}…` : clean;
}

/** 依設定的巡邏範圍蒐集所有要掃描的文字。 */
function collectTargets(scopes: AiPatrolScope[]): ScanTarget[] {
  const targets: ScanTarget[] = [];

  if (scopes.includes('moments') || scopes.includes('comments')) {
    for (const moment of useMomentsStore.getState().moments) {
      if (scopes.includes('moments')) {
        targets.push({
          scope: 'moments',
          userId: moment.userId,
          text: moment.text,
          sourceKey: `moment:${moment.id}`,
          momentId: moment.id,
        });
      }
      if (scopes.includes('comments')) {
        for (const comment of moment.comments) {
          targets.push({
            scope: 'comments',
            userId: comment.userId,
            text: comment.text,
            sourceKey: `comment:${comment.id}`,
            momentId: moment.id,
          });
        }
      }
    }
  }

  if (scopes.includes('chats')) {
    for (const message of useChatStore.getState().messages) {
      if (message.kind !== 'text' || !message.text) continue;
      targets.push({
        scope: 'chats',
        userId: message.senderId,
        text: message.text,
        sourceKey: `message:${message.id}`,
      });
    }
  }

  if (scopes.includes('profiles')) {
    for (const profile of SEED_PROFILES) {
      if (!profile.bio) continue;
      targets.push({
        scope: 'profiles',
        userId: profile.id,
        text: profile.bio,
        sourceKey: `bio:${profile.id}`,
      });
    }
  }

  return targets;
}

/** 已經在題庫或草稿裡出現過的文字，避免產生重複題目。 */
function takenTexts(state: Pick<AiState, 'drafts' | 'published'>): Set<string> {
  const taken = new Set<string>();
  for (const item of QUICK_QUESTIONS) taken.add(item.question);
  for (const item of TRUTH_CARDS) taken.add(item);
  for (const item of DARE_CARDS) taken.add(item);
  for (const item of state.published.quick) taken.add(item.question);
  for (const item of state.published.truth) taken.add(item);
  for (const item of state.published.dare) taken.add(item);
  for (const draft of state.drafts) taken.add(draft.text);
  return taken;
}

export const useAiStore = create<AiState>()(
  persist(
    (set, get) => ({
      patrol: DEFAULT_PATROL,
      findings: [],
      runs: [],
      lastPatrolAt: null,

      content: DEFAULT_CONTENT,
      drafts: [],
      published: { quick: [], truth: [], dare: [] },
      contentVersion: 1,
      lastGenerateAt: null,
      lastPublishAt: null,
      updates: [],

      setPatrol: (patch) => set((state) => ({ patrol: { ...state.patrol, ...patch } })),

      togglePatrolScope: (scope) =>
        set((state) => ({
          patrol: {
            ...state.patrol,
            scopes: state.patrol.scopes.includes(scope)
              ? state.patrol.scopes.filter((item) => item !== scope)
              : [...state.patrol.scopes, scope],
          },
        })),

      runPatrol: (trigger) => {
        const { patrol, findings } = get();
        const now = Date.now();
        const seen = new Set(findings.map((finding) => finding.sourceKey));
        const bannedWords = useAdminStore.getState().flags.bannedWords;
        const targets = collectTargets(patrol.scopes);

        const hits: AiFinding[] = [];
        for (const target of targets) {
          if (seen.has(target.sourceKey)) continue;
          const hit = matchText(target.text, patrol.sensitivity, bannedWords);
          if (!hit) continue;
          hits.push({
            id: makeId('find'),
            scope: target.scope,
            userId: target.userId,
            excerpt: excerptOf(target.text),
            rule: hit.rule,
            severity: hit.severity,
            status: patrol.action === 'hide' && target.momentId ? 'removed' : 'pending',
            createdAt: now,
            momentId: target.momentId,
            sourceKey: target.sourceKey,
          });
        }

        const admin = useAdminStore.getState();
        if (patrol.action !== 'log') {
          for (const hit of hits) {
            admin.enqueueReview({
              kind: hit.scope === 'profiles' ? 'bio' : 'moment',
              userId: hit.userId,
              content: hit.excerpt,
              flags: ['AI 巡邏', hit.rule],
              momentId: hit.momentId,
            });
          }
        }

        if (patrol.action === 'hide') {
          const deleteMoment = useMomentsStore.getState().deleteMoment;
          for (const hit of hits) {
            if (hit.momentId) deleteMoment(hit.momentId);
          }
        }

        const run: AiPatrolRun = {
          id: makeId('run'),
          trigger,
          scanned: targets.length,
          flagged: hits.length,
          startedAt: now,
        };

        set((state) => ({
          findings: [...hits, ...state.findings].slice(0, 80),
          runs: [run, ...state.runs].slice(0, 20),
          lastPatrolAt: now,
        }));

        const first = hits[0];
        admin.logAgent(
          AI_ACTOR,
          `${trigger === 'auto' ? '自動' : '手動'}巡邏：掃描 ${targets.length} 筆、命中 ${hits.length} 筆`,
          first?.rule,
        );

        if (first && patrol.notifyAdmin) {
          useNotificationsStore.getState().push({
            kind: 'system',
            title: `AI 巡邏發現 ${hits.length} 筆可疑內容`,
            body: `最新命中：${first.rule}（${SCOPE_LABEL[first.scope]}）`,
          });
        }

        return { scanned: targets.length, flagged: hits.length };
      },

      resolveFinding: (findingId, keep) => {
        const finding = get().findings.find((item) => item.id === findingId);
        if (!finding) return;
        if (!keep && finding.momentId) {
          useMomentsStore.getState().deleteMoment(finding.momentId);
        }
        set((state) => ({
          findings: state.findings.map((item) =>
            item.id === findingId ? { ...item, status: keep ? 'kept' : 'removed' } : item,
          ),
        }));
        useAdminStore
          .getState()
          .logAgent(
            AI_ACTOR,
            keep ? '人工判定保留 AI 命中內容' : '人工確認下架 AI 命中內容',
            displayName(finding.userId, finding.userId),
          );
      },

      clearFindings: () => set({ findings: [] }),

      setContent: (patch) => set((state) => ({ content: { ...state.content, ...patch } })),

      toggleContentKind: (kind) =>
        set((state) => ({
          content: {
            ...state.content,
            kinds: state.content.kinds.includes(kind)
              ? state.content.kinds.filter((item) => item !== kind)
              : [...state.content.kinds, kind],
          },
        })),

      generateDrafts: (trigger) => {
        const state = get();
        const { kinds, batchSize, tone } = state.content;
        if (kinds.length === 0) return [];

        const taken = takenTexts(state);
        const created: AiDraft[] = [];
        const now = Date.now();

        for (let index = 0; index < batchSize; index += 1) {
          const kind = kinds[index % kinds.length];
          const generated = generateContent(kind, tone, taken);
          if (!generated) continue;
          taken.add(generated.text);
          created.push({
            id: makeId('draft'),
            kind,
            text: generated.text,
            options: generated.options,
            status: 'draft',
            createdAt: now,
          });
        }

        if (created.length === 0) {
          set({ lastGenerateAt: now });
          return [];
        }

        set((current) => ({
          drafts: [...created, ...current.drafts].slice(0, 60),
          lastGenerateAt: now,
        }));

        useAdminStore
          .getState()
          .logAgent(
            AI_ACTOR,
            `${trigger === 'auto' ? '自動' : '手動'}產生 ${created.length} 則遊戲題目`,
          );

        return created.map((draft) => draft.id);
      },

      publishDrafts: (draftIds, trigger) => {
        const state = get();
        const targets = state.drafts.filter(
          (draft) => draftIds.includes(draft.id) && draft.status === 'draft',
        );
        if (targets.length === 0) return 0;

        const quick = [...state.published.quick];
        const truth = [...state.published.truth];
        const dare = [...state.published.dare];
        const counts: Record<AiContentKind, number> = { quick: 0, truth: 0, dare: 0 };

        for (const draft of targets) {
          counts[draft.kind] += 1;
          if (draft.kind === 'quick' && draft.options) {
            quick.push({ id: draft.id, question: draft.text, options: draft.options });
          } else if (draft.kind === 'truth') {
            truth.push(draft.text);
          } else if (draft.kind === 'dare') {
            dare.push(draft.text);
          }
        }

        const now = Date.now();
        const version = state.contentVersion + 1;
        const entry: AiUpdateEntry = {
          id: makeId('update'),
          version,
          counts,
          trigger,
          createdAt: now,
        };

        set((current) => ({
          published: { quick, truth, dare },
          drafts: current.drafts.map((draft) =>
            draftIds.includes(draft.id) && draft.status === 'draft'
              ? { ...draft, status: 'published' }
              : draft,
          ),
          contentVersion: version,
          lastPublishAt: now,
          updates: [entry, ...current.updates].slice(0, 20),
        }));

        const summary = KIND_ORDER.filter((kind) => counts[kind] > 0)
          .map((kind) => `${KIND_LABEL[kind]} ${counts[kind]} 則`)
          .join('、');

        useAdminStore
          .getState()
          .logAgent(
            AI_ACTOR,
            `更新遊戲題庫至 v${version}：${summary}`,
            trigger === 'auto' ? '自動發佈' : '手動發佈',
          );

        useNotificationsStore.getState().push({
          kind: 'system',
          title: `遊戲題庫已更新 v${version}`,
          body: `AI 新增了${summary}，開一局試試新題目。`,
        });

        return targets.length;
      },

      rejectDraft: (draftId) =>
        set((state) => ({
          drafts: state.drafts.map((draft) =>
            draft.id === draftId ? { ...draft, status: 'rejected' } : draft,
          ),
        })),
    }),
    {
      name: 'jimatch-ai',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        patrol: state.patrol,
        findings: state.findings,
        runs: state.runs,
        lastPatrolAt: state.lastPatrolAt,
        content: state.content,
        drafts: state.drafts,
        published: state.published,
        contentVersion: state.contentVersion,
        lastGenerateAt: state.lastGenerateAt,
        lastPublishAt: state.lastPublishAt,
        updates: state.updates,
      }),
    },
  ),
);

/* --------------------------------------------------- 遊戲題庫（含 AI 新增） */

/** 極速開局題庫：內建題目 + AI 已發佈的題目。 */
export function liveQuickQuestions(): QuickQuestion[] {
  return [...QUICK_QUESTIONS, ...useAiStore.getState().published.quick];
}

export function liveTruthCards(): string[] {
  return [...TRUTH_CARDS, ...useAiStore.getState().published.truth];
}

export function liveDareCards(): string[] {
  return [...DARE_CARDS, ...useAiStore.getState().published.dare];
}

/* ----------------------------------------------------------- 自動化排程 */

const TICK_MS = 60_000;

/**
 * App 開著的時候每分鐘檢查一次：巡邏到期就巡邏，出題到期就出題
 * （設定為自動發佈時直接更新遊戲題庫）。
 */
export function useAiAutomation() {
  useEffect(() => {
    const tick = () => {
      if (!useAiStore.persist.hasHydrated()) return;
      const state = useAiStore.getState();
      const now = Date.now();

      if (state.patrol.enabled) {
        const due =
          state.lastPatrolAt === null ||
          now - state.lastPatrolAt >= Math.max(1, state.patrol.intervalMinutes) * 60_000;
        if (due) state.runPatrol('auto');
      }

      const cadenceMs = CADENCE_MS[state.content.cadence];
      if (state.content.enabled && cadenceMs > 0) {
        const due = state.lastGenerateAt === null || now - state.lastGenerateAt >= cadenceMs;
        if (due) {
          const created = useAiStore.getState().generateDrafts('auto');
          if (created.length > 0 && useAiStore.getState().content.autoPublish) {
            useAiStore.getState().publishDrafts(created, 'auto');
          }
        }
      }
    };

    tick();
    const timer = setInterval(tick, TICK_MS);
    return () => clearInterval(timer);
  }, []);
}

export function useAiHydrated() {
  const [hydrated, setHydrated] = useState(() => useAiStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return undefined;
    return useAiStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  return hydrated;
}

/** 待處理的 AI 命中數量，設定頁與巡邏頁共用。 */
export function usePendingFindingCount() {
  return useAiStore((state) => state.findings.filter((item) => item.status === 'pending').length);
}

/** 尚未發佈的草稿數量。 */
export function usePendingDraftCount() {
  return useAiStore((state) => state.drafts.filter((item) => item.status === 'draft').length);
}
