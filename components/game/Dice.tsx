import { useEffect } from 'react';
import { View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { GAME } from '@/lib/theme';

const PIPS: Record<number, boolean[]> = {
  1: [false, false, false, false, true, false, false, false, false],
  2: [true, false, false, false, false, false, false, false, true],
  3: [true, false, false, false, true, false, false, false, true],
  4: [true, false, true, false, false, false, true, false, true],
  5: [true, false, true, false, true, false, true, false, true],
  6: [true, false, true, true, false, true, true, false, true],
};

/** 骰面 3×3 的九個位置，用來當穩定的 key。 */
const SLOTS = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'] as const;

interface DiceProps {
  value: number;
  rolling: boolean;
  size?: number;
}

/** 擲骰子：滾動時旋轉，停下時顯示點數。 */
export function Dice({ value, rolling, size = 76 }: DiceProps) {
  const spin = useSharedValue(0);

  useEffect(() => {
    if (rolling) {
      spin.value = withRepeat(withTiming(1, { duration: 380, easing: Easing.linear }), -1, false);
    } else {
      spin.value = withTiming(0, { duration: 220 });
    }
  }, [rolling, spin]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }, { scale: 1 - spin.value * 0.08 }],
  }));

  const pips = PIPS[value] ?? PIPS[1];
  const pipSize = Math.round(size * 0.15);

  return (
    <AnimatedView
      accessibilityLabel={rolling ? '骰子滾動中' : `骰子點數 ${value}`}
      className="bg-game-raised border-game-line items-center justify-center border"
      style={[
        { width: size, height: size, borderRadius: size * 0.24, padding: size * 0.12 },
        style,
      ]}
    >
      <View className="h-full w-full flex-row flex-wrap justify-between">
        {SLOTS.map((slot, index) => (
          <View
            key={slot}
            className="items-center justify-center"
            style={{ width: '33%', height: '33%' }}
          >
            {pips[index] ? (
              <View
                style={{
                  width: pipSize,
                  height: pipSize,
                  borderRadius: pipSize / 2,
                  backgroundColor: GAME.gold,
                }}
              />
            ) : null}
          </View>
        ))}
      </View>
    </AnimatedView>
  );
}
