import { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import MapView from '@/components/MapView';
import { Photo } from '@/components/ui/Photo';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Txt } from '@/components/ui/Txt';
import { SEED_PROFILES } from '@/lib/data/seed';
import { activityLabel, distanceLabel } from '@/lib/format';
import { NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';

const RADIUS_OPTIONS = [2, 5, 10, 30] as const;

const ME_COORDS = { latitude: 25.0264, longitude: 121.5435 };

export default function NearbyScreen() {
  const [radius, setRadius] = useState<number>(10);

  const nearby = SEED_PROFILES.filter((profile) => profile.distanceKm <= radius).sort(
    (a, b) => a.distanceKm - b.distanceKm,
  );

  return (
    <Screen glow={false}>
      <ScreenHeader
        back
        fallback="/(tabs)"
        title="附近的人"
        subtitle={`${radius} 公里內有 ${nearby.length} 人`}
      />

      <View className="px-4 pb-3">
        <View className="flex-row gap-2">
          {RADIUS_OPTIONS.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: radius === option }}
              accessibilityLabel={`${option} 公里內`}
              onPress={() => setRadius(option)}
              className={cn(
                'flex-1 items-center rounded-full border py-2 active:opacity-70',
                radius === option ? 'border-accent bg-accent/15' : 'border-border/70 bg-surface',
              )}
            >
              <Txt className={cn('text-[12px]', radius === option ? 'text-accent' : 'text-muted')}>
                {option} km
              </Txt>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="border-border/60 mx-4 mb-4 h-64 overflow-hidden rounded-3xl border">
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            ...ME_COORDS,
            latitudeDelta: radius / 40,
            longitudeDelta: radius / 40,
          }}
          showsUserLocation
          circles={[
            {
              id: 'radius',
              center: ME_COORDS,
              radius: radius * 1000,
              fillColor: 'rgba(255,95,126,0.12)',
              strokeColor: NEON.coral,
              strokeWidth: 1,
            },
          ]}
          markers={nearby.map((profile) => ({
            id: profile.id,
            coordinate: profile.coords,
            title: `${profile.name}，${profile.age}`,
            description: `${profile.job} · ${distanceLabel(profile.distanceKm)}`,
            color: profile.online ? NEON.coral : NEON.violet,
            onPress: () => router.push(`/profile/${profile.id}`),
          }))}
        />
      </View>

      <ScrollView contentContainerClassName="gap-3 px-4 pb-8">
        {nearby.map((profile) => (
          <Pressable
            key={profile.id}
            accessibilityRole="button"
            accessibilityLabel={`查看 ${profile.name}`}
            onPress={() => router.push(`/profile/${profile.id}`)}
            className="bg-surface border-border/60 flex-row items-center gap-3 rounded-3xl border p-3 active:opacity-80"
          >
            <View className="overflow-hidden rounded-2xl">
              <Photo uri={profile.photos[0] ?? ''} width={60} height={72} radius={16} />
            </View>
            <View className="flex-1 gap-1">
              <View className="flex-row items-center gap-2">
                <Txt weight="semibold" className="text-foreground text-[15px]">
                  {profile.name}，{profile.age}
                </Txt>
                {profile.online ? <View className="bg-success h-2 w-2 rounded-full" /> : null}
              </View>
              <Txt className="text-muted text-[12px]" numberOfLines={1}>
                {profile.job} · {profile.district}
              </Txt>
              <Txt className="text-muted text-[11px]">
                {activityLabel(profile.online, profile.lastActiveMinutes)}
              </Txt>
            </View>
            <View className="items-end gap-1">
              <View className="flex-row items-center gap-1">
                <Navigation color={NEON.cyan} size={12} />
                <Txt weight="medium" className="text-neon-cyan text-[12px]">
                  {distanceLabel(profile.distanceKm)}
                </Txt>
              </View>
              <View className="flex-row items-center gap-1">
                <MapPin color="#8C8397" size={10} />
                <Txt className="text-muted text-[10px]">{profile.city}</Txt>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
