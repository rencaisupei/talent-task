import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { TextInput } from 'react-native';
import { useThemeColor } from 'heroui-native';

import { AdminScreen } from '@/components/admin/AdminScreen';
import { AdminGroup, DataRow, FilterChips, StatusPill } from '@/components/admin/AdminUI';
import { Txt } from '@/components/ui/Txt';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ADMIN_STATUS_LABEL, ADMIN_STATUS_TONE } from '@/lib/data/admin';
import { SEED_PROFILES } from '@/lib/data/seed';
import { DEFAULT_USER_RECORD, useAdminStore } from '@/lib/stores/admin';
import { useAuthStore } from '@/lib/stores/auth';
import { TIER_LABEL } from '@/lib/stores/subscription';
import type { AdminUserStatus } from '@/lib/types';

type StatusFilter = 'all' | AdminUserStatus;

export default function AdminUsersScreen() {
  const me = useAuthStore((state) => state.me);
  const records = useAdminStore((state) => state.users);
  const [muted] = useThemeColor(['muted']);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const people = useMemo(() => [me, ...SEED_PROFILES], [me]);

  const rows = people.map((profile) => ({
    profile,
    record: records[profile.id] ?? DEFAULT_USER_RECORD,
  }));

  const counts = rows.reduce<Record<StatusFilter, number>>(
    (acc, row) => {
      acc.all += 1;
      acc[row.record.status] += 1;
      return acc;
    },
    { all: 0, active: 0, muted: 0, suspended: 0, banned: 0 },
  );

  const keyword = query.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (status !== 'all' && row.record.status !== status) return false;
    if (!keyword) return true;
    const haystack = [
      row.profile.name,
      row.profile.id,
      row.profile.city,
      row.profile.district,
      row.profile.job,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(keyword);
  });

  return (
    <AdminScreen title="使用者管理" subtitle={`${counts.all} 個帳號`}>
      <View className="bg-surface border-border/60 flex-row items-center gap-2 rounded-2xl border px-3.5 py-2.5">
        <Search color={muted} size={16} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="搜尋名字、帳號 ID、城市或職業"
          placeholderTextColor={muted}
          className="text-foreground flex-1 text-[14px]"
        />
      </View>

      <FilterChips<StatusFilter>
        options={[
          { key: 'all', label: '全部', count: counts.all },
          { key: 'active', label: '正常', count: counts.active },
          { key: 'muted', label: '禁言', count: counts.muted },
          { key: 'suspended', label: '停權', count: counts.suspended },
          { key: 'banned', label: '封鎖', count: counts.banned },
        ]}
        value={status}
        onChange={setStatus}
      />

      <AdminGroup>
        {filtered.length === 0 ? (
          <DataRow title="沒有符合條件的帳號" subtitle="換個關鍵字或狀態再試一次" last />
        ) : (
          filtered.map((row, index) => (
            <DataRow
              key={row.profile.id}
              title={`${row.profile.name}${row.profile.id === 'me' ? '（本人）' : ''} · ${row.profile.age}`}
              subtitle={`${row.profile.city}${row.profile.district} · ${row.profile.job} · 警告 ${row.record.warnings} 次`}
              left={
                <UserAvatar
                  uri={row.profile.photos[0]}
                  name={row.profile.name}
                  size={40}
                  verified={row.record.verified}
                />
              }
              right={
                <View className="items-end gap-1">
                  <StatusPill
                    label={ADMIN_STATUS_LABEL[row.record.status]}
                    tone={ADMIN_STATUS_TONE[row.record.status]}
                  />
                  {row.record.tierOverride ? (
                    <Txt className="text-accent text-[10px]">
                      {TIER_LABEL[row.record.tierOverride]}
                    </Txt>
                  ) : null}
                </View>
              }
              onPress={() =>
                router.push({ pathname: '/admin/user/[id]', params: { id: row.profile.id } })
              }
              last={index === filtered.length - 1}
            />
          ))
        )}
      </AdminGroup>
    </AdminScreen>
  );
}
