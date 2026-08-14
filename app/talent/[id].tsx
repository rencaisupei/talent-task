import { useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BadgeCheck, CircleCheckBig, Clock, MapPin, Star } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { RatingStars } from '@/components/RatingStars';
import { ReviewCard } from '@/components/ReviewCard';
import { EmptyState, SectionHeading } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { formatNumber } from '@/lib/format';
import { goBackOrReplace } from '@/lib/navigation';
import { SEED_TALENTS } from '@/lib/seed';
import { useGigStore } from '@/lib/stores/gigs';
import { useReviewStore } from '@/lib/stores/reviews';
import { useSessionStore } from '@/lib/stores/session';
import { formatResponseTime, reviewsForUser, summarizeReviews, trustBadge } from '@/lib/trust';

export default function TalentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reviews = useReviewStore((state) => state.reviews);
  const gigs = useGigStore((state) => state.gigs);

  const userId = useSessionStore((state) => state.userId);
  const displayName = useSessionStore((state) => state.displayName);
  const region = useSessionStore((state) => state.region);
  const skills = useSessionStore((state) => state.skills);
  const verification = useSessionStore((state) => state.verification);

  const isSelf = id === userId;
  const seedProfile = SEED_TALENTS.find((talent) => talent.id === id);

  const completedBySelf = useMemo(
    () =>
      gigs.filter((gig) => gig.assignedTalentId === userId && gig.status === 'completed').length,
    [gigs, userId],
  );

  const targetReviews = useMemo(
    () => [...reviewsForUser(reviews, id ?? '')].sort((a, b) => b.createdAt - a.createdAt),
    [reviews, id],
  );

  const summary = useMemo(() => summarizeReviews(targetReviews), [targetReviews]);

  if (!seedProfile && !isSelf) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-6">
        <EmptyState title="找不到這位人才" caption="檔案可能已下架或帳號已停用。" />
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          className="mt-4"
          accessibilityRole="button"
        >
          <Text className="text-brand-strong text-[14px] font-semibold">返回</Text>
        </Pressable>
      </View>
    );
  }

  const profile = seedProfile ?? {
    id: userId,
    name: displayName,
    region,
    tags: skills,
    isPremium: false,
    verification,
    completedJobs: completedBySelf,
    rating: summary.average,
    responseMinutes: 15,
  };

  const badge = trustBadge(summary, profile.completedJobs);
  const maxDistribution = Math.max(1, ...summary.distribution);

  return (
    <View className="bg-background flex-1">
      <View className="border-hairline pt-safe-offset-3 flex-row items-center gap-3 border-b bg-white px-5 pb-4">
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="返回"
          className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
        >
          <ArrowLeft size={18} color={COLORS.ink} strokeWidth={2.2} />
        </Pressable>
        <Text className="text-ink flex-1 text-[17px] font-semibold">人才檔案</Text>
        <StaticTag label={badge.label} tone={badge.tone} />
      </View>

      <ScrollView
        contentContainerClassName="px-5 py-5 gap-5 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="border-hairline rounded-xl border bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="bg-brand h-14 w-14 items-center justify-center rounded-xl">
              <Text className="text-[20px] font-bold text-white">{profile.name.slice(0, 1)}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-ink text-[18px] font-bold tracking-tight">
                  {profile.name}
                </Text>
                {profile.verification === 'approved' ? (
                  <BadgeCheck size={16} color={COLORS.brand} strokeWidth={2.2} />
                ) : null}
              </View>
              <View className="mt-1 flex-row items-center gap-1.5">
                <MapPin size={13} color={COLORS.muted} strokeWidth={2} />
                <Text className="text-muted text-[12px]">{profile.region}</Text>
              </View>
              <RatingStars className="mt-1.5" value={summary.average} count={summary.count} />
            </View>
          </View>

          <View className="border-hairline mt-4 flex-row border-t pt-4">
            <TrustMetric
              icon={<CircleCheckBig size={15} color={COLORS.brandStrong} strokeWidth={2.2} />}
              label="完成任務"
              value={`${formatNumber(profile.completedJobs)} 件`}
            />
            <View className="bg-hairline w-px" />
            <TrustMetric
              icon={<Clock size={15} color={COLORS.coral} strokeWidth={2.2} />}
              label="回應速度"
              value={formatResponseTime(profile.responseMinutes).replace('平均 ', '')}
            />
            <View className="bg-hairline w-px" />
            <TrustMetric
              icon={<Star size={15} color={COLORS.coral} fill={COLORS.coral} strokeWidth={2.2} />}
              label="平均星等"
              value={summary.count > 0 ? summary.average.toFixed(1) : '尚無'}
            />
          </View>
        </View>

        <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
          <SectionHeading title="認證技能標籤" caption={`共 ${profile.tags.length} 項`} />
          <View className="flex-row flex-wrap gap-2">
            {profile.tags.length === 0 ? (
              <Text className="text-muted text-[13px]">尚未選擇技能標籤。</Text>
            ) : (
              profile.tags.map((tag) => <StaticTag key={tag} label={tag} tone="brand" />)
            )}
          </View>
        </View>

        {summary.count > 0 ? (
          <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
            <SectionHeading title="評價分布" caption={`${summary.count} 則歷史評價`} />
            <View className="gap-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = summary.distribution[stars - 1];
                return (
                  <View key={stars} className="flex-row items-center gap-3">
                    <Text className="text-muted w-8 text-[12px]">{stars} 星</Text>
                    <View className="bg-canvas h-2 flex-1 overflow-hidden rounded-full">
                      <View
                        className="bg-coral h-2 rounded-full"
                        style={{ width: `${(count / maxDistribution) * 100}%` }}
                      />
                    </View>
                    <Text className="text-ink-soft w-6 text-right text-[12px]">{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View className="gap-3">
          <SectionHeading title="客戶評價" />
          {targetReviews.length === 0 ? (
            <EmptyState
              title="尚無評價"
              caption="完成第一筆任務後，客戶的評價會顯示在這裡。"
              icon={<Star size={22} color={COLORS.coral} strokeWidth={2.1} />}
            />
          ) : (
            targetReviews.map((review) => <ReviewCard key={review.id} review={review} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function TrustMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 items-center gap-1">
      {icon}
      <Text className="text-ink text-[14px] font-bold">{value}</Text>
      <Text className="text-muted text-[11px]">{label}</Text>
    </View>
  );
}
