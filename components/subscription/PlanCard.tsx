import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { GRADIENT } from '@/lib/theme';
import type { SubscriptionPlan } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  plan: SubscriptionPlan;
  selected: boolean;
  onPress: () => void;
}

export function PlanCard({ plan, selected, onPress }: PlanCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${plan.title} ${plan.priceLabel}`}
      onPress={onPress}
      className={cn(
        'rounded-3xl border p-4 active:opacity-80',
        selected ? 'border-accent bg-accent/12' : 'border-border/60 bg-surface',
      )}
    >
      <View className="flex-row items-center gap-3">
        <View
          className={cn(
            'h-6 w-6 items-center justify-center rounded-full border-2',
            selected ? 'border-accent bg-accent' : 'border-border',
          )}
        >
          {selected ? <Check color="#ffffff" size={14} /> : null}
        </View>

        <View className="flex-1 gap-0.5">
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <Txt weight="semibold" className="text-foreground text-[15px]">
              {plan.title}
            </Txt>
            {plan.popular ? (
              <LinearGradient
                colors={GRADIENT.vip}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-full px-2 py-0.5"
              >
                <Txt weight="semibold" className="text-[10px] text-white">
                  最熱門
                </Txt>
              </LinearGradient>
            ) : null}
          </View>
          <Txt className="text-muted text-xs" numberOfLines={1}>
            {plan.perMonthLabel}
          </Txt>
        </View>

        <View className="shrink-0 items-end gap-0.5">
          <Txt weight="bold" className="text-foreground text-base" numberOfLines={1}>
            {plan.priceLabel}
          </Txt>
          {plan.savingLabel ? (
            <Txt weight="medium" className="text-neon-lime text-[11px]" numberOfLines={1}>
              {plan.savingLabel}
            </Txt>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

interface FeatureRowProps {
  label: string;
  free: string;
  plus: string;
  vip: string;
}

/**
 * 比較表用固定欄寬而不是彈性比例：中文欄名在小螢幕或系統放大字體時，
 * 用比例分欄會把最後幾欄推出畫面。
 */
const VALUE_COL = 'w-[52px] shrink-0 text-center';

export function FeatureHeader() {
  return (
    <View className="border-border/40 flex-row items-center border-b pb-2">
      <Txt className="text-muted flex-1 pr-2 text-[11px]" numberOfLines={1}>
        功能
      </Txt>
      <Txt className={cn('text-muted text-[11px]', VALUE_COL)} numberOfLines={1}>
        免費
      </Txt>
      <Txt className={cn('text-muted text-[11px]', VALUE_COL)} numberOfLines={1}>
        Plus
      </Txt>
      <Txt className={cn('text-muted text-[11px]', VALUE_COL)} numberOfLines={1}>
        VIP
      </Txt>
    </View>
  );
}

export function FeatureRow({ label, free, plus, vip }: FeatureRowProps) {
  return (
    <View className="border-border/40 flex-row items-center border-b py-3">
      <Txt className="text-foreground flex-1 pr-2 text-[13px]" numberOfLines={2}>
        {label}
      </Txt>
      <Txt className={cn('text-muted text-[12px]', VALUE_COL)} numberOfLines={1}>
        {free}
      </Txt>
      <Txt className={cn('text-foreground text-[12px]', VALUE_COL)} numberOfLines={1}>
        {plus}
      </Txt>
      <Txt
        weight="medium"
        className={cn('text-neon-amber text-[12px]', VALUE_COL)}
        numberOfLines={1}
      >
        {vip}
      </Txt>
    </View>
  );
}
