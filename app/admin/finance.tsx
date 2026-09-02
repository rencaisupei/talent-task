import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Coins, CreditCard, RotateCcw, TrendingUp } from 'lucide-react-native';

import { AdminScreen } from '@/components/admin/AdminScreen';
import {
  ActionButton,
  AdminGroup,
  DataRow,
  FilterChips,
  MiniBars,
  StatTile,
  StatusPill,
} from '@/components/admin/AdminUI';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { METRIC_DAYS, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/lib/data/admin';
import { COIN_PACKS, SUBSCRIPTION_PLANS } from '@/lib/data/seed';
import { displayName } from '@/lib/data/profiles';
import { relativeTime } from '@/lib/format';
import { useAdminStore } from '@/lib/stores/admin';
import { NEON } from '@/lib/theme';
import type { AdminOrderStatus } from '@/lib/types';

type Filter = 'all' | AdminOrderStatus;

export default function AdminFinanceScreen() {
  const orders = useAdminStore((state) => state.orders);
  const flags = useAdminStore((state) => state.flags);
  const refundOrder = useAdminStore((state) => state.refundOrder);
  const [filter, setFilter] = useState<Filter>('all');

  const paid = orders.filter((order) => order.status === 'paid');
  const subscriptionRevenue = paid
    .filter((order) => order.kind === 'subscription')
    .reduce((sum, order) => sum + order.amountTwd, 0);
  const coinRevenue = paid
    .filter((order) => order.kind === 'coins')
    .reduce((sum, order) => sum + order.amountTwd, 0);
  const refunded = orders
    .filter((order) => order.status === 'refunded')
    .reduce((sum, order) => sum + order.amountTwd, 0);
  const weekRevenue = METRIC_DAYS.reduce((sum, day) => sum + day.revenue, 0);

  const counts = {
    all: orders.length,
    paid: paid.length,
    refunded: orders.filter((order) => order.status === 'refunded').length,
    failed: orders.filter((order) => order.status === 'failed').length,
    pending: orders.filter((order) => order.status === 'pending').length,
  };

  const visible = filter === 'all' ? orders : orders.filter((order) => order.status === filter);

  return (
    <AdminScreen title="金流後台" subtitle="訂閱、代幣與退款">
      <View className="flex-row gap-2">
        <StatTile
          label="近 7 日營收"
          value={`NT$${weekRevenue.toLocaleString()}`}
          hint="平台報表數據"
          icon={<TrendingUp color={NEON.lime} size={14} />}
        />
        <StatTile
          label="訂閱收入"
          value={`NT$${subscriptionRevenue.toLocaleString()}`}
          hint={`${paid.filter((order) => order.kind === 'subscription').length} 筆已付款`}
          icon={<CreditCard color={NEON.cyan} size={14} />}
        />
      </View>

      <View className="flex-row gap-2">
        <StatTile
          label="代幣收入"
          value={`NT$${coinRevenue.toLocaleString()}`}
          hint={`兌換率 1 元 = ${flags.coinRate} 代幣`}
          icon={<Coins color={NEON.amber} size={14} />}
        />
        <StatTile
          label="退款金額"
          value={`NT$${refunded.toLocaleString()}`}
          hint={`${counts.refunded} 筆退款`}
          icon={<RotateCcw color={NEON.coral} size={14} />}
        />
      </View>

      <Section title="每日營收">
        <View className="bg-surface border-border/60 rounded-3xl border p-4">
          <MiniBars data={METRIC_DAYS.map((day) => ({ label: day.label, value: day.revenue }))} />
        </View>
      </Section>

      <Section title="訂單" subtitle="來自 App Store 與 Google Play 的交易紀錄">
        <View className="gap-3">
          <FilterChips<Filter>
            options={[
              { key: 'all', label: '全部', count: counts.all },
              { key: 'paid', label: '已付款', count: counts.paid },
              { key: 'refunded', label: '已退款', count: counts.refunded },
              { key: 'failed', label: '失敗', count: counts.failed },
              { key: 'pending', label: '處理中', count: counts.pending },
            ]}
            value={filter}
            onChange={setFilter}
          />
          <AdminGroup>
            {visible.length === 0 ? (
              <DataRow title="沒有符合條件的訂單" last />
            ) : (
              visible.map((order, index) => (
                <View key={order.id}>
                  <DataRow
                    title={`${order.title} · NT$${order.amountTwd.toLocaleString()}`}
                    subtitle={`${displayName(order.userId, order.userId)} · ${
                      order.platform === 'ios' ? 'App Store' : 'Google Play'
                    } · ${relativeTime(order.createdAt)}`}
                    right={
                      <StatusPill
                        label={ORDER_STATUS_LABEL[order.status]}
                        tone={ORDER_STATUS_TONE[order.status]}
                      />
                    }
                    onPress={() =>
                      router.push({ pathname: '/admin/user/[id]', params: { id: order.userId } })
                    }
                    last={order.status === 'paid' ? false : index === visible.length - 1}
                  />
                  {order.status === 'paid' ? (
                    <View
                      className={`flex-row gap-2 px-4 pb-3 ${
                        index === visible.length - 1 ? '' : 'border-border/40 border-b'
                      }`}
                    >
                      <ActionButton
                        label="退款"
                        tone="warning"
                        onPress={() => refundOrder(order.id)}
                      />
                      <Txt className="text-muted self-center text-[10px]">
                        產品代號 {order.productId}
                      </Txt>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </AdminGroup>
        </View>
      </Section>

      <Section title="訂閱方案" subtitle="價格由 App Store / Google Play 後台設定">
        <AdminGroup>
          {SUBSCRIPTION_PLANS.map((plan, index) => (
            <DataRow
              key={plan.id}
              title={`${plan.title} · ${plan.priceLabel}`}
              subtitle={`${plan.perMonthLabel} · ${plan.productId}`}
              right={plan.popular ? <StatusPill label="熱門" tone="primary" /> : undefined}
              last={index === SUBSCRIPTION_PLANS.length - 1}
            />
          ))}
        </AdminGroup>
      </Section>

      <Section title="代幣包">
        <AdminGroup>
          {COIN_PACKS.map((pack, index) => (
            <DataRow
              key={pack.id}
              title={`${pack.coins} + ${pack.bonus} 心動代幣 · ${pack.priceLabel}`}
              subtitle={pack.productId}
              right={pack.popular ? <StatusPill label="最熱賣" tone="primary" /> : undefined}
              last={index === COIN_PACKS.length - 1}
            />
          ))}
        </AdminGroup>
      </Section>
    </AdminScreen>
  );
}
