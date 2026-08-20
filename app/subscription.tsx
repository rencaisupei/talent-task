import { router } from 'expo-router';
import { Button } from 'heroui-native';
import { Check, Crown, Infinity as InfinityIcon, X } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { ConfirmSheet } from '@/components/ConfirmSheet';
import { requireSignIn } from '@/lib/authGuard';
import { COLORS } from '@/lib/colors';
import { formatCurrency } from '@/lib/format';
import { SUBSCRIPTION_TERMS } from '@/lib/legalCopy';
import { goBackOrReplace } from '@/lib/navigation';
import {
  FREE_MONTHLY_CHAT_QUOTA,
  PREMIUM_PRICE_TWD,
  useIsPremium,
  useSessionStore,
} from '@/lib/stores/session';
import { cn } from '@/lib/utils';

const FREE_FEATURES = [
  `每月可與 ${FREE_MONTHLY_CHAT_QUOTA} 位不同對象開啟新對話（發案、接案雙向共用）`,
  '完整瀏覽全台任務牆',
  'AI 即時認證徽章',
];

const PREMIUM_FEATURES = [
  '無限開啟新對話，不再受每月配額限制',
  '任務牆推播優先排序',
  '個人檔案標籤優先曝光',
  '急件任務即時提醒',
];

export default function SubscriptionScreen() {
  const isPremium = useIsPremium();
  const remaining = useSessionStore((state) => state.chatQuotaRemaining);
  const activatePremium = useSessionStore((state) => state.activatePremium);
  const cancelPremium = useSessionStore((state) => state.cancelPremium);
  const [processing, setProcessing] = useState(false);
  const [confirmKind, setConfirmKind] = useState<'subscribe' | 'cancel' | null>(null);

  const storeName = Platform.OS === 'android' ? 'Google Play' : 'App Store';

  // 訂閱屬於帳號（登出後仍留在裝置上，但只對同一個帳號有效），
  // 因此訪客要先登入才能開通，否則會出現「已開通但畫面仍顯示免費版」的矛盾狀態。
  const handleSubscribe = () => {
    if (!requireSignIn()) return;
    setProcessing(true);
    setConfirmKind('subscribe');
  };

  const handleCancel = () => setConfirmKind('cancel');

  const handleConfirm = () => {
    if (confirmKind === 'subscribe') {
      activatePremium();
      setProcessing(false);
    }
    if (confirmKind === 'cancel') {
      cancelPremium();
    }
    setConfirmKind(null);
  };

  const handleDismiss = () => {
    setProcessing(false);
    setConfirmKind(null);
  };

  return (
    <View className="bg-background flex-1 justify-end">
      <View className="border-hairline max-h-full rounded-t-3xl border-t bg-white">
        <View className="flex-row items-center gap-3 px-5 pt-5 pb-3">
          <View className="bg-brand-soft h-10 w-10 items-center justify-center rounded-xl">
            <Crown size={19} color={COLORS.brandStrong} strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-ink text-[19px] font-bold tracking-tight">訂閱方案</Text>
            <Text className="text-muted mt-0.5 text-[12px]">
              {isPremium ? '你目前是進階版會員' : `本月剩餘新對話配額 ${remaining} 組`}
            </Text>
          </View>
          <Pressable
            onPress={() => goBackOrReplace('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="關閉"
            className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
          >
            <X size={17} color={COLORS.ink} strokeWidth={2.2} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerClassName="px-5 pb-4 gap-3"
          showsVerticalScrollIndicator={false}
        >
          <PlanCard
            title="基本版"
            price="免費"
            caption="適合偶爾接案"
            features={FREE_FEATURES}
            isActive={!isPremium}
          />

          <PlanCard
            title="進階版"
            price={`${formatCurrency(PREMIUM_PRICE_TWD)} / 月`}
            caption="無限對話，成交不受限"
            features={PREMIUM_FEATURES}
            isActive={isPremium}
            highlighted
          />

          <View className="border-hairline bg-canvas rounded-xl border px-4 py-3">
            <Text className="text-muted text-[11px] leading-4">{SUBSCRIPTION_TERMS}</Text>
          </View>
        </ScrollView>

        <View className="border-hairline pb-safe-or-5 gap-3 border-t px-5 pt-4">
          {isPremium ? (
            <>
              <Button size="lg" variant="tertiary" onPress={handleCancel}>
                <Button.Label>取消進階版訂閱</Button.Label>
              </Button>
              <Button size="lg" onPress={() => router.replace('/(tabs)')}>
                <Button.Label>回到任務牆</Button.Label>
              </Button>
            </>
          ) : (
            <Button size="lg" isDisabled={processing} onPress={handleSubscribe}>
              <Button.Label>{`訂閱進階版 ${formatCurrency(PREMIUM_PRICE_TWD)} / 月`}</Button.Label>
            </Button>
          )}
        </View>
      </View>

      <ConfirmSheet
        visible={confirmKind !== null}
        title={confirmKind === 'cancel' ? '取消進階版？' : `${storeName} 訂閱確認`}
        message={
          confirmKind === 'cancel'
            ? `取消後將回到免費版每月 ${FREE_MONTHLY_CHAT_QUOTA} 組新對話的限制。`
            : `人才速配 進階版 ${formatCurrency(PREMIUM_PRICE_TWD)} / 月，可隨時取消。`
        }
        actions={[
          {
            id: 'confirm',
            label: confirmKind === 'cancel' ? '確認取消' : '確認訂閱',
            tone: confirmKind === 'cancel' ? 'danger' : 'primary',
          },
        ]}
        cancelLabel={confirmKind === 'cancel' ? '保留進階版' : '取消'}
        onSelect={handleConfirm}
        onCancel={handleDismiss}
      />
    </View>
  );
}

interface PlanCardProps {
  title: string;
  price: string;
  caption: string;
  features: string[];
  isActive: boolean;
  highlighted?: boolean;
}

function PlanCard({ title, price, caption, features, isActive, highlighted }: PlanCardProps) {
  return (
    <View
      className={cn(
        'rounded-xl border bg-white p-4',
        highlighted ? 'border-brand' : 'border-hairline',
      )}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-ink text-[16px] font-bold tracking-tight">{title}</Text>
            {highlighted ? (
              <View className="bg-coral-soft flex-row items-center gap-1 rounded-lg px-2 py-0.5">
                <InfinityIcon size={12} color={COLORS.coral} strokeWidth={2.4} />
                <Text className="text-coral text-[11px] font-semibold">無限對話</Text>
              </View>
            ) : null}
          </View>
          <Text className="text-muted mt-1 text-[12px]">{caption}</Text>
        </View>
        <View className="items-end">
          <Text
            className={cn('text-[16px] font-bold', highlighted ? 'text-brand-strong' : 'text-ink')}
          >
            {price}
          </Text>
          {isActive ? (
            <Text className="text-brand-strong mt-1 text-[11px] font-semibold">目前方案</Text>
          ) : null}
        </View>
      </View>

      <View className="border-hairline mt-3 gap-2 border-t pt-3">
        {features.map((feature) => (
          <View key={feature} className="flex-row items-start gap-2">
            <Check size={15} color={highlighted ? COLORS.brand : COLORS.muted} strokeWidth={2.4} />
            <Text className="text-ink-soft flex-1 text-[13px] leading-5">{feature}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
