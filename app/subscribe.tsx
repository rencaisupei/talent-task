import { useMemo, useState } from 'react';
import {
  Check,
  Crown,
  Eye,
  Filter,
  Heart,
  RotateCcw,
  Sparkles,
  Video,
  X,
  Zap,
} from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { Switch } from 'heroui-native';

import { FeatureHeader, FeatureRow, PlanCard } from '@/components/subscription/PlanCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { SUBSCRIPTION_PLANS } from '@/lib/data/seed';
import { STORE_LABEL, planForProductId } from '@/lib/iap';
import { goBackOrReplace } from '@/lib/navigation';
import { TIER_LABEL, useSubscriptionStore } from '@/lib/stores/subscription';
import { GRADIENT, NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';

const BENEFITS = [
  {
    icon: <Heart color={NEON.coral} size={17} />,
    title: '無限喜歡',
    body: '不再有每日 15 個的上限',
  },
  {
    icon: <Eye color={NEON.violet} size={17} />,
    title: '看見喜歡你的人',
    body: '直接互相配對，省下滑卡時間',
  },
  {
    icon: <Sparkles color={NEON.amber} size={17} />,
    title: '更多超級喜歡',
    body: 'Plus 每天 5 個、VIP 每天 10 個',
  },
  {
    icon: <Filter color={NEON.cyan} size={17} />,
    title: '進階篩選',
    body: '身高、星座、生活習慣都能篩',
  },
  {
    icon: <RotateCcw color={NEON.lime} size={17} />,
    title: '回到上一位',
    body: '滑錯了可以無限次救回來',
  },
  {
    icon: <Video color={NEON.rose} size={17} />,
    title: '視訊通話（VIP）',
    body: '見面前先確認彼此的感覺',
  },
  {
    icon: <Zap color={NEON.violet} size={17} />,
    title: '曝光加速',
    body: 'Plus 每月 1 次、VIP 每月 5 次',
  },
];

export default function SubscribeScreen() {
  const tier = useSubscriptionStore((state) => state.tier);
  const productId = useSubscriptionStore((state) => state.productId);
  const renewsAt = useSubscriptionStore((state) => state.renewsAt);
  const autoRenew = useSubscriptionStore((state) => state.autoRenew);
  const purchasingId = useSubscriptionStore((state) => state.purchasingId);
  const lastMessage = useSubscriptionStore((state) => state.lastMessage);
  const buyPlan = useSubscriptionStore((state) => state.buyPlan);
  const restore = useSubscriptionStore((state) => state.restore);
  const setAutoRenew = useSubscriptionStore((state) => state.setAutoRenew);
  const cancelSubscription = useSubscriptionStore((state) => state.cancelSubscription);
  const clearMessage = useSubscriptionStore((state) => state.clearMessage);

  const [selectedTier, setSelectedTier] = useState<'plus' | 'vip'>(tier === 'vip' ? 'vip' : 'plus');
  const plans = useMemo(
    () => SUBSCRIPTION_PLANS.filter((plan) => plan.tier === selectedTier),
    [selectedTier],
  );
  const [selectedPlanId, setSelectedPlanId] = useState(
    () => SUBSCRIPTION_PLANS.find((plan) => plan.popular && plan.tier === selectedTier)?.id ?? '',
  );

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];
  const currentPlan = planForProductId(productId);

  const changeTier = (next: 'plus' | 'vip') => {
    setSelectedTier(next);
    const popular = SUBSCRIPTION_PLANS.find((plan) => plan.tier === next && plan.popular);
    setSelectedPlanId(
      popular?.id ?? SUBSCRIPTION_PLANS.find((plan) => plan.tier === next)?.id ?? '',
    );
  };

  const purchase = async () => {
    if (!selectedPlan) return;
    const ok = await buyPlan(selectedPlan);
    if (ok) setSelectedTier(selectedPlan.tier);
  };

  return (
    <Screen glow={false}>
      <LinearGradient
        colors={selectedTier === 'vip' ? GRADIENT.vip : GRADIENT.plus}
        className="absolute top-0 right-0 left-0 h-72 opacity-25"
      />

      <View className="pt-safe-offset-3 flex-row items-center justify-between px-4 pb-2">
        <Txt weight="semibold" className="text-foreground text-[17px]">
          會員方案
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
        <View className="items-center gap-3 pt-2">
          <LinearGradient
            colors={selectedTier === 'vip' ? GRADIENT.vip : GRADIENT.plus}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-16 w-16 items-center justify-center rounded-3xl"
          >
            <Crown color="#ffffff" size={30} />
          </LinearGradient>
          <Txt weight="bold" className="text-foreground text-2xl">
            {selectedTier === 'vip' ? 'JiMatch VIP' : 'JiMatch Plus'}
          </Txt>
          <Txt className="text-muted text-center text-[13px] leading-5">
            {selectedTier === 'vip'
              ? '所有功能全開，含視訊通話、隱身瀏覽與優先曝光。'
              : '解鎖無限喜歡、看見喜歡你的人，配對效率明顯提升。'}
          </Txt>
        </View>

        {tier !== 'free' ? (
          <View className="border-accent/40 bg-accent/10 gap-3 rounded-3xl border p-4">
            <View className="flex-row items-center gap-2">
              <Check color={NEON.lime} size={16} />
              <Txt weight="semibold" className="text-foreground flex-1 text-[14px]">
                目前方案：{TIER_LABEL[tier]}
                {currentPlan ? ` · ${currentPlan.title}` : ''}
              </Txt>
            </View>
            {renewsAt ? (
              <Txt className="text-muted text-[12px]">
                {autoRenew ? '下次續訂' : '到期日'}：
                {new Date(renewsAt).toLocaleDateString('zh-TW')}
              </Txt>
            ) : null}
            <View className="flex-row items-center justify-between">
              <Txt className="text-foreground text-[13px]">自動續訂</Txt>
              <Switch isSelected={autoRenew} onSelectedChange={setAutoRenew} />
            </View>
            {autoRenew ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="取消訂閱"
                onPress={cancelSubscription}
                className="active:opacity-70"
              >
                <Txt className="text-muted text-[12px] underline">關閉自動續訂</Txt>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View className="bg-surface border-border/60 flex-row gap-1 rounded-full border p-1">
          {(['plus', 'vip'] as const).map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedTier === item }}
              accessibilityLabel={item === 'plus' ? 'Plus 方案' : 'VIP 方案'}
              onPress={() => changeTier(item)}
              className={cn(
                'flex-1 items-center rounded-full py-2.5 active:opacity-80',
                selectedTier === item ? 'bg-accent' : '',
              )}
            >
              <Txt
                weight={selectedTier === item ? 'semibold' : 'regular'}
                className={cn('text-[14px]', selectedTier === item ? 'text-white' : 'text-muted')}
              >
                {item === 'plus' ? 'Plus' : 'VIP'}
              </Txt>
            </Pressable>
          ))}
        </View>

        <View className="gap-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlan?.id === plan.id}
              onPress={() => setSelectedPlanId(plan.id)}
            />
          ))}
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

        <View className="gap-3">
          <GlowButton
            label={
              selectedPlan
                ? `以 ${selectedPlan.priceLabel} 訂閱${selectedPlan.tier === 'vip' ? ' VIP' : ' Plus'}`
                : '選擇方案'
            }
            size="lg"
            colors={selectedTier === 'vip' ? GRADIENT.vip : GRADIENT.plus}
            loading={purchasingId === selectedPlan?.id}
            disabled={!selectedPlan || purchasingId !== null}
            onPress={() => void purchase()}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="回復購買"
            onPress={() => void restore()}
            className="items-center py-1 active:opacity-70"
          >
            <Txt className="text-muted text-[13px]">回復購買</Txt>
          </Pressable>
        </View>

        <Section title="會員能做什麼">
          <View className="bg-surface border-border/60 gap-4 rounded-3xl border p-4">
            {BENEFITS.map((benefit) => (
              <View key={benefit.title} className="flex-row items-start gap-3">
                <View className="bg-glass border-border/60 h-9 w-9 items-center justify-center rounded-2xl border">
                  {benefit.icon}
                </View>
                <View className="flex-1">
                  <Txt weight="medium" className="text-foreground text-[14px]">
                    {benefit.title}
                  </Txt>
                  <Txt className="text-muted mt-0.5 text-[12px] leading-4">{benefit.body}</Txt>
                </View>
              </View>
            ))}
          </View>
        </Section>

        <Section title="方案比較">
          <View className="bg-surface border-border/60 rounded-3xl border px-3 pt-3 pb-1">
            <FeatureHeader />
            <FeatureRow label="每日喜歡" free="15" plus="無限" vip="無限" />
            <FeatureRow label="超級喜歡" free="1/天" plus="5/天" vip="10/天" />
            <FeatureRow label="誰喜歡我" free="—" plus="完整" vip="完整" />
            <FeatureRow label="訪客名單" free="—" plus="完整" vip="完整" />
            <FeatureRow label="已讀回執" free="—" plus="有" vip="有" />
            <FeatureRow label="視訊通話" free="—" plus="—" vip="無限" />
            <FeatureRow label="隱身瀏覽" free="—" plus="—" vip="有" />
            <FeatureRow label="曝光加速" free="—" plus="1/月" vip="5/月" />
            <FeatureRow label="優先推薦" free="—" plus="—" vip="有" />
          </View>
        </Section>

        <View className="bg-surface border-border/60 gap-2 rounded-3xl border p-4">
          <Txt weight="medium" className="text-foreground text-[13px]">
            關於自動續訂
          </Txt>
          <Txt className="text-muted text-[11px] leading-5">
            訂閱透過 {STORE_LABEL} 帳號收費，到期前 24 小時會自動續訂。你可以隨時在
            {STORE_LABEL} 的訂閱設定中關閉續訂，已付款期間仍可使用。
          </Txt>
          <Txt className="text-muted text-[11px] leading-5">
            商店產品代號：{SUBSCRIPTION_PLANS.map((plan) => plan.productId).join('、')}
          </Txt>
        </View>
      </ScrollView>
    </Screen>
  );
}
