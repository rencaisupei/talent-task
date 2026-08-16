import { router } from 'expo-router';
import {
  Ban,
  BellRing,
  ChevronRight,
  ClipboardList,
  CreditCard,
  LogOut,
  ScanEye,
  ScrollText,
  ShieldCheck,
  Users,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { KpiCard } from '@/components/KpiCard';
import { SectionHeading } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { CATEGORY_FILTER_ALL, usePlatformAnalytics } from '@/lib/analytics';
import { COLORS } from '@/lib/colors';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/format';
import { useAdminStore } from '@/lib/stores/admin';
import { useAdminAuditStore } from '@/lib/stores/adminAudit';
import { useAdminAuthStore } from '@/lib/stores/adminAuth';
import { useAnnouncementStore } from '@/lib/stores/announcements';
import { bidsAwaitingReview, useBidStore } from '@/lib/stores/bids';
import { gigsAwaitingReview, useGigStore } from '@/lib/stores/gigs';
import { usePlatformUserStore } from '@/lib/stores/platformUsers';
import { ADMIN_ACTION_LABEL, ADMIN_ROLE_LABEL } from '@/lib/types';

export default function AdminHomeScreen() {
  const currentAdmin = useAdminAuthStore((state) => state.currentAdmin);
  const signOut = useAdminAuthStore((state) => state.signOut);

  const verifications = useAdminStore((state) => state.verifications);
  const reports = useAdminStore((state) => state.reports);
  const bannedUserIds = useAdminStore((state) => state.bannedUserIds);
  const users = usePlatformUserStore((state) => state.users);
  const gigs = useGigStore((state) => state.gigs);
  const bids = useBidStore((state) => state.bids);
  const announcements = useAnnouncementStore((state) => state.announcements);
  const auditEntries = useAdminAuditStore((state) => state.entries);

  const analytics = usePlatformAnalytics(CATEGORY_FILTER_ALL);

  const [signOutVisible, setSignOutVisible] = useState(false);

  const pendingVerifications = useMemo(
    () => verifications.filter((item) => item.status === 'pending').length,
    [verifications],
  );
  const openReports = useMemo(() => reports.filter((item) => !item.resolved).length, [reports]);
  const takedownCount = useMemo(
    () => gigs.filter((gig) => gig.takedownReason !== undefined).length,
    [gigs],
  );
  const pendingGigReviews = useMemo(() => gigsAwaitingReview(gigs).length, [gigs]);
  const pendingBidReviews = useMemo(() => bidsAwaitingReview(bids).length, [bids]);

  const recentEntries = auditEntries.slice(0, 4);

  const handleSignOut = () => setSignOutVisible(true);

  const confirmSignOut = () => {
    setSignOutVisible(false);
    signOut();
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
        fallback="/(tabs)"
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
            label="月經常性收入"
            value={formatCurrency(analytics.mrrEstimate)}
            caption={`活躍付費人才 ${formatNumber(analytics.activePremiumTalents)} 位`}
            tone="brand"
          />
          <KpiCard
            label="平台累計註冊用戶"
            value={formatNumber(analytics.totalUsers)}
            caption={`任務累計 ${formatNumber(analytics.totalBroadcastedGigs)} 件・已下架 ${takedownCount} 件`}
            tone="brand"
          />
        </View>

        <View className="gap-3">
          <SectionHeading title="管理模組" caption="所有動作皆記錄操作者與時間" />
          <View className="border-hairline overflow-hidden rounded-xl border bg-white">
            <ModuleRow
              icon={<ScanEye size={17} color={COLORS.coral} strokeWidth={2.1} />}
              label="AI 認證複審中心"
              caption={`任務 ${pendingGigReviews} 件・提案 ${pendingBidReviews} 份・人才 ${pendingVerifications} 位待複審`}
              onPress={() => router.push('/admin/review')}
            />
            <Divider />
            <ModuleRow
              icon={<Users size={17} color={COLORS.ink} strokeWidth={2.1} />}
              label="使用者管理總表"
              caption={`${formatNumber(users.length)} 位帳號・停權 ${bannedUserIds.length} 個`}
              onPress={() => router.push('/admin/users')}
            />
            <Divider />
            <ModuleRow
              icon={<ClipboardList size={17} color={COLORS.ink} strokeWidth={2.1} />}
              label="任務與內容管理"
              caption={`${formatNumber(gigs.length)} 件任務・已下架 ${takedownCount} 件`}
              onPress={() => router.push('/admin/gigs')}
            />
            <Divider />
            <ModuleRow
              icon={<ShieldCheck size={17} color={COLORS.ink} strokeWidth={2.1} />}
              label="審核與安全中心"
              caption={`待審核 ${pendingVerifications} 件・未處理檢舉 ${openReports} 件`}
              onPress={() => router.push('/admin/dashboard')}
            />
            <Divider />
            <ModuleRow
              icon={<CreditCard size={17} color={COLORS.ink} strokeWidth={2.1} />}
              label="訂閱與營收管理"
              caption={`月經常性收入 ${formatCurrency(analytics.mrrEstimate)}`}
              onPress={() => router.push('/admin/revenue')}
            />
            <Divider />
            <ModuleRow
              icon={<BellRing size={17} color={COLORS.ink} strokeWidth={2.1} />}
              label="系統公告與推播"
              caption={`${announcements.length} 則公告已發布`}
              onPress={() => router.push('/admin/announcements')}
            />
            <Divider />
            <ModuleRow
              icon={<ScrollText size={17} color={COLORS.ink} strokeWidth={2.1} />}
              label="管理員操作紀錄"
              caption={`${formatNumber(auditEntries.length)} 筆稽核紀錄`}
              onPress={() => router.push('/admin/audit')}
            />
          </View>
        </View>

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
      </ScrollView>

      <ConfirmSheet
        visible={signOutVisible}
        title="登出管理後台？"
        message="將回到管理員登入頁，一般使用者介面不受影響。"
        actions={[{ id: 'confirm', label: '確認登出', tone: 'danger' }]}
        onSelect={confirmSignOut}
        onCancel={() => setSignOutVisible(false)}
      />
    </View>
  );
}

function Divider() {
  return <View className="bg-hairline h-px" />;
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
