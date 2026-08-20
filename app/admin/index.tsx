import type { Href } from 'expo-router';
import { router } from 'expo-router';
import {
  Ban,
  BellRing,
  ChevronRight,
  ClipboardList,
  CreditCard,
  LogOut,
  MessageSquare,
  ScanEye,
  ScrollText,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmSheet, type ConfirmAction } from '@/components/ConfirmSheet';
import { KpiCard } from '@/components/KpiCard';
import { SectionHeading } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { useAccessIdentity } from '@/hooks/useAccessIdentity';
import { endAccessSession } from '@/lib/adminHost';
import {
  ADMIN_PERMISSION_LABEL,
  ADMIN_ROLE_SUMMARY,
  type AdminPermission,
} from '@/lib/adminPermissions';
import { CATEGORY_FILTER_ALL, usePlatformAnalytics } from '@/lib/analytics';
import { COLORS } from '@/lib/colors';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/format';
import { useAdminStore } from '@/lib/stores/admin';
import { useAdminAuditStore } from '@/lib/stores/adminAudit';
import { useAdminAuthStore } from '@/lib/stores/adminAuth';
import { useAnnouncementStore } from '@/lib/stores/announcements';
import { useAdminContentStore } from '@/lib/stores/adminContent';
import { usePlatformUserStore } from '@/lib/stores/platformUsers';
import { ADMIN_ACTION_LABEL, ADMIN_ROLE_LABEL } from '@/lib/types';

