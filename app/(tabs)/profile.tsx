import { router } from 'expo-router';
import { Button, Input, Label, TextField } from 'heroui-native';
import {
  BadgeCheck,
  Bell,
  BellRing,
  ChevronRight,
  Clock,
  Crown,
  LogIn,
  LogOut,
  RefreshCw,
  Repeat,
  ShieldCheck,
  Star,
  Tags,
  Wrench,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ChatQuotaPill } from '@/components/ChatQuotaPill';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { RatingStars } from '@/components/RatingStars';
import { RegionPicker } from '@/components/RegionPicker';
import { SectionHeading } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { signOut } from '@/lib/auth';
import { COLORS } from '@/lib/colors';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { CATEGORY_COUNT, TOTAL_TAG_COUNT } from '@/lib/omniTags';
import { useGigStore } from '@/lib/stores/gigs';
import { useMaintenanceStore } from '@/lib/stores/maintenance';
import { usePushPrefsStore } from '@/lib/stores/pushPrefs';
import { useReviewStore } from '@/lib/stores/reviews';
import {
  PREMIUM_PRICE_TWD,
  useIsPremium,
  useMyUserId,
  useSessionStore,
} from '@/lib/stores/session';
import { reviewsForUser, summarizeReviews, trustScore, trustSignals } from '@/lib/trust';
import type { VerificationStatus } from '@/lib/types';

const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  none: '尚未認證',
  pending: '複審中',
  approved: 'AI 已認證',
  rejected: '複審未通過',
};

