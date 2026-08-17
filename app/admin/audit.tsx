import { FlashList } from '@shopify/flash-list';
import {
  Ban,
  BellRing,
  ClipboardList,
  CreditCard,
  KeyRound,
  ScanEye,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Wrench,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { EmptyState } from '@/components/SectionHeading';
import { SegmentedTabs, type SegmentOption } from '@/components/SegmentedTabs';
import { StaticTag } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { formatClockTime, formatDate, formatRelativeTime } from '@/lib/format';
import { useAdminAuditStore } from '@/lib/stores/adminAudit';
import { ADMIN_ACTION_LABEL, type AdminActionKind, type AdminAuditEntry } from '@/lib/types';

type AuditFilter = 'all' | AdminActionKind;

const FILTER_ORDER: AdminActionKind[] = [
  'moderation',
  'verification',
  'ban',
  'gig',
  'subscription',
  'announcement',
  'report',
  'maintenance',
  'account',
  'auth',
];

function iconFor(kind: AdminActionKind) {
  const icons: Record<AdminActionKind, React.ReactNode> = {
    ban: <Ban size={15} color={COLORS.coral} strokeWidth={2.2} />,
    moderation: <ScanEye size={15} color={COLORS.coral} strokeWidth={2.2} />,
    verification: <ShieldCheck size={15} color={COLORS.brandStrong} strokeWidth={2.2} />,
    gig: <ClipboardList size={15} color={COLORS.ink} strokeWidth={2.2} />,
    subscription: <CreditCard size={15} color={COLORS.ink} strokeWidth={2.2} />,
    announcement: <BellRing size={15} color={COLORS.ink} strokeWidth={2.2} />,
    report: <ShieldAlert size={15} color={COLORS.coral} strokeWidth={2.2} />,
    maintenance: <Wrench size={15} color={COLORS.ink} strokeWidth={2.2} />,
    account: <UserCog size={15} color={COLORS.brandStrong} strokeWidth={2.2} />,
    auth: <KeyRound size={15} color={COLORS.muted} strokeWidth={2.2} />,
  };
  return icons[kind];
}

export default function AdminAuditScreen() {
  const entries = useAdminAuditStore((state) => state.entries);
  const [filter, setFilter] = useState<AuditFilter>('all');

  const options: SegmentOption<AuditFilter>[] = useMemo(
    () => [
      { id: 'all', label: '全部', count: entries.length },
      ...FILTER_ORDER.map((kind) => ({
        id: kind,
        label: ADMIN_ACTION_LABEL[kind],
        count: entries.filter((entry) => entry.kind === kind).length,
      })),
    ],
    [entries],
  );

  const data = useMemo(
    () => (filter === 'all' ? entries : entries.filter((entry) => entry.kind === filter)),
    [entries, filter],
  );

  return (
    <View className="bg-background flex-1">
      <AdminHeader title="管理員操作紀錄" caption={`共 ${entries.length} 筆稽核紀錄`} />

      <FlashList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-3 py-4">
            <SegmentedTabs options={options} value={filter} onChange={setFilter} />
            <Text className="text-muted text-[12px] leading-5">
              每筆紀錄都包含操作者、動作內容、對象與時間，供事後追查與交接使用。
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => <AuditRow entry={item} />}
        ListEmptyComponent={
          <EmptyState
            title="沒有符合條件的紀錄"
            caption="切換上方分類查看其他管理動作。"
            icon={<ScrollText size={22} color={COLORS.brand} strokeWidth={2.1} />}
          />
        }
      />
    </View>
  );
}

function AuditRow({ entry }: { entry: AdminAuditEntry }) {
  return (
    <View className="border-hairline flex-row items-start gap-3 rounded-xl border bg-white p-4">
      <View className="bg-canvas h-9 w-9 items-center justify-center rounded-xl">
        {iconFor(entry.kind)}
      </View>
      <View className="flex-1">
        <Text className="text-ink text-[14px] leading-5 font-semibold">{entry.summary}</Text>
        <Text className="text-muted mt-1 text-[12px]">
          {entry.adminName}・{formatDate(entry.at)} {formatClockTime(entry.at)}（
          {formatRelativeTime(entry.at)}）
        </Text>
        {entry.targetLabel ? (
          <Text className="text-ink-soft mt-1 text-[12px]">
            對象：{entry.targetLabel}
            {entry.targetId ? `（${entry.targetId}）` : ''}
          </Text>
        ) : null}
      </View>
      <StaticTag label={ADMIN_ACTION_LABEL[entry.kind]} />
    </View>
  );
}
