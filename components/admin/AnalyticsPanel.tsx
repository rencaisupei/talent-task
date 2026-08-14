import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { KpiCard } from '@/components/KpiCard';
import { SectionHeading } from '@/components/SectionHeading';
import { TrendLineChart } from '@/components/TrendLineChart';
import { CATEGORY_FILTER_ALL, usePlatformAnalytics } from '@/lib/analytics';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import { OMNI_INDUSTRY_TAGS } from '@/lib/omniTags';
import { PREMIUM_PRICE_TWD } from '@/lib/stores/session';
import { cn } from '@/lib/utils';

export function AnalyticsPanel() {
  const [categoryId, setCategoryId] = useState<string>(CATEGORY_FILTER_ALL);
  const analytics = usePlatformAnalytics(categoryId);

  const activeCategoryName =
    categoryId === CATEGORY_FILTER_ALL
      ? '全部類別'
      : (OMNI_INDUSTRY_TAGS.find((category) => category.id === categoryId)?.name ?? '全部類別');

  const maxActivity = analytics.topTags[0]?.activity ?? 1;

  return (
    <View className="gap-4">
      <SectionHeading title="即時平台分析" caption="數據每分鐘同步，供營運決策使用。" />

      <View className="gap-3">
        <KpiCard
          label="平台累計註冊用戶（客戶 + 人才）"
          value={formatNumber(analytics.totalUsers)}
          caption="含本機示範帳號"
        />
        <View className="flex-row gap-3">
          <KpiCard
            className="flex-1"
            label="活躍付費人才"
            value={formatNumber(analytics.activePremiumTalents)}
            caption={`每月 ${formatCurrency(PREMIUM_PRICE_TWD)}`}
            tone="brand"
          />
          <KpiCard
            className="flex-1"
            label="即時月經常性收入"
            value={formatCurrency(analytics.mrrEstimate)}
            caption="付費人才 × 399"
            tone="coral"
          />
        </View>
        <View className="flex-row gap-3">
          <KpiCard
            className="flex-1"
            label="累計廣播任務"
            value={formatNumber(analytics.totalBroadcastedGigs)}
            caption="客戶端部署總量"
          />
          <KpiCard
            className="flex-1"
            label="任務對話轉換率"
            value={formatPercent(analytics.conversationMatchRate)}
            caption="至少成立一組對話"
            tone="brand"
          />
        </View>
      </View>

      <SectionHeading title="類別篩選" caption={`目前檢視：${activeCategoryName}`} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-4"
      >
        {[{ id: CATEGORY_FILTER_ALL, name: '全部類別' }, ...OMNI_INDUSTRY_TAGS].map((category) => {
          const isActive = categoryId === category.id;
          return (
            <Pressable
              key={category.id}
              onPress={() => setCategoryId(category.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className={cn(
                'rounded-xl border px-3 py-2',
                isActive ? 'border-brand bg-brand' : 'border-hairline bg-canvas',
              )}
            >
              <Text
                className={cn(
                  'text-[12px] font-semibold',
                  isActive ? 'text-white' : 'text-ink-soft',
                )}
              >
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <TrendLineChart
        points={analytics.trend}
        title="每週任務頻率趨勢"
        caption={`${activeCategoryName}・近 12 週，點選任一週查看數值`}
      />

      <SectionHeading title="熱門標籤排行榜" caption="監控即時經濟活躍度。" />

      <View className="border-hairline gap-2 rounded-xl border bg-white p-4">
        {analytics.topTags.map((entry, index) => (
          <View key={entry.tag} className="gap-1.5">
            <View className="flex-row items-center gap-2">
              <Text className="text-muted w-5 text-[12px] font-bold">{index + 1}</Text>
              <Text className="text-ink flex-1 text-[13px] font-semibold">#{entry.tag}</Text>
              <Text className="text-coral text-[12px] font-semibold">
                {formatNumber(entry.activity)}
              </Text>
            </View>
            <View className="bg-canvas ml-7 h-1.5 overflow-hidden rounded-full">
              <View
                className="bg-brand h-full rounded-full"
                style={{ width: `${Math.max(6, (entry.activity / maxActivity) * 100)}%` }}
              />
            </View>
            <Text className="text-muted ml-7 text-[11px]">{entry.categoryName}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
