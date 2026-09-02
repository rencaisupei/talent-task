import { useState } from 'react';
import { Lock, RotateCcw, X } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Label, Slider, Switch } from 'heroui-native';

import { UpgradeSheet } from '@/components/subscription/UpgradeSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { INTEREST_OPTIONS, LOOKING_FOR_OPTIONS, SEED_PROFILES } from '@/lib/data/seed';
import { goBackOrReplace } from '@/lib/navigation';
import { matchesFilters, useDiscoverStore } from '@/lib/stores/discover';
import { useEntitlements } from '@/lib/stores/subscription';
import { NEON } from '@/lib/theme';
import type { DiscoverFilters, Gender, LookingFor } from '@/lib/types';
import { cn } from '@/lib/utils';

const GENDER_LABEL: Record<Gender, string> = {
  female: '女性',
  male: '男性',
  nonbinary: '非二元',
};

export default function FiltersScreen() {
  const filters = useDiscoverStore((state) => state.filters);
  const setFilters = useDiscoverStore((state) => state.setFilters);
  const resetFilters = useDiscoverStore((state) => state.resetFilters);
  const entitlements = useEntitlements();

  const [draft, setDraft] = useState<DiscoverFilters>(filters);
  const [paywall, setPaywall] = useState(false);

  const matchCount = SEED_PROFILES.filter((profile) => matchesFilters(profile, draft)).length;

  const patch = (next: Partial<DiscoverFilters>) => setDraft({ ...draft, ...next });

  const toggleGender = (gender: Gender) =>
    patch({
      genders: draft.genders.includes(gender)
        ? draft.genders.filter((item) => item !== gender)
        : [...draft.genders, gender],
    });

  const toggleInterest = (interest: string) => {
    if (!entitlements.advancedFilters) {
      setPaywall(true);
      return;
    }
    patch({
      interests: draft.interests.includes(interest)
        ? draft.interests.filter((item) => item !== interest)
        : [...draft.interests, interest],
    });
  };

  return (
    <Screen>
      <View className="pt-safe-offset-3 flex-row items-center justify-between px-4 pb-2">
        <View>
          <Txt weight="semibold" className="text-foreground text-[17px]">
            篩選條件
          </Txt>
          <Txt className="text-muted text-[11px]">符合條件約 {matchCount} 人</Txt>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="重設條件"
            hitSlop={8}
            onPress={() => {
              resetFilters();
              setDraft(useDiscoverStore.getState().filters);
            }}
            className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
          >
            <RotateCcw color={NEON.amber} size={17} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="關閉"
            hitSlop={8}
            onPress={() => goBackOrReplace('/discover')}
            className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
          >
            <X color="#F6F1F8" size={18} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-7 px-4 pb-8">
        <View className="bg-surface border-border/60 gap-4 rounded-3xl border p-4">
          <Slider
            value={draft.ageRange}
            onChange={(value: number | number[]) => {
              const next = Array.isArray(value) ? value : [value];
              patch({ ageRange: [next[0] ?? 18, next[1] ?? next[0] ?? 70] });
            }}
            minValue={18}
            maxValue={70}
            step={1}
          >
            <View className="mb-2 flex-row items-center justify-between">
              <Label>年齡範圍</Label>
              <Txt weight="medium" className="text-accent text-[13px]">
                {draft.ageRange[0]} – {draft.ageRange[1]} 歲
              </Txt>
            </View>
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb index={0} />
              <Slider.Thumb index={1} />
            </Slider.Track>
          </Slider>
        </View>

        <View className="bg-surface border-border/60 gap-4 rounded-3xl border p-4">
          <Slider
            value={[draft.maxDistanceKm]}
            onChange={(value: number | number[]) => {
              const next = Array.isArray(value) ? value : [value];
              patch({ maxDistanceKm: next[0] ?? 30 });
            }}
            minValue={1}
            maxValue={200}
            step={1}
          >
            <View className="mb-2 flex-row items-center justify-between">
              <Label>最遠距離</Label>
              <Txt weight="medium" className="text-accent text-[13px]">
                {draft.maxDistanceKm} 公里
              </Txt>
            </View>
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb index={0} />
            </Slider.Track>
          </Slider>
        </View>

        <Section title="想看到的性別">
          <View className="flex-row gap-2">
            {(['female', 'male', 'nonbinary'] as Gender[]).map((gender) => (
              <Pressable
                key={gender}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: draft.genders.includes(gender) }}
                accessibilityLabel={GENDER_LABEL[gender]}
                onPress={() => toggleGender(gender)}
                className={cn(
                  'flex-1 items-center rounded-2xl border py-3 active:opacity-70',
                  draft.genders.includes(gender)
                    ? 'border-accent bg-accent/15'
                    : 'border-border/70 bg-surface',
                )}
              >
                <Txt
                  className={cn(
                    'text-[13px]',
                    draft.genders.includes(gender) ? 'text-accent' : 'text-foreground',
                  )}
                >
                  {GENDER_LABEL[gender]}
                </Txt>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="關係目標">
          <View className="flex-row flex-wrap gap-2">
            {(['不限', ...LOOKING_FOR_OPTIONS] as ('不限' | LookingFor)[]).map((option) => (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected: draft.lookingFor === option }}
                accessibilityLabel={option}
                onPress={() => patch({ lookingFor: option })}
                className={cn(
                  'rounded-full border px-3.5 py-2 active:opacity-70',
                  draft.lookingFor === option
                    ? 'border-accent bg-accent/15'
                    : 'border-border/70 bg-surface',
                )}
              >
                <Txt
                  className={cn(
                    'text-[13px]',
                    draft.lookingFor === option ? 'text-accent' : 'text-foreground',
                  )}
                >
                  {option}
                </Txt>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="顯示條件">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            <ToggleRow
              label="只看線上中的人"
              value={draft.onlineOnly}
              onChange={(value) => patch({ onlineOnly: value })}
            />
            <ToggleRow
              label="只看已通過真人認證"
              value={draft.verifiedOnly}
              onChange={(value) => patch({ verifiedOnly: value })}
            />
            <ToggleRow
              label="只看有照片的人"
              value={draft.withPhotoOnly}
              onChange={(value) => patch({ withPhotoOnly: value })}
              last
            />
          </View>
        </Section>

        <Section
          title="共同興趣"
          subtitle={
            entitlements.advancedFilters
              ? '選了之後只會看到有相同興趣的人'
              : '進階篩選需要 Plus 會員'
          }
          action={
            entitlements.advancedFilters ? undefined : (
              <View className="bg-glass border-border/60 flex-row items-center gap-1 rounded-full border px-2.5 py-1">
                <Lock color={NEON.amber} size={11} />
                <Txt className="text-neon-amber text-[10px]">Plus</Txt>
              </View>
            )
          }
        >
          <View
            className={cn(
              'flex-row flex-wrap gap-2',
              !entitlements.advancedFilters && 'opacity-55',
            )}
          >
            {INTEREST_OPTIONS.slice(0, 20).map((interest) => {
              const selected = draft.interests.includes(interest);
              return (
                <Pressable
                  key={interest}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={interest}
                  onPress={() => toggleInterest(interest)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 active:opacity-70',
                    selected ? 'border-accent bg-accent/15' : 'border-border/70 bg-surface',
                  )}
                >
                  <Txt className={cn('text-[12px]', selected ? 'text-accent' : 'text-foreground')}>
                    {interest}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
        </Section>
      </ScrollView>

      <View className="pb-safe-offset-4 px-4">
        <GlowButton
          label={`套用條件 · ${matchCount} 人`}
          size="lg"
          onPress={() => {
            setFilters(draft);
            router.back();
          }}
        />
      </View>

      <UpgradeSheet
        visible={paywall}
        onClose={() => setPaywall(false)}
        title="進階篩選是會員功能"
        description="用共同興趣篩選，第一句話就有題材可以聊。"
        bullets={['興趣、身高、星座篩選', '無限喜歡', '看見喜歡你的人', '回到上一位']}
      />
    </Screen>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  last = false,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center justify-between px-4 py-3.5',
        last ? '' : 'border-border/40 border-b',
      )}
    >
      <Txt className="text-foreground flex-1 text-[14px]">{label}</Txt>
      <Switch isSelected={value} onSelectedChange={onChange} />
    </View>
  );
}
