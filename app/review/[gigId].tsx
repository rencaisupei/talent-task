import { router, useLocalSearchParams } from 'expo-router';
import { Button, Label, TextArea, TextField } from 'heroui-native';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { RatingStars, StarRatingInput } from '@/components/RatingStars';
import { EmptyState } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { goBackOrReplace } from '@/lib/navigation';
import { useGigStore } from '@/lib/stores/gigs';
import { findReview, useReviewStore } from '@/lib/stores/reviews';
import { useSessionStore } from '@/lib/stores/session';
import type { UserRole } from '@/lib/types';

export default function ReviewScreen() {
  const { gigId } = useLocalSearchParams<{ gigId: string }>();
  const gigs = useGigStore((state) => state.gigs);
  const reviews = useReviewStore((state) => state.reviews);
  const addReview = useReviewStore((state) => state.addReview);

  const userId = useSessionStore((state) => state.userId);
  const displayName = useSessionStore((state) => state.displayName);

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');

  const gig = gigs.find((item) => item.id === gigId);

  if (!gig || gig.status !== 'completed') {
    return (
      <View className="bg-background flex-1 items-center justify-center px-6">
        <EmptyState title="尚無法評價" caption="任務標記完成後才能給出評價。" />
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          className="mt-4"
          accessibilityRole="button"
        >
          <Text className="text-brand-strong text-[14px] font-semibold">返回</Text>
        </Pressable>
      </View>
    );
  }

  const isClient = gig.clientId === userId;
  const target = isClient
    ? { id: gig.assignedTalentId, name: gig.assignedTalentName, role: 'talent' as UserRole }
    : { id: gig.clientId, name: gig.clientName, role: 'client' as UserRole };

  const existing = findReview(reviews, gig.id, userId);

  if (!target.id || !target.name || (!isClient && gig.assignedTalentId !== userId)) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-6">
        <EmptyState title="沒有可評價的對象" caption="此任務沒有已媒合的合作對象。" />
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          className="mt-4"
          accessibilityRole="button"
        >
          <Text className="text-brand-strong text-[14px] font-semibold">返回</Text>
        </Pressable>
      </View>
    );
  }

  const targetId = target.id;
  const targetName = target.name;

  const handleSubmit = () => {
    if (stars < 1) {
      Alert.alert('請先選擇星等', '至少給 1 顆星才能送出評價。');
      return;
    }
    addReview({
      gig,
      authorId: userId,
      authorName: displayName,
      targetId,
      targetName,
      targetRole: target.role,
      stars,
      comment,
    });
    router.replace({ pathname: '/gig/[id]', params: { id: gig.id } });
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
        <Text className="text-ink flex-1 text-[17px] font-semibold">給出評價</Text>
      </View>

      <ScrollView
        contentContainerClassName="px-5 py-5 gap-5 pb-12"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="border-hairline rounded-xl border bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="bg-brand-soft h-12 w-12 items-center justify-center rounded-xl">
              <Text className="text-brand-strong text-[18px] font-bold">
                {targetName.slice(0, 1)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-ink text-[16px] font-bold tracking-tight">{targetName}</Text>
              <Text className="text-muted mt-0.5 text-[12px]">
                {target.role === 'talent' ? '承接人才' : '需求客戶'}
              </Text>
            </View>
            <StaticTag label={gig.tag} tone="brand" />
          </View>
          <Text numberOfLines={2} className="text-ink-soft mt-3 text-[13px] leading-5">
            {gig.title}
          </Text>
        </View>

        {existing ? (
          <View className="border-hairline gap-2 rounded-xl border bg-white p-4">
            <Text className="text-ink text-[14px] font-semibold">你已評價過這筆任務</Text>
            <RatingStars value={existing.stars} size={15} />
            {existing.comment.length > 0 ? (
              <Text className="text-ink-soft text-[13px] leading-5">{existing.comment}</Text>
            ) : null}
            <Text className="text-muted text-[12px]">送出新的評價會覆蓋這筆紀錄。</Text>
          </View>
        ) : null}

        <View className="border-hairline gap-4 rounded-xl border bg-white p-4">
          <Text className="text-ink text-[15px] font-semibold">整體滿意度</Text>
          <StarRatingInput value={stars} onChange={setStars} />
        </View>

        <View className="border-hairline rounded-xl border bg-white p-4">
          <TextField>
            <Label>文字評價（選填）</Label>
            <TextArea
              value={comment}
              onChangeText={setComment}
              placeholder="描述準時度、專業度、溝通與收費是否符合約定"
              numberOfLines={5}
              style={{ minHeight: 110 }}
            />
          </TextField>
        </View>

        <View className="border-hairline bg-canvas flex-row items-start gap-2 rounded-xl border px-4 py-3">
          <ShieldCheck size={15} color={COLORS.brandStrong} strokeWidth={2.1} />
          <Text className="text-ink-soft flex-1 text-[12px] leading-5">
            評價會顯示在對方的公開檔案並計入信任度分數，請以實際合作經驗描述。
          </Text>
        </View>

        <Button size="lg" onPress={handleSubmit}>
          <Button.Label>送出評價</Button.Label>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
