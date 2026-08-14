import { BadgeCheck, ShieldAlert, ShieldQuestion } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { StaticTag } from '@/components/TagChip';
import { riskLabel } from '@/lib/aiReview';
import { COLORS } from '@/lib/colors';
import { AI_DECISION_LABEL, AI_ENGINE_LABEL, type AiReviewResult } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AiReviewCardProps {
  result: AiReviewResult;
  /** 標題可覆寫，例如管理端顯示「AI 判定」。 */
  title?: string;
  className?: string;
}

/** 即時認證結果卡：判定、風險分數、命中原因與審核引擎來源。 */
export function AiReviewCard({ result, title, className }: AiReviewCardProps) {
  const passed = result.decision === 'approved';
  const blocked = result.decision === 'rejected';

  return (
    <View
      className={cn(
        'gap-3 rounded-xl border p-4',
        passed ? 'border-brand/25 bg-brand-soft' : 'border-coral/25 bg-coral-soft',
        className,
      )}
    >
      <View className="flex-row items-center gap-2">
        {passed ? (
          <BadgeCheck size={18} color={COLORS.brandStrong} strokeWidth={2.2} />
        ) : blocked ? (
          <ShieldAlert size={18} color={COLORS.coral} strokeWidth={2.2} />
        ) : (
          <ShieldQuestion size={18} color={COLORS.coral} strokeWidth={2.2} />
        )}
        <Text className="text-ink flex-1 text-[15px] font-semibold">
          {title ?? AI_DECISION_LABEL[result.decision]}
        </Text>
        <StaticTag label={riskLabel(result.riskScore)} tone={passed ? 'brand' : 'coral'} />
      </View>

      <View className="gap-1.5">
        {result.reasons.map((reason) => (
          <Text key={reason} className="text-ink-soft text-[12px] leading-5">
            ・{reason}
          </Text>
        ))}
      </View>

      {result.flaggedTerms.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {result.flaggedTerms.map((term) => (
            <StaticTag key={term} label={term} tone="coral" />
          ))}
        </View>
      ) : null}

      <Text className="text-muted text-[11px]">
        審核來源：{AI_ENGINE_LABEL[result.engine]}
        {result.engine === 'rules' ? '（設定 AI 金鑰後自動改用模型判定）' : ''}
      </Text>
    </View>
  );
}
