import { ChevronRight, Dices } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { CheckerPattern } from '@/components/game/CheckerPattern';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { GAME, GRADIENT } from '@/lib/theme';

interface MonopolyBannerProps {
  onPress: () => void;
  /** 進行中的對象名字，沒有就顯示邀請文案。 */
  partnerName?: string;
  /** 心動值 0-100，用來畫進度條。 */
  affinity?: number;
}

/** 大富翁入口：橫幅寬卡，背景是棋盤格紋路，左邊骰子圖標。 */
export function MonopolyBanner({ onPress, partnerName, affinity = 0 }: MonopolyBannerProps) {
  const progress = Math.max(0, Math.min(100, affinity));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="進入大富翁棋盤"
      onPress={onPress}
      className="border-game-line overflow-hidden rounded-3xl border active:opacity-85"
    >
      <LinearGradient
        colors={GRADIENT.gameBoard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="w-full"
      >
        <CheckerPattern cell={26} rows={5} cols={20} opacity={0.9} />
        <LinearGradient
          colors={GRADIENT.gameRoom}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          className="absolute inset-0"
        />

        <View className="flex-row items-center gap-3 p-4">
          <LinearGradient
            colors={GRADIENT.game}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-14 w-14 items-center justify-center rounded-2xl"
          >
            <Dices color="#ffffff" size={28} />
          </LinearGradient>

          <View className="flex-1 gap-1">
            <Txt weight="bold" style={{ color: GAME.text, fontSize: 15 }}>
              大富翁：擲骰子踩格子解鎖真愛
            </Txt>
            <Txt style={{ color: GAME.muted, fontSize: 11 }} numberOfLines={1}>
              {partnerName
                ? `與 ${partnerName} 的棋局進行中 · 心動值 ${progress}/100`
                : '真心話、大冒險、代幣格，走到終點就能開聊天室'}
            </Txt>
            {partnerName ? (
              <View className="bg-game-base/70 mt-1 h-1.5 overflow-hidden rounded-full">
                <View
                  className="bg-game-pink h-full rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
            ) : null}
          </View>

          <ChevronRight color={GAME.muted} size={20} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
