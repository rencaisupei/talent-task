import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Button, SearchField } from 'heroui-native';
import { ChevronRight, Inbox, Zap } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { EmptyState } from '@/components/SectionHeading';
import { SegmentedTabs, type SegmentOption } from '@/components/SegmentedTabs';
import { StaticTag } from '@/components/TagChip';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { COLORS } from '@/lib/colors';
import { formatRelativeTime } from '@/lib/format';
import { findCategoryByTag } from '@/lib/omniTags';
import { useBidStore } from '@/lib/stores/bids';
import { useChatStore } from '@/lib/stores/chat';
import { useGigStore } from '@/lib/stores/gigs';
import { BUDGET_LEVELS, type Gig, type GigStatus } from '@/lib/types';

type GigFilter = 'all' | 'open' | 'talking' | 'assigned' | 'completed' | 'takedown';

const STATUS_LABEL: Record<GigStatus, string> = {
  open: '等待媒合',
  talking: '對話中',
  assigned: '進行中',
  completed: '已完成',
  closed: '已結束',
};

const TAKEDOWN_REASONS = [
  { id: '內容違規或有詐騙風險', label: '內容違規或有詐騙風險' },
  { id: '重複張貼同一任務', label: '重複張貼同一任務' },
  { id: '標籤與任務內容不符', label: '標籤與任務內容不符' },
];

export default function AdminGigsScreen() {
  const gigs = useGigStore((state) => state.gigs);
  const takedownGig = useGigStore((state) => state.takedownGig);
  const restoreGig = useGigStore((state) => state.restoreGig);
  const bids = useBidStore((state) => state.bids);
  const conversations = useChatStore((state) => state.conversations);
  const logAction = useAuditLogger();

  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<GigFilter>('all');
  const [takedownTarget, setTakedownTarget] = useState<Gig | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Gig | null>(null);

  const counts = useMemo(
    () => ({
      all: gigs.length,
      open: gigs.filter((gig) => gig.status === 'open').length,
      talking: gigs.filter((gig) => gig.status === 'talking').length,
      assigned: gigs.filter((gig) => gig.status === 'assigned').length,
      completed: gigs.filter((gig) => gig.status === 'completed').length,
      takedown: gigs.filter((gig) => gig.takedownReason !== undefined).length,
    }),
    [gigs],
  );

  const options: SegmentOption<GigFilter>[] = [
    { id: 'all', label: '全部', count: counts.all },
    { id: 'open', label: '等待媒合', count: counts.open },
    { id: 'talking', label: '對話中', count: counts.talking },
    { id: 'assigned', label: '進行中', count: counts.assigned },
    { id: 'completed', label: '已完成', count: counts.completed },
    { id: 'takedown', label: '已下架', count: counts.takedown },
  ];

  const data = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return gigs.filter((gig) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'takedown'
            ? gig.takedownReason !== undefined
            : gig.status === filter && gig.takedownReason === undefined;
      if (!matchesFilter) return false;
      if (needle.length === 0) return true;
      return [gig.title, gig.tag, gig.detail, gig.clientName, gig.location.region].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
  }, [filter, gigs, keyword]);

  const handleTakedown = (reason: string) => {
    if (!takedownTarget) return;
    takedownGig(takedownTarget.id, reason);
    logAction({
      kind: 'gig',
      summary: `下架任務：${reason}`,
      targetId: takedownTarget.id,
      targetLabel: takedownTarget.title,
    });
    setTakedownTarget(null);
  };

  const handleRestore = () => {
    if (!restoreTarget) return;
    restoreGig(restoreTarget.id);
    logAction({
      kind: 'gig',
      summary: '恢復上架：任務重新開放媒合',
      targetId: restoreTarget.id,
      targetLabel: restoreTarget.title,
    });
    setRestoreTarget(null);
  };

  return (
    <View className="bg-background flex-1">
      <AdminHeader
        title="任務與內容管理"
        caption={`${counts.all} 件任務・已下架 ${counts.takedown} 件`}
      />

      <FlashList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-3 py-4">
            <SearchField value={keyword} onChange={setKeyword}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input
                  placeholder="搜尋任務標題、標籤、地區或發布者"
                  returnKeyType="search"
                />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <SegmentedTabs options={options} value={filter} onChange={setFilter} />
          </View>
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <GigAdminRow
            gig={item}
            bidCount={
              bids.filter((bid) => bid.gigId === item.id && bid.status !== 'withdrawn').length
            }
            conversationCount={
              conversations.filter((conversation) => conversation.gigId === item.id).length
            }
            onTakedown={() => setTakedownTarget(item)}
            onRestore={() => setRestoreTarget(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="沒有符合條件的任務"
            caption="調整搜尋關鍵字或切換狀態篩選。"
            icon={<Inbox size={22} color={COLORS.brand} strokeWidth={2.1} />}
          />
        }
      />

      <ConfirmSheet
        visible={takedownTarget !== null}
        title="下架此任務？"
        message={`「${takedownTarget?.title ?? ''}」將停止曝光，選擇下架原因後客戶會收到通知。`}
        actions={TAKEDOWN_REASONS.map((reason) => ({
          id: reason.id,
          label: reason.label,
          tone: 'danger' as const,
        }))}
        onSelect={handleTakedown}
        onCancel={() => setTakedownTarget(null)}
      />

      <ConfirmSheet
        visible={restoreTarget !== null}
        title="恢復上架？"
        message={`「${restoreTarget?.title ?? ''}」將回到等待媒合狀態，重新推送給符合標籤的人才。`}
        actions={[{ id: 'confirm', label: '確認恢復上架', tone: 'primary' }]}
        onSelect={handleRestore}
        onCancel={() => setRestoreTarget(null)}
      />
    </View>
  );
}

