import { useEffect } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Swords, Zap } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Txt } from '@/components/ui/Txt';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { STAMINA_COST } from '@/lib/data/games';
import { GAME } from '@/lib/theme';

const SIZE = 216;
const RING = 12;

interface QuickStartButtonProps {
  onPress: () => void;
  /** 體力不夠時仍可按，畫面會提示補體力。 */
  enoughStamina: boolean;
}

/** 中央核心：巨大圓形「極速開局」按鈕，外框帶旋轉漸層發光。 */
export function QuickStartButton({ onPress, enoughStamina }: QuickStartButtonProps) {
  const spin = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 5200, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse, spin]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + pulse.value * 0.34,
    transform: [{ scale: 1 + pulse.value * 0.08 }],
  }));

  return (
    <View className="items-center justify-center" style={{ width: SIZE + 40, height: SIZE + 40 }}>
      <AnimatedView
        pointerEvents="none"
        className="absolute"
        style={[
          {
            width: SIZE + 34,
            height: SIZE + 34,
            borderRadius: (SIZE + 34) / 2,
            backgroundColor: GAME.pink,
          },
          glowStyle,
        ]}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`極速開局，消耗 ${STAMINA_COST.quick} 點體力`}
        onPress={onPress}
        className="active:opacity-90"
        style={
          Platform.OS === 'web'
            ? undefined
            : {
                shadowColor: GAME.pink,
                shadowOpacity: 0.65,
                shadowRadius: 26,
                shadowOffset: { width: 0, height: 0 },
                elevation: 14,
              }
        }
      >
        <View
          className="items-center justify-center overflow-hidden"
          style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2 }}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: SIZE * 1.6,
                height: SIZE * 1.6,
                top: -SIZE * 0.3,
                left: -SIZE * 0.3,
              },
              ringStyle,
            ]}
          >
            <LinearGradient
              colors={[GAME.orange, GAME.pink, GAME.violet, GAME.orange]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          </Animated.View>

          <View
            className="bg-game-base absolute items-center justify-center"
            style={{
              width: SIZE - RING,
              height: SIZE - RING,
              borderRadius: (SIZE - RING) / 2,
            }}
          >
            <LinearGradient
              colors={['rgba(255,138,61,0.30)', 'rgba(255,79,154,0.20)', 'rgba(168,85,247,0.26)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="absolute inset-0"
              style={{ borderRadius: (SIZE - RING) / 2 }}
            />

            <View className="items-center gap-1.5 px-6">
              <Swords color={GAME.gold} size={30} />
              <Txt weight="bold" style={{ color: GAME.text, fontSize: 27, letterSpacing: 1 }}>
                極速開局
              </Txt>
              <View className="border-game-line bg-game-base/70 flex-row items-center gap-1 rounded-full border px-2.5 py-1">
                <Zap color={enoughStamina ? GAME.cyan : GAME.muted} size={12} />
                <Txt style={{ color: enoughStamina ? GAME.text : GAME.muted, fontSize: 11 }}>
                  {enoughStamina ? `消耗 ${STAMINA_COST.quick} 體力` : '體力不足'}
                </Txt>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
