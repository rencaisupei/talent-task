import { Coins, Gift, Sparkles, X, Zap } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { GlowButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { COIN_PACKS } from '@/lib/data/seed';
import { STORE_LABEL } from '@/lib/iap';
import { goBackOrReplace } from '@/lib/navigation';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { GRADIENT, NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';

const USES = [
  {
    icon: <Gift color={NEON.rose} size={16} />,
    label: '送禮物給配對',
    cost: '10 – 1200 心動代幣',
  },
  { icon: <Sparkles color={NEON.cyan} size={16} />, label: '單買超級喜歡', cost: '50 代幣 / 個' },
  { icon: <Zap color={NEON.violet} size={16} />, label: '遊戲城補體力', cost: '60 代幣 / 1 點' },
];

export default function CoinsScreen() {
  const coins = useSubscriptionStore((state) => state.coins);
  const purchasingId = useSubscriptionStore((state) => state.purchasingId);
  const lastMessage = useSubscriptionStore((state) => state.lastMessage);
  const buyCoins = useSubscriptionStore((state) => state.buyCoins);
  const clearMessage = useSubscriptionStore((state) => state.clearMessage);

  return (
    <Screen glow={false}>
      <LinearGradient
        colors={GRADIENT.coin}
        className="absolute top-0 right-0 left-0 h-64 opacity-20"
      />

      <View className="pt-safe-offset-3 flex-row items-center justify-between px-4 pb-2">
        <Txt weight="semibold" className="text-foreground text-[17px]">
          心動代幣加值
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="關閉"
          hitSlop={8}
          onPress={() => goBackOrReplace('/(tabs)/me')}
          className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
        >
          <X color="#F6F1F8" size={18} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-6 px-4 pb-10">
        <View className="items-center gap-2 pt-2">
          <LinearGradient
            colors={GRADIENT.coin}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-16 w-16 items-center justify-center rounded-3xl"
          >
            <Coins color="#ffffff" size={30} />
          </LinearGradient>
          <Txt weight="bold" className="text-foreground text-3xl">
            {coins}
          </Txt>
          <Txt className="text-muted text-[13px]">目前心動代幣餘額</Txt>
        </View>

        {lastMessage ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="關閉提示"
            onPress={clearMessage}
            className="rounded-2xl border border-[#2FD68A]/40 bg-[#2FD68A]/10 px-4 py-3 active:opacity-70"
          >
            <Txt className="text-foreground text-[12px]">{lastMessage}</Txt>
          </Pressable>
        ) : null}

        <Section title="選擇加值方案">
          <View className="flex-row flex-wrap gap-3">
            {COIN_PACKS.map((pack) => (
              <View
                key={pack.id}
                className={cn(
                  'w-[48%] gap-2 rounded-3xl border p-4',
                  pack.popular
                    ? 'border-neon-amber/60 bg-neon-amber/10'
                    : 'border-border/60 bg-surface',
                )}
              >
                {pack.popular ? (
                  <View className="bg-neon-amber/20 self-start rounded-full px-2 py-0.5">
                    <Txt weight="semibold" className="text-neon-amber text-[10px]">
                      最划算
                    </Txt>
                  </View>
                ) : null}
                <View className="flex-row items-center gap-1.5">
                  <Coins color={NEON.amber} size={16} />
                  <Txt weight="bold" className="text-foreground text-lg">
                    {pack.coins}
                  </Txt>
                </View>
                {pack.bonus > 0 ? (
                  <Txt className="text-neon-lime text-[11px]">加贈 {pack.bonus} 代幣</Txt>
                ) : (
                  <Txt className="text-muted text-[11px]">無加贈</Txt>
                )}
                <GlowButton
                  label={pack.priceLabel}
                  size="sm"
                  colors={GRADIENT.coin}
                  loading={purchasingId === pack.id}
                  disabled={purchasingId !== null}
                  onPress={() => void buyCoins(pack)}
                />
              </View>
            ))}
          </View>
        </Section>

        <Section title="心動代幣可以用在">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            {USES.map((use, index) => (
              <View
                key={use.label}
                className={cn(
                  'flex-row items-center gap-3 px-4 py-3.5',
                  index === USES.length - 1 ? '' : 'border-border/40 border-b',
                )}
              >
                <View className="bg-glass border-border/60 h-9 w-9 items-center justify-center rounded-2xl border">
                  {use.icon}
                </View>
                <Txt className="text-foreground flex-1 text-[14px]">{use.label}</Txt>
                <Txt className="text-muted text-[12px]">{use.cost}</Txt>
              </View>
            ))}
          </View>
        </Section>

        <View className="bg-surface border-border/60 gap-2 rounded-3xl border p-4">
          <Txt weight="medium" className="text-foreground text-[13px]">
            付款說明
          </Txt>
          <Txt className="text-muted text-[11px] leading-5">
            心動代幣屬於一次性消耗型商品，透過 {STORE_LABEL}{' '}
            收費，購買後不可退款也無法轉移到其他帳號。
          </Txt>
          <Txt className="text-muted text-[11px] leading-5">
            商店產品代號：{COIN_PACKS.map((pack) => pack.productId).join('、')}
          </Txt>
        </View>
      </ScrollView>
    </Screen>
  );
}
