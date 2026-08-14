import { bilt } from '@/lib/bilt';
import { detectScamTerms } from '@/lib/moderation';
import type {
  AiReviewDecision,
  AiReviewEngine,
  AiReviewResult,
  AiReviewTarget,
  PublishReview,
} from '@/lib/types';

export interface AiReviewInput {
  target: AiReviewTarget;
  title?: string;
  detail?: string;
  tag?: string;
  categoryName?: string;
  region?: string;
  budgetLabel?: string;
  name?: string;
  tags?: string[];
}

interface RawReviewResponse {
  decision?: unknown;
  riskScore?: unknown;
  reasons?: unknown;
  flaggedTerms?: unknown;
  engine?: unknown;
}

function toDecision(value: unknown, fallbackScore: number): AiReviewDecision {
  if (value === 'approved' || value === 'review' || value === 'rejected') return value;
  if (fallbackScore >= 60) return 'rejected';
  if (fallbackScore >= 30) return 'review';
  return 'approved';
}

function toEngine(value: unknown): AiReviewEngine {
  return value === 'model' || value === 'rules' || value === 'offline' ? value : 'rules';
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

/** 後端不可用時的裝置端備援判定，確保任何發布都經過一次風險檢查。 */
function offlineReview(input: AiReviewInput): AiReviewResult {
  const text = [input.title, input.detail, input.name, (input.tags ?? []).join('、')]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join('\n');
  const flaggedTerms = detectScamTerms(text);
  const riskScore = Math.min(100, flaggedTerms.length * 30);

  return {
    target: input.target,
    decision: flaggedTerms.length > 0 ? 'review' : 'approved',
    riskScore,
    reasons:
      flaggedTerms.length > 0
        ? [`離線規則命中風險字詞（${flaggedTerms.join('、')}）`]
        : ['連線審核暫時無法使用，已改用裝置端規則檢查並未發現風險字詞'],
    flaggedTerms,
    engine: 'offline',
    reviewedAt: Date.now(),
  };
}

/** 呼叫伺服器端即時審核；連線失敗時退回裝置端規則備援。 */
export async function runAiReview(input: AiReviewInput): Promise<AiReviewResult> {
  try {
    const { data, error } = await bilt.functions.invoke('ai-review', { body: input });
    if (error || data === null || typeof data !== 'object') {
      return offlineReview(input);
    }

    const raw = data as RawReviewResponse;
    const riskScore = Math.max(0, Math.min(100, Math.round(Number(raw.riskScore ?? 0))));
    const reasons = toStringList(raw.reasons);

    return {
      target: input.target,
      decision: toDecision(raw.decision, riskScore),
      riskScore,
      reasons: reasons.length > 0 ? reasons : ['未偵測到詐騙或違規特徵'],
      flaggedTerms: toStringList(raw.flaggedTerms),
      engine: toEngine(raw.engine),
      reviewedAt: Date.now(),
    };
  } catch {
    return offlineReview(input);
  }
}

/** AI 判定轉為上架狀態：通過即公開，其餘一律送交管理員複審。 */
export function publishReviewFromAi(ai: AiReviewResult): PublishReview {
  return { state: ai.decision === 'approved' ? 'approved' : 'pending', ai };
}

export function riskToneOf(score: number): 'brand' | 'coral' {
  return score >= 30 ? 'coral' : 'brand';
}

export function riskLabel(score: number): string {
  if (score >= 60) return `風險 ${score}／高`;
  if (score >= 30) return `風險 ${score}／中`;
  return `風險 ${score}／低`;
}
