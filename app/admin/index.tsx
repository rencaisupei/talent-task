import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  BellRing,
  CalendarClock,
  Coins,
  Flag,
  Gamepad2,
  Heart,
  LogOut,
  MessageSquare,
  ScrollText,
  ShieldAlert,
  Sliders,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react-native';

import { AdminNotice, AdminScreen } from '@/components/admin/AdminScreen';
import {
  AdminGroup,
  DataRow,
  FilterChips,
  MiniBars,
  StatTile,
  StatusPill,
  ToggleRow,
} from '@/components/admin/AdminUI';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { ADMIN_ACCOUNTS, ADMIN_ROLE_LABEL, METRIC_DAYS } from '@/lib/data/admin';
import { SEED_PROFILES } from '@/lib/data/seed';
import { relativeTime } from '@/lib/format';
import { useAdminStore, usePendingReportCount, usePendingReviewCount } from '@/lib/stores/admin';
import { useChatStore } from '@/lib/stores/chat';
import { useMatchesStore } from '@/lib/stores/matches';
import { NEON } from '@/lib/theme';

type MetricKey = 'dau' | 'signups' | 'matches' | 'revenue';

const METRIC_OPTIONS: { key: MetricKey; label: string }[] = [
  { key: 'dau', label: '活躍用戶' },
  { key: 'signups', label: '新註冊' },
  { key: 'matches', label: '配對數' },
  { key: 'revenue', label: '營收' },
];

const MODULES = [
  { href: '/admin/users', label: '使用者管理', icon: Users, tint: NEON.cyan },
  { href: '/admin/reports', label: '檢舉審核', icon: Flag, tint: NEON.coral },
  { href: '/admin/moderation', label: '內容審核', icon: ShieldAlert, tint: NEON.amber },
  { href: '/admin/rooms', label: '遊戲房管理', icon: Gamepad2, tint: NEON.violet },
  { href: '/admin/finance', label: '金流後台', icon: Coins, tint: NEON.lime },
  { href: '/admin/push', label: '推播通知', icon: BellRing, tint: NEON.rose },
  { href: '/admin/events', label: '活動與公告', icon: CalendarClock, tint: NEON.cyan },
  { href: '/admin/settings', label: '系統設定', icon: Sliders, tint: NEON.amber },
  { href: '/admin/audit', label: '稽核紀錄', icon: ScrollText, tint: NEON.violet },
] as const;

