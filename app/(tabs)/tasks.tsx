import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Bookmark, ClipboardList, Inbox, Send, Star } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BidCard } from '@/components/BidCard';
import { GigCard } from '@/components/GigCard';
import { NotificationBell } from '@/components/NotificationBell';
import { SegmentedTabs, type SegmentOption } from '@/components/SegmentedTabs';
import { EmptyState } from '@/components/SectionHeading';
import { COLORS } from '@/lib/colors';
import { bidsByTalent, bidsForGig, useBidStore } from '@/lib/stores/bids';
import { useGigStore } from '@/lib/stores/gigs';
import { findReview, useReviewStore } from '@/lib/stores/reviews';
import { useSavedStore } from '@/lib/stores/saved';
import { useSessionStore } from '@/lib/stores/session';
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
  const reviews = useReviewStore((state) => state.reviews);
  const userId = useSessionStore((state) => state.userId);

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
      </ScreenHeader>

      <FlashList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const gigBidCount = bidsForGig(bids, item.id).filter(
            (bid) => bid.status === 'pending',
          ).length;
          const needsReview = item.status === 'completed' && !findReview(reviews, item.id, userId);

          return (
            <View className="pb-3">
              <GigCard
                gig={item}
                onPress={() => openGig(item.id)}
                footer={
                  gigBidCount > 0 || needsReview ? (
                    <View className="border-hairline mt-3 flex-row items-center gap-2 border-t pt-3">
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
          <EmptyState
            title="這個分類沒有任務"
            caption="切換分類，或從首頁 30 秒發布新的急件。"
            icon={<ClipboardList size={22} color={COLORS.brand} strokeWidth={2.1} />}
          />
        }
      />
    </View>
  );
}

function TalentTasks() {
  const gigs = useGigStore((state) => state.gigs);
  const bids = useBidStore((state) => state.bids);
  const savedGigIds = useSavedStore((state) => state.savedGigIds);
  const toggleSaved = useSavedStore((state) => state.toggleSaved);
  const userId = useSessionStore((state) => state.userId);

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
      </ScreenHeader>

      {segment === 'bids' ? (
        <FlashList
          data={myBids}
          keyExtractor={(item: Bid) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="pb-3">
              <BidCard bid={item} showGigTitle onPressGig={() => openGig(item.gigId)} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="還沒有投遞提案"
              caption="在任務牆挑選符合標籤的急件，填寫報價與可到場時間即可投遞。"
              icon={<Send size={22} color={COLORS.brand} strokeWidth={2.1} />}
            />
          }
        />
      ) : (
        <FlashList
          data={gigData}
          keyExtractor={(item: Gig) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
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
