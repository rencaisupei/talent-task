import { FlashList } from '@shopify/flash-list';
import { SearchField } from 'heroui-native';
import { router } from 'expo-router';
import {
  ClipboardList,
  Inbox,
  List,
  Map as MapIcon,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { BidCard } from '@/components/BidCard';
import { BrandWordmark } from '@/components/BrandLogo';
import { ChatQuotaPill } from '@/components/ChatQuotaPill';
import { CloudListState } from '@/components/CloudListState';
import { GigCard } from '@/components/GigCard';
import { GigFilterSheet } from '@/components/GigFilterSheet';
import { GigMapPanel } from '@/components/GigMapPanel';
import { NotificationBell } from '@/components/NotificationBell';
import { EmptyState, SectionHeading } from '@/components/SectionHeading';
import { SignInNotice } from '@/components/SignInNotice';
import { COLORS } from '@/lib/colors';
import {
  activeFilterCount,
  applyGigFilters,
  DEFAULT_GIG_FILTERS,
  type GigFilters,
} from '@/lib/gigFilters';
import { CATEGORY_COUNT } from '@/lib/omniTags';
import { toggleSavedGig } from '@/lib/savedActions';
import { isBidVisible, useBidStore } from '@/lib/stores/bids';
import { isGigVisible, useGigStore } from '@/lib/stores/gigs';
import { useSavedStore } from '@/lib/stores/saved';
import { useIsSignedIn, useMyUserId, useSessionStore } from '@/lib/stores/session';
import type { Gig } from '@/lib/types';
import { cn } from '@/lib/utils';

type BrowseMode = 'list' | 'map';

export default function HomeScreen() {
  const role = useSessionStore((state) => state.role);
  return role === 'client' ? <ClientHome /> : <TalentHome />;
}

function openGig(gigId: string) {
  router.push({ pathname: '/gig/[id]', params: { id: gigId } });
}

function TalentHome() {
  const gigs = useGigStore((state) => state.gigs);
  const loadState = useGigStore((state) => state.loadState);
  const isRefreshing = useGigStore((state) => state.isRefreshing);
  const errorMessage = useGigStore((state) => state.errorMessage);
  const refreshGigs = useGigStore((state) => state.refreshGigs);
  const skills = useSessionStore((state) => state.skills);
  const userId = useMyUserId();
  const verification = useSessionStore((state) => state.verification);
  const savedGigIds = useSavedStore((state) => state.savedGigIds);

  const [filters, setFilters] = useState<GigFilters>(() => ({
    ...DEFAULT_GIG_FILTERS,
    // 還沒選技能標籤時不套用標籤篩選，否則任務牆一進來會是空的。
    skillOnly: skills.length > 0,
  }));
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<BrowseMode>('list');

  const data = useMemo(() => {
    const openGigs = gigs.filter(
      (gig) =>
        gig.clientId !== userId &&
        isGigVisible(gig) &&
        (gig.status === 'open' || gig.status === 'talking'),
    );
    return applyGigFilters(openGigs, filters, { skills });
  }, [gigs, filters, skills, userId]);

  const filterCount = activeFilterCount(filters);

  const controlBar = (
    <View className="gap-3">
      <SearchField
        value={filters.keyword}
        onChange={(keyword) => setFilters((current) => ({ ...current, keyword }))}
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="搜尋標籤、地區或任務內容" returnKeyType="search" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          className="border-hairline bg-canvas flex-1 flex-row items-center gap-2 rounded-xl border px-3.5 py-2.5"
        >
          <SlidersHorizontal size={15} color={COLORS.ink} strokeWidth={2.1} />
          <Text className="text-ink flex-1 text-[13px] font-semibold">篩選與排序</Text>
          {filterCount > 0 ? (
            <View className="bg-brand min-w-5 items-center rounded-md px-1.5 py-0.5">
              <Text className="text-[11px] font-bold text-white">{filterCount}</Text>
            </View>
          ) : null}
        </Pressable>

        <View className="border-hairline bg-canvas flex-row items-center gap-1 rounded-xl border p-1">
          <ModeButton
            isActive={mode === 'list'}
            label="列表"
            icon={<List size={14} color={mode === 'list' ? COLORS.white : COLORS.muted} />}
            onPress={() => setMode('list')}
          />
          <ModeButton
            isActive={mode === 'map'}
            label="地圖"
            icon={<MapIcon size={14} color={mode === 'map' ? COLORS.white : COLORS.muted} />}
            onPress={() => setMode('map')}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View className="bg-background flex-1">
      {mode === 'map' ? (
        <>
          <View className="pt-safe-offset-3 gap-3 px-5 pb-3">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-ink text-[20px] font-bold tracking-tight">地圖模式</Text>
              <NotificationBell />
            </View>
            {controlBar}
            <Text className="text-muted text-[12px]">{data.length} 筆任務符合條件</Text>
          </View>
          <GigMapPanel gigs={data} onOpenGig={openGig} />
        </>
      ) : (
        <FlashList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={() => void refreshGigs()}
          ListHeaderComponent={
            <View className="pt-safe-offset-4 gap-4 pb-4">
              <View className="flex-row items-center justify-between gap-3">
                <BrandWordmark size={48} />
                <NotificationBell />
              </View>

              <ChatQuotaPill onPress={() => router.push('/subscription')} />

              {verification === 'pending' ? (
                <View className="border-coral/25 bg-coral-soft flex-row items-center gap-2 rounded-xl border px-4 py-3">
                  <ShieldCheck size={16} color={COLORS.coral} strokeWidth={2.1} />
                  <Text className="text-ink-soft flex-1 text-[13px]">
                    人才資料正由管理員複審，通過後會顯示「AI 已認證」徽章。
                  </Text>
                </View>
              ) : null}

              {controlBar}

              <SectionHeading
                title={`${data.length} 筆任務`}
                caption={
                  filters.skillOnly ? '僅顯示符合你認證標籤的任務，可於篩選中關閉' : undefined
                }
              />
            </View>
          }
          renderItem={({ item }) => (
            <View className="pb-3">
              <GigCard
                gig={item}
                onPress={() => openGig(item.id)}
                isSaved={savedGigIds.includes(item.id)}
                onToggleSave={() => toggleSavedGig(item.id)}
              />
            </View>
          )}
          ListEmptyComponent={
            <CloudListState
              loadState={loadState}
              errorMessage={errorMessage}
              onRetry={() => void refreshGigs()}
              loadingLabel="正在讀取全台任務…"
              emptyTitle="目前沒有符合條件的任務"
              emptyCaption="調整篩選條件或擴大服務地區，就能看到更多急件。"
              emptyIcon={<Zap size={22} color={COLORS.coral} strokeWidth={2.1} />}
            />
          }
        />
      )}

      <GigFilterSheet
        visible={isSheetOpen}
        filters={filters}
        onClose={() => setSheetOpen(false)}
        onApply={setFilters}
        showSkillFilter
        skillCount={skills.length}
      />
    </View>
  );
}

function ModeButton({
  isActive,
  label,
  icon,
  onPress,
}: {
  isActive: boolean;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      className={cn(
        'flex-row items-center gap-1.5 rounded-lg px-2.5 py-1.5',
        isActive ? 'bg-brand' : 'bg-transparent',
      )}
    >
      {icon}
      <Text className={cn('text-[12px] font-semibold', isActive ? 'text-white' : 'text-muted')}>
        {label}
      </Text>
    </Pressable>
  );
}

function ClientHome() {
  const gigs = useGigStore((state) => state.gigs);
  const bids = useBidStore((state) => state.bids);
  const isRefreshing = useGigStore((state) => state.isRefreshing);
  const refreshGigs = useGigStore((state) => state.refreshGigs);
  const userId = useMyUserId();
  const isSignedIn = useIsSignedIn();

  const myGigs = useMemo(
    () => gigs.filter((gig) => gig.clientId === userId).sort((a, b) => b.createdAt - a.createdAt),
    [gigs, userId],
  );

  const pendingBids = useMemo(
    () =>
      bids
        .filter((bid) => bid.clientId === userId && bid.status === 'pending' && isBidVisible(bid))
        .sort((a, b) => b.createdAt - a.createdAt),
    [bids, userId],
  );

  const activeGigs = useMemo(() => myGigs.filter((gig) => gig.status === 'assigned'), [myGigs]);

  const recentGigs = useMemo(
    () => myGigs.filter((gig) => gig.status !== 'completed' && gig.status !== 'closed').slice(0, 3),
    [myGigs],
  );

  return (
    <View className="bg-background flex-1">
      <ScrollView
        contentContainerClassName="px-5 pt-safe-offset-4 pb-28 gap-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshGigs()} />
        }
      >
        <View className="flex-row items-center justify-between gap-3">
          <BrandWordmark size={48} />
          <NotificationBell />
        </View>

        {isSignedIn ? null : (
          <SignInNotice
            title="登入後開始發布任務"
            caption="任務會同步到雲端並廣播給全台人才，因此需要帳號才能發布與收提案。瀏覽任務牆不需要登入。"
          />
        )}

        <Pressable
          onPress={() => router.push('/publish')}
          accessibilityRole="button"
          className="border-brand/25 bg-brand-soft rounded-xl border p-4"
        >
          <View className="flex-row items-center gap-3">
            <View className="bg-brand h-11 w-11 items-center justify-center rounded-xl">
              <Sparkles size={20} color={COLORS.white} strokeWidth={2.1} />
            </View>
            <View className="flex-1">
              <Text className="text-ink text-[16px] font-bold tracking-tight">30 秒極速發布</Text>
              <Text className="text-ink-soft mt-0.5 text-[12px]">
                選標籤、補描述，立即廣播給全台認證人才
              </Text>
            </View>
          </View>
        </Pressable>

        <View className="gap-3">
          <SectionHeading
            title="待處理提案"
            caption={
              pendingBids.length > 0 ? `${pendingBids.length} 位人才等待你的回覆` : undefined
            }
            right={
              pendingBids.length > 2 ? (
                <Pressable onPress={() => router.push('/(tabs)/tasks')} accessibilityRole="button">
                  <Text className="text-brand-strong text-[13px] font-semibold">查看全部</Text>
                </Pressable>
              ) : undefined
            }
          />

          {pendingBids.length === 0 ? (
            <EmptyState
              title="尚未收到提案"
              caption={
                isSignedIn
                  ? '任務發布後，符合標籤的人才會送出報價與可到場時間。'
                  : '登入並發布任務後，符合標籤的人才會送出報價與可到場時間。'
              }
              icon={<Inbox size={22} color={COLORS.brand} strokeWidth={2.1} />}
            />
          ) : (
            pendingBids
              .slice(0, 2)
              .map((bid) => (
                <BidCard
                  key={bid.id}
                  bid={bid}
                  showGigTitle
                  onPressGig={() => openGig(bid.gigId)}
                  onPressTalent={() =>
                    router.push({ pathname: '/talent/[id]', params: { id: bid.talentId } })
                  }
                />
              ))
          )}
        </View>

        {activeGigs.length > 0 ? (
          <View className="gap-3">
            <SectionHeading title="進行中任務" caption="已選定人才，等待完工確認" />
            {activeGigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} onPress={() => openGig(gig.id)} />
            ))}
          </View>
        ) : null}

        <View className="gap-3">
          <SectionHeading
            title="最近發布"
            caption={myGigs.length > 0 ? `共 ${myGigs.length} 筆任務` : undefined}
            right={
              <Pressable onPress={() => router.push('/(tabs)/tasks')} accessibilityRole="button">
                <Text className="text-brand-strong text-[13px] font-semibold">全部管理</Text>
              </Pressable>
            }
          />

          {recentGigs.length === 0 ? (
            <EmptyState
              title="還沒有進行中的任務"
              caption={`從 ${CATEGORY_COUNT} 大類別中選一個標籤，30 秒完成發布。`}
              icon={<ClipboardList size={22} color={COLORS.brand} strokeWidth={2.1} />}
            />
          ) : (
            recentGigs.map((gig: Gig) => (
              <GigCard key={gig.id} gig={gig} onPress={() => openGig(gig.id)} />
            ))
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.push('/publish')}
        accessibilityRole="button"
        accessibilityLabel="發布任務"
        className="bg-brand absolute right-5 bottom-6 h-14 w-14 items-center justify-center rounded-full"
        style={{
          shadowColor: '#000000',
          shadowOpacity: 0.12,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        <Plus size={26} color={COLORS.white} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
