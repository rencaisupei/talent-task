import type { ReactNode } from 'react';
import type { Href } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useThemeColor } from 'heroui-native';

import { Txt } from '@/components/ui/Txt';
import { goBackOrReplace } from '@/lib/navigation';
import { cn } from '@/lib/utils';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  back?: boolean;
  fallback?: Href;
  right?: ReactNode;
  left?: ReactNode;
  className?: string;
  border?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  back = false,
  fallback = '/(tabs)',
  right,
  left,
  className,
  border = false,
}: ScreenHeaderProps) {
  const [foreground] = useThemeColor(['foreground']);

  return (
    <View
      className={cn(
        'pt-safe-offset-2 flex-row items-center gap-3 px-4 pb-3',
        border && 'border-border/60 border-b',
        className,
      )}
    >
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="返回"
          hitSlop={8}
          onPress={() => goBackOrReplace(fallback)}
          className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
        >
          <ChevronLeft color={foreground} size={22} />
        </Pressable>
      ) : null}
      {left}
      <View className="flex-1">
        {title ? (
          <Txt weight="semibold" className="text-foreground text-[19px]" numberOfLines={1}>
            {title}
          </Txt>
        ) : null}
        {subtitle ? (
          <Txt className="text-muted mt-0.5 text-xs" numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
    </View>
  );
}
