import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/utils';

interface TagChipProps {
  label: string;
  isSelected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
}

/** 可選取標籤：選中時以純青色高亮。 */
export function TagChip({ label, isSelected, onPress, disabled, className }: TagChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled }}
      className={cn(
        'rounded-xl border px-3 py-2.5',
        isSelected ? 'border-brand bg-brand' : 'border-hairline bg-canvas',
        disabled && !isSelected ? 'opacity-40' : '',
        className,
      )}
    >
      <Text
        numberOfLines={2}
        className={cn(
          'text-[13px] leading-[18px]',
          isSelected ? 'font-semibold text-white' : 'text-ink-soft',
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface StaticTagProps {
  label: string;
  tone?: 'brand' | 'coral' | 'neutral';
}

export function StaticTag({ label, tone = 'neutral' }: StaticTagProps) {
  const toneClass =
    tone === 'brand'
      ? 'bg-brand-soft border-brand/20'
      : tone === 'coral'
        ? 'bg-coral-soft border-coral/20'
        : 'bg-canvas border-hairline';
  const textClass =
    tone === 'brand' ? 'text-brand-strong' : tone === 'coral' ? 'text-coral' : 'text-ink-soft';

  return (
    <View className={cn('rounded-lg border px-2.5 py-1', toneClass)}>
      <Text className={cn('text-[12px] font-medium', textClass)}>{label}</Text>
    </View>
  );
}
