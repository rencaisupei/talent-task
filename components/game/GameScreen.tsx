import type { ReactNode } from 'react';
import { View } from 'react-native';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { GRADIENT } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface GameScreenProps {
  children: ReactNode;
  className?: string;
  /** 頂部橙 → 粉紫的漸層高度。 */
  glowHeight?: number;
}

/**
 * 遊戲城專用畫面外殼：沉浸式暗黑底 #121212，頂部由橙色過渡到粉紫。
 * 只有遊戲相關畫面使用這個 shell，其他畫面仍使用 components/ui/Screen。
 */
export function GameScreen({ children, className, glowHeight = 360 }: GameScreenProps) {
  return (
    <View className="bg-game-base flex-1">
      <LinearGradient
        colors={GRADIENT.gameGlow}
        className="absolute top-0 right-0 left-0"
        style={{ height: glowHeight }}
        pointerEvents="none"
      />
      <View className={cn('flex-1', className)}>{children}</View>
    </View>
  );
}
