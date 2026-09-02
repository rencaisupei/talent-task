import { useCallback, useRef, useState } from 'react';
import {
  Bell,
  ChevronLeft,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
  Zap,
} from 'lucide-react-native';
import { Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ActionBar } from '@/components/discover/ActionBar';
import { SwipeDeck, type SwipeDeckHandle } from '@/components/discover/SwipeDeck';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlowButton, IconButton, OutlineButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { UpgradeSheet } from '@/components/subscription/UpgradeSheet';
import { goBackOrReplace } from '@/lib/navigation';
import { useDiscoverQueue, useDiscoverStore } from '@/lib/stores/discover';
import { useUnreadNotificationCount } from '@/lib/stores/notifications';
import { useEntitlements, useSubscriptionStore } from '@/lib/stores/subscription';
import { NEON } from '@/lib/theme';
import type { Profile, SwipeDirection } from '@/lib/types';

type Paywall = 'likes' | 'super' | 'boost' | 'rewind' | null;

/** 經典滑卡（原探索頁）。現在從遊戲城或配對頁進入。 */
export default function DiscoverScreen() {
  const deckRef = useRef<SwipeDeckHandle>(null);
  const queue = useDiscoverQueue();
  const swipe = useDiscoverStore((state) => state.swipe);
  const rewind = useDiscoverStore((state) => state.rewind);
  const reshuffle = useDiscoverStore((state) => state.reshuffle);
  const startBoost = useDiscoverStore((state) => state.startBoost);
  const likesUsedToday = useDiscoverStore((state) => state.likesUsedToday);
  const historyLength = useDiscoverStore((state) => state.history.length);
  const boostUntil = useDiscoverStore((state) => state.boostUntil);

  const superLikesLeft = useSubscriptionStore((state) => state.superLikesLeft);
  const boostsLeft = useSubscriptionStore((state) => state.boostsLeft);
  const entitlements = useEntitlements();
  const unreadNotifications = useUnreadNotificationCount();

  const [paywall, setPaywall] = useState<Paywall>(null);

  const tap = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSwipe = useCallback(
    (direction: SwipeDirection, profile: Profile) => {
      const outcome = swipe(direction);
      if (outcome.kind === 'limit') {
        setPaywall('likes');
        return false;
      }
      if (outcome.kind === 'no-superlike') {
        setPaywall('super');
        return false;
      }
      if (outcome.kind === 'empty') return false;

      tap();
      if (outcome.matched) {
        setTimeout(() => router.push(`/match/${profile.id}`), 320);
      }
      return true;
    },
    [swipe, tap],
  );

  const boostActive = boostUntil !== null && boostUntil > Date.now();
  const likesLeft = entitlements.unlimitedLikes
    ? null
    : Math.max(0, entitlements.dailyLikeLimit - likesUsedToday);

  return (
    <Screen>
      <View className="pt-safe-offset-2 flex-row items-center gap-2 px-4 pb-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="返回遊戲城"
          hitSlop={8}
          onPress={() => goBackOrReplace('/(tabs)')}
          className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
        >
          <ChevronLeft color="#F6F1F8" size={22} />
        </Pressable>
        <Txt weight="bold" className="text-foreground flex-1 text-lg">
          經典滑卡
        </Txt>

        <IconButton label="搜尋" onPress={() => router.push('/search')}>
          <Search color={NEON.coral} size={18} />
        </IconButton>
        <IconButton label="附近的人" onPress={() => router.push('/nearby')}>
          <MapPin color={NEON.cyan} size={18} />
        </IconButton>
        <IconButton label="篩選條件" onPress={() => router.push('/filters')}>
          <SlidersHorizontal color={NEON.violet} size={18} />
        </IconButton>
        <View>
          <IconButton label="通知" onPress={() => router.push('/notifications')}>
            <Bell color={NEON.amber} size={18} />
          </IconButton>
          {unreadNotifications > 0 ? (
            <View className="bg-accent border-background absolute -top-0.5 -right-0.5 h-4 min-w-4 items-center justify-center rounded-full border px-1">
              <Txt weight="semibold" className="text-[9px] text-white">
                {unreadNotifications}
              </Txt>
            </View>
          ) : null}
        </View>
      </View>

      {boostActive ? (
        <View className="border-neon-violet/40 bg-neon-violet/10 mx-4 mb-2 flex-row items-center gap-2 rounded-2xl border px-3 py-2">
          <Zap color={NEON.violet} size={14} />
          <Txt className="text-foreground flex-1 text-[12px]">
            曝光加速中，接下來 30 分鐘你會出現在更多人的首頁
          </Txt>
        </View>
      ) : null}

      <View className="flex-1 px-4 pb-3">
        {queue.length > 0 ? (
          <SwipeDeck
            ref={deckRef}
            profiles={queue}
            onSwipe={handleSwipe}
            onOpenProfile={(profile) => router.push(`/profile/${profile.id}`)}
          />
        ) : (
          <View className="bg-surface border-border/60 flex-1 justify-center rounded-[32px] border">
            <EmptyState
              icon={<Users color={NEON.coral} size={26} />}
              title="這附近先看完了"
              description="放寬篩選條件，或稍後再回來看看有沒有新加入的人。"
              action={
                <View className="w-full gap-3">
                  <GlowButton label="調整篩選條件" onPress={() => router.push('/filters')} />
                  <OutlineButton label="重新整理牌組" onPress={reshuffle} />
                </View>
              }
            />
          </View>
        )}
      </View>

      <View className="pb-safe-offset-2 gap-2 px-4">
        <ActionBar
          rewindEnabled={historyLength > 0}
          superLikesLeft={superLikesLeft}
          boostsLeft={boostsLeft}
          onRewind={() => {
            if (!entitlements.rewind) {
              setPaywall('rewind');
              return;
            }
            if (rewind()) tap();
          }}
          onPass={() => deckRef.current?.swipe('left')}
          onSuperLike={() => deckRef.current?.swipe('up')}
          onLike={() => deckRef.current?.swipe('right')}
          onBoost={() => {
            if (!startBoost()) {
              setPaywall('boost');
              return;
            }
            tap();
          }}
        />

        {likesLeft !== null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="查看訂閱方案"
            onPress={() => router.push('/subscribe')}
            className="items-center py-1 active:opacity-70"
          >
            <Txt className="text-muted text-[11px]">
              今天還有 {likesLeft} 個喜歡 · 升級 Plus 可無限喜歡
            </Txt>
          </Pressable>
        ) : (
          <View className="items-center py-1">
            <Txt className="text-muted text-[11px]">無限喜歡已開啟</Txt>
          </View>
        )}
      </View>

      <UpgradeSheet
        visible={paywall === 'likes'}
        onClose={() => setPaywall(null)}
        title="今天的喜歡用完了"
        description="免費會員每天有 15 個喜歡。升級後不再受限，也能看到誰先喜歡你。"
        bullets={['無限喜歡', '看見喜歡你的人', '每天 5 個超級喜歡', '已讀回執']}
      />
      <UpgradeSheet
        visible={paywall === 'super'}
        onClose={() => setPaywall(null)}
        title="超級喜歡不夠了"
        description="超級喜歡會把你排到對方最前面，被回應的機率高出約三倍。"
        bullets={['Plus 每天 5 個', 'VIP 每天 10 個', '也可以用心動代幣單買']}
      />
      <UpgradeSheet
        visible={paywall === 'boost'}
        onClose={() => setPaywall(null)}
        title="曝光加速需要會員"
        description="加速期間你會被推到附近使用者的首頁前段，通常能帶來 10 倍瀏覽。"
        bullets={['Plus 每月 1 次', 'VIP 每月 5 次', '可查看加速成效報告']}
      />
      <UpgradeSheet
        visible={paywall === 'rewind'}
        onClose={() => setPaywall(null)}
        title="想把剛剛那位找回來？"
        description="回上一位是付費功能，滑錯的時候可以救回來。"
        bullets={['無限次回到上一位', '無限喜歡', '進階篩選條件']}
      />
    </Screen>
  );
}
