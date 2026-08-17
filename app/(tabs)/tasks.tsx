import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Bookmark, ClipboardList, Inbox, ScanEye, Send, Star } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BidCard } from '@/components/BidCard';
import { CloudListState } from '@/components/CloudListState';
import { GigCard } from '@/components/GigCard';
import { NotificationBell } from '@/components/NotificationBell';
import { SegmentedTabs, type SegmentOption } from '@/components/SegmentedTabs';
import { EmptyState } from '@/components/SectionHeading';
import { SignInNotice } from '@/components/SignInNotice';
import { COLORS } from '@/lib/colors';
import { bidsByTalent, bidsForGig, useBidStore } from '@/lib/stores/bids';
import { useGigStore } from '@/lib/stores/gigs';
import { findReview, useReviewStore } from '@/lib/stores/reviews';
import { useSavedStore } from '@/lib/stores/saved';
import { useIsSignedIn, useMyUserId, useSessionStore } from '@/lib/stores/session';
import type { Bid, Gig } from '@/lib/types';

type ClientSegment = 'all' | 'open' | 'active' | 'done';
type TalentSegment = 'bids' | 'active' | 'done' | 'saved';

export default function TasksScreen() {
  const role = useSessionStore((state) => state.role);
  return role === 'client' ? <ClientTasks /> : <TalentTasks />;
}

function openGig(gigId: string) {
  router.push({ pathname: '/gig/[id]', params: { id: gigId } });
}

function ScreenHeader({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="pt-safe-offset-4 gap-3 px-5 pb-3">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-ink text-[26px] font-bold tracking-tight">{title}</Text>
          {caption ? <Text className="text-muted mt-1 text-[13px]">{caption}</Text> : null}
        </View>
        <NotificationBell />
      </View>
      {children}
    </View>
  );
}

