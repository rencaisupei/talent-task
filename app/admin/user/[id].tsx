import { router, useLocalSearchParams } from 'expo-router';
import { Button, Label, TextArea, TextField } from 'heroui-native';
import {
  BadgeCheck,
  Ban,
  ChevronRight,
  Clock,
  CreditCard,
  ShieldAlert,
  Star,
  UserX,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ReadOnlyNotice } from '@/components/admin/ReadOnlyNotice';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { RatingStars } from '@/components/RatingStars';
import { EmptyState, SectionHeading } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { COLORS } from '@/lib/colors';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/format';
import { useAdminStore } from '@/lib/stores/admin';
import { useAdminAuditStore } from '@/lib/stores/adminAudit';
import { useAdminCan } from '@/lib/stores/adminAuth';
import { useAdminContentStore } from '@/lib/stores/adminContent';
import { findPlatformUser, usePlatformUserStore } from '@/lib/stores/platformUsers';
import { useReviewStore } from '@/lib/stores/reviews';
import { subscriptionsForUser, useRevenueStore } from '@/lib/stores/revenue';
import { formatResponseTime, reviewsForUser, summarizeReviews } from '@/lib/trust';
import {
  SUBSCRIPTION_CHANNEL_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  type VerificationStatus,
} from '@/lib/types';

type PendingAction = 'ban' | 'unban' | 'grant' | 'revoke' | 'approve' | 'reject';

