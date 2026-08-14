import { MapPin, X, Zap } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import MapView from '@/components/MapView';
import type { MapMarker, MapRegion } from '@/components/MapView.types';
import { EmptyState } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { formatRelativeTime } from '@/lib/format';
import { TAIWAN_VIEWPORT } from '@/lib/regions';
import { BUDGET_LEVELS, type Gig } from '@/lib/types';

interface GigMapPanelProps {
  gigs: Gig[];
  onOpenGig: (gigId: string) => void;
}

function toRegion(gigs: Gig[]): MapRegion {
  if (gigs.length === 0) return TAIWAN_VIEWPORT;

  const latitudes = gigs.map((gig) => gig.location.latitude ?? TAIWAN_VIEWPORT.latitude);
  const longitudes = gigs.map((gig) => gig.location.longitude ?? TAIWAN_VIEWPORT.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.08, (maxLat - minLat) * 1.5),
    longitudeDelta: Math.max(0.08, (maxLng - minLng) * 1.5),
  };
}

/** 地圖模式：以標記顯示全台急件位置。 */
export function GigMapPanel({ gigs, onOpenGig }: GigMapPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapHeight, setMapHeight] = useState(0);

  const located = useMemo(
    () =>
      gigs.filter(
        (gig) => gig.location.latitude !== undefined && gig.location.longitude !== undefined,
      ),
    [gigs],
  );

  const initialRegion = useMemo(() => toRegion(located), [located]);

  const markers = useMemo<MapMarker[]>(
    () =>
      located.map((gig) => ({
        id: gig.id,
        coordinate: {
          latitude: gig.location.latitude ?? TAIWAN_VIEWPORT.latitude,
          longitude: gig.location.longitude ?? TAIWAN_VIEWPORT.longitude,
        },
        title: gig.tag,
        description: gig.location.region,
        color: gig.isUrgent ? COLORS.coral : COLORS.brand,
      })),
    [located],
  );

  const selected = located.find((gig) => gig.id === selectedId);
  const budget = selected
    ? BUDGET_LEVELS.find((level) => level.id === selected.budgetLevel)
    : undefined;

  if (located.length === 0) {
    return (
      <View className="px-5 py-6">
        <EmptyState
          title="沒有可顯示的任務位置"
          caption="調整篩選條件後，符合條件的急件會標記在地圖上。"
          icon={<MapPin size={22} color={COLORS.brand} strokeWidth={2.1} />}
        />
      </View>
    );
  }

  return (
    <View className="flex-1" onLayout={(event) => setMapHeight(event.nativeEvent.layout.height)}>
      {mapHeight > 0 ? (
        <MapView
          style={{ width: '100%', height: mapHeight }}
          initialRegion={initialRegion}
          markers={markers}
          onMarkerPress={(marker) => setSelectedId(marker.id ?? null)}
          showsUserLocation={false}
        />
      ) : null}

      <View className="absolute top-3 left-4 flex-row items-center gap-2 rounded-xl bg-white/95 px-3 py-2">
        <Zap size={14} color={COLORS.coral} strokeWidth={2.2} />
        <Text className="text-ink-soft text-[12px] font-medium">
          橘色標記為急件・共 {located.length} 筆
        </Text>
      </View>

      {selected ? (
        <View className="border-hairline absolute right-4 bottom-4 left-4 rounded-xl border bg-white p-4">
          <View className="flex-row items-start gap-3">
            <View className="flex-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <StaticTag label={selected.tag} tone="brand" />
                {selected.isUrgent ? <StaticTag label="急件" tone="coral" /> : null}
              </View>
              <Text numberOfLines={2} className="text-ink mt-2 text-[15px] leading-5 font-semibold">
                {selected.title}
              </Text>
              <Text className="text-muted mt-1.5 text-[12px]">
                {selected.location.region}・{budget?.label}・
                {formatRelativeTime(selected.createdAt)}
              </Text>
            </View>
            <Pressable
              onPress={() => setSelectedId(null)}
              accessibilityRole="button"
              accessibilityLabel="關閉"
              className="bg-canvas h-8 w-8 items-center justify-center rounded-full"
            >
              <X size={15} color={COLORS.ink} strokeWidth={2.2} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => onOpenGig(selected.id)}
            accessibilityRole="button"
            className="bg-brand mt-3 items-center rounded-xl py-3"
          >
            <Text className="text-[14px] font-semibold text-white">查看任務詳情</Text>
          </Pressable>
        </View>
      ) : (
        <View className="absolute right-4 bottom-4 left-4 items-center rounded-xl bg-white/95 px-4 py-3">
          <Text className="text-ink-soft text-[12px]">點選地圖標記即可查看任務摘要</Text>
        </View>
      )}
    </View>
  );
}