function ClientTasks() {
  const gigs = useGigStore((state) => state.gigs);
  const bids = useBidStore((state) => state.bids);
  const loadState = useGigStore((state) => state.loadState);
  const isRefreshing = useGigStore((state) => state.isRefreshing);
  const errorMessage = useGigStore((state) => state.errorMessage);
  const refreshGigs = useGigStore((state) => state.refreshGigs);
  const reviews = useReviewStore((state) => state.reviews);
  const userId = useMyUserId();
  const isSignedIn = useIsSignedIn();

  const [segment, setSegment] = useState<ClientSegment>('all');

  const myGigs = useMemo(
    () => gigs.filter((gig) => gig.clientId === userId).sort((a, b) => b.createdAt - a.createdAt),
    [gigs, userId],
  );

  const counts = useMemo(
    () => ({
      all: myGigs.length,
      open: myGigs.filter((gig) => gig.status === 'open' || gig.status === 'talking').length,
      active: myGigs.filter((gig) => gig.status === 'assigned').length,
      done: myGigs.filter((gig) => gig.status === 'completed' || gig.status === 'closed').length,
    }),
    [myGigs],
  );

  const options: SegmentOption<ClientSegment>[] = [
    { id: 'all', label: '全部', count: counts.all },
    { id: 'open', label: '等待媒合', count: counts.open },
    { id: 'active', label: '進行中', count: counts.active },
    { id: 'done', label: '已完成', count: counts.done },
  ];

  const data = useMemo(() => {
    if (segment === 'open') {
      return myGigs.filter((gig) => gig.status === 'open' || gig.status === 'talking');
    }
    if (segment === 'active') return myGigs.filter((gig) => gig.status === 'assigned');
    if (segment === 'done') {
      return myGigs.filter((gig) => gig.status === 'completed' || gig.status === 'closed');
    }
    return myGigs;
  }, [myGigs, segment]);

  return (
    <View className="bg-background flex-1">
      <ScreenHeader title="任務管理" caption="追蹤提案、進行中與已完成的委託">
        <SegmentedTabs options={options} value={segment} onChange={setSegment} />
        {isSignedIn ? null : (
          <SignInNotice
            title="登入後才看得到自己的任務"
            caption="任務存在雲端並綁定帳號，登入後即可在任何裝置管理同一批委託。"
          />
        )}
      </ScreenHeader>

      <FlashList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={() => void refreshGigs()}
        renderItem={({ item }) => {
          const gigBidCount = bidsForGig(bids, item.id).filter(
            (bid) => bid.status === 'pending',
          ).length;
          const needsReview = item.status === 'completed' && !findReview(reviews, item.id, userId);
          const awaitingModeration = item.review?.state === 'pending';
          const moderationRejected = item.review?.state === 'rejected';

          return (
            <View className="pb-3">
              <GigCard
                gig={item}
                onPress={() => openGig(item.id)}
                footer={
                  gigBidCount > 0 || needsReview || awaitingModeration || moderationRejected ? (
                    <View className="border-hairline mt-3 flex-row flex-wrap items-center gap-2 border-t pt-3">
                      {awaitingModeration ? (
                        <View className="border-coral/25 bg-coral-soft flex-row items-center gap-1.5 rounded-lg border px-2.5 py-1">
                          <ScanEye size={12} color={COLORS.coral} strokeWidth={2.2} />
                          <Text className="text-coral text-[11px] font-semibold">
                            認證複審中，尚未曝光
                          </Text>
                        </View>
                      ) : null}
                      {moderationRejected ? (
                        <View className="border-coral/25 bg-coral-soft flex-row items-center gap-1.5 rounded-lg border px-2.5 py-1">
                          <ScanEye size={12} color={COLORS.coral} strokeWidth={2.2} />
                          <Text className="text-coral text-[11px] font-semibold">複審未通過</Text>
                        </View>
                      ) : null}
                      {gigBidCount > 0 ? (
                        <View className="border-brand/25 bg-brand-soft flex-row items-center gap-1.5 rounded-lg border px-2.5 py-1">
                          <Inbox size={12} color={COLORS.brandStrong} strokeWidth={2.2} />
                          <Text className="text-brand-strong text-[11px] font-semibold">
                            {gigBidCount} 份待處理提案
                          </Text>
                        </View>
                      ) : null}
                      {needsReview ? (
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/review/[gigId]',
                              params: { gigId: item.id },
                            })
                          }
                          accessibilityRole="button"
                          className="border-coral/25 bg-coral-soft flex-row items-center gap-1.5 rounded-lg border px-2.5 py-1"
                        >
                          <Star size={12} color={COLORS.coral} strokeWidth={2.2} />
                          <Text className="text-coral text-[11px] font-semibold">給出評價</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null
                }
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <CloudListState
            loadState={isSignedIn ? loadState : 'ready'}
            errorMessage={errorMessage}
            onRetry={() => void refreshGigs()}
            emptyTitle={isSignedIn ? '這個分類沒有任務' : '尚未有任務紀錄'}
            emptyCaption={
              isSignedIn
                ? '切換分類，或從首頁 30 秒發布新的急件。'
                : '登入後這裡會顯示你發布的任務與收到的提案。'
            }
            emptyIcon={<ClipboardList size={22} color={COLORS.brand} strokeWidth={2.1} />}
          />
        }
      />
    </View>
  );
}

function TalentTasks() {
  const gigs = useGigStore((state) => state.gigs);
  const bids = useBidStore((state) => state.bids);
  const loadState = useBidStore((state) => state.loadState);
  const isRefreshing = useBidStore((state) => state.isRefreshing);
  const errorMessage = useBidStore((state) => state.errorMessage);
  const refreshBids = useBidStore((state) => state.refreshBids);
  const refreshGigs = useGigStore((state) => state.refreshGigs);
  const savedGigIds = useSavedStore((state) => state.savedGigIds);
  const toggleSaved = useSavedStore((state) => state.toggleSaved);
  const userId = useMyUserId();
  const isSignedIn = useIsSignedIn();

  const handleRefresh = () => {
    void refreshBids();
    void refreshGigs();
  };

  const [segment, setSegment] = useState<TalentSegment>('bids');

  const myBids = useMemo(() => bidsByTalent(bids, userId), [bids, userId]);

  const activeGigs = useMemo(
    () => gigs.filter((gig) => gig.assignedTalentId === userId && gig.status === 'assigned'),
    [gigs, userId],
  );

  const doneGigs = useMemo(
    () => gigs.filter((gig) => gig.assignedTalentId === userId && gig.status === 'completed'),
    [gigs, userId],
  );

  const savedGigs = useMemo(
    () =>
      savedGigIds.map((id) => gigs.find((gig) => gig.id === id)).filter((gig): gig is Gig => !!gig),
    [gigs, savedGigIds],
  );

  const options: SegmentOption<TalentSegment>[] = [
    { id: 'bids', label: '我的提案', count: myBids.length },
    { id: 'active', label: '進行中', count: activeGigs.length },
    { id: 'done', label: '已完成', count: doneGigs.length },
    { id: 'saved', label: '收藏', count: savedGigs.length },
  ];

  const gigData = segment === 'active' ? activeGigs : segment === 'done' ? doneGigs : savedGigs;

  return (
    <View className="bg-background flex-1">
      <ScreenHeader title="我的接案" caption="管理提案進度、進行中案件與收藏">
        <SegmentedTabs options={options} value={segment} onChange={setSegment} />
        {isSignedIn ? null : (
          <SignInNotice
            title="登入後才能投遞提案"
            caption="提案會送到發案者的雲端任務上，因此需要帳號；瀏覽任務牆與收藏不需要登入。"
          />
        )}
      </ScreenHeader>

      {segment === 'bids' ? (
        <FlashList
          data={myBids}
          keyExtractor={(item: Bid) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => (
            <View className="pb-3">
              {item.review?.state === 'pending' ? (
                <View className="border-coral/25 bg-coral-soft mb-2 flex-row items-center gap-1.5 self-start rounded-lg border px-2.5 py-1">
                  <ScanEye size={12} color={COLORS.coral} strokeWidth={2.2} />
                  <Text className="text-coral text-[11px] font-semibold">
                    認證複審中，客戶尚未看到
                  </Text>
                </View>
              ) : null}
              <BidCard bid={item} showGigTitle onPressGig={() => openGig(item.gigId)} />
            </View>
          )}
          ListEmptyComponent={
            <CloudListState
              loadState={isSignedIn ? loadState : 'ready'}
              errorMessage={errorMessage}
              onRetry={handleRefresh}
              loadingLabel="正在讀取你的提案…"
              emptyTitle="還沒有投遞提案"
              emptyCaption={
                isSignedIn
                  ? '在任務牆挑選符合標籤的急件，填寫報價與可到場時間即可投遞。'
                  : '登入後即可投遞提案，並在這裡追蹤每一份報價的狀態。'
              }
              emptyIcon={<Send size={22} color={COLORS.brand} strokeWidth={2.1} />}
            />
          }
        />
      ) : (
        <FlashList
          data={gigData}
          keyExtractor={(item: Gig) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => (
            <View className="pb-3">
              <GigCard
                gig={item}
                onPress={() => openGig(item.id)}
                isSaved={savedGigIds.includes(item.id)}
                onToggleSave={segment === 'saved' ? () => toggleSaved(item.id) : undefined}
              />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title={segment === 'saved' ? '尚未收藏任務' : '這個分類沒有案件'}
              caption={
                segment === 'saved'
                  ? '在任務牆點右上角書籤即可收藏，稍後再回來投遞。'
                  : '被客戶選定後，案件會出現在進行中，完工後轉為已完成。'
              }
              icon={
                segment === 'saved' ? (
                  <Bookmark size={22} color={COLORS.brand} strokeWidth={2.1} />
                ) : (
                  <ClipboardList size={22} color={COLORS.brand} strokeWidth={2.1} />
                )
              }
            />
          }
        />
      )}
    </View>
  );
}
