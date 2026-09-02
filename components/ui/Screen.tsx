import type { ReactNode } from 'react';
import { View } from 'react-native';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { GRADIENT } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface ScreenProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

/** Base screen shell: night background plus the brand glow bleeding from the top. */
export function Screen({ children, className, glow = true }: ScreenProps) {
  return (
    <View className="bg-background flex-1">
      {glow ? (
        <LinearGradient
          colors={GRADIENT.screenGlow}
          className="absolute top-0 right-0 left-0 h-80"
          pointerEvents="none"
        />
      ) : null}
      <View className={cn('flex-1', className)}>{children}</View>
    </View>
  );
}
