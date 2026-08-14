import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Button, SearchField } from 'heroui-native';
import { BadgeCheck, Ban, ChevronRight, Crown, UserSearch } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { EmptyState } from '@/components/SectionHeading';
import { SegmentedTabs, type SegmentOption } from '@/components/SegmentedTabs';
import { StaticTag } from '@/components/TagChip';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { COLORS } from '@/lib/colors';
import { formatDate, formatNumber } from '@/lib/format';
import { useAdminStore } from '@/lib/stores/admin';
import { usePlatformUserStore } from '@/lib/stores/platformUsers';
import { useRevenueStore } from '@/lib/stores/revenue';
import { useSessionStore } from '@/lib/stores/session';
import { LOCAL_USER_ID, type PlatformUser } from '@/lib/types';

type UserFilter = 'all' | 'client' | 'talent' | 'premium' | 'pending' | 'banned';

export default function AdminUsersScreen() {
  const users = usePlatformUserStore((state) => state.users);
  const bannedUserIds = useAdminStore((state) => state.bannedUserIds);
  const grantPremium = useRevenueStore((state) => state.grantPremium);
  const revokePremium = useRevenueStore((state) => state.revokePremium);
  const logAction = useAuditLogger();

  const localName = useSessionStore((state) => state.displayName);
  const localRole = useSessionStore((state) => state.role);
  const localPremium = useSessionStore((state) => state.isPremium);

  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const [confirmLocal, setConfirmLocal] = useState(false);

  const counts = useMemo(
    () => ({
      all: users.length,
      client: users.filter((user) => user.role === 'client').length,
      talent: users.filter((user) => user.role === 'talent').length,
      premium: users.filter((user) => user.isPremium).length,
      pending: users.filter((user) => user.verification === 'pending').length,
      banned: users.filter((user) => bannedUserIds.includes(user.id)).length,
    }),
    [bannedUserIds, users],
  );

  const options: SegmentOption<UserFilter>[] = [
    { id: 'all', label: '全部', count: counts.all },
    { id: 'client', label: '客戶', count: counts.client },
    { id: 'talent', label: '人才', count: counts.talent },
    { id: 'premium', label: '進階版', count: counts.premium },
    { id: 'pending', label: '待驗證', count: counts.pending },
    { id: 'banned', label: '已停權', count: counts.banned },
  ];

  const data = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return users.filter((user) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'client'
            ? user.role === 'client'
            : filter === 'talent'
              ? user.role === 'talent'
              : filter === 'premium'
                ? user.isPremium
                : filter === 'pending'
                  ? user.verification === 'pending'
                  : bannedUserIds.includes(user.id);
      if (!matchesFilter) return false;
      if (needle.length === 0) return true;
      return [user.name, user.id, user.region, ...user.tags].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
  }, [bannedUserIds, filter, keyword, users]);

  const handleLocalSubscription = () => {
    if (localPremium) {
      revokePremium(LOCAL_USER_ID);
      logAction({
        kind: 'subscription',
        summary: '取消進階版：本機示範帳號',
        targetId: LOCAL_USER_ID,
        targetLabel: localName,
      });
    } else {
      grantPremium({ id: LOCAL_USER_ID, name: localName });
      logAction({
        kind: 'subscription',
        summary: '手動開通進階版：本機示範帳號',
        targetId: LOCAL_USER_ID,
        targetLabel: localName,
      });
    }
    setConfirmLocal(false);
  };

  return (
    <View className="bg-background flex-1">
      <AdminHeader
        title="使用者管理總表"
        caption={`${formatNumber(users.length)} 位帳號・停權 ${counts.banned} 個`}
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
                  placeholder="搜尋姓名、帳號代碼、地區或標籤"
                  returnKeyType="search"
                />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>

            <SegmentedTabs options={options} value={filter} onChange={setFilter} />

            <View className="border-brand/25 bg-brand-soft gap-3 rounded-xl border p-4">
              <Text className="text-ink text-[14px] font-semibold">本機示範帳號</Text>
              <Text className="text-ink-soft text-[12px] leading-5">
                {localName}・{localRole === 'client' ? '尋找專家' : '我要接案'}・
                {localPremium ? '進階版使用中' : '免費版'}
              </Text>
              <Button size="md" variant="tertiary" onPress={() => setConfirmLocal(true)}>
                <Button.Label>{localPremium ? '取消進階版' : '手動開通進階版'}</Button.Label>
              </Button>
              <Text className="text-muted text-[11px] leading-4">
                此動作會即時反映在使用者端的對話配額與訂閱狀態。
              </Text>
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <UserRow user={item} isBanned={bannedUserIds.includes(item.id)} />
        )}
        ListEmptyComponent={
          <EmptyState
            title="沒有符合條件的帳號"
            caption="調整搜尋關鍵字或切換篩選條件。"
            icon={<UserSearch size={22} color={COLORS.brand} strokeWidth={2.1} />}
          />
        }
      />

      <ConfirmSheet
        visible={confirmLocal}
        title={localPremium ? '取消本機帳號的進階版？' : '手動開通進階版？'}
        message={
          localPremium
            ? '使用中的帳務紀錄將轉為已取消，對話配額回到每月 2 組。'
            : '將建立一筆「管理員開通」帳務紀錄，該帳號可無限開啟新對話。'
        }
        actions={[
          {
            id: 'confirm',
            label: localPremium ? '確認取消' : '確認開通',
            tone: localPremium ? 'danger' : 'primary',
          },
        ]}
        onSelect={handleLocalSubscription}
        onCancel={() => setConfirmLocal(false)}
      />
    </View>
  );
}

interface UserRowProps {
  user: PlatformUser;
  isBanned: boolean;
}

function UserRow({ user, isBanned }: UserRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`檢視 ${user.name} 的帳號詳情`}
      className="border-hairline flex-row items-center gap-3 rounded-xl border bg-white p-4"
      onPress={() => router.push({ pathname: '/admin/user/[id]', params: { id: user.id } })}
    >
      <View className="bg-canvas h-11 w-11 items-center justify-center rounded-xl">
        <Text className="text-ink text-[16px] font-bold">{user.name.slice(0, 1)}</Text>
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-ink text-[15px] font-semibold">{user.name}</Text>
          {user.verification === 'approved' ? (
            <BadgeCheck size={14} color={COLORS.brand} strokeWidth={2.2} />
          ) : null}
          {user.isPremium ? <Crown size={13} color={COLORS.coral} strokeWidth={2.2} /> : null}
          {isBanned ? <Ban size={13} color={COLORS.coral} strokeWidth={2.2} /> : null}
        </View>
        <Text className="text-muted mt-0.5 text-[12px]">
          {user.role === 'client' ? '客戶' : '人才'}・{user.region}・加入{' '}
          {formatDate(user.joinedAt)}
        </Text>
        <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
          <StaticTag
            label={
              user.role === 'client'
                ? `發布 ${user.publishedGigs} 件`
                : `完成 ${user.completedJobs} 件`
            }
          />
          {user.role === 'talent' ? (
            <StaticTag label={`星等 ${user.rating.toFixed(1)}`} tone="brand" />
          ) : null}
          {isBanned ? <StaticTag label="已停權" tone="coral" /> : null}
          {user.verification === 'pending' ? <StaticTag label="待驗證" tone="coral" /> : null}
        </View>
      </View>

      <ChevronRight size={16} color={COLORS.muted} strokeWidth={2.2} />
    </Pressable>
  );
}
