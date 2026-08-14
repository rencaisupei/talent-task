import { useLocalSearchParams } from 'expo-router';
import { Button, Input, Label, Switch, TextArea, TextField } from 'heroui-native';
import { ArrowLeft, Clock, Info } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { formatCurrency } from '@/lib/format';
import { goBackOrReplace } from '@/lib/navigation';
import { myBidForGig, useBidStore } from '@/lib/stores/bids';
import { useGigStore } from '@/lib/stores/gigs';
import { useSessionStore } from '@/lib/stores/session';
import { BID_ETA_OPTIONS, BUDGET_LEVELS } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function BidScreen() {
  const { gigId } = useLocalSearchParams<{ gigId: string }>();
  const gigs = useGigStore((state) => state.gigs);
  const bids = useBidStore((state) => state.bids);
  const submitBid = useBidStore((state) => state.submitBid);

  const userId = useSessionStore((state) => state.userId);
  const displayName = useSessionStore((state) => state.displayName);
  const region = useSessionStore((state) => state.region);

  const gig = gigs.find((item) => item.id === gigId);
  const existing = useMemo(
    () => (gig ? myBidForGig(bids, gig.id, userId) : undefined),
    [bids, gig, userId],
  );

  const [isNegotiable, setNegotiable] = useState(existing?.quote === null);
  const [quote, setQuote] = useState(existing?.quote ? String(existing.quote) : '');
  const [eta, setEta] = useState<string>(existing?.etaLabel ?? BID_ETA_OPTIONS[0]);
  const [message, setMessage] = useState(existing?.message ?? '');

  if (!gig) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-6">
        <EmptyState title="找不到這筆任務" caption="任務可能已結案或被移除。" />
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          className="mt-4"
          accessibilityRole="button"
        >
          <Text className="text-brand-strong text-[14px] font-semibold">返回任務牆</Text>
        </Pressable>
      </View>
    );
  }

  const budget = BUDGET_LEVELS.find((level) => level.id === gig.budgetLevel);
  const numericQuote = Number(quote.replace(/[^\d]/g, ''));
  const canSubmit =
    message.trim().length >= 10 &&
    (isNegotiable || (Number.isFinite(numericQuote) && numericQuote > 0));

  const handleSubmit = () => {
    if (!canSubmit) {
      Alert.alert('提案還不完整', '請填寫報價（或選擇面議）並輸入至少 10 個字的說明。');
      return;
    }
    submitBid({
      gig,
      talentId: userId,
      talentName: displayName,
      talentRegion: region,
      quote: isNegotiable ? null : numericQuote,
      etaLabel: eta,
      message: message.trim(),
    });
    goBackOrReplace({ pathname: '/gig/[id]', params: { id: gig.id } });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="bg-background flex-1"
    >
      <View className="border-hairline pt-safe-offset-3 flex-row items-center gap-3 border-b bg-white px-5 pb-4">
        <Pressable
          onPress={() => goBackOrReplace({ pathname: '/gig/[id]', params: { id: gig.id } })}
          accessibilityRole="button"
          accessibilityLabel="返回"
          className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
        >
          <ArrowLeft size={18} color={COLORS.ink} strokeWidth={2.2} />
        </Pressable>
        <Text className="text-ink flex-1 text-[17px] font-semibold">
          {existing ? '修改提案' : '投遞提案'}
        </Text>
      </View>

      <ScrollView
        contentContainerClassName="px-5 py-5 gap-5 pb-12"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="border-hairline rounded-xl border bg-white p-4">
          <View className="flex-row flex-wrap items-center gap-2">
            <StaticTag label={gig.tag} tone="brand" />
            {gig.isUrgent ? <StaticTag label="急件" tone="coral" /> : null}
          </View>
          <Text className="text-ink mt-2.5 text-[16px] leading-6 font-semibold">{gig.title}</Text>
          <Text className="text-muted mt-1.5 text-[12px]">
            {gig.location.region}・客戶預算 {budget?.label}
          </Text>
        </View>

        <View className="border-hairline gap-4 rounded-xl border bg-white p-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-ink text-[14px] font-semibold">價格面議</Text>
              <Text className="text-muted mt-0.5 text-[12px]">需到場評估後才能報價時選擇</Text>
            </View>
            <Switch isSelected={isNegotiable} onSelectedChange={setNegotiable} />
          </View>

          {!isNegotiable ? (
            <TextField>
              <Label>報價金額（新台幣）</Label>
              <Input
                value={quote}
                onChangeText={setQuote}
                keyboardType="number-pad"
                placeholder="例如 3200"
              />
            </TextField>
          ) : null}

          {!isNegotiable && numericQuote > 0 ? (
            <Text className="text-brand-strong text-[13px] font-semibold">
              客戶看到的報價：{formatCurrency(numericQuote)}
            </Text>
          ) : null}
        </View>

        <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
          <View className="flex-row items-center gap-2">
            <Clock size={15} color={COLORS.coral} strokeWidth={2.2} />
            <Text className="text-ink text-[14px] font-semibold">可開始時間</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {BID_ETA_OPTIONS.map((option) => {
              const isActive = eta === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setEta(option)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  className={cn(
                    'rounded-xl border px-3.5 py-2.5',
                    isActive ? 'border-brand bg-brand' : 'border-hairline bg-canvas',
                  )}
                >
                  <Text
                    className={cn(
                      'text-[13px] font-semibold',
                      isActive ? 'text-white' : 'text-ink-soft',
                    )}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="border-hairline rounded-xl border bg-white p-4">
          <TextField>
            <Label>提案說明</Label>
            <TextArea
              value={message}
              onChangeText={setMessage}
              placeholder="說明施作方式、包含項目、保固與需要客戶準備的事項"
              numberOfLines={5}
              style={{ minHeight: 120 }}
            />
          </TextField>
          <Text className="text-muted mt-2 text-[12px]">
            已輸入 {message.trim().length} 字（至少 10 字）
          </Text>
        </View>

        <View className="border-hairline bg-canvas flex-row items-start gap-2 rounded-xl border px-4 py-3">
          <Info size={15} color={COLORS.muted} strokeWidth={2.1} />
          <Text className="text-ink-soft flex-1 text-[12px] leading-5">
            投遞提案不佔用對話配額。請勿在提案中提供銀行帳號或要求私下交易，所有內容皆會經伺服器端審核。
          </Text>
        </View>

        <Button size="lg" isDisabled={!canSubmit} onPress={handleSubmit}>
          <Button.Label>{existing ? '更新提案' : '送出提案'}</Button.Label>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
