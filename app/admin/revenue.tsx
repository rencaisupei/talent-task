import { router } from 'expo-router';
import { Button } from 'heroui-native';
import { ArrowUpRight, CreditCard, Receipt } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { KpiCard } from '@/components/KpiCard';
import { EmptyState, SectionHeading } from '@/components/SectionHeading';
import { SegmentedTabs, type SegmentOption } from '@/components/SegmentedTabs';
import { StaticTag } from '@/components/TagChip';
import { TrendLineChart } from '@/components/TrendLineChart';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { MONTHLY_REVENUE } from '@/lib/adminSeed';
import { CATEGORY_FILTER_ALL, usePlatformAnalytics } from '@/lib/analytics';
import { COLORS } from '@/lib/colors';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/format';
import { revenueTotals, useRevenueStore } from '@/lib/stores/revenue';
import { PREMIUM_PRICE_TWD } from '@/lib/stores/session';
import {
  SUBSCRIPTION_CHANNEL_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  type SubscriptionRecord,
  type SubscriptionStatus,
} from '@/lib/types';

type LedgerFilter = 'all' | SubscriptionStatus;

type PendingAction = { kind: 'refund' | 'cancel'; record: SubscriptionRecord };

export default function AdminRevenueScreen() {
  const subscriptions = useRevenueStore((state) => state.subscriptions);
  const refundSubscription = useRevenueStore((state) => state.refundSubscription);
  const revokePremium = useRevenueStore((state) => state.revokePremium);
  const logAction = useAuditLogger();
  const analytics = usePlatformAnalytics(CATEGORY_FILTER_ALL);

  const [filter, setFilter] = useState<LedgerFilter>('all');
  const [pending, setPending] = useState<PendingAction | null>(null);

  const totals = useMemo(() => revenueTotals(subscriptions), [subscriptions]);
  const sixMonthRevenue = useMemo(
    () => MONTHLY_REVENUE.reduce((sum, point) => sum + point.value, 0),
    [],
  );

  const options: SegmentOption<LedgerFilter>[] = [
    { id: 'all', label: '全部', count: subscriptions.length },
    { id: 'active', label: '使用中', count: totals.activeCount },
    { id: 'cancelled', label: '已取消', count: totals.cancelledCount },
    { id: 'refunded', label: '已退款', count: totals.refundedCount },
  ];

  const ledger = useMemo(
    () =>
      filter === 'all' ? subscriptions : subscriptions.filter((record) => record.status === filter),
    [filter, subscriptions],
  );

  const handleConfirm = () => {
    if (!pending) return;
    const { kind, record } = pending;
    if (kind === 'refund') {
      refundSubscription(record.id);
      logAction({
        kind: 'subscription',
        summary: `標記退款：訂閱 ${record.invoiceNo}`,
        targetId: record.userId,
        targetLabel: record.userName,
      });
    } else {
      revokePremium(record.userId);
      logAction({
        kind: 'subscription',
        summary: `取消訂閱：${record.invoiceNo}`,
        targetId: record.userId,
        targetLabel: record.userName,
      });
    }
    setPending(null);
  };

  return (
    <View className="bg-background flex-1">
      <AdminHeader
        title="訂閱與營收管理"
        caption={`進階版 ${formatCurrency(PREMIUM_PRICE_TWD)}／月`}
      />

      <ScrollView
        contentContainerClassName="px-5 py-5 pb-12 gap-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3">
          <KpiCard
            label="即時月經常性收入"
            value={formatCurrency(analytics.mrrEstimate)}
            caption={`活躍付費人才 ${formatNumber(analytics.activePremiumTalents)} 位 × ${formatCurrency(PREMIUM_PRICE_TWD)}`}
            tone="brand"
          />
          <View className="flex-row gap-3">
            <KpiCard
              className="flex-1"
              label="近 6 個月累計營收"
              value={formatCurrency(sixMonthRevenue)}
              caption="含 App Store 與 Google Play"
            />
            <KpiCard
              className="flex-1"
              label="退款金額"
              value={formatCurrency(totals.refundedAmount)}
              caption={`退款 ${totals.refundedCount} 筆`}
              tone="coral"
            />
          </View>
          <View className="flex-row gap-3">
            <KpiCard
              className="flex-1"
              label="帳務明細續訂率"
              value={formatPercent(totals.renewRate)}
              caption={`使用中 ${totals.activeCount} 筆`}
              tone="brand"
            />
            <KpiCard
              className="flex-1"
              label="明細月收入"
              value={formatCurrency(totals.ledgerMrr)}
              caption="抽樣帳務紀錄合計"
            />
          </View>
        </View>

        <TrendLineChart
          points={MONTHLY_REVENUE}
          title="每月經常性收入趨勢"
          caption="以進階版訂閱人數 × NT$399 計算"
          formatValue={(value) => formatCurrency(value)}
          unitLabel="營收"
        />

        <View className="gap-3">
          <SectionHeading
            title="訂閱帳務明細"
            caption="可標記退款或取消，動作會同步使用者端訂閱狀態"
          />
          <SegmentedTabs options={options} value={filter} onChange={setFilter} />

          {ledger.length === 0 ? (
            <EmptyState
              title="沒有符合條件的帳務紀錄"
              caption="切換上方篩選條件查看其他狀態。"
              icon={<Receipt size={22} color={COLORS.brand} strokeWidth={2.1} />}
            />
          ) : (
            ledger.map((record) => (
              <View
                key={record.id}
                className="border-hairline gap-3 rounded-xl border bg-white p-4"
              >
                <View className="flex-row items-start gap-3">
                  <View className="bg-canvas h-10 w-10 items-center justify-center rounded-xl">
                    <CreditCard size={17} color={COLORS.ink} strokeWidth={2.1} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink text-[15px] font-semibold">{record.userName}</Text>
                    <Text className="text-muted mt-0.5 text-[12px]">
                      {record.invoiceNo}・{SUBSCRIPTION_CHANNEL_LABEL[record.channel]}
                    </Text>
                  </View>
                  <StaticTag
                    label={SUBSCRIPTION_STATUS_LABEL[record.status]}
                    tone={record.status === 'active' ? 'brand' : 'coral'}
                  />
                </View>

                <View className="border-hairline flex-row flex-wrap gap-x-6 gap-y-2 border-t pt-3">
                  <LedgerStat label="金額" value={`${formatCurrency(record.amount)}／月`} />
                  <LedgerStat label="起始日" value={formatDate(record.startedAt)} />
                  <LedgerStat
                    label={record.status === 'active' ? '下次續約' : '原續約日'}
                    value={formatDate(record.renewsAt)}
                  />
                  {record.refundedAt ? (
                    <LedgerStat label="退款日" value={formatDate(record.refundedAt)} />
                  ) : null}
                </View>

                {record.status === 'active' ? (
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Button
                        size="md"
                        variant="primary"
                        className="bg-coral"
                        onPress={() => setPending({ kind: 'refund', record })}
                      >
                        <Button.Label>標記退款</Button.Label>
                      </Button>
                    </View>
                    <View className="flex-1">
                      <Button
                        size="md"
                        variant="tertiary"
                        onPress={() => setPending({ kind: 'cancel', record })}
                      >
                        <Button.Label>取消訂閱</Button.Label>
                      </Button>
                    </View>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View className="border-brand/25 bg-brand-soft gap-3 rounded-xl border p-4">
          <View className="flex-row items-center gap-2">
            <ArrowUpRight size={16} color={COLORS.brandStrong} strokeWidth={2.2} />
            <Text className="text-ink text-[15px] font-semibold">手動開通進階版</Text>
          </View>
          <Text className="text-ink-soft text-[13px] leading-5">
            客服補償或合作夥伴開通請至使用者管理總表，於帳號詳情頁執行，系統會建立「管理員開通」帳務紀錄。
          </Text>
          <Button size="md" onPress={() => router.push('/admin/users')}>
            <Button.Label>前往使用者管理總表</Button.Label>
          </Button>
        </View>
      </ScrollView>

      <ConfirmSheet
        visible={pending !== null}
        title={pending?.kind === 'refund' ? '標記此筆訂閱退款？' : '取消此筆訂閱？'}
        message={
          pending?.kind === 'refund'
            ? `${pending.record.userName}（${pending.record.invoiceNo}）將標記為已退款，並停用進階版權益。`
            : `${pending?.record.userName ?? ''} 的進階版將於本期結束後停止，對話配額回到每月 2 組。`
        }
        actions={[
          {
            id: 'confirm',
            label: pending?.kind === 'refund' ? '確認退款' : '確認取消',
            tone: 'danger',
          },
        ]}
        onSelect={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </View>
  );
}

interface LedgerStatProps {
  label: string;
  value: string;
}

function LedgerStat({ label, value }: LedgerStatProps) {
  return (
    <View>
      <Text className="text-muted text-[11px]">{label}</Text>
      <Text className="text-ink mt-0.5 text-[13px] font-semibold">{value}</Text>
    </View>
  );
}
