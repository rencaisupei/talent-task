import { useState } from 'react';
import {
  ScrollView,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { Photo } from '@/components/ui/Photo';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { GRADIENT } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface PhotoCarouselProps {
  photos: string[];
  height?: number;
}

export function PhotoCarousel({ photos, height = 460 }: PhotoCarouselProps) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / Math.max(1, width));
    if (next !== index) setIndex(next);
  };

  return (
    <View style={{ height }} className="bg-surface-secondary">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={32}
      >
        {photos.map((photo) => (
          <Photo key={photo} uri={photo} width={width} height={height} />
        ))}
      </ScrollView>

      <LinearGradient
        colors={GRADIENT.cardShade}
        className="absolute right-0 bottom-0 left-0 h-40"
        pointerEvents="none"
      />

      {photos.length > 1 ? (
        <View className="pt-safe-offset-2 absolute top-0 right-4 left-4 flex-row gap-1.5">
          {photos.map((photo, dotIndex) => (
            <View
              key={`dot-${photo}`}
              className={cn(
                'h-1 flex-1 rounded-full',
                dotIndex === index ? 'bg-white' : 'bg-white/30',
              )}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
