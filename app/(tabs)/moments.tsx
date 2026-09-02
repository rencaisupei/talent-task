import { useState } from 'react';
import { PenLine, Sparkles } from 'lucide-react-native';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';

import { MomentCard } from '@/components/moments/MomentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Txt } from '@/components/ui/Txt';
import { getProfileById } from '@/lib/data/profiles';
import { useMatchesStore } from '@/lib/stores/matches';
import { useMomentsStore } from '@/lib/stores/moments';
import { NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';

const TABS = ['推薦', '附近', '已配對', '我的'] as const;
type TabKey = (typeof TABS)[number];

export default function MomentsScreen() {
  const moments = useMomentsStore((state) => state.moments);
  const toggleLike = useMomentsStore((state) => state.toggleLike);
  const matchedIds = useMatchesStore((state) => state.matchedIds);
  const [tab, setTab] = useState<TabKey>('推薦');

  const filtered = moments.filter((moment) => {
    if (tab === '我的') return moment.userId === 'me';
    if (tab === '已配對') return matchedIds.includes(moment.userId);
    if (tab === '附近') {
      const author = getProfileById(moment.userId);
      return moment.userId === 'me' || (author?.distanceKm ?? 999) <= 10;
    }
    return true;
  });

  return (
    <Screen>
      <ScreenHeader
        title="動態"
        subtitle="看看大家最近在做什麼"
        right={
          <IconButton label="發佈動態" onPress={() => router.push('/moments/new')}>
            <PenLine color={NEON.coral} size={18} />
          </IconButton>
        }
      />

      <View className="flex-row gap-2 px-4 pb-3">
        {TABS.map((item) => (
          <SegmentButton
            key={item}
            label={item}
            active={tab === item}
            onPress={() => setTab(item)}
          />
        ))}
      </View>

      <FlashList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          <EmptyState
            icon={<Sparkles color={NEON.amber} size={24} />}
            title="這裡還沒有動態"
            description={tab === '我的' ? '發第一則動態，讓配對更容易開始對話。' : '換個分類看看。'}
          />
        }
        renderItem={({ item }) => (
          <MomentCard
            moment={item}
            onOpen={() => router.push(`/moment/${item.id}`)}
            onToggleLike={() => toggleLike(item.id)}
            onOpenAuthor={() =>
              item.userId === 'me'
                ? router.push('/(tabs)/me')
                : router.push(`/profile/${item.userId}`)
            }
            onMore={() => router.push(`/moment/${item.id}`)}
          />
        )}
      />
    </Screen>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <View
      className={cn(
        'rounded-full border',
        active ? 'border-accent bg-accent/15' : 'border-border/60 bg-surface',
      )}
    >
      <Txt
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={onPress}
        weight={active ? 'semibold' : 'regular'}
        className={cn('px-4 py-2 text-[13px]', active ? 'text-accent' : 'text-muted')}
      >
        {label}
      </Txt>
    </View>
  );
}
