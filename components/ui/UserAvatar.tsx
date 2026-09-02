import { BadgeCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { Photo } from '@/components/ui/Photo';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { GRADIENT } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  online?: boolean;
  verified?: boolean;
  ring?: boolean;
  className?: string;
}

export function UserAvatar({
  uri,
  name,
  size = 48,
  online = false,
  verified = false,
  ring = false,
  className,
}: UserAvatarProps) {
  const inner = ring ? size - 5 : size;

  return (
    <View className={cn('relative', className)} style={{ width: size, height: size }}>
      {ring ? (
        <LinearGradient
          colors={GRADIENT.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0 items-center justify-center"
          style={{ borderRadius: size / 2 }}
        />
      ) : null}
      <View
        className="bg-surface-secondary absolute items-center justify-center overflow-hidden"
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          top: (size - inner) / 2,
          left: (size - inner) / 2,
        }}
      >
        {uri ? (
          <Photo uri={uri} width={inner} height={inner} radius={inner / 2} />
        ) : (
          <Txt weight="semibold" className="text-muted" style={{ fontSize: inner * 0.38 }}>
            {name?.slice(0, 1) ?? '?'}
          </Txt>
        )}
      </View>
      {online ? (
        <View
          className="bg-success border-background absolute right-0 bottom-0 rounded-full border-2"
          style={{ width: Math.max(10, size * 0.24), height: Math.max(10, size * 0.24) }}
        />
      ) : null}
      {verified && !online ? (
        <View className="bg-background absolute right-0 bottom-0 rounded-full">
          <BadgeCheck color="#5CD1EC" size={Math.max(14, size * 0.3)} />
        </View>
      ) : null}
    </View>
  );
}
