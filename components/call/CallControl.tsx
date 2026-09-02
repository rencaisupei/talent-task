import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Txt } from '@/components/ui/Txt';
import { cn } from '@/lib/utils';

interface CallControlProps {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}

export function CallControl({
  label,
  icon,
  onPress,
  active = false,
  disabled = false,
}: CallControlProps) {
  return (
    <View className="w-20 items-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: active, disabled }}
        onPress={onPress}
        disabled={disabled}
        className={cn(
          'h-16 w-16 items-center justify-center rounded-full border active:opacity-70',
          active ? 'border-white bg-white' : 'border-white/20 bg-white/12',
          disabled && 'opacity-40',
        )}
      >
        {icon}
      </Pressable>
      <Txt className="text-center text-[11px] text-white/75">{label}</Txt>
    </View>
  );
}
