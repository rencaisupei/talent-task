import { Heart, RotateCcw, Star, X, Zap } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { GRADIENT, NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface ActionBarProps {
  onRewind: () => void;
  onPass: () => void;
  onSuperLike: () => void;
  onLike: () => void;
  onBoost: () => void;
  superLikesLeft: number;
  boostsLeft: number;
  rewindEnabled: boolean;
}

export function ActionBar({
  onRewind,
  onPass,
  onSuperLike,
  onLike,
  onBoost,
  superLikesLeft,
  boostsLeft,
  rewindEnabled,
}: ActionBarProps) {
  return (
    <View className="flex-row items-center justify-center gap-3">
      <SmallAction label="回到上一位" onPress={onRewind} disabled={!rewindEnabled}>
        <RotateCcw color={NEON.amber} size={20} />
      </SmallAction>

      <BigAction label="略過" onPress={onPass} colors={GRADIENT.nope}>
        <X color="#ffffff" size={28} />
      </BigAction>

      <BigAction
        label="超級喜歡"
        onPress={onSuperLike}
        colors={GRADIENT.superLike}
        badge={superLikesLeft}
      >
        <Star color="#ffffff" size={26} />
      </BigAction>

      <BigAction label="喜歡" onPress={onLike} colors={GRADIENT.brand}>
        <Heart color="#ffffff" size={28} fill="#ffffff" />
      </BigAction>

      <SmallAction label="開啟曝光加速" onPress={onBoost} badge={boostsLeft}>
        <Zap color={NEON.violet} size={20} />
      </SmallAction>
    </View>
  );
}

function BigAction({
  label,
  onPress,
  colors,
  children,
  badge,
}: {
  label: string;
  onPress: () => void;
  colors: readonly [string, string, ...string[]];
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="active:opacity-75"
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="h-16 w-16 items-center justify-center rounded-full"
      >
        {children}
      </LinearGradient>
      {typeof badge === 'number' ? <Badge value={badge} /> : null}
    </Pressable>
  );
}

function SmallAction({
  label,
  onPress,
  children,
  disabled,
  badge,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  badge?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'bg-glass border-border/70 h-12 w-12 items-center justify-center rounded-full border active:opacity-70',
        disabled && 'opacity-35',
      )}
    >
      {children}
      {typeof badge === 'number' ? <Badge value={badge} /> : null}
    </Pressable>
  );
}

function Badge({ value }: { value: number }) {
  return (
    <View className="bg-background border-border absolute -top-1 -right-1 min-w-5 items-center rounded-full border px-1.5 py-0.5">
      <Txt weight="semibold" className="text-foreground text-[10px]">
        {value > 99 ? '99+' : value}
      </Txt>
    </View>
  );
}