/** 管理平台只在網頁版提供，手機 App 不顯示任何入口。 */
export default function ProfileScreen() {
  const role = useSessionStore((state) => state.role);
  const displayName = useSessionStore((state) => state.displayName);
  const setDisplayName = useSessionStore((state) => state.setDisplayName);
  const region = useSessionStore((state) => state.region);
  const setRegion = useSessionStore((state) => state.setRegion);
  const skills = useSessionStore((state) => state.skills);
  const verification = useSessionStore((state) => state.verification);
  const credentialVerified = useSessionStore((state) => state.credentialVerified);
  const credentialUri = useSessionStore((state) => state.credentialUri);
  const isPremium = useIsPremium();
  const userId = useMyUserId();
  const email = useSessionStore((state) => state.email);
  const authStatus = useSessionStore((state) => state.authStatus);
  const switchRole = useSessionStore((state) => state.switchRole);
  const resetSession = useSessionStore((state) => state.resetSession);

  const reviews = useReviewStore((state) => state.reviews);
  const gigs = useGigStore((state) => state.gigs);
  const pushEnabled = usePushPrefsStore((state) => state.enabled);
  const pushPermission = usePushPrefsStore((state) => state.permission);
  const maintenanceRuns = useMaintenanceStore((state) => state.runs);
  const updateStatus = useMaintenanceStore((state) => state.updateStatus);
  const lastMaintenanceAt = maintenanceRuns[0]?.at ?? null;

  const [confirmAction, setConfirmAction] = useState<'switch' | 'reset' | 'signOut' | null>(null);

  const summary = useMemo(
    () => summarizeReviews(reviewsForUser(reviews, userId)),
    [reviews, userId],
  );

  const completedCount = useMemo(
    () =>
      gigs.filter(
        (gig) =>
          gig.status === 'completed' &&
          (role === 'talent' ? gig.assignedTalentId === userId : gig.clientId === userId),
      ).length,
    [gigs, role, userId],
  );

  const trustInput = useMemo(
    () => ({
      summary,
      completedJobs: completedCount,
      aiVerified: verification === 'approved',
      credentialVerified,
    }),
    [summary, completedCount, verification, credentialVerified],
  );

  const signals = trustSignals(trustInput);
  const score = trustScore(trustInput);

  const handleSwitchRole = () => setConfirmAction('switch');

  const handleReset = () => setConfirmAction('reset');

  const handleConfirm = () => {
    if (confirmAction === 'switch') {
      switchRole();
      setConfirmAction(null);
      router.replace('/(tabs)');
      return;
    }
    if (confirmAction === 'reset') {
      resetSession();
      setConfirmAction(null);
      router.replace('/onboarding/role');
      return;
    }
    if (confirmAction === 'signOut') {
      setConfirmAction(null);
      // 登出後仍留在目前畫面：未登入也能繼續瀏覽任務牆。
      void signOut();
      return;
    }
    setConfirmAction(null);
  };

  return (
    <View className="bg-background flex-1">
      <ScrollView
        contentContainerClassName="px-5 pt-safe-offset-4 pb-12 gap-5"
        showsVerticalScrollIndicator={false}
      >
        <Text accessibilityRole="header" className="text-ink text-[26px] font-bold tracking-tight">
          帳戶
        </Text>

        <View className="border-hairline rounded-xl border bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="bg-brand h-14 w-14 items-center justify-center rounded-xl">
              <Text className="text-[20px] font-bold text-white">{displayName.slice(0, 1)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-ink text-[18px] font-bold tracking-tight">{displayName}</Text>
              {email !== null ? (
                <Text className="text-muted mt-0.5 text-[12px]">{email}</Text>
              ) : null}
              <View className="mt-1.5 flex-row flex-wrap items-center gap-2">
                <StaticTag label={role === 'client' ? '尋找專家' : '我要接案'} tone="brand" />
                {role === 'talent' ? (
                  <StaticTag
                    label={`認證：${VERIFICATION_LABEL[verification]}`}
                    tone={verification === 'approved' ? 'brand' : 'coral'}
                  />
                ) : null}
                {isPremium ? <StaticTag label="進階版" tone="coral" /> : null}
              </View>
            </View>
          </View>

          <View className="border-hairline mt-4 gap-3 border-t pt-4">
            <TextField>
              <Label>顯示名稱</Label>
              <Input value={displayName} onChangeText={setDisplayName} placeholder="輸入顯示名稱" />
            </TextField>

            <RegionPicker label="主要服務地區" value={region} onChange={setRegion} />
          </View>
        </View>

        {role === 'talent' ? (
          <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
            <SectionHeading
              title="我的信任度"
              caption={`信任度 ${score} 分・AI 認證為基礎，證照為加分`}
              right={
                <Pressable
                  onPress={() => router.push({ pathname: '/talent/[id]', params: { id: userId } })}
                  accessibilityRole="button"
                  className="flex-row items-center gap-1"
                >
                  <Text className="text-brand-strong text-[13px] font-semibold">公開檔案</Text>
                  <ChevronRight size={14} color={COLORS.brandStrong} strokeWidth={2.2} />
                </Pressable>
              }
            />
            <View className="flex-row flex-wrap items-center gap-3">
              <RatingStars value={summary.average} size={16} count={summary.count} />
            </View>
            <View className="flex-row flex-wrap gap-2">
              {signals.map((signal) => (
                <StaticTag key={signal.label} label={signal.label} tone={signal.tone} />
              ))}
            </View>
            <View className="border-hairline flex-row items-center gap-2 border-t pt-3">
              <Star size={14} color={COLORS.coral} strokeWidth={2.2} />
              <Text className="text-ink-soft flex-1 text-[12px]">
                已完成 {completedCount} 件任務・{summary.count} 則客戶評價
              </Text>
            </View>
          </View>
        ) : null}

        {role === 'talent' ? (
          <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
            <SectionHeading
              title="對話配額與訂閱"
              caption={
                isPremium
                  ? '進階版每月無限開啟新對話。'
                  : `免費版每月 2 組新對話；進階版 ${formatCurrency(PREMIUM_PRICE_TWD)} / 月無限。`
              }
            />
            <ChatQuotaPill onPress={() => router.push('/subscription')} />
            <Button size="md" onPress={() => router.push('/subscription')}>
              <Button.Label>{isPremium ? '管理訂閱' : '升級進階版'}</Button.Label>
            </Button>
          </View>
        ) : (
          <View className="border-brand/25 bg-brand-soft gap-3 rounded-xl border p-4">
            <View className="flex-row items-center gap-2">
              <Crown size={17} color={COLORS.brandStrong} strokeWidth={2.1} />
              <Text className="text-ink text-[15px] font-semibold">也想接案賺取收入？</Text>
            </View>
            <Text className="text-ink-soft text-[13px] leading-5">
              切換為人才模式，完成技能認證後即可接收全台急件推播。
            </Text>
            <Button size="md" onPress={handleSwitchRole}>
              <Button.Label>切換為接案模式</Button.Label>
            </Button>
          </View>
        )}

        {role === 'talent' ? (
          <View className="border-hairline rounded-xl border bg-white p-4">
            <SectionHeading
              title="我的技能標籤"
              caption={`已選 ${skills.length} / 5 項`}
              right={
                <Pressable
                  onPress={() => router.push('/onboarding/skills')}
                  accessibilityRole="button"
                  className="flex-row items-center gap-1"
                >
                  <Text className="text-brand-strong text-[13px] font-semibold">編輯</Text>
                  <ChevronRight size={14} color={COLORS.brandStrong} strokeWidth={2.2} />
                </Pressable>
              }
            />
            <View className="mt-3 flex-row flex-wrap gap-2">
              {skills.map((skill) => (
                <StaticTag key={skill} label={skill} tone="brand" />
              ))}
            </View>

            <View className="border-hairline mt-4 flex-row items-center gap-2 border-t pt-4">
              {verification === 'approved' ? (
                <BadgeCheck size={16} color={COLORS.brand} strokeWidth={2.2} />
              ) : (
                <Clock size={16} color={COLORS.coral} strokeWidth={2.2} />
              )}
              <Text className="text-ink-soft flex-1 text-[12px]">
                資料認證：{VERIFICATION_LABEL[verification]}・證照（選填）：
                {credentialVerified ? '已驗證加分' : credentialUri ? '待人工驗證' : '未上傳'}
              </Text>
            </View>
          </View>
        ) : null}

        <View className="border-hairline overflow-hidden rounded-xl border bg-white">
          <ProfileRow
            icon={<Bell size={17} color={COLORS.ink} strokeWidth={2.1} />}
            label="通知中心"
            caption="提案、媒合與評價動態"
            onPress={() => router.push('/notifications')}
          />
          <View className="bg-hairline h-px" />
          <ProfileRow
            icon={<BellRing size={17} color={COLORS.ink} strokeWidth={2.1} />}
            label="推播通知設定"
            caption={
              pushPermission === 'unsupported'
                ? '此平台不支援裝置推播'
                : pushEnabled
                  ? '已開啟・可依分類調整'
                  : '目前已關閉全部推播'
            }
            onPress={() => router.push('/notification-settings')}
          />
          <View className="bg-hairline h-px" />
          <ProfileRow
            icon={<Wrench size={17} color={COLORS.ink} strokeWidth={2.1} />}
            label="系統維護"
            caption={
              updateStatus === 'available'
                ? '有新版本可套用・每天自動維護一次'
                : lastMaintenanceAt === null
                  ? '每天自動維護一次'
                  : `上次維護 ${formatRelativeTime(lastMaintenanceAt)}`
            }
            onPress={() => router.push('/maintenance')}
          />
          <View className="bg-hairline h-px" />
          <ProfileRow
            icon={<Repeat size={17} color={COLORS.ink} strokeWidth={2.1} />}
            label="切換使用身分"
            caption={role === 'client' ? '目前：尋找專家' : '目前：我要接案'}
            onPress={handleSwitchRole}
          />
          <View className="bg-hairline h-px" />
          <ProfileRow
            icon={<Tags size={17} color={COLORS.ink} strokeWidth={2.1} />}
            label={`瀏覽 ${CATEGORY_COUNT} 大類別矩陣`}
            caption={`共 ${TOTAL_TAG_COUNT} 個技能標籤`}
            onPress={() => router.push('/onboarding/skills')}
          />
          <View className="bg-hairline h-px" />
          <ProfileRow
            icon={<ShieldCheck size={17} color={COLORS.ink} strokeWidth={2.1} />}
            label="隱私權政策"
            caption="伺服器端聊天審核說明"
            onPress={() => router.push('/privacy')}
          />
          <View className="bg-hairline h-px" />
          <ProfileRow
            icon={<RefreshCw size={17} color={COLORS.coral} strokeWidth={2.1} />}
            label="重設個人資料"
            caption="回到身分選擇頁"
            onPress={handleReset}
          />
          <View className="bg-hairline h-px" />
          {authStatus === 'signedIn' ? (
            <ProfileRow
              icon={<LogOut size={17} color={COLORS.coral} strokeWidth={2.1} />}
              label="登出"
              caption={email ?? '已登入這個裝置'}
              onPress={() => setConfirmAction('signOut')}
            />
          ) : (
            <ProfileRow
              icon={<LogIn size={17} color={COLORS.brandStrong} strokeWidth={2.1} />}
              label="登入或註冊"
              caption="用 Email 驗證碼登入，跨裝置同步身分與技能標籤"
              onPress={() => router.push('/auth/sign-in')}
            />
          )}
        </View>
      </ScrollView>

      <ConfirmSheet
        visible={confirmAction !== null}
        title={
          confirmAction === 'reset'
            ? '重設個人資料？'
            : confirmAction === 'signOut'
              ? '登出這個帳號？'
              : '切換使用身分？'
        }
        message={
          confirmAction === 'reset'
            ? '將清除身分、技能與訂閱狀態，回到身分選擇頁。'
            : confirmAction === 'signOut'
              ? '登出後仍可以瀏覽任務牆。這台裝置上的通知中心、收藏與評價會一併清除，雲端的任務、提案與對話都會保留；重新以同一個 Email 登入即可繼續同步身分。'
              : `將切換為「${role === 'client' ? '我要接案' : '尋找專家'}」模式，資料與對話都會保留。`
        }
        actions={[
          {
            id: 'confirm',
            label:
              confirmAction === 'reset'
                ? '確認重設'
                : confirmAction === 'signOut'
                  ? '確認登出'
                  : '確認切換',
            tone: confirmAction === 'switch' ? 'primary' : 'danger',
          },
        ]}
        onSelect={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </View>
  );
}

interface ProfileRowProps {
  icon: React.ReactNode;
  label: string;
  caption?: string;
  onPress: () => void;
}

function ProfileRow({ icon, label, caption, onPress }: ProfileRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 bg-white px-4 py-3.5"
    >
      <View className="bg-canvas h-9 w-9 items-center justify-center rounded-xl">{icon}</View>
      <View className="flex-1">
        <Text className="text-ink text-[14px] font-semibold">{label}</Text>
        {caption ? <Text className="text-muted mt-0.5 text-[12px]">{caption}</Text> : null}
      </View>
      <ChevronRight size={16} color={COLORS.muted} strokeWidth={2.2} />
    </Pressable>
  );
}
