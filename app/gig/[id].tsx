import { router, useLocalSearchParams } from 'expo-router';
import { Button } from 'heroui-native';
import { ArrowLeft, BadgeCheck, MapPin, MessageSquarePlus, Star, Zap } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import MapView from '@/components/MapView';
import { ChatQuotaPill } from '@/components/ChatQuotaPill';
import { StaticTag } from '@/components/TagChip';
import { EmptyState, SectionHeading } from '@/components/SectionHeading';
import { COLORS } from '@/lib/colors';
import { formatRelativeTime } from '@/lib/format';
import { goBackOrReplace } from '@/lib/navigation';
import { findCategoryById } from '@/lib/omniTags';
import { SEED_TALENTS } from '@/lib/seed';
import { useChatStore } from '@/lib/stores/chat';
import { useGigStore } from '@/lib/stores/gigs';
import { useSessionStore } from '@/lib/stores/session';
import { BUDGET_LEVELS } from '@/lib/types';

export default function GigDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const gigs = useGigStore((state) => state.gigs);
  const markTalking = useGigStore((state) => state.markTalking);
  const closeGig = useGigStore((state) => state.closeGig);

  const role = useSessionStore((state) => state.role);
  const userId = useSessionStore((state) => state.userId);
  const displayName = useSessionStore((state) => state.displayName);
  const requestChatWith = useSessionStore((state) => state.requestChatWith);

  const startConversation = useChatStore((state) => state.startConversation);

  const gig = gigs.find((item) => item.id === id);

  const recommendedTalents = useMemo(() => {
    if (!gig) return [];
    const exact = SEED_TALENTS.filter((talent) => talent.tags.includes(gig.tag));
    const sameRegion = SEED_TALENTS.filter(
      (talent) => talent.region === gig.location.region && !exact.includes(talent),
    );
    return [...exact, ...sameRegion].slice(0, 4);
  }, [gig]);

  if (!gig) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-6">
        <EmptyState title="找不到這筆任務" caption="任務可能已結案或被移除。" />
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          className="mt-4"
          accessibilityRole="button"
        >
          <Text className="text-brand-strong text-[14px] font-semibold">返回列表</Text>
        </Pressable>
      </View>
    );
  }

  const budget = BUDGET_LEVELS.find((level) => level.id === gig.budgetLevel);
  const category = findCategoryById(gig.categoryId);
  const isOwner = gig.clientId === userId;

  const handleTalentOpenChat = () => {
    const result = requestChatWith(gig.clientId);
    if (result === 'blocked') {
      router.push('/subscription');
      return;
    }
    const conversationId = startConversation({
      gig,
      talentId: userId,
      talentName: displayName,
      openingMessage: `您好，我可以承接「${gig.tag}」這項任務，方便說明現場細節嗎？`,
    });
    markTalking(gig.id);
    router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
  };

  const handleClientOpenChat = (talentId: string, talentName: string) => {
    const conversationId = startConversation({
      gig,
      talentId,
      talentName,
      openingMessage: `您好，我發布了「${gig.tag}」的任務，想請您評估。`,
    });
    markTalking(gig.id);
    router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
  };

  const handleClose = () => {
    Alert.alert('結案這筆任務？', '結案後將不再出現在人才任務牆。', [
      { text: '取消', style: 'cancel' },
      {
        text: '確認結案',
        style: 'destructive',
        onPress: () => {
          closeGig(gig.id);
          goBackOrReplace('/(tabs)');
        },
      },
    ]);
  };

  return (
    <View className="bg-background flex-1">
      <View className="border-hairline pt-safe-offset-3 flex-row items-center gap-3 border-b bg-white px-5 pb-4">
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="返回"
          className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
        >
          <ArrowLeft size={18} color={COLORS.ink} strokeWidth={2.2} />
        </Pressable>
        <Text className="text-ink flex-1 text-[17px] font-semibold">任務詳情</Text>
        {gig.isUrgent ? <StaticTag label="急件" tone="coral" /> : null}
      </View>

      <ScrollView
        contentContainerClassName="px-5 py-5 gap-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="border-hairline rounded-xl border bg-white p-4">
          <View className="flex-row flex-wrap items-center gap-2">
            <StaticTag label={gig.tag} tone="brand" />
            <StaticTag label={category?.name ?? ''} />
          </View>
          <Text className="text-ink mt-3 text-[20px] leading-7 font-bold tracking-tight">
            {gig.title}
          </Text>
          <Text className="text-ink-soft mt-2 text-[14px] leading-6">{gig.detail}</Text>

          <View className="border-hairline mt-4 gap-2 border-t pt-4">
            <DetailRow label="預算等級" value={budget?.label ?? ''} />
            <DetailRow
              label="任務地點"
              value={`${gig.location.region}（${gig.location.source === 'gps' ? '裝置定位' : '手動選擇'}）`}
            />
            <DetailRow label="發布時間" value={formatRelativeTime(gig.createdAt)} highlight />
            <DetailRow label="發布者" value={gig.clientName} />
          </View>
        </View>

        {gig.location.latitude !== undefined && gig.location.longitude !== undefined ? (
          <View className="border-hairline overflow-hidden rounded-xl border bg-white">
            <MapView
              style={{ width: '100%', height: 170 }}
              initialRegion={{
                latitude: gig.location.latitude,
                longitude: gig.location.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              markers={[
                {
                  id: gig.id,
                  coordinate: {
                    latitude: gig.location.latitude,
                    longitude: gig.location.longitude,
                  },
                  title: gig.tag,
                  color: COLORS.brand,
                },
              ]}
              scrollEnabled={false}
              zoomEnabled={false}
            />
            <View className="flex-row items-center gap-1.5 px-4 py-3">
              <MapPin size={14} color={COLORS.muted} strokeWidth={2} />
              <Text className="text-muted text-[12px]">定位座標僅供人才評估距離</Text>
            </View>
          </View>
        ) : null}

        {role === 'talent' && !isOwner ? (
          <View className="gap-3">
            <ChatQuotaPill onPress={() => router.push('/subscription')} />
            <Button size="lg" onPress={handleTalentOpenChat}>
              <Button.Label>開啟對話並回覆客戶</Button.Label>
            </Button>
            <Text className="text-muted text-[12px] leading-5">
              免費版每月最多與 2 位不同客戶開啟新對話；已對話過的客戶不再計入配額。
            </Text>
          </View>
        ) : null}

        {isOwner ? (
          <View className="gap-4">
            <SectionHeading title="推薦人才" caption="依標籤與地區即時比對的認證人才。" />

            {recommendedTalents.map((talent) => (
              <View key={talent.id} className="border-hairline rounded-xl border bg-white p-4">
                <View className="flex-row items-center gap-3">
                  <View className="bg-brand-soft h-11 w-11 items-center justify-center rounded-xl">
                    <Text className="text-brand-strong text-[16px] font-bold">
                      {talent.name.slice(0, 1)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-ink text-[15px] font-semibold">{talent.name}</Text>
                      {talent.verification === 'approved' ? (
                        <BadgeCheck size={15} color={COLORS.brand} strokeWidth={2.2} />
                      ) : null}
                    </View>
                    <View className="mt-1 flex-row items-center gap-2">
                      <View className="flex-row items-center gap-1">
                        <Star size={13} color={COLORS.coral} strokeWidth={2.2} />
                        <Text className="text-coral text-[12px] font-medium">{talent.rating}</Text>
                      </View>
                      <Text className="text-muted text-[12px]">
                        {talent.region}・完成 {talent.completedJobs} 件
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleClientOpenChat(talent.id, talent.name)}
                    accessibilityRole="button"
                    className="bg-brand h-10 w-10 items-center justify-center rounded-xl"
                  >
                    <MessageSquarePlus size={18} color={COLORS.white} strokeWidth={2.1} />
                  </Pressable>
                </View>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {talent.tags.map((talentTag) => (
                    <StaticTag key={talentTag} label={talentTag} />
                  ))}
                </View>
              </View>
            ))}

            {gig.status !== 'closed' ? (
              <Button size="lg" variant="tertiary" onPress={handleClose}>
                <Button.Label>結束這筆任務</Button.Label>
              </Button>
            ) : (
              <View className="border-hairline bg-canvas flex-row items-center gap-2 rounded-xl border px-4 py-3">
                <Zap size={15} color={COLORS.muted} strokeWidth={2} />
                <Text className="text-muted text-[13px]">此任務已結案</Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-muted text-[13px]">{label}</Text>
      <Text
        className={
          highlight ? 'text-coral text-[13px] font-semibold' : 'text-ink text-[13px] font-medium'
        }
      >
        {value}
      </Text>
    </View>
  );
}
