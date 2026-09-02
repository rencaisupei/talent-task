import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { Txt } from '@/components/ui/Txt';
import { GRADIENT } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface GlowButtonProps {
  label: string;
  onPress?: () => void;
  colors?: readonly [string, string, ...string[]];
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const HEIGHT = { sm: 'h-10', md: 'h-12', lg: 'h-14' } as const;
const TEXT = { sm: 'text-sm', md: 'text-[15px]', lg: 'text-base' } as const;

export function GlowButton({
  label,
  onPress,
  colors = GRADIENT.brand,
  icon,
  disabled = false,
  loading = false,
  size = 'md',
  className,
}: GlowButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'overflow-hidden rounded-full active:opacity-80',
        isDisabled && 'opacity-50',
        className,
      )}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className={cn('w-full flex-row items-center justify-center gap-2 px-6', HEIGHT[size])}
      >
        {loading ? <ActivityIndicator color="#ffffff" size="small" /> : icon}
        <Txt weight="semibold" className={cn('text-white', TEXT[size])}>
          {label}
        </Txt>
      </LinearGradient>
    </Pressable>
  );
}

interface OutlineButtonProps {
  label: string;
  onPress?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function OutlineButton({ label, onPress, icon, disabled, className }: OutlineButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'bg-glass border-border/70 h-12 flex-row items-center justify-center gap-2 rounded-full border px-6 active:opacity-70',
        disabled && 'opacity-50',
        className,
      )}
    >
      {icon}
      <Txt weight="medium" className="text-foreground text-[15px]">
        {label}
      </Txt>
    </Pressable>
  );
}

interface IconButtonProps {
  children: ReactNode;
  onPress?: () => void;
  label: string;
  className?: string;
  disabled?: boolean;
}

export function IconButton({ children, onPress, label, className, disabled }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70',
        disabled && 'opacity-40',
        className,
      )}
    >
      <View>{children}</View>
    </Pressable>
  );
}
