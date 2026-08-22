import { useLocalSearchParams } from 'expo-router';
import { Button, Input, Label, Spinner, Switch, TextArea, TextField } from 'heroui-native';
import { ArrowLeft, Clock, Info } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { AiReviewCard } from '@/components/AiReviewCard';
import { FieldStatusBadge, RequiredFieldCard } from '@/components/FieldStatus';
import { EmptyState } from '@/components/SectionHeading';
import { SignInNotice } from '@/components/SignInNotice';
import { StaticTag } from '@/components/TagChip';
import { publishReviewFromAi, runAiReview } from '@/lib/aiReview';
import { requireSignIn } from '@/lib/authGuard';
import { COLORS } from '@/lib/colors';
import { formatCurrency } from '@/lib/format';
import { goBackOrReplace } from '@/lib/navigation';
import { myBidForGig, useBidStore } from '@/lib/stores/bids';
import { useGigStore } from '@/lib/stores/gigs';
import { useIsSignedIn, useMyUserId, useSessionStore } from '@/lib/stores/session';
import { type AiReviewResult, BID_ETA_OPTIONS, BUDGET_LEVELS } from '@/lib/types';
import { cn } from '@/lib/utils';

/** 提案說明的最低字數，同時決定「可以送出」與欄位狀態標籤。 */
const MIN_MESSAGE_LENGTH = 10;

export default function BidScreen() {
  const { gigId } = useLocalSearchParams<{ gigId: string }>();
  const gigs = useGigStore((state) => state.gigs);
  const loadState = useGigStore((state) => state.loadState);
  const bids = useBidStore((state) => state.bids);
  const submitBid = useBidStore((state) => state.submitBid);

  const userId = useMyUserId();
  const isSignedIn = useIsSignedIn();
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
  const [reviewing, setReviewing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [flagged, setFlagged] = useState<AiReviewResult | null>(null);

  if (!gig) {
    if (loadState === 'loading' || loadState === 'idle') {
      return (
        <View className="bg-background flex-1 items-center justify-center gap-3 px-6">
          <Spinner size="md" />
          <Text className="text-muted text-[13px]">正在讀取任務…</Text>
        </View>
      );
    }

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
  const quoteComplete = isNegotiable || (Number.isFinite(numericQuote) && numericQuote > 0);
  const messageLength = message.trim().length;
  const messageComplete = messageLength >= MIN_MESSAGE_LENGTH;
  const canSubmit = isSignedIn && messageComplete && quoteComplete;

  const missingLabels = [quoteComplete ? null : '報價', messageComplete ? null : '說明'].filter(
    (label): label is string => label !== null,
  );

  const handleSubmit = async () => {
    if (!canSubmit || reviewing) return;
    if (!requireSignIn()) return;
    setReviewing(true);
    setFlagged(null);
    setSubmitError(null);

    const ai = await runAiReview({
      target: 'gig',
      title: `提案：${gig.title}`,
      detail: message.trim(),
      tag: gig.tag,
      region,
      name: displayName,
      budgetLabel: isNegotiable ? '價格面議' : `報價 ${formatCurrency(numericQuote)}`,
    });
    const review = publishReviewFromAi(ai);

    const result = await submitBid({
      gig,
      talentId: userId,
      talentName: displayName,
      talentRegion: region,
      quote: isNegotiable ? null : numericQuote,
      etaLabel: eta,
      message: message.trim(),
      review,
    });

    setReviewing(false);

    if (result.status === 'error') {
      setSubmitError(result.message);
      return;
    }

    if (review.state === 'approved') {
      goBackOrReplace({ pathname: '/gig/[id]', params: { id: gig.id } });
      return;
    }
    setFlagged(ai);
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

        <RequiredFieldCard
          complete={quoteComplete}
          title="報價方式"
          completeLabel={isNegotiable ? '價格面議' : formatCurrency(numericQuote)}
          hint="請輸入報價金額，或改為「價格面議」。"
        >
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
        </RequiredFieldCard>

        <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 flex-row items-center gap-2">
              <Clock size={15} color={COLORS.coral} strokeWidth={2.2} />
              <Text className="text-ink text-[14px] font-semibold">可開始時間</Text>
            </View>
            <FieldStatusBadge complete completeLabel={eta} />
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

        <RequiredFieldCard
          complete={messageComplete}
          title="提案說明"
          caption={`至少 ${MIN_MESSAGE_LENGTH} 字，客戶會用這段內容決定要不要選你。`}
        >
          <TextArea
            value={message}
            onChangeText={setMessage}
            accessibilityLabel="提案說明"
            placeholder="說明施作方式、包含項目、保固與需要客戶準備的事項"
            numberOfLines={5}
            style={{ minHeight: 120 }}
          />
          <Text
            className={cn(
              'text-[12px] leading-4',
              messageComplete ? 'text-muted' : 'text-coral-strong font-semibold',
            )}
          >
            {messageComplete
              ? `已輸入 ${messageLength} 字`
              : `已輸入 ${messageLength} 字，還需要 ${MIN_MESSAGE_LENGTH - messageLength} 字`}
          </Text>
        </RequiredFieldCard>

        <View className="border-hairline bg-canvas flex-row items-start gap-2 rounded-xl border px-4 py-3">
          <Info size={15} color={COLORS.muted} strokeWidth={2.1} />
          <Text className="text-ink-soft flex-1 text-[12px] leading-5">
            投遞提案不佔用對話配額。提案送出前會經過即時認證，請勿提供銀行帳號或要求私下交易。
          </Text>
        </View>

        {isSignedIn ? null : (
          <SignInNotice
            title="投遞提案需要先登入"
            caption="提案會送到發案者的雲端任務上，並以你的帳號名稱顯示報價與可到場時間。"
          />
        )}

        {submitError ? (
          <View className="border-coral/25 bg-coral-soft rounded-xl border px-4 py-3">
            <Text className="text-coral text-[13px] leading-5">{submitError}</Text>
          </View>
        ) : null}

        {flagged ? (
          <View className="gap-3">
            <AiReviewCard result={flagged} title="提案已送交管理員複審" />
            <Text className="text-ink-soft text-[12px] leading-5">
              複審通過後客戶才會看到這份提案；你也可以修改內容後重新送出。
            </Text>
            <Button
              size="lg"
              variant="tertiary"
              onPress={() => goBackOrReplace({ pathname: '/gig/[id]', params: { id: gig.id } })}
            >
              <Button.Label>返回任務詳情</Button.Label>
            </Button>
          </View>
        ) : null}

        {reviewing ? (
          <View className="flex-row items-center justify-center gap-2">
            <Spinner size="sm" />
            <Text className="text-brand-strong text-[13px] font-semibold">即時認證中…</Text>
          </View>
        ) : null}

        <Button size="lg" isDisabled={!canSubmit || reviewing} onPress={() => void handleSubmit()}>
          <Button.Label>
            {reviewing
              ? '認證中…'
              : !isSignedIn
                ? '登入後即可投遞'
                : !canSubmit
                  ? `請完成：${missingLabels.join('、')}`
                  : existing
                    ? '認證並更新提案'
                    : '認證並送出提案'}
          </Button.Label>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
