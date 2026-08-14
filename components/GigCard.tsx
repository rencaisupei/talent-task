import { Bookmark, MapPin, Zap } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { StaticTag } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { formatRelativeTime } from '@/lib/format';
import { findCategoryById } from '@/lib/omniTags';
import { BUDGET_LEVELS, type Gig } from '@/lib/types';

interface GigCardProps {
  gig: Gig;
  onPress?: () => void;
  footer?: React.ReactNode;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

const STATUS_LABEL: Record<Gig['status'], string> = {
  open: '等待媒合',
  talking: '對話中',
  assigned: '進行中',
  completed: '已完成',
  closed: '已結案',
};

export function GigCard({ gig, onPress, footer, isSaved, onToggleSave }: GigCardProps) {
  const budget = BUDGET_LEVELS.find((level) => level.id === gig.budgetLevel);
  const category = findCategoryById(gig.categoryId);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="border-hairline rounded-xl border bg-white p-4"
      style={{
        shadowColor: '#000000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
      }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <StaticTag label={gig.tag} tone="brand" />
            {gig.isUrgent ? <StaticTag label="急件" tone="coral" /> : null}
          </View>
          <Text className="text-ink mt-2.5 text-[16px] leading-6 font-semibold">{gig.title}</Text>
        </View>
        {gig.isUrgent ? (
          <View className="bg-coral-soft h-9 w-9 items-center justify-center rounded-xl">
            <Zap size={18} color={COLORS.coral} strokeWidth={2.1} />
          </View>
        ) : null}
        {onToggleSave ? (
          <Pressable
            onPress={onToggleSave}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? '取消收藏' : '收藏任務'}
            accessibilityState={{ selected: isSaved }}
            hitSlop={8}
            className="border-hairline bg-canvas h-9 w-9 items-center justify-center rounded-xl border"
          >
            <Bookmark
              size={17}
              color={isSaved ? COLORS.brand : COLORS.muted}
              fill={isSaved ? COLORS.brand : 'transparent'}
              strokeWidth={2.1}
            />
          </Pressable>
        ) : null}
      </View>

      <Text numberOfLines={2} className="text-muted mt-2 text-[13px] leading-5">
        {gig.detail}
      </Text>

      <View className="mt-3 flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <MapPin size={14} color={COLORS.muted} strokeWidth={2} />
          <Text className="text-muted text-[12px]">{gig.location.region}</Text>
        </View>
        <View className="bg-hairline h-1 w-1 rounded-full" />
        <Text className="text-muted text-[12px]">{category?.name}</Text>
        <View className="bg-hairline h-1 w-1 rounded-full" />
        <Text className="text-coral text-[12px] font-medium">
          {formatRelativeTime(gig.createdAt)}
        </Text>
      </View>

      <View className="border-hairline mt-3 flex-row items-center justify-between border-t pt-3">
        <Text className="text-ink text-[13px] font-semibold">{budget?.label}</Text>
        <Text className="text-muted text-[12px]">
          {gig.clientName}・{STATUS_LABEL[gig.status]}
        </Text>
      </View>

      {footer}
    </Pressable>
  );
}
