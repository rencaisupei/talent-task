import { ChevronLeft } from 'lucide-react-native';
import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Txt } from '@/components/ui/Txt';
import { goBackOrReplace } from '@/lib/navigation';
import { GAME } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  fallback?: Href;
  className?: string;
}

/** 遊戲子畫面的標題列，配色跟著遊戲城（暗黑底 + 白字）。 */
export function GameHeader({
  title,
  subtitle,
  right,
  fallback = '/(tabs)',
  className,
}: GameHeaderProps) {
  return (
    <View
      className={cn('pt-safe-offset-2 flex-row items-center gap-3 px-4 pb-3', className)}
      style={{ zIndex: 2 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="返回"
        hitSlop={8}
        onPress={() => goBackOrReplace(fallback)}
        className="border-game-line bg-game-card h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
      >
        <ChevronLeft color={GAME.text} size={22} />
      </Pressable>
      <View className="flex-1">
        <Txt weight="semibold" style={{ color: GAME.text, fontSize: 18 }} numberOfLines={1}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt style={{ color: GAME.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
    </View>
  );
}
