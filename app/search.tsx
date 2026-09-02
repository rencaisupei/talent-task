import { useState } from 'react';
import { Search, X } from 'lucide-react-native';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useThemeColor } from 'heroui-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Photo } from '@/components/ui/Photo';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { SEED_PROFILES } from '@/lib/data/seed';
import { activityLabel, distanceLabel } from '@/lib/format';
import { NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';

const HOT_INTERESTS = ['手沖', '爬山', '獨立音樂', '拳擊', '看展', '養貓', '露營', '調酒'];

export default function SearchScreen() {
  const [muted] = useThemeColor(['muted']);
  const [query, setQuery] = useState('');
  const [interest, setInterest] = useState<string | null>(null);

  const trimmed = query.trim();
  const results = SEED_PROFILES.filter((profile) => {
    if (interest && !profile.interests.includes(interest)) return false;
    if (!trimmed) return Boolean(interest);
    return (
      profile.name.includes(trimmed) ||
      profile.job.includes(trimmed) ||
      profile.city.includes(trimmed) ||
      profile.district.includes(trimmed) ||
      profile.interests.some((item) => item.includes(trimmed))
    );
  });

  const showResults = Boolean(trimmed) || Boolean(interest);

  return (
    <Screen>
      <ScreenHeader back fallback="/(tabs)" title="搜尋" />

      <View className="px-4 pb-4">
        <View className="bg-surface border-border/60 flex-row items-center gap-2 rounded-2xl border px-3.5 py-2.5">
          <Search color={muted} size={16} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="搜尋名字、職業、地區或興趣"
            placeholderTextColor={muted}
            autoFocus
            className="text-foreground flex-1 text-[14px]"
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="清除"
              hitSlop={8}
              onPress={() => setQuery('')}
              className="active:opacity-70"
            >
              <X color={muted} size={15} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-6 px-4 pb-8">
        <Section title="熱門興趣" subtitle="點一下用興趣找人">
          <View className="flex-row flex-wrap gap-2">
            {HOT_INTERESTS.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: interest === item }}
                accessibilityLabel={item}
                onPress={() => setInterest(interest === item ? null : item)}
                className={cn(
                  'rounded-full border px-3.5 py-2 active:opacity-70',
                  interest === item ? 'border-accent bg-accent/15' : 'border-border/70 bg-surface',
                )}
              >
                <Txt
                  className={cn(
                    'text-[13px]',
                    interest === item ? 'text-accent' : 'text-foreground',
                  )}
                >
                  {item}
                </Txt>
              </Pressable>
            ))}
          </View>
        </Section>

        {showResults ? (
          <Section title={`搜尋結果 · ${results.length} 人`}>
            {results.length === 0 ? (
              <EmptyState
                icon={<Search color={NEON.coral} size={22} />}
                title="沒有符合的人"
                description="換個關鍵字，或試試其他興趣標籤。"
              />
            ) : (
              <View className="gap-3">
                {results.map((profile) => (
                  <Pressable
                    key={profile.id}
                    accessibilityRole="button"
                    accessibilityLabel={`查看 ${profile.name}`}
                    onPress={() => router.push(`/profile/${profile.id}`)}
                    className="bg-surface border-border/60 flex-row items-center gap-3 rounded-3xl border p-3 active:opacity-80"
                  >
                    <View className="overflow-hidden rounded-2xl">
                      <Photo uri={profile.photos[0] ?? ''} width={64} height={78} radius={16} />
                    </View>
                    <View className="flex-1 gap-1">
                      <Txt weight="semibold" className="text-foreground text-[15px]">
                        {profile.name}，{profile.age}
                      </Txt>
                      <Txt className="text-muted text-[12px]" numberOfLines={1}>
                        {profile.job} · {profile.district} · {distanceLabel(profile.distanceKm)}
                      </Txt>
                      <Txt className="text-muted text-[11px]">
                        {activityLabel(profile.online, profile.lastActiveMinutes)} · 契合{' '}
                        {profile.vibeScore}%
                      </Txt>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </Section>
        ) : (
          <Section title="推薦給你" subtitle="契合度最高的幾位">
            <View className="flex-row flex-wrap gap-3">
              {[...SEED_PROFILES]
                .sort((a, b) => b.vibeScore - a.vibeScore)
                .slice(0, 6)
                .map((profile) => (
                  <Pressable
                    key={profile.id}
                    accessibilityRole="button"
                    accessibilityLabel={`查看 ${profile.name}`}
                    onPress={() => router.push(`/profile/${profile.id}`)}
                    className="w-[31%] gap-1.5 active:opacity-80"
                  >
                    <View className="overflow-hidden rounded-2xl">
                      <Photo uri={profile.photos[0] ?? ''} width="100%" height={126} radius={16} />
                    </View>
                    <Txt className="text-foreground text-[12px]" numberOfLines={1}>
                      {profile.name}
                    </Txt>
                    <Txt className="text-muted text-[10px]">契合 {profile.vibeScore}%</Txt>
                  </Pressable>
                ))}
            </View>
          </Section>
        )}
      </ScrollView>
    </Screen>
  );
}