export default function AdminHomeScreen() {
  const currentAdmin = useAdminAuthStore((state) => state.currentAdmin);
  const permissions = useAdminAuthStore((state) => state.permissions);
  const signOut = useAdminAuthStore((state) => state.signOut);

  const verifications = useAdminStore((state) => state.verifications);
  const bannedUserIds = useAdminStore((state) => state.bannedUserIds);
  const users = usePlatformUserStore((state) => state.users);
  const gigs = useAdminContentStore((state) => state.gigs);
  const bids = useAdminContentStore((state) => state.bids);
  const conversations = useAdminContentStore((state) => state.conversations);
  const tickets = useAdminContentStore((state) => state.tickets);
  const refreshContent = useAdminContentStore((state) => state.refresh);
  const refreshChats = useAdminContentStore((state) => state.refreshChats);
  const refreshTickets = useAdminContentStore((state) => state.refreshTickets);
  const announcements = useAnnouncementStore((state) => state.announcements);
  const auditEntries = useAdminAuditStore((state) => state.entries);

  const analytics = usePlatformAnalytics(CATEGORY_FILTER_ALL);
  const accessIdentity = useAccessIdentity();

  const [signOutVisible, setSignOutVisible] = useState(false);

  const pendingVerifications = useMemo(
    () => verifications.filter((item) => item.status === 'pending').length,
    [verifications],
  );
  // 檢舉在雲端（conversations.report_state），只有審核權限才讀得到對話。
  const openReports = useMemo(
    () => conversations.filter((item) => item.reportState === 'open').length,
    [conversations],
  );
  const takedownCount = useMemo(
    () => gigs.filter((gig) => gig.takedownReason !== undefined).length,
    [gigs],
  );
  const pendingGigReviews = useMemo(
    () => gigs.filter((gig) => gig.review?.state === 'pending').length,
    [gigs],
  );
  const pendingBidReviews = useMemo(
    () =>
      bids.filter((bid) => bid.status !== 'withdrawn' && bid.review?.state === 'pending').length,
    [bids],
  );

  const openTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'open').length,
    [tickets],
  );

  useEffect(() => {
    void refreshContent();
    if (permissions.includes('review:manage')) {
      void refreshChats();
      void refreshTickets();
    }
  }, [permissions, refreshChats, refreshContent, refreshTickets]);

  const recentEntries = auditEntries.slice(0, 4);
  const canViewRevenue = permissions.includes('revenue:view');
  const canViewAudit = permissions.includes('audit:view');

  const modules = useMemo<AdminModule[]>(() => {
    const all: AdminModule[] = [
      {
        key: 'review',
        permission: 'review:manage',
        icon: <ScanEye size={17} color={COLORS.coral} strokeWidth={2.1} />,
        label: 'AI 認證複審中心',
        caption: `任務 ${pendingGigReviews} 件・提案 ${pendingBidReviews} 份・人才 ${pendingVerifications} 位待複審`,
        href: '/admin/review',
      },
      {
        key: 'users',
        permission: 'users:view',
        icon: <Users size={17} color={COLORS.ink} strokeWidth={2.1} />,
        label: '使用者管理總表',
        caption: `${formatNumber(users.length)} 位帳號・停權 ${bannedUserIds.length} 個`,
        href: '/admin/users',
      },
      {
        key: 'gigs',
        permission: 'gigs:manage',
        icon: <ClipboardList size={17} color={COLORS.ink} strokeWidth={2.1} />,
        label: '任務與內容管理',
        caption: `${formatNumber(gigs.length)} 件任務・已下架 ${takedownCount} 件`,
        href: '/admin/gigs',
      },
      {
        key: 'dashboard',
        permission: 'review:manage',
        icon: <ShieldCheck size={17} color={COLORS.ink} strokeWidth={2.1} />,
        label: '審核與安全中心',
        caption: `待審核 ${pendingVerifications} 件・未處理檢舉 ${openReports} 件`,
        href: '/admin/dashboard',
      },
      {
        key: 'support',
        permission: 'review:manage',
        icon: <MessageSquare size={17} color={COLORS.ink} strokeWidth={2.1} />,
        label: '客服留言（聯絡我們）',
        caption: `待處理 ${openTickets} 則・回覆寄到留言者信箱`,
        href: '/admin/support',
      },
      {
        key: 'revenue',
        permission: 'revenue:view',
        icon: <CreditCard size={17} color={COLORS.ink} strokeWidth={2.1} />,
        label: '訂閱與營收管理',
        caption: `月經常性收入 ${formatCurrency(analytics.mrrEstimate)}`,
        href: '/admin/revenue',
      },
      {
        key: 'announcements',
        permission: 'announcements:send',
        icon: <BellRing size={17} color={COLORS.ink} strokeWidth={2.1} />,
        label: '系統公告與推播',
        caption: `${announcements.length} 則公告已發布`,
        href: '/admin/announcements',
      },
      {
        key: 'accounts',
        permission: 'admins:manage',
        icon: <UserCog size={17} color={COLORS.brandStrong} strokeWidth={2.1} />,
        label: '管理員帳號管理',
        caption: '新增、停用、調整角色與重設密碼',
        href: '/admin/accounts',
      },
      {
        key: 'audit',
        permission: 'audit:view',
        icon: <ScrollText size={17} color={COLORS.ink} strokeWidth={2.1} />,
        label: '管理員操作紀錄',
        caption: `${formatNumber(auditEntries.length)} 筆稽核紀錄`,
        href: '/admin/audit',
      },
      {
        key: 'maintenance',
        permission: 'audit:view',
        icon: <Wrench size={17} color={COLORS.ink} strokeWidth={2.1} />,
        label: '每日系統維護',
        caption: '排程設定與伺服器端維護紀錄',
        href: '/admin/maintenance',
      },
    ];

    return all.filter((item) => permissions.includes(item.permission));
  }, [
    analytics.mrrEstimate,
    announcements.length,
    auditEntries.length,
    bannedUserIds.length,
    gigs.length,
    openReports,
    openTickets,
    pendingBidReviews,
    pendingGigReviews,
    pendingVerifications,
    permissions,
    takedownCount,
    users.length,
  ]);

  const handleSignOut = () => setSignOutVisible(true);

  const signOutActions: ConfirmAction[] =
    accessIdentity === null
      ? [{ id: 'local', label: '確認登出', tone: 'danger' }]
      : [
          { id: 'local', label: '僅登出管理帳號', tone: 'neutral' },
          { id: 'access', label: '登出並結束 Cloudflare 連線', tone: 'danger' },
        ];

  const confirmSignOut = (actionId: string) => {
    setSignOutVisible(false);
    void signOut();

    if (actionId === 'access') {
      endAccessSession();
      return;
    }

    router.replace('/admin/login');
  };

  return (
    <View className="bg-background flex-1">
      <AdminHeader
        title="管理員專屬平台"
        caption={
          currentAdmin
            ? `${currentAdmin.name}・${ADMIN_ROLE_LABEL[currentAdmin.role]}`
            : '營運管理中心'
        }
        fallback="/admin"
        showBack={false}
        right={
          <Pressable
            onPress={handleSignOut}
            accessibilityRole="button"
            accessibilityLabel="登出管理後台"
            className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
          >
            <LogOut size={17} color={COLORS.coral} strokeWidth={2.2} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerClassName="px-5 py-5 pb-12 gap-5"
        showsVerticalScrollIndicator={false}
      >
        {accessIdentity === null ? null : (
          <View className="border-brand/25 bg-brand-soft flex-row items-center gap-3 rounded-xl border px-4 py-3">
            <ShieldCheck size={16} color={COLORS.brandStrong} strokeWidth={2.2} />
            <View className="flex-1">
              <Text className="text-ink text-[13px] font-semibold">Cloudflare Access 已驗證</Text>
              <Text className="text-muted mt-0.5 text-[12px]">
                {accessIdentity.name ? `${accessIdentity.name}・` : ''}
                {accessIdentity.email}
              </Text>
            </View>
          </View>
        )}

        <View className="gap-3">
          <View className="flex-row gap-3">
            <KpiCard
              className="flex-1"
              label="待複審驗證"
              value={formatNumber(pendingVerifications)}
              caption="AI 認證未通過的人才"
              tone="coral"
            />
            <KpiCard
              className="flex-1"
              label="未處理檢舉"
              value={formatNumber(openReports)}
              caption="含詐騙關鍵字對話"
              tone="coral"
            />
          </View>
          <View className="flex-row gap-3">
            <KpiCard
              className="flex-1"
              label="待複審任務"
              value={formatNumber(pendingGigReviews)}
              caption="未通過即時認證"
              tone="coral"
            />
            <KpiCard
              className="flex-1"
              label="已封禁帳號"
              value={formatNumber(bannedUserIds.length)}
              caption="封禁引擎累計"
            />
          </View>
          <KpiCard
            label="平台累計註冊用戶"
            value={formatNumber(analytics.totalUsers)}
            caption={`任務累計 ${formatNumber(analytics.totalBroadcastedGigs)} 件・已下架 ${takedownCount} 件`}
            tone="brand"
          />
          {canViewRevenue ? (
            <KpiCard
              label="月經常性收入"
              value={formatCurrency(analytics.mrrEstimate)}
              caption={`活躍付費人才 ${formatNumber(analytics.activePremiumTalents)} 位`}
              tone="brand"
            />
          ) : null}
        </View>

        {currentAdmin === null ? null : (
          <View className="border-hairline gap-2 rounded-xl border bg-white p-4">
            <View className="flex-row items-center gap-2">
              <UserCog size={15} color={COLORS.brandStrong} strokeWidth={2.2} />
              <Text className="text-ink text-[14px] font-semibold">
                你的角色：{ADMIN_ROLE_LABEL[currentAdmin.role]}
              </Text>
            </View>
            <Text className="text-muted text-[12px] leading-5">
              {ADMIN_ROLE_SUMMARY[currentAdmin.role]}
            </Text>
            <View className="mt-1 flex-row flex-wrap gap-1.5">
              {permissions.map((permission) => (
                <StaticTag key={permission} label={ADMIN_PERMISSION_LABEL[permission]} />
              ))}
            </View>
          </View>
        )}

        <View className="gap-3">
          <SectionHeading title="管理模組" caption="只顯示你的角色可執行的模組" />
          <View className="border-hairline overflow-hidden rounded-xl border bg-white">
            {modules.map((module, index) => (
              <View key={module.key}>
                {index === 0 ? null : <Divider />}
                <ModuleRow
                  icon={module.icon}
                  label={module.label}
                  caption={module.caption}
                  onPress={() => router.push(module.href)}
                />
              </View>
            ))}
          </View>
        </View>

        {!canViewAudit ? null : (
          <View className="gap-3">
            <SectionHeading
              title="最新管理動作"
              caption="依時間排序"
              right={
                <Pressable
                  onPress={() => router.push('/admin/audit')}
                  accessibilityRole="button"
                  className="flex-row items-center gap-1"
                >
                  <Text className="text-brand-strong text-[13px] font-semibold">全部紀錄</Text>
                  <ChevronRight size={14} color={COLORS.brandStrong} strokeWidth={2.2} />
                </Pressable>
              }
            />
            <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
              {recentEntries.map((entry) => (
                <View key={entry.id} className="flex-row items-start gap-3">
                  <View className="bg-canvas h-8 w-8 items-center justify-center rounded-xl">
                    {entry.kind === 'ban' ? (
                      <Ban size={15} color={COLORS.coral} strokeWidth={2.2} />
                    ) : (
                      <ShieldCheck size={15} color={COLORS.brandStrong} strokeWidth={2.2} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink text-[13px] leading-5 font-semibold">
                      {entry.summary}
                    </Text>
                    <Text className="text-muted mt-0.5 text-[11px]">
                      {entry.adminName}・{formatRelativeTime(entry.at)}
                    </Text>
                  </View>
                  <StaticTag label={ADMIN_ACTION_LABEL[entry.kind]} />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <ConfirmSheet
        visible={signOutVisible}
        title="登出管理後台？"
        message={
          accessIdentity === null
            ? '將回到管理員登入頁，其他管理動作需重新登入。'
            : '僅登出管理帳號會停在登入頁；結束 Cloudflare 連線會連同網域驗證一起清除，下次進入需重新收取驗證碼。'
        }
        actions={signOutActions}
        onSelect={confirmSignOut}
        onCancel={() => setSignOutVisible(false)}
      />
    </View>
  );
}

function Divider() {
  return <View className="bg-hairline h-px" />;
}

interface AdminModule {
  key: string;
  permission: AdminPermission;
  icon: React.ReactNode;
  label: string;
  caption: string;
  href: Href;
}

interface ModuleRowProps {
  icon: React.ReactNode;
  label: string;
  caption: string;
  onPress: () => void;
}

function ModuleRow({ icon, label, caption, onPress }: ModuleRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 bg-white px-4 py-3.5"
    >
      <View className="bg-canvas h-9 w-9 items-center justify-center rounded-xl">{icon}</View>
      <View className="flex-1">
        <Text className="text-ink text-[14px] font-semibold">{label}</Text>
        <Text className="text-muted mt-0.5 text-[12px]">{caption}</Text>
      </View>
      <ChevronRight size={16} color={COLORS.muted} strokeWidth={2.2} />
    </Pressable>
  );
}
