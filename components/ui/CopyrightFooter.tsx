import { View } from 'react-native';

import { Txt } from '@/components/ui/Txt';
import { APP_VERSION, COPYRIGHT } from '@/lib/company';
import { GAME } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface CopyrightFooterProps {
  /** 'game' 使用遊戲城的獨立配色，其餘畫面用暖夜霓虹語意色。 */
  variant?: 'default' | 'game';
  /** 是否附上版本號那一行。 */
  showVersion?: boolean;
  className?: string;
}

const GAME_TEXT = { color: GAME.muted } as const;

/** 全站共用頁尾：公司版權宣告。 */
export function CopyrightFooter({
  variant = 'default',
  showVersion = false,
  className,
}: CopyrightFooterProps) {
  const isGame = variant === 'game';

  return (
    <View className={cn('items-center gap-1 px-6 pt-6 pb-4', className)}>
      <View
        className={cn('h-px w-16 rounded-full', isGame ? 'bg-game-line' : 'bg-border/60')}
        pointerEvents="none"
      />
      {showVersion ? (
        <Txt
          className={cn('mt-2 text-[10px]', isGame ? undefined : 'text-muted')}
          style={isGame ? GAME_TEXT : undefined}
        >
          JiMatch {APP_VERSION}
        </Txt>
      ) : null}
      <Txt
        className={cn('mt-1 text-center text-[11px] leading-4', isGame ? undefined : 'text-muted')}
        style={isGame ? GAME_TEXT : undefined}
      >
        {COPYRIGHT}
      </Txt>
    </View>
  );
}
