import { BadgeCheck, Info, MapPin, Sparkles } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Photo } from '@/components/ui/Photo';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { activityLabel, distanceLabel } from '@/lib/format';
import { GRADIENT, NEON } from '@/lib/theme';
import type { Profile } from '@/lib/types';

interface SwipeCardProps {
  profile: Profile;
  onOpenProfile?: () => void;
  photoIndex?: number;
}

export function SwipeCard({ profile, onOpenProfile, photoIndex = 0 }: SwipeCardProps) {
  const photo = profile.photos[photoIndex] ?? profile.photos[0] ?? '';

  return (
    <View className="bg-surface border-border/50 flex-1 overflow-hidden rounded-[32px] border">
      <Photo uri={photo} width="100%" height="100%" />

      <LinearGradient
        colors={GRADIENT.cardShade}
        className="absolute right-0 bottom-0 left-0 h-2/3"
      />

      <View className="absolute top-4 right-4 left-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          {profile.online ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1.5">
              <View className="bg-success h-2 w-2 rounded-full" />
              <Txt className="text-[11px] text-white">線上中</Txt>
            </View>
          ) : null}
          {profile.isPlus ? (
            <LinearGradient
              colors={GRADIENT.plus}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-full px-2.5 py-1.5"
            >
              <Txt weight="semibold" className="text-[11px] text-white">
                Plus
              </Txt>
            </LinearGradient>
          ) : null}
        </View>

        <View className="flex-row items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1.5">
          <Sparkles color={NEON.amber} size={13} />
          <Txt weight="semibold" className="text-[11px] text-white">
            契合 {profile.vibeScore}%
          </Txt>
        </View>
      </View>

      <View className="absolute right-0 bottom-0 left-0 gap-3 p-5">
        <View className="flex-row items-end justify-between gap-3">
          <View className="flex-1 gap-1.5">
            <View className="flex-row items-center gap-2">
              <Txt weight="bold" className="text-2xl text-white" numberOfLines={1}>
                {profile.name}
              </Txt>
              <Txt className="text-xl text-white/85">{profile.age}</Txt>
              {profile.verified ? <BadgeCheck color={NEON.cyan} size={20} /> : null}
            </View>

            <Txt className="text-[13px] text-white/85" numberOfLines={1}>
              {profile.job} · {profile.district}
            </Txt>

            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <MapPin color="rgba(255,255,255,0.75)" size={12} />
                <Txt className="text-[11px] text-white/75">{distanceLabel(profile.distanceKm)}</Txt>
              </View>
              <Txt className="text-[11px] text-white/75">
                {activityLabel(profile.online, profile.lastActiveMinutes)}
              </Txt>
            </View>
          </View>

          {onOpenProfile ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`查看 ${profile.name} 的完整檔案`}
              onPress={onOpenProfile}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/15 active:opacity-70"
            >
              <Info color="#ffffff" size={20} />
            </Pressable>
          ) : null}
        </View>

        <View className="flex-row flex-wrap gap-2">
          {profile.interests.slice(0, 4).map((interest) => (
            <View
              key={interest}
              className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1"
            >
              <Txt className="text-[11px] text-white">{interest}</Txt>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
