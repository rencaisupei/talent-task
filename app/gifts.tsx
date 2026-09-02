import { useState } from 'react';
import { Coins, X } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { GiftGlyph } from '@/components/ui/GiftGlyph';
import { GlowButton, OutlineButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { GIFTS } from '@/lib/data/seed';
import { goBackOrReplace } from '@/lib/navigation';
import { useChatStore } from '@/lib/stores/chat';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { GRADIENT, NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';

export default function GiftsScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId?: string }>();
  const coins = useSubscriptionStore((state) => state.coins);
  const spendCoins = useSubscriptionStore((state) => state.spendCoins);
  const sendGift = useChatStore((state) => state.sendGift);

  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gift = GIFTS.find((item) => item.id === selected);

  const send = () => {
    if (!gift) return;
    if (!conversationId) {
      setError('請先從聊天室進入才能送禮');
      return;
    }
    if (!spendCoins(gift.coins)) {
      setError('心動代幣不足，先加值再送禮');
      return;
    }
    sendGift(conversationId, gift.id);
    goBackOrReplace(`/chat/${conversationId}`);
  };

  return (
    <Screen glow={false}>
      <View className="pt-safe-offset-3 flex-row items-center justify-between px-4 pb-2">
        <View>
          <Txt weight="semibold" className="text-foreground text-[17px]">
            禮物商店
          </Txt>
          <Txt className="text-muted text-[11px]">
            {conversationId ? '選一個禮物送給對方' : '從聊天室進入可直接送出'}
          </Txt>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="心動代幣加值"
            onPress={() => router.push('/coins')}
            className="bg-glass border-border/60 flex-row items-center gap-1.5 rounded-full border px-3 py-2 active:opacity-70"
          >
            <Coins color={NEON.amber} size={14} />
            <Txt weight="medium" className="text-foreground text-[12px]">
              {coins}
            </Txt>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="關閉"
            hitSlop={8}
            onPress={() => goBackOrReplace('/(tabs)/messages')}
            className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
          >
            <X color="#F6F1F8" size={18} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-4 pb-8">
        <View className="flex-row flex-wrap gap-3">
          {GIFTS.map((item) => {
            const isSelected = selected === item.id;
            const affordable = coins >= item.coins;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${item.name}，${item.coins} 心動代幣`}
                onPress={() => {
                  setSelected(item.id);
                  setError(null);
                }}
                className={cn(
                  'w-[31%] items-center gap-2 rounded-3xl border py-4 active:opacity-80',
                  isSelected ? 'border-accent bg-accent/12' : 'border-border/60 bg-surface',
                  !affordable && 'opacity-45',
                )}
              >
                <GiftGlyph icon={item.icon} size={32} />
                <Txt className="text-foreground text-[13px]">{item.name}</Txt>
                <View className="flex-row items-center gap-1">
                  <Coins color={NEON.amber} size={11} />
                  <Txt className="text-muted text-[11px]">{item.coins}</Txt>
                </View>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <View className="border-danger/40 bg-danger/10 rounded-2xl border px-4 py-3">
            <Txt className="text-foreground text-[12px]">{error}</Txt>
          </View>
        ) : null}

        <View className="bg-surface border-border/60 gap-2 rounded-3xl border p-4">
          <Txt weight="medium" className="text-foreground text-[13px]">
            送禮小提醒
          </Txt>
          <Txt className="text-muted text-[11px] leading-5">
            禮物會顯示在聊天室，對方收到後會收到通知。開場就送大禮不一定加分，先聊幾句通常效果更好。
          </Txt>
        </View>
      </ScrollView>

      <View className="pb-safe-offset-4 gap-3 px-4">
        <GlowButton
          label={gift ? `送出${gift.name} · ${gift.coins} 代幣` : '選一個禮物'}
          size="lg"
          colors={GRADIENT.brand}
          disabled={!gift}
          onPress={send}
        />
        <OutlineButton label="代幣不夠？前往加值" onPress={() => router.push('/coins')} />
      </View>
    </Screen>
  );
}
