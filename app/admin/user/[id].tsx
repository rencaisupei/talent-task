import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  BadgeCheck,
  Ban,
  Coins,
  MessageSquareOff,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react-native';

import { AdminScreen } from '@/components/admin/AdminScreen';
import {
  ActionButton,
  AdminField,
  AdminGroup,
  AdminInput,
  DataRow,
  FilterChips,
  StatusPill,
} from '@/components/admin/AdminUI';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  ADMIN_STATUS_LABEL,
  ADMIN_STATUS_TONE,
  REPORT_KIND_LABEL,
  REPORT_STATUS_LABEL,
  REPORT_STATUS_TONE,
} from '@/lib/data/admin';
import { getProfileById } from '@/lib/data/profiles';
import { relativeTime } from '@/lib/format';
import { useAdminStore, useAdminUserRecord } from '@/lib/stores/admin';
import { useAuthStore } from '@/lib/stores/auth';
import { TIER_LABEL } from '@/lib/stores/subscription';
import { NEON } from '@/lib/theme';
import type { AdminUserStatus, Tier } from '@/lib/types';

type TierFilter = Tier | 'none';

const STATUS_ACTIONS: {
  status: AdminUserStatus;
  label: string;
  tone: 'success' | 'warning' | 'danger';
}[] = [
  { status: 'active', label: '恢復正常', tone: 'success' },
  { status: 'muted', label: '禁言', tone: 'warning' },
  { status: 'suspended', label: '停權 7 天', tone: 'warning' },
  { status: 'banned', label: '永久封鎖', tone: 'danger' },
];

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useAuthStore((state) => state.me);
  const profile = id === 'me' ? me : getProfileById(id);
  const record = useAdminUserRecord(id ?? '');
  const reports = useAdminStore((state) => state.reports);
  const setUserStatus = useAdminStore((state) => state.setUserStatus);
  const warnUser = useAdminStore((state) => state.warnUser);
  const setUserVerified = useAdminStore((state) => state.setUserVerified);
  const setUserNote = useAdminStore((state) => state.setUserNote);
  const adjustUserCoins = useAdminStore((state) => state.adjustUserCoins);
  const setUserTier = useAdminStore((state) => state.setUserTier);

  const [note, setNote] = useState(record.note);
  const [coinInput, setCoinInput] = useState('');

  if (!profile || !id) {
    return (
      <Screen>
        <ScreenHeader back fallback="/admin/users" title="使用者" />
        <EmptyState title="找不到這個帳號" description="它可能已經被刪除或 ID 有誤。" />
      </Screen>
    );
  }

  const related = reports.filter((report) => report.targetId === id);
  const tierValue: TierFilter = record.tierOverride ?? 'none';

  const applyCoins = () => {
    const amount = Number.parseInt(coinInput, 10);
    if (Number.isNaN(amount) || amount === 0) return;
    adjustUserCoins(id, amount);
    setCoinInput('');
  };

  return (
    <AdminScreen title={profile.name} subtitle={`帳號 ${profile.id}`} fallback="/admin/users">
      <View className="bg-surface border-border/60 flex-row items-center gap-3 rounded-3xl border p-4">
        <UserAvatar uri={profile.photos[0]} name={profile.name} size={64} ring />
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Txt weight="bold" className="text-foreground text-base">
              {profile.name}，{profile.age}
            </Txt>
            {record.verified ? <BadgeCheck color={NEON.cyan} size={16} /> : null}
          </View>
          <Txt className="text-muted text-[12px]">
            {profile.city}
            {profile.district} · {profile.job}
          </Txt>
          <View className="mt-1 flex-row gap-2">
            <StatusPill
              label={ADMIN_STATUS_LABEL[record.status]}
              tone={ADMIN_STATUS_TONE[record.status]}
            />
            <StatusPill
              label={`警告 ${record.warnings}`}
              tone={record.warnings ? 'warning' : 'neutral'}
            />
            {record.tierOverride ? (
              <StatusPill label={TIER_LABEL[record.tierOverride]} tone="primary" />
            ) : null}
          </View>
        </View>
      </View>

      <Section title="帳號狀態">
        <View className="flex-row flex-wrap gap-2">
          {STATUS_ACTIONS.map((action) => (
            <ActionButton
              key={action.status}
              label={action.label}
              tone={record.status === action.status ? 'primary' : action.tone}
              icon={
                action.status === 'banned' ? (
                  <Ban color={record.status === action.status ? '#ffffff' : NEON.coral} size={13} />
                ) : action.status === 'muted' ? (
                  <MessageSquareOff
                    color={record.status === action.status ? '#ffffff' : NEON.amber}
                    size={13}
                  />
                ) : action.status === 'active' ? (
                  <ShieldCheck
                    color={record.status === action.status ? '#ffffff' : NEON.lime}
                    size={13}
                  />
                ) : undefined
              }
              onPress={() => setUserStatus(id, action.status)}
            />
          ))}
          <ActionButton
            label="發出警告"
            tone="warning"
            icon={<TriangleAlert color={NEON.amber} size={13} />}
            onPress={() => warnUser(id)}
          />
          <ActionButton
            label={record.verified ? '取消真人認證' : '通過真人認證'}
            tone={record.verified ? 'neutral' : 'success'}
            onPress={() => setUserVerified(id, !record.verified)}
          />
        </View>
      </Section>

      <Section title="會員等級" subtitle="手動指定後會覆蓋商店訂閱狀態">
        <FilterChips<TierFilter>
          options={[
            { key: 'none', label: '沿用原狀態' },
            { key: 'free', label: '免費會員' },
            { key: 'plus', label: 'Plus' },
            { key: 'vip', label: 'VIP' },
          ]}
          value={tierValue}
          onChange={(next) => setUserTier(id, next === 'none' ? null : next)}
        />
      </Section>

      <Section
        title="心動代幣"
        subtitle={`後台累計調整 ${record.coinAdjust >= 0 ? '+' : ''}${record.coinAdjust}`}
      >
        <View className="gap-3">
          <View className="flex-row flex-wrap gap-2">
            <ActionButton
              label="+50"
              tone="success"
              icon={<Coins color={NEON.lime} size={13} />}
              onPress={() => adjustUserCoins(id, 50)}
            />
            <ActionButton label="+100" tone="success" onPress={() => adjustUserCoins(id, 100)} />
            <ActionButton label="+500" tone="success" onPress={() => adjustUserCoins(id, 500)} />
            <ActionButton label="-50" tone="danger" onPress={() => adjustUserCoins(id, -50)} />
          </View>
          <AdminField label="自訂數量（負數為扣除）">
            <AdminInput
              value={coinInput}
              onChangeText={setCoinInput}
              placeholder="例如 300 或 -120"
              keyboardType="number-pad"
              onSubmitEditing={applyCoins}
            />
          </AdminField>
          <ActionButton label="套用調整" tone="primary" onPress={applyCoins} />
        </View>
      </Section>

      <Section title="後台備註">
        <View className="gap-3">
          <AdminField label="僅管理員可見">
            <AdminInput
              value={note}
              onChangeText={setNote}
              placeholder="紀錄處理過程、客服溝通內容等"
              multiline
            />
          </AdminField>
          <ActionButton label="儲存備註" tone="primary" onPress={() => setUserNote(id, note)} />
          {record.updatedAt ? (
            <Txt className="text-muted text-[11px]">最後更新：{relativeTime(record.updatedAt)}</Txt>
          ) : null}
        </View>
      </Section>

      <Section title={`相關檢舉（${related.length}）`}>
        <AdminGroup>
          {related.length === 0 ? (
            <DataRow title="沒有檢舉紀錄" subtitle="這個帳號目前沒有被檢舉過" last />
          ) : (
            related.map((report, index) => (
              <DataRow
                key={report.id}
                title={`${report.reason} · ${REPORT_KIND_LABEL[report.kind]}`}
                subtitle={`${report.detail} · ${relativeTime(report.createdAt)}`}
                right={
                  <StatusPill
                    label={REPORT_STATUS_LABEL[report.status]}
                    tone={REPORT_STATUS_TONE[report.status]}
                  />
                }
                last={index === related.length - 1}
              />
            ))
          )}
        </AdminGroup>
      </Section>
    </AdminScreen>
  );
}
