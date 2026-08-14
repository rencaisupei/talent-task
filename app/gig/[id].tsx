import { router, useLocalSearchParams } from 'expo-router';
import { Button } from 'heroui-native';
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  CircleCheckBig,
  Inbox,
  MapPin,
  MessageSquarePlus,
  Star,
  UserCheck,
  Zap,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { BidCard } from '@/components/BidCard';
import { ChatQuotaPill } from '@/components/ChatQuotaPill';
import MapView from '@/components/MapView';
import { EmptyState, SectionHeading } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { formatRelativeTime } from '@/lib/format';
import { goBackOrReplace } from '@/lib/navigation';
import { findCategoryById } from '@/lib/omniTags';
import { SEED_TALENTS } from '@/lib/seed';
import { bidsForGig, myBidForGig, useBidStore } from '@/lib/stores/bids';
import { useChatStore } from '@/lib/stores/chat';
import { useGigStore } from '@/lib/stores/gigs';
import { findReview, useReviewStore } from '@/lib/stores/reviews';
import { useSavedStore } from '@/lib/stores/saved';
import { useSessionStore } from '@/lib/stores/session';
import { BUDGET_LEVELS } from '@/lib/types';

export default function GigDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const gigs = useGigStore((state) => state.gigs);
  const markTalking = useGigStore((state) => state.markTalking);
  const completeGig = useGigStore((state) => state.completeGig);
  const closeGig = useGigStore((state) => state.closeGig);

  const role = useSessionStore((state) => state.role);
  const userId = useSessionStore((state) => state.userId);
  const displayName = useSessionStore((state) => state.displayName);
  const requestChatWith = useSessionStore((state) => state.requestChatWith);

  const startConversation = useChatStore((state) => state.startConversation);
  const conversations = useChatStore((state) => state.conversations);

  const bids = useBidStore((state) => state.bids);
  const withdrawBid = useBidStore((state) => state.withdrawBid);
  const acceptBid = useBidStore((state) => state.acceptBid);

  const reviews = useReviewStore((state) => state.reviews);
  const savedGigIds = useSavedStore((state) => state.savedGigIds);
  const toggleSaved = useSavedStore((state) => state.toggleSaved);

  const gig = gigs.find((item) => item.id === id);

  const recommendedTalents = useMemo(() => {
    if (!gig) return [];
    const exact = SEED_TALENTS.filter((talent) => talent.tags.includes(gig.tag));
    const sameRegion = SEED_TALENTS.filter(
      (talent) => talent.region === gig.location.region && !exact.includes(talent),
    );
    return [...exact, ...sameRegion].slice(0, 4);
  }, [gig]);

  const gigBids = useMemo(() => (gig ? bidsForGig(bids, gig.id) : []), [bids, gig]);
  const myBid = useMemo(
    () => (gig ? myBidForGig(bids, gig.id, userId) : undefined),
    [bids, gig, userId],
  );

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
  const isAssignedToMe = gig.assignedTalentId === userId;
  const assignedTalentId = gig.assignedTalentId;
  const isSaved = savedGigIds.includes(gig.id);
  const myReview = findReview(reviews, gig.id, userId);
  const pendingBids = gigBids.filter((bid) => bid.status === 'pending');

  const goToChat = (talentId: string, talentName: string, openingMessage: string) => {
    const existing = conversations.find(
      (conversation) => conversation.gigId === gig.id && conversation.talentId === talentId,
    );
    if (existing) {
      router.push({ pathname: '/chat/[id]', params: { id: existing.id } });
      return;
    }
    const conversationId = startConversation({
      gig,
      talentId,
      talentName,
      openingMessage,
    });
    markTalking(gig.id);
    router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
  };

  const handleTalentOpenChat = () => {
    const result = requestChatWith(gig.clientId);
    if (result === 'blocked') {
      router.push('/subscription');
      return;
    }
    goToChat(userId, displayName, `您好，我可以承接「${gig.tag}」這項任務，方便說明現場細節嗎？`);
  };

  const handleAcceptBid = (bidId: string, talentName: string) => {
    Alert.alert('選定這位人才？', `將由 ${talentName} 承接此任務，其他提案會標記為未錄取。`, [
      { text: '取消', style: 'cancel' },
      { text: '確認選定', onPress: () => acceptBid(bidId) },
    ]);
  };

  const handleWithdraw = (bidId: string) => {
    Alert.alert('撤回提案？', '撤回後客戶將看不到這份提案，可再重新投遞。', [
      { text: '取消', style: 'cancel' },
      { text: '確認撤回', style: 'destructive', onPress: () => withdrawBid(bidId) },
    ]);
  };

  const handleComplete = () => {
    Alert.alert('標記任務完成？', '完成後雙方即可互相評價。', [
      { text: '取消', style: 'cancel' },
      { text: '確認完成', onPress: () => completeGig(gig.id) },
    ]);
  };

  const handleClose = () => {
    Alert.alert('結束這筆任務？', '結束後將不再出現在人才任務牆。', [
      { text: '取消', style: 'cancel' },
      {
        text: '確認結束',
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
        {!isOwner ? (
          <Pressable
            onPress={() => toggleSaved(gig.id)}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? '取消收藏' : '收藏任務'}
            accessibilityState={{ selected: isSaved }}
            className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
          >
            <Bookmark
              size={17}
              color={isSaved ? COLORS.brand : COLORS.muted}
              fill={isSaved ? COLORS.brand : 'transparent'}
              strokeWidth={2.1}
            />
          </Pressable>
        ) : null}
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
            {gig.assignedTalentName ? (
              <DetailRow label="承接人才" value={gig.assignedTalentName} />
            ) : null}
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
                  color: gig.isUrgent ? COLORS.coral : COLORS.brand,
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

        {gig.status === 'assigned' || gig.status === 'completed' ? (
          <View className="border-brand/25 bg-brand-soft gap-3 rounded-xl border p-4">
            <View className="flex-row items-center gap-2">
              {gig.status === 'completed' ? (
                <CircleCheckBig size={17} color={COLORS.brandStrong} strokeWidth={2.2} />
              ) : (
                <UserCheck size={17} color={COLORS.brandStrong} strokeWidth={2.2} />
              )}
              <Text className="text-ink flex-1 text-[15px] font-semibold">
                {gig.status === 'completed' ? '任務已完成' : '媒合完成・進行中'}
              </Text>
            </View>
            <Text className="text-ink-soft text-[13px] leading-5">
              {gig.status === 'completed'
                ? `完成時間 ${formatRelativeTime(gig.completedAt ?? gig.createdAt)}，雙方可互相評價。`
                : `由 ${gig.assignedTalentName ?? '認證人才'} 承接，請於對話中確認施作細節。`}
            </Text>

            {assignedTalentId && assignedTalentId !== userId ? (
              <Button
                size="md"
                variant="tertiary"
                onPress={() =>
                  router.push({ pathname: '/talent/[id]', params: { id: assignedTalentId } })
                }
              >
                <Button.Label>查看人才檔案</Button.Label>
              </Button>
            ) : null}

            {isOwner && gig.status === 'assigned' ? (
              <Button size="md" onPress={handleComplete}>
                <Button.Label>標記任務完成</Button.Label>
              </Button>
            ) : null}

            {gig.status === 'assigned' && isAssignedToMe ? (
              <Text className="text-muted text-[12px]">完工後由客戶在此標記完成並進行評價。</Text>
            ) : null}

            {gig.status === 'completed' && (isOwner || isAssignedToMe) ? (
              myReview ? (
                <View className="flex-row items-center gap-2">
                  <Star size={14} color={COLORS.coral} fill={COLORS.coral} strokeWidth={2} />
                  <Text className="text-ink-soft text-[13px]">
                    你已給出 {myReview.stars} 星評價
                  </Text>
                </View>
              ) : (
                <Button
                  size="md"
                  onPress={() =>
                    router.push({ pathname: '/review/[gigId]', params: { gigId: gig.id } })
                  }
                >
                  <Button.Label>{isOwner ? '評價人才' : '評價客戶'}</Button.Label>
                </Button>
              )
            ) : null}
          </View>
        ) : null}

        {role === 'talent' && !isOwner && gig.status !== 'completed' && gig.status !== 'closed' ? (
          <View className="gap-3">
            <ChatQuotaPill onPress={() => router.push('/subscription')} />

            {myBid ? (
              <>
                <SectionHeading title="我的提案" caption="客戶會在此比較報價與可到場時間。" />
                <BidCard
                  bid={myBid}
                  onWithdraw={
                    myBid.status === 'pending' ? () => handleWithdraw(myBid.id) : undefined
                  }
                />
                {myBid.status === 'pending' ? (
                  <Button
                    size="md"
                    variant="tertiary"
                    onPress={() =>
                      router.push({ pathname: '/bid/[gigId]', params: { gigId: gig.id } })
                    }
                  >
                    <Button.Label>修改報價內容</Button.Label>
                  </Button>
                ) : null}
              </>
            ) : (
              <Button
                size="lg"
                onPress={() => router.push({ pathname: '/bid/[gigId]', params: { gigId: gig.id } })}
              >
                <Button.Label>投遞提案並報價</Button.Label>
              </Button>
            )}

            <Button size="lg" variant="secondary" onPress={handleTalentOpenChat}>
              <Button.Label>開啟對話並回覆客戶</Button.Label>
            </Button>
            <Text className="text-muted text-[12px] leading-5">
              投遞提案不佔用對話配額；免費版每月最多與 2 位不同客戶開啟新對話。
            </Text>
          </View>
        ) : null}

        {isOwner ? (
          <View className="gap-4">
            <SectionHeading
              title={`收到的提案（${pendingBids.length}）`}
              caption="比較報價、可到場時間與評價後選定人才。"
            />

            {gigBids.length === 0 ? (
              <EmptyState
                title="尚未收到提案"
                caption="任務已廣播給符合標籤的認證人才，收到提案時會通知你。"
                icon={<Inbox size={22} color={COLORS.brand} strokeWidth={2.1} />}
              />
            ) : (
              gigBids.map((bid) => (
                <BidCard
                  key={bid.id}
                  bid={bid}
                  onAccept={
                    bid.status === 'pending' &&
                    gig.status !== 'assigned' &&
                    gig.status !== 'completed'
                      ? () => handleAcceptBid(bid.id, bid.talentName)
                      : undefined
                  }
                  onChat={() =>
                    goToChat(
                      bid.talentId,
                      bid.talentName,
                      `您好，我看到您對「${gig.tag}」的提案，想再確認幾個細節。`,
                    )
                  }
                  onPressTalent={() =>
                    router.push({ pathname: '/talent/[id]', params: { id: bid.talentId } })
                  }
                />
              ))
            )}

            {gig.status === 'open' || gig.status === 'talking' ? (
              <>
                <SectionHeading title="推薦人才" caption="依標籤與地區即時比對的認證人才。" />

                {recommendedTalents.map((talent) => (
                  <View key={talent.id} className="border-hairline rounded-xl border bg-white p-4">
                    <View className="flex-row items-center gap-3">
                      <Pressable
                        onPress={() =>
                          router.push({ pathname: '/talent/[id]', params: { id: talent.id } })
                        }
                        accessibilityRole="button"
                        className="flex-1 flex-row items-center gap-3"
                      >
                        <View className="bg-brand-soft h-11 w-11 items-center justify-center rounded-xl">
                          <Text className="text-brand-strong text-[16px] font-bold">
                            {talent.name.slice(0, 1)}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5">
                            <Text className="text-ink text-[15px] font-semibold">
                              {talent.name}
                            </Text>
                            {talent.verification === 'approved' ? (
                              <BadgeCheck size={15} color={COLORS.brand} strokeWidth={2.2} />
                            ) : null}
                          </View>
                          <View className="mt-1 flex-row items-center gap-2">
                            <View className="flex-row items-center gap-1">
                              <Star
                                size={13}
                                color={COLORS.coral}
                                fill={COLORS.coral}
                                strokeWidth={2.2}
                              />
                              <Text className="text-coral text-[12px] font-medium">
                                {talent.rating}
                              </Text>
                            </View>
                            <Text className="text-muted text-[12px]">
                              {talent.region}・完成 {talent.completedJobs} 件
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          goToChat(
                            talent.id,
                            talent.name,
                            `您好，我發布了「${gig.tag}」的任務，想請您評估。`,
                          )
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`與 ${talent.name} 開啟對話`}
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

                <Button size="lg" variant="tertiary" onPress={handleClose}>
                  <Button.Label>結束這筆任務</Button.Label>
                </Button>
              </>
            ) : null}

            {gig.status === 'closed' ? (
              <View className="border-hairline bg-canvas flex-row items-center gap-2 rounded-xl border px-4 py-3">
                <Zap size={15} color={COLORS.muted} strokeWidth={2} />
                <Text className="text-muted text-[13px]">此任務已結束</Text>
              </View>
            ) : null}
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
