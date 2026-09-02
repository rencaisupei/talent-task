import { useCallback, useEffect, useImperativeHandle, useState, type Ref } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { SwipeCard } from '@/components/discover/SwipeCard';
import { Txt } from '@/components/ui/Txt';
import { NEON } from '@/lib/theme';
import type { Profile, SwipeDirection } from '@/lib/types';

export interface SwipeDeckHandle {
  swipe: (direction: SwipeDirection) => void;
}

interface SwipeDeckProps {
  profiles: Profile[];
  /** Returns true when the swipe was accepted; false springs the card back. */
  onSwipe: (direction: SwipeDirection, profile: Profile) => boolean;
  onOpenProfile: (profile: Profile) => void;
  ref?: Ref<SwipeDeckHandle>;
}

const SWIPE_X = 110;
const SWIPE_Y = 130;

interface ExitState {
  key: string;
  profile: Profile;
  direction: SwipeDirection;
  fromX: number;
  fromY: number;
}

export function SwipeDeck({ profiles, onSwipe, onOpenProfile, ref }: SwipeDeckProps) {
  const { width, height } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [exiting, setExiting] = useState<ExitState | null>(null);

  const top = profiles[0];
  const second = profiles[1];
  const third = profiles[2];

  const reset = useCallback(() => {
    translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
  }, [translateX, translateY]);

  const commit = useCallback(
    (direction: SwipeDirection, fromX: number, fromY: number) => {
      if (!top) return;
      const accepted = onSwipe(direction, top);
      if (!accepted) {
        reset();
        return;
      }
      setExiting({ key: `${top.id}-${Date.now()}`, profile: top, direction, fromX, fromY });
      translateX.value = 0;
      translateY.value = 0;
    },
    [onSwipe, reset, top, translateX, translateY],
  );

  useImperativeHandle(ref, () => ({ swipe: (direction) => commit(direction, 0, 0) }), [commit]);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationY < -SWIPE_Y && Math.abs(event.translationX) < SWIPE_X) {
        runOnJS(commit)('up', event.translationX, event.translationY);
        return;
      }
      if (event.translationX > SWIPE_X) {
        runOnJS(commit)('right', event.translationX, event.translationY);
        return;
      }
      if (event.translationX < -SWIPE_X) {
        runOnJS(commit)('left', event.translationX, event.translationY);
        return;
      }
      translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${translateX.value / 22}deg` },
    ],
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, translateX.value / 90)),
  }));
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, -translateX.value / 90)),
  }));
  const superStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, -translateY.value / 110)),
  }));

  const clearExit = useCallback(() => setExiting(null), []);

  if (!top) return null;

  return (
    <View className="flex-1">
      {third ? (
        <View
          style={[StyleSheet.absoluteFill, { transform: [{ scale: 0.92 }, { translateY: 26 }] }]}
          pointerEvents="none"
        >
          <SwipeCard profile={third} />
        </View>
      ) : null}

      {second ? (
        <View
          style={[StyleSheet.absoluteFill, { transform: [{ scale: 0.96 }, { translateY: 13 }] }]}
          pointerEvents="none"
        >
          <SwipeCard profile={second} />
        </View>
      ) : null}

      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, cardStyle]}>
          <SwipeCard profile={top} onOpenProfile={() => onOpenProfile(top)} />
          <Animated.View style={[styles.stamp, styles.stampLeft, likeStyle]} pointerEvents="none">
            <Txt weight="bold" style={[styles.stampText, { color: NEON.lime }]}>
              喜歡
            </Txt>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampRight, nopeStyle]} pointerEvents="none">
            <Txt weight="bold" style={[styles.stampText, { color: '#9AA0AE' }]}>
              略過
            </Txt>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampTop, superStyle]} pointerEvents="none">
            <Txt weight="bold" style={[styles.stampText, { color: NEON.cyan }]}>
              超級喜歡
            </Txt>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {exiting ? (
        <ExitCard
          key={exiting.key}
          state={exiting}
          width={width}
          height={height}
          onDone={clearExit}
        />
      ) : null}
    </View>
  );
}

function ExitCard({
  state,
  width,
  height,
  onDone,
}: {
  state: ExitState;
  width: number;
  height: number;
  onDone: () => void;
}) {
  const x = useSharedValue(state.fromX);
  const y = useSharedValue(state.fromY);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const targetX =
      state.direction === 'left'
        ? -width * 1.3
        : state.direction === 'right'
          ? width * 1.3
          : state.fromX;
    const targetY = state.direction === 'up' ? -height : state.fromY + 60;

    x.value = withTiming(targetX, { duration: 280 });
    y.value = withTiming(targetY, { duration: 280 });
    opacity.value = withTiming(0, { duration: 280 });

    const timer = setTimeout(onDone, 290);
    return () => clearTimeout(timer);
  }, [height, onDone, opacity, state.direction, state.fromX, state.fromY, width, x, y]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${x.value / 22}deg` }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <SwipeCard profile={state.profile} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    position: 'absolute',
    borderWidth: 4,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stampText: {
    fontSize: 24,
    letterSpacing: 3,
  },
  stampLeft: {
    top: 44,
    left: 24,
    borderColor: NEON.lime,
    transform: [{ rotate: '-14deg' }],
  },
  stampRight: {
    top: 44,
    right: 24,
    borderColor: '#9AA0AE',
    transform: [{ rotate: '14deg' }],
  },
  stampTop: {
    bottom: 140,
    alignSelf: 'center',
    borderColor: NEON.cyan,
  },
});