const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  none: '未送審',
  pending: '待審核',
  approved: '已認證',
  rejected: '未通過',
};

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const users = usePlatformUserStore((state) => state.users);
  const setNote = usePlatformUserStore((state) => state.setNote);
  const verifications = useAdminStore((state) => state.verifications);
  const bannedUserIds = useAdminStore((state) => state.bannedUserIds);
  const banUser = useAdminStore((state) => state.banUser);
  const unbanUser = useAdminStore((state) => state.unbanUser);
  const approveVerification = useAdminStore((state) => state.approveVerification);
  const rejectVerification = useAdminStore((state) => state.rejectVerification);
  const subscriptions = useRevenueStore((state) => state.subscriptions);
  const grantPremium = useRevenueStore((state) => state.grantPremium);
  const revokePremium = useRevenueStore((state) => state.revokePremium);
  const gigs = useAdminContentStore((state) => state.gigs);
  const bids = useAdminContentStore((state) => state.bids);
  const conversations = useAdminContentStore((state) => state.conversations);
  const refreshContent = useAdminContentStore((state) => state.refresh);
  const refreshChats = useAdminContentStore((state) => state.refreshChats);
  const reviews = useReviewStore((state) => state.reviews);
  const auditEntries = useAdminAuditStore((state) => state.entries);
  const logAction = useAuditLogger();
  const canManageUsers = useAdminCan('users:manage');
  const canReviewChats = useAdminCan('review:manage');
  const canManageRevenue = useAdminCan('revenue:manage');
  const canReview = useAdminCan('review:manage');

  const user = useMemo(() => findPlatformUser(users, id), [id, users]);
  const [note, setNoteDraft] = useState(user?.note ?? '');
  const [pending, setPending] = useState<PendingAction | null>(null);

  useEffect(() => {
    void refreshContent();
    if (canReviewChats) void refreshChats();
  }, [canReviewChats, refreshChats, refreshContent]);

  const summary = useMemo(() => summarizeReviews(reviewsForUser(reviews, id)), [id, reviews]);
  const userGigs = useMemo(
    () => gigs.filter((gig) => gig.clientId === id || gig.assignedTalentId === id),
    [gigs, id],
  );
  const userBids = useMemo(() => bids.filter((bid) => bid.talentId === id), [bids, id]);
  // 檢舉在雲端的 conversations 上（管理端只讀得到被檢舉或被標記的那些）。
  const userReports = useMemo(
    () =>
      conversations.filter(
        (item) => item.reportState !== 'none' && (item.clientId === id || item.talentId === id),
      ),
    [conversations, id],
  );
  const userSubscriptions = useMemo(
    () => subscriptionsForUser(subscriptions, id),
    [id, subscriptions],
  );
  const userAudit = useMemo(
    () => auditEntries.filter((entry) => entry.targetId === id).slice(0, 8),
    [auditEntries, id],
  );
  const pendingVerification = useMemo(
    () => verifications.find((item) => item.talentId === id && item.status === 'pending'),
    [id, verifications],
  );

  if (!user) {
    return (
      <View className="bg-background flex-1">
        <AdminHeader title="帳號詳情" fallback="/admin/users" />
        <View className="px-5 py-6">
          <EmptyState
            title="找不到這個帳號"
            caption="帳號可能已從總表移除，請返回使用者管理總表。"
            icon={<UserX size={22} color={COLORS.muted} strokeWidth={2.1} />}
          />
        </View>
      </View>
    );
  }

  const isBanned = bannedUserIds.includes(user.id);

  const handleConfirm = () => {
    switch (pending) {
      case 'ban':
        banUser(user.id);
        logAction({
          kind: 'ban',
          summary: '封禁帳號：管理員自帳號詳情執行',
          targetId: user.id,
          targetLabel: user.name,
        });
        break;
      case 'unban':
        unbanUser(user.id);
        logAction({
          kind: 'ban',
          summary: '解除封禁：恢復帳號使用權限',
          targetId: user.id,
          targetLabel: user.name,
        });
        break;
      case 'grant':
        grantPremium({ id: user.id, name: user.name });
        logAction({
          kind: 'subscription',
          summary: '手動開通進階版訂閱',
          targetId: user.id,
          targetLabel: user.name,
        });
        break;
      case 'revoke':
        revokePremium(user.id);
        logAction({
          kind: 'subscription',
          summary: '取消進階版訂閱',
          targetId: user.id,
          targetLabel: user.name,
        });
        break;
      case 'approve':
        if (pendingVerification) {
          approveVerification(pendingVerification.id);
          logAction({
            kind: 'verification',
            summary: '核准技能認證：憑證比對通過',
            targetId: user.id,
            targetLabel: user.name,
          });
        }
        break;
      case 'reject':
        if (pendingVerification) {
          rejectVerification(pendingVerification.id);
          logAction({
            kind: 'verification',
            summary: '拒絕技能認證：憑證不足或影像不清',
            targetId: user.id,
            targetLabel: user.name,
          });
        }
        break;
      default:
        break;
    }
    setPending(null);
  };

  const handleSaveNote = () => {
    setNote(user.id, note.trim());
    logAction({
      kind: 'report',
      summary: note.trim().length === 0 ? '清除帳號備註' : `更新帳號備註：${note.trim()}`,
      targetId: user.id,
      targetLabel: user.name,
    });
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AdminHeader
        title={user.name}
        caption={`${user.role === 'client' ? '客戶' : '人才'}・帳號代碼 ${user.id}`}
        fallback="/admin/users"
      />

      <ScrollView
        contentContainerClassName="px-5 py-5 pb-12 gap-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="bg-brand h-14 w-14 items-center justify-center rounded-xl">
              <Text className="text-[20px] font-bold text-white">{user.name.slice(0, 1)}</Text>
            </View>
            <View className="flex-1 gap-1.5">
              <Text className="text-ink text-[18px] font-bold tracking-tight">{user.name}</Text>
              <View className="flex-row flex-wrap items-center gap-1.5">
                <StaticTag label={user.role === 'client' ? '尋找專家' : '我要接案'} tone="brand" />
                {user.isPremium ? <StaticTag label="進階版" tone="coral" /> : null}
                {isBanned ? <StaticTag label="已停權" tone="coral" /> : null}
                <StaticTag label={`認證：${VERIFICATION_LABEL[user.verification]}`} />
              </View>
            </View>
          </View>

          <View className="border-hairline flex-row flex-wrap gap-x-6 gap-y-2 border-t pt-3">
            <Stat label="所在地區" value={user.region} />
            <Stat label="加入日期" value={formatDate(user.joinedAt)} />
            {user.role === 'talent' ? (
              <>
                <Stat label="完成件數" value={`${user.completedJobs} 件`} />
                <Stat label="平均回應" value={formatResponseTime(user.responseMinutes)} />
                <Stat label="投遞提案" value={`${userBids.length} 份`} />
              </>
            ) : (
              <>
                <Stat label="發布任務" value={`${user.publishedGigs} 件`} />
                <Stat label="完成任務" value={`${user.completedJobs} 件`} />
              </>
            )}
          </View>

          {user.role === 'talent' ? (
            <View className="border-hairline flex-row items-center gap-3 border-t pt-3">
              <RatingStars value={summary.average} size={15} count={summary.count} />
              <Pressable
                onPress={() => router.push({ pathname: '/talent/[id]', params: { id: user.id } })}
                accessibilityRole="button"
                className="ml-auto flex-row items-center gap-1"
              >
                <Text className="text-brand-strong text-[13px] font-semibold">公開檔案</Text>
                <ChevronRight size={14} color={COLORS.brandStrong} strokeWidth={2.2} />
              </Pressable>
            </View>
          ) : null}

          {user.tags.length > 0 ? (
            <View className="border-hairline flex-row flex-wrap gap-2 border-t pt-3">
              {user.tags.map((tag) => (
                <StaticTag key={tag} label={tag} tone="brand" />
              ))}
            </View>
          ) : null}
        </View>

        {pendingVerification ? (
          <View className="border-coral/25 bg-coral-soft gap-3 rounded-xl border p-4">
            <View className="flex-row items-center gap-2">
              <Clock size={16} color={COLORS.coral} strokeWidth={2.2} />
              <Text className="text-ink text-[15px] font-semibold">技能認證待審核</Text>
            </View>
            <Text className="text-ink-soft text-[12px] leading-5">
              送審 {formatRelativeTime(pendingVerification.submittedAt)}・
              {pendingVerification.note ?? '未附備註'}
            </Text>
            {canReview ? (
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button size="md" onPress={() => setPending('approve')}>
                    <Button.Label>核准認證</Button.Label>
                  </Button>
                </View>
                <View className="flex-1">
                  <Button size="md" variant="tertiary" onPress={() => setPending('reject')}>
                    <Button.Label>拒絕</Button.Label>
                  </Button>
                </View>
              </View>
            ) : (
              <ReadOnlyNotice permission="review:manage" action="核准或拒絕技能認證" />
            )}
          </View>
        ) : null}

        <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
          <SectionHeading title="訂閱與帳務" caption="進階版 NT$399／月" />
          {userSubscriptions.length === 0 ? (
            <Text className="text-muted text-[12px]">尚無訂閱紀錄。</Text>
          ) : (
            userSubscriptions.map((record) => (
              <View
                key={record.id}
                className="border-hairline bg-canvas gap-1 rounded-xl border p-3"
              >
                <View className="flex-row items-center gap-2">
                  <CreditCard size={14} color={COLORS.ink} strokeWidth={2.2} />
                  <Text className="text-ink flex-1 text-[13px] font-semibold">
                    {formatCurrency(record.amount)}／月・
                    {SUBSCRIPTION_CHANNEL_LABEL[record.channel]}
                  </Text>
                  <StaticTag
                    label={SUBSCRIPTION_STATUS_LABEL[record.status]}
                    tone={record.status === 'active' ? 'brand' : 'coral'}
                  />
                </View>
                <Text className="text-muted text-[11px]">
                  {record.invoiceNo}・起始 {formatDate(record.startedAt)}・續約{' '}
                  {formatDate(record.renewsAt)}
                </Text>
              </View>
            ))
          )}
          {canManageRevenue ? (
            <Button
              size="md"
              variant="tertiary"
              onPress={() => setPending(user.isPremium ? 'revoke' : 'grant')}
            >
              <Button.Label>{user.isPremium ? '取消進階版' : '手動開通進階版'}</Button.Label>
            </Button>
          ) : (
            <ReadOnlyNotice permission="revenue:manage" action="開通或取消進階版" />
          )}
        </View>

        <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
          <SectionHeading
            title="帳號權限"
            caption={isBanned ? '此帳號目前無法登入或開啟新對話' : '帳號狀態正常'}
          />
          <View className="flex-row items-center gap-2">
            {isBanned ? (
              <Ban size={15} color={COLORS.coral} strokeWidth={2.2} />
            ) : (
              <BadgeCheck size={15} color={COLORS.brand} strokeWidth={2.2} />
            )}
            <Text className="text-ink-soft flex-1 text-[12px]">
              相關檢舉 {userReports.length} 件・未處理{' '}
              {userReports.filter((item) => item.reportState === 'open').length} 件
            </Text>
          </View>
          {canManageUsers ? (
            <Button
              size="md"
              variant={isBanned ? 'tertiary' : 'primary'}
              className={isBanned ? undefined : 'bg-coral'}
              onPress={() => setPending(isBanned ? 'unban' : 'ban')}
            >
              <Button.Label>{isBanned ? '解除封禁' : '封禁此帳號'}</Button.Label>
            </Button>
          ) : (
            <ReadOnlyNotice permission="users:manage" action="封禁或解除封禁帳號" />
          )}
        </View>

        <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
          <SectionHeading title="管理備註" caption="僅管理員可見" />
          <TextField>
            <Label>備註內容</Label>
            <TextArea
              value={note}
              onChangeText={setNoteDraft}
              placeholder="記錄查核結果、聯繫過程或後續追蹤事項"
              numberOfLines={4}
              style={{ minHeight: 92 }}
              isDisabled={!canManageUsers}
            />
          </TextField>
          {canManageUsers ? (
            <Button size="md" onPress={handleSaveNote}>
              <Button.Label>儲存備註</Button.Label>
            </Button>
          ) : (
            <ReadOnlyNotice permission="users:manage" action="編輯管理備註" />
          )}
        </View>

        {userReports.length > 0 ? (
          <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
            <SectionHeading title="相關檢舉" caption="完整逐字紀錄請至審核與安全中心" />
            {userReports.map((report) => (
              <View
                key={report.id}
                className="border-hairline bg-canvas gap-1 rounded-xl border p-3"
              >
                <View className="flex-row items-center gap-2">
                  <ShieldAlert size={14} color={COLORS.coral} strokeWidth={2.2} />
                  <Text className="text-ink flex-1 text-[13px] font-semibold">
                    {report.reportReason ?? '伺服器自動標記高風險內容'}
                  </Text>
                  <StaticTag
                    label={report.reportState === 'resolved' ? '已結案' : '未處理'}
                    tone={report.reportState === 'resolved' ? 'neutral' : 'coral'}
                  />
                </View>
                <Text className="text-muted text-[11px]">
                  檢舉人 {report.reporterName ?? '系統'}・
                  {formatRelativeTime(report.reportedAt ?? report.lastMessageAt)}
                </Text>
              </View>
            ))}
            <Button size="md" variant="tertiary" onPress={() => router.push('/admin/dashboard')}>
              <Button.Label>前往審核與安全中心</Button.Label>
            </Button>
          </View>
        ) : null}

        {userGigs.length > 0 ? (
          <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
            <SectionHeading title="相關任務" caption={`共 ${userGigs.length} 件`} />
            {userGigs.slice(0, 6).map((gig) => (
              <Pressable
                key={gig.id}
                onPress={() => router.push({ pathname: '/gig/[id]', params: { id: gig.id } })}
                accessibilityRole="button"
                className="border-hairline bg-canvas flex-row items-center gap-2 rounded-xl border p-3"
              >
                <View className="flex-1">
                  <Text className="text-ink text-[13px] font-semibold" numberOfLines={1}>
                    {gig.title}
                  </Text>
                  <Text className="text-muted mt-0.5 text-[11px]">
                    {gig.location.region}・{formatRelativeTime(gig.createdAt)}
                    {gig.takedownReason ? `・已下架（${gig.takedownReason}）` : ''}
                  </Text>
                </View>
                <ChevronRight size={15} color={COLORS.muted} strokeWidth={2.2} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {summary.count > 0 ? (
          <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
            <SectionHeading title="收到的評價" caption={`${summary.count} 則`} />
            {reviewsForUser(reviews, user.id)
              .slice(0, 4)
              .map((review) => (
                <View
                  key={review.id}
                  className="border-hairline bg-canvas gap-1 rounded-xl border p-3"
                >
                  <View className="flex-row items-center gap-2">
                    <Star size={13} color={COLORS.coral} strokeWidth={2.2} />
                    <Text className="text-ink flex-1 text-[12px] font-semibold">
                      {review.stars} 星・{review.authorName}
                    </Text>
                    <Text className="text-muted text-[11px]">
                      {formatRelativeTime(review.createdAt)}
                    </Text>
                  </View>
                  <Text className="text-ink-soft text-[12px] leading-5">{review.comment}</Text>
                </View>
              ))}
          </View>
        ) : null}

        {userAudit.length > 0 ? (
          <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
            <SectionHeading title="此帳號的管理紀錄" caption="依時間排序" />
            {userAudit.map((entry) => (
              <View key={entry.id} className="gap-0.5">
                <Text className="text-ink text-[12px] leading-5 font-semibold">
                  {entry.summary}
                </Text>
                <Text className="text-muted text-[11px]">
                  {entry.adminName}・{formatRelativeTime(entry.at)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <ConfirmSheet
        visible={pending !== null}
        title={CONFIRM_COPY[pending ?? 'ban'].title}
        message={CONFIRM_COPY[pending ?? 'ban'].message}
        actions={[
          {
            id: 'confirm',
            label: CONFIRM_COPY[pending ?? 'ban'].action,
            tone:
              pending === 'ban' || pending === 'revoke' || pending === 'reject'
                ? 'danger'
                : 'primary',
          },
        ]}
        onSelect={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </KeyboardAvoidingView>
  );
}

const CONFIRM_COPY: Record<PendingAction, { title: string; message: string; action: string }> = {
  ban: {
    title: '封禁此帳號？',
    message: '帳號將無法登入、投遞提案或開啟新對話，動作會寫入稽核紀錄。',
    action: '確認封禁',
  },
  unban: {
    title: '解除封禁？',
    message: '帳號將恢復完整使用權限。',
    action: '確認解除',
  },
  grant: {
    title: '手動開通進階版？',
    message: '將建立一筆「管理員開通」帳務紀錄，該帳號可無限開啟新對話。',
    action: '確認開通',
  },
  revoke: {
    title: '取消進階版？',
    message: '使用中的帳務紀錄將轉為已取消，對話配額回到每月 2 組。',
    action: '確認取消',
  },
  approve: {
    title: '核准技能認證？',
    message: '認證徽章會顯示在公開檔案，客戶會優先看到已認證人才。',
    action: '確認核准',
  },
  reject: {
    title: '拒絕技能認證？',
    message: '人才會收到通知，需重新上傳清晰的證照影像後再送審。',
    action: '確認拒絕',
  },
};

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <View>
      <Text className="text-muted text-[11px]">{label}</Text>
      <Text className="text-ink mt-0.5 text-[13px] font-semibold">{value}</Text>
    </View>
  );
}