interface GigAdminRowProps {
  gig: Gig;
  bidCount: number;
  conversationCount: number;
  onTakedown: () => void;
  onRestore: () => void;
}

function GigAdminRow({
  gig,
  bidCount,
  conversationCount,
  onTakedown,
  onRestore,
}: GigAdminRowProps) {
  const budget = BUDGET_LEVELS.find((level) => level.id === gig.budgetLevel);
  const category = findCategoryByTag(gig.tag);
  const isTakenDown = gig.takedownReason !== undefined;

  return (
    <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
      <Pressable
        onPress={() => router.push({ pathname: '/gig/[id]', params: { id: gig.id } })}
        accessibilityRole="button"
        accessibilityLabel={`檢視任務 ${gig.title}`}
        className="flex-row items-start gap-2"
      >
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            {gig.isUrgent ? <Zap size={13} color={COLORS.coral} strokeWidth={2.4} /> : null}
            <Text className="text-ink flex-1 text-[15px] font-semibold" numberOfLines={2}>
              {gig.title}
            </Text>
          </View>
          <Text className="text-muted mt-1 text-[12px]">
            {gig.clientName}・{gig.location.region}・{formatRelativeTime(gig.createdAt)}
          </Text>
        </View>
        <ChevronRight size={16} color={COLORS.muted} strokeWidth={2.2} />
      </Pressable>

      <View className="flex-row flex-wrap items-center gap-1.5">
        <StaticTag label={gig.tag} tone="brand" />
        {category ? <StaticTag label={category.name} /> : null}
        {budget ? <StaticTag label={budget.label} /> : null}
        <StaticTag
          label={isTakenDown ? '已下架' : STATUS_LABEL[gig.status]}
          tone={isTakenDown ? 'coral' : gig.status === 'completed' ? 'brand' : 'neutral'}
        />
      </View>

      <Text className="text-ink-soft text-[12px]">
        提案 {bidCount} 份・對話 {conversationCount} 組
        {gig.assignedTalentName ? `・已指派 ${gig.assignedTalentName}` : ''}
      </Text>

      {isTakenDown ? (
        <View className="border-coral/25 bg-coral-soft rounded-xl border px-3 py-2">
          <Text className="text-coral text-[12px] font-semibold">
            下架原因：{gig.takedownReason}
          </Text>
          {gig.takedownAt ? (
            <Text className="text-muted mt-0.5 text-[11px]">
              {formatRelativeTime(gig.takedownAt)}由管理員處理
            </Text>
          ) : null}
        </View>
      ) : null}

      <View className="border-hairline border-t pt-3">
        {isTakenDown ? (
          <Button size="md" variant="tertiary" onPress={onRestore}>
            <Button.Label>恢復上架</Button.Label>
          </Button>
        ) : (
          <Button size="md" variant="primary" className="bg-coral" onPress={onTakedown}>
            <Button.Label>下架任務</Button.Label>
          </Button>
        )}
      </View>
    </View>
  );
}