export default function AdminDashboardScreen() {
  const flags = useAdminStore((state) => state.flags);
  const setFlag = useAdminStore((state) => state.setFlag);
  const audit = useAdminStore((state) => state.audit);
  const logout = useAdminStore((state) => state.logout);
  const users = useAdminStore((state) => state.users);
  const pendingReports = usePendingReportCount();
  const pendingReviews = usePendingReviewCount();
  const matchedIds = useMatchesStore((state) => state.matchedIds);
  const conversations = useChatStore((state) => state.conversations);

  const [metric, setMetric] = useState<MetricKey>('dau');

  const today = METRIC_DAYS[METRIC_DAYS.length - 1];
  const yesterday = METRIC_DAYS[METRIC_DAYS.length - 2];
  const weekRevenue = METRIC_DAYS.reduce((sum, day) => sum + day.revenue, 0);
  const dauDelta =
    today && yesterday ? Math.round(((today.dau - yesterday.dau) / yesterday.dau) * 100) : 0;
  const restricted = Object.values(users).filter((record) => record.status !== 'active').length;

  return (
    <AdminScreen
      title="管理員平台"
      subtitle="營運總覽"
      back={false}
      right={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="登出管理平台"
          hitSlop={8}
          onPress={() => {
            logout();
            router.replace('/settings');
          }}
          className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
        >
          <LogOut color="#8C8397" size={18} />
        </Pressable>
      }
    >
      {flags.maintenance ? (
        <AdminNotice text={`維護模式開啟中：${flags.maintenanceNotice}`} />
      ) : null}

      <View className="flex-row gap-2">
        <StatTile
          label="今日活躍"
          value={today?.dau.toLocaleString() ?? 0}
          hint={`${dauDelta >= 0 ? '+' : ''}${dauDelta}% 對比昨日`}
          icon={<TrendingUp color={NEON.cyan} size={14} />}
        />
        <StatTile
          label="今日新註冊"
          value={`${today?.signups ?? 0}`}
          hint={flags.registrationOpen ? '註冊開放中' : '註冊已關閉'}
          icon={<UserRound color={NEON.lime} size={14} />}
        />
      </View>

      <View className="flex-row gap-2">
        <StatTile
          label="今日配對"
          value={`${today?.matches ?? 0}`}
          hint={`本機配對 ${matchedIds.length} 組`}
          icon={<Heart color={NEON.rose} size={14} />}
        />
        <StatTile
          label="今日訊息"
          value={`${((today?.messages ?? 0) / 1000).toFixed(1)}k`}
          hint={`${conversations.length} 個對話`}
          icon={<MessageSquare color={NEON.violet} size={14} />}
        />
      </View>

      <View className="flex-row gap-2">
        <StatTile
          label="近 7 日營收"
          value={`NT$${weekRevenue.toLocaleString()}`}
          hint="訂閱 + 代幣"
          icon={<Coins color={NEON.amber} size={14} />}
          onPress={() => router.push('/admin/finance')}
        />
        <StatTile
          label="待處理事項"
          value={`${pendingReports + pendingReviews}`}
          hint={`檢舉 ${pendingReports} · 內容 ${pendingReviews}`}
          icon={<Flag color={NEON.coral} size={14} />}
          onPress={() => router.push('/admin/reports')}
        />
      </View>

      <Section title="近 7 日趨勢">
        <View className="bg-surface border-border/60 gap-3 rounded-3xl border p-4">
          <FilterChips options={METRIC_OPTIONS} value={metric} onChange={setMetric} />
          <MiniBars data={METRIC_DAYS.map((day) => ({ label: day.label, value: day[metric] }))} />
          <Txt className="text-muted text-[11px]">
            {metric === 'revenue'
              ? `平均日營收 NT$${Math.round(weekRevenue / METRIC_DAYS.length).toLocaleString()}`
              : `期間總計 ${METRIC_DAYS.reduce((sum, day) => sum + day[metric], 0).toLocaleString()}`}
          </Txt>
        </View>
      </Section>

      <Section title="系統狀態">
        <AdminGroup>
          <ToggleRow
            label="維護模式"
            hint="開啟後 App 內顯示維護公告，遊戲與配對暫停"
            value={flags.maintenance}
            onChange={(value) => setFlag('maintenance', value)}
          />
          <ToggleRow
            label="開放新註冊"
            hint="關閉後新使用者無法完成建檔"
            value={flags.registrationOpen}
            onChange={(value) => setFlag('registrationOpen', value)}
          />
          <DataRow
            title="受限帳號"
            subtitle="禁言、停權或封鎖中的帳號"
            right={
              <StatusPill label={`${restricted} 人`} tone={restricted ? 'warning' : 'success'} />
            }
            onPress={() => router.push('/admin/users')}
          />
          <DataRow
            title="總使用者"
            subtitle="含示範資料庫中的所有帳號"
            right={<StatusPill label={`${SEED_PROFILES.length + 1} 人`} />}
            onPress={() => router.push('/admin/users')}
            last
          />
        </AdminGroup>
      </Section>

      <Section title="管理模組">
        <View className="flex-row flex-wrap gap-3">
          {MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <Pressable
                key={module.href}
                accessibilityRole="button"
                accessibilityLabel={module.label}
                onPress={() => router.push(module.href)}
                className="bg-surface border-border/60 min-w-[30%] flex-1 items-center gap-2 rounded-2xl border p-3 active:opacity-80"
              >
                <Icon color={module.tint} size={20} />
                <Txt className="text-foreground text-center text-[11px]">{module.label}</Txt>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section
        title="最近操作"
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="查看全部稽核紀錄"
            onPress={() => router.push('/admin/audit')}
          >
            <Txt className="text-accent text-[12px]">全部</Txt>
          </Pressable>
        }
      >
        <AdminGroup>
          {audit.length === 0 ? (
            <DataRow title="尚無操作紀錄" subtitle="所有後台動作都會記錄在這裡" last />
          ) : (
            audit
              .slice(0, 4)
              .map((entry, index) => (
                <DataRow
                  key={entry.id}
                  title={entry.action}
                  subtitle={`${entry.actor}${entry.target ? ` · ${entry.target}` : ''} · ${relativeTime(entry.createdAt)}`}
                  last={index === Math.min(3, audit.length - 1)}
                />
              ))
          )}
        </AdminGroup>
      </Section>

      <Section title="管理員帳號">
        <AdminGroup>
          {ADMIN_ACCOUNTS.map((account, index) => (
            <DataRow
              key={account.id}
              title={`${account.name} · ${ADMIN_ROLE_LABEL[account.role]}`}
              subtitle={`${account.email} · ${relativeTime(account.lastActiveAt)}活躍`}
              right={
                <StatusPill
                  label={ADMIN_ROLE_LABEL[account.role]}
                  tone={account.role === 'owner' ? 'primary' : 'neutral'}
                />
              }
              last={index === ADMIN_ACCOUNTS.length - 1}
            />
          ))}
        </AdminGroup>
      </Section>
    </AdminScreen>
  );
}
