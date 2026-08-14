import { BadgeCheck, Clock, MessageSquarePlus, Quote } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { RatingStars } from '@/components/RatingStars';
import { StaticTag } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { SEED_TALENTS } from '@/lib/seed';
import { useReviewStore } from '@/lib/stores/reviews';
import { formatResponseTime, reviewsForUser, summarizeReviews, trustBadge } from '@/lib/trust';
import type { Bid } from '@/lib/types';

const BID_STATUS_LABEL: Record<Bid['status'], string> = {
  pending: '等待客戶回覆',
  accepted: '已錄取',
  rejected: '未錄取',
  withdrawn: '已撤回',
};

interface BidCardProps {
  bid: Bid;
  /** 客戶端：選定此人才。 */
  onAccept?: () => void;
  onChat?: () => void;
  onWithdraw?: () => void;
  onPressTalent?: () => void;
  onPressGig?: () => void;
  /** 顯示任務標題（人才的提案列表使用）。 */
  showGigTitle?: boolean;
}

export function BidCard({
  bid,
  onAccept,
  onChat,
  onWithdraw,
  onPressTalent,
  onPressGig,
  showGigTitle,
}: BidCardProps) {
  const reviews = useReviewStore((state) => state.reviews);
  const profile = SEED_TALENTS.find((talent) => talent.id === bid.talentId);

  const summary = useMemo(
    () => summarizeReviews(reviewsForUser(reviews, bid.talentId)),
    [reviews, bid.talentId],
  );

  const badge = trustBadge(summary, profile?.completedJobs ?? 0);

  return (
    <View className="border-hairline rounded-xl border bg-white p-4">
      {showGigTitle ? (
        <Pressable onPress={onPressGig} accessibilityRole="button" className="mb-3">
          <Text numberOfLines={1} className="text-ink text-[15px] font-semibold">
            {bid.gigTitle}
          </Text>
          <Text className="text-muted mt-0.5 text-[12px]">
            投遞於 {formatRelativeTime(bid.createdAt)}
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={onPressTalent}
        accessibilityRole="button"
        className="flex-row items-center gap-3"
      >
        <View className="bg-brand-soft h-11 w-11 items-center justify-center rounded-xl">
          <Text className="text-brand-strong text-[16px] font-bold">
            {bid.talentName.slice(0, 1)}
          </Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-ink text-[15px] font-semibold">{bid.talentName}</Text>
            {profile?.verification === 'approved' ? (
              <BadgeCheck size={15} color={COLORS.brand} strokeWidth={2.2} />
            ) : null}
          </View>
          <View className="mt-1 flex-row items-center gap-2">
            <RatingStars value={summary.average} size={12} count={summary.count} />
          </View>
          <Text className="text-muted mt-1 text-[12px]">
            {bid.talentRegion}
            {profile
              ? `・完成 ${profile.completedJobs} 件・${formatResponseTime(profile.responseMinutes)}`
              : ''}
          </Text>
        </View>
        <StaticTag label={badge.label} tone={badge.tone} />
      </Pressable>

      <View className="border-hairline mt-3 flex-row items-center justify-between border-t pt-3">
        <View>
          <Text className="text-muted text-[12px]">報價</Text>
          <Text className="text-ink mt-0.5 text-[17px] font-bold tracking-tight">
            {bid.quote === null ? '面議' : formatCurrency(bid.quote)}
          </Text>
        </View>
        <View className="items-end">
          <View className="flex-row items-center gap-1">
            <Clock size={13} color={COLORS.coral} strokeWidth={2.2} />
            <Text className="text-coral text-[12px] font-semibold">{bid.etaLabel}</Text>
          </View>
          <Text className="text-muted mt-1 text-[11px]">{BID_STATUS_LABEL[bid.status]}</Text>
        </View>
      </View>

      {bid.message.length > 0 ? (
        <View className="bg-canvas mt-3 flex-row gap-2 rounded-xl p-3">
          <Quote size={13} color={COLORS.muted} strokeWidth={2.2} />
          <Text className="text-ink-soft flex-1 text-[13px] leading-5">{bid.message}</Text>
        </View>
      ) : null}

      {onAccept || onChat || onWithdraw ? (
        <View className="mt-3 flex-row gap-2">
          {onAccept ? (
            <Pressable
              onPress={onAccept}
              accessibilityRole="button"
              className="bg-brand flex-1 items-center rounded-xl py-3"
            >
              <Text className="text-[14px] font-semibold text-white">選定此人才</Text>
            </Pressable>
          ) : null}
          {onChat ? (
            <Pressable
              onPress={onChat}
              accessibilityRole="button"
              accessibilityLabel="開啟對話"
              className="border-hairline bg-canvas h-11 w-11 items-center justify-center rounded-xl border"
            >
              <MessageSquarePlus size={18} color={COLORS.ink} strokeWidth={2.1} />
            </Pressable>
          ) : null}
          {onWithdraw ? (
            <Pressable
              onPress={onWithdraw}
              accessibilityRole="button"
              className="border-hairline bg-canvas flex-1 items-center rounded-xl border py-3"
            >
              <Text className="text-ink-soft text-[14px] font-semibold">撤回提案</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
