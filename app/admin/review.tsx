import { router } from 'expo-router';
import { Button } from 'heroui-native';
import { FileBadge, Inbox, ShieldCheck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AiReviewCard } from '@/components/AiReviewCard';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { KpiCard } from '@/components/KpiCard';
import { EmptyState, SectionHeading } from '@/components/SectionHeading';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { StaticTag } from '@/components/TagChip';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { COLORS } from '@/lib/colors';
import { formatNumber, formatRelativeTime } from '@/lib/format';
import { useAdminStore } from '@/lib/stores/admin';
import { useAdminAuthStore } from '@/lib/stores/adminAuth';
import { gigsAwaitingReview, useGigStore } from '@/lib/stores/gigs';

type ReviewTab = 'gigs' | 'talents' | 'credentials';

const REJECT_REASONS = [
  '疑似假急件詐騙',
  '要求預付款或提供金融資料',
  '引導離開平台私下交易',
  '內容不實或無法確認需求',
];

interface PendingAction {
  kind: 'gig-approve' | 'gig-reject' | 'talent-approve' | 'talent-reject' | 'credential';
  id: string;
  label: string;
  verified?: boolean;
}

export default function AdminReviewScreen() {
  const currentAdmin = useAdminAuthStore((state) => state.currentAdmin);
  const gigs = useGigStore((state) => state.gigs);
  const approveGigReview = useGigStore((state) => state.approveGigReview);
  const rejectGigReview = useGigStore((state) => state.rejectGigReview);

  const verifications = useAdminStore((state) => state.verifications);
  const approveVerification = useAdminStore((state) => state.approveVerification);
  const rejectVerification = useAdminStore((state) => state.rejectVerification);
  const verifyCredential = useAdminStore((state) => state.verifyCredential);

  const logAction = useAuditLogger();

  const [tab, setTab] = useState<ReviewTab>('gigs');
  const [pending, setPending] = useState<PendingAction | null>(null);

  const pendingGigs = useMemo(() => gigsAwaitingReview(gigs), [gigs]);
  const pendingTalents = useMemo(
    () => verifications.filter((item) => item.status === 'pending'),
    [verifications],
  );
  const credentialQueue = useMemo(
    () =>
      verifications.filter(
        (item) => item.credentialUri !== undefined && item.credentialVerified !== true,
      ),
    [verifications],
  );

  const adminIdentity = {
    adminId: currentAdmin?.id ?? 'admin_system',
    adminName: currentAdmin?.name ?? '系統',
  };

  const runAction = (actionId: string) => {
    if (!pending) return;

    if (pending.kind === 'gig-approve') {
      approveGigReview(pending.id, adminIdentity);
      logAction({
        kind: 'moderation',
        summary: '複審放行任務：確認無詐騙風險並開放曝光',
        targetId: pending.id,
        targetLabel: pending.label,
      });
    }

    if (pending.kind === 'gig-reject') {
      const reason = REJECT_REASONS.includes(actionId) ? actionId : REJECT_REASONS[0];
      rejectGigReview(pending.id, { ...adminIdentity, note: reason });
      logAction({
        kind: 'moderation',
        summary: `複審退回任務：${reason}`,
        targetId: pending.id,
        targetLabel: pending.label,
      });
    }

    if (pending.kind === 'talent-approve') {
      approveVerification(pending.id);
      logAction({
        kind: 'moderation',
        summary: '複審放行人才資料：內容確認無誤',
        targetId: pending.id,
        targetLabel: pending.label,
      });
    }

    if (pending.kind === 'talent-reject') {
      rejectVerification(pending.id);
      logAction({
        kind: 'moderation',
        summary: '複審退回人才資料：疑似不實或高風險',
        targetId: pending.id,
        targetLabel: pending.label,
      });
    }

    if (pending.kind === 'credential') {
      const verified = pending.verified === true;
      verifyCredential(pending.id, verified);
      logAction({
        kind: 'verification',
        summary: verified ? '證照驗證通過：套用信任度加分' : '證照驗證未通過：加分未套用',
        targetId: pending.id,
        targetLabel: pending.label,
      });
    }

    setPending(null);
  };

  const sheetActions = () => {
    if (pending?.kind === 'gig-reject') {
      return REJECT_REASONS.map((reason) => ({ id: reason, label: reason, tone: 'danger' as const }));
    }
    if (pending?.kind === 'talent-reject') {
      return [{ id: 'confirm', label: '確認退回', tone: 'danger' as const }];
    }
    return [{ id: 'confirm', label: '確認放行', tone: 'primary' as const }];
  };

  const sheetTitle = () => {
    switch (pending?.kind) {
      case 'gig-approve':
        return '放行這筆任務？';
      case 'gig-reject':
        return '選擇退回原因';
      case 'talent-approve':
        return '放行這位人才資料？';
      case 'talent-reject':
        return '退回這位人才資料？';
      default:
        return pending?.verified === true ? '確認證照有效？' : '標記證照無法辨識？';
    }
  };

  return (
    <View className="bg-background flex-1">
      <AdminHeader title="AI 認證複審中心" caption="未通過即時認證的發布內容一律在此人工確認" />

      <ScrollView
        contentContainerClassName="px-5 py-5 pb-12 gap-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row gap-3">
          <KpiCard
            className="flex-1"
            label="待複審任務"
            value={formatNumber(pendingGigs.length)}
            caption="未通過即時認證"
            tone="coral"
          />
          <KpiCard
            className="flex-1"
            label="待複審人才"
            value={formatNumber(pendingTalents.length)}
            caption="資料需人工確認"
            tone="coral"
          />
        </View>
        <KpiCard
          label="證照待驗證（加分項）"
          value={formatNumber(credentialQueue.length)}
          caption="證照非接案必要條件，驗證後給予信任度加分"
        />

        <SegmentedTabs
          options={[
            { id: 'gigs', label: '任務複審', count: pendingGigs.length },
            { id: 'talents', label: '人才複審', count: pendingTalents.length },
            { id: 'credentials', label: '證照加分', count: credentialQueue.length },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'gigs' ? (
          <View className="gap-4">
            <SectionHeading
              title="等待複審的任務"
              caption="放行後才會出現在人才任務牆與地圖。"
            />
            {pendingGigs.length === 0 ? (
              <EmptyState
                title="沒有待複審的任務"
                caption="所有發布內容都已通過即時認證。"
                icon={<ShieldCheck size={22} color={COLORS.brand} strokeWidth={2.1} />}
              />
            ) : (
              pendingGigs.map((gig) => (
                <View key={gig.id} className="border-hairline gap-3 rounded-xl border bg-white p-4">
                  <Pressable
                    onPress={() => router.push({ pathname: '/gig/[id]', params: { id: gig.id } })}
                    accessibilityRole="button"
                  >
                    <View className="flex-row items-start gap-2">
                      <Text className="text-ink flex-1 text-[15px] leading-6 font-semibold">
                        {gig.title}
                      </Text>
                      {gig.isUrgent ? <StaticTag label="急件" tone="coral" /> : null}
                    </View>
                    <Text className="text-muted mt-1 text-[12px]">
                      {gig.clientName}・{gig.location.region}・發布{' '}
                      {formatRelativeTime(gig.createdAt)}
                    </Text>
                    <Text numberOfLines={3} className="text-ink-soft mt-2 text-[13px] leading-5">
                      {gig.detail}
                    </Text>
                  </Pressable>

                  {gig.review ? <AiReviewCard result={gig.review.ai} title="AI 判定結果" /> : null}

                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Button
                        size="md"
                        onPress={() =>
                          setPending({ kind: 'gig-approve', id: gig.id, label: gig.title })
                        }
                      >
                        <Button.Label>放行上架</Button.Label>
                      </Button>
                    </View>
                    <View className="flex-1">
                      <Button
                        size="md"
                        variant="tertiary"
                        onPress={() =>
                          setPending({ kind: 'gig-reject', id: gig.id, label: gig.title })
                        }
                      >
                        <Button.Label>退回不上架</Button.Label>
                      </Button>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {tab === 'talents' ? (
          <View className="gap-4">
            <SectionHeading title="等待複審的人才資料" caption="放行後人才即可投遞提案並接案。" />
            {pendingTalents.length === 0 ? (
              <EmptyState
                title="沒有待複審的人才"
                caption="所有送審資料都已通過即時認證。"
                icon={<Inbox size={22} color={COLORS.brand} strokeWidth={2.1} />}
              />
            ) : (
              pendingTalents.map((request) => (
                <View
                  key={request.id}
                  className="border-hairline gap-3 rounded-xl border bg-white p-4"
                >
                  <View className="flex-row items-center gap-2">
                    <Text className="text-ink flex-1 text-[15px] font-semibold">
                      {request.talentName}
                    </Text>
                    <StaticTag
                      label={request.credentialUri ? '附證照' : '未附證照'}
                      tone={request.credentialUri ? 'brand' : 'neutral'}
                    />
                  </View>
                  <Text className="text-muted text-[12px]">
                    {request.region}・送審 {formatRelativeTime(request.submittedAt)}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {request.tags.map((tag) => (
                      <StaticTag key={tag} label={tag} tone="brand" />
                    ))}
                  </View>

                  {request.aiReview ? (
                    <AiReviewCard result={request.aiReview} title="AI 判定結果" />
                  ) : (
                    <Text className="text-ink-soft text-[12px] leading-5">
                      此筆為舊資料，未留存 AI 判定紀錄，請人工確認技能與服務地區。
                    </Text>
                  )}

                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Button
                        size="md"
                        onPress={() =>
                          setPending({
                            kind: 'talent-approve',
                            id: request.id,
                            label: request.talentName,
                          })
                        }
                      >
                        <Button.Label>放行接案</Button.Label>
                      </Button>
                    </View>
                    <View className="flex-1">
                      <Button
                        size="md"
                        variant="tertiary"
                        onPress={() =>
                          setPending({
                            kind: 'talent-reject',
                            id: request.id,
                            label: request.talentName,
                          })
                        }
                      >
                        <Button.Label>退回補正</Button.Label>
                      </Button>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {tab === 'credentials' ? (
          <View className="gap-4">
            <SectionHeading
              title="證照驗證（加分項）"
              caption="證照可有可無；驗證通過只會增加信任度，不影響接案資格。"
            />
            {credentialQueue.length === 0 ? (
              <EmptyState
                title="沒有待驗證的證照"
                caption="人才未上傳證照時，仍可依 AI 認證正常接案。"
                icon={<FileBadge size={22} color={COLORS.coral} strokeWidth={2.1} />}
              />
            ) : (
              credentialQueue.map((request) => (
                <View
                  key={request.id}
                  className="border-hairline gap-3 rounded-xl border bg-white p-4"
                >
                  <View className="flex-row items-center gap-3">
                    {request.credentialUri ? (
                      <Image
                        source={{ uri: request.credentialUri }}
                        style={{ width: 56, height: 56, borderRadius: 10 }}
                        resizeMode="cover"
                      />
                    ) : null}
                    <View className="flex-1">
                      <Text className="text-ink text-[15px] font-semibold">
                        {request.talentName}
                      </Text>
                      <Text className="text-muted mt-0.5 text-[12px]">
                        {request.region}・上傳 {formatRelativeTime(request.submittedAt)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Button
                        size="md"
                        onPress={() =>
                          setPending({
                            kind: 'credential',
                            id: request.id,
                            label: request.talentName,
                            verified: true,
                          })
                        }
                      >
                        <Button.Label>證照有效</Button.Label>
                      </Button>
                    </View>
                    <View className="flex-1">
                      <Button
                        size="md"
                        variant="tertiary"
                        onPress={() =>
                          setPending({
                            kind: 'credential',
                            id: request.id,
                            label: request.talentName,
                            verified: false,
                          })
                        }
                      >
                        <Button.Label>無法辨識</Button.Label>
                      </Button>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      <ConfirmSheet
        visible={pending !== null}
        title={sheetTitle()}
        message={pending ? `對象：${pending.label}。所有複審動作都會寫入稽核紀錄。` : undefined}
        actions={sheetActions()}
        onSelect={runAction}
        onCancel={() => setPending(null)}
      />
    </View>
  );
}
