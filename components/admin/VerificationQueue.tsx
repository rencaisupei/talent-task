import { Button } from 'heroui-native';
import { BadgeCheck, FileImage, ShieldQuestion } from 'lucide-react-native';
import { Image, Text, View } from 'react-native';

import { EmptyState, SectionHeading } from '@/components/SectionHeading';
import { AiReviewCard } from '@/components/AiReviewCard';
import { StaticTag } from '@/components/TagChip';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { COLORS } from '@/lib/colors';
import { formatRelativeTime } from '@/lib/format';
import { useAdminStore } from '@/lib/stores/admin';
import type { VerificationRequest, VerificationStatus } from '@/lib/types';

const STATUS_LABEL: Record<VerificationStatus, string> = {
  none: '未送審',
  pending: '待複審',
  approved: '已認證',
  rejected: '已退回',
};

export function VerificationQueue() {
  const verifications = useAdminStore((state) => state.verifications);
  const approveVerification = useAdminStore((state) => state.approveVerification);
  const rejectVerification = useAdminStore((state) => state.rejectVerification);
  const logAction = useAuditLogger();

  const pending = verifications.filter((item) => item.status === 'pending');
  const processed = verifications.filter((item) => item.status !== 'pending');

  const handleDecision = (request: VerificationRequest, decision: 'approved' | 'rejected') => {
    if (decision === 'approved') approveVerification(request.id);
    else rejectVerification(request.id);
    logAction({
      kind: 'moderation',
      summary:
        decision === 'approved'
          ? '複審放行人才資料：內容確認無詐騙風險'
          : '複審退回人才資料：疑似不實或高風險',
      targetId: request.talentId,
      targetLabel: request.talentName,
    });
  };

  return (
    <View className="gap-4">
      <SectionHeading
        title="人才資料複審佇列"
        caption={`待複審 ${pending.length} 件・已處理 ${processed.length} 件（AI 認證未通過才會進入此佇列）`}
      />

      {verifications.length === 0 ? (
        <EmptyState
          title="佇列已清空"
          caption="目前沒有等待審核的註冊申請。"
          icon={<ShieldQuestion size={22} color={COLORS.brand} strokeWidth={2.1} />}
        />
      ) : null}

      {[...pending, ...processed].map((request) => (
        <View key={request.id} className="border-hairline rounded-xl border bg-white p-4">
          <View className="flex-row items-start gap-3">
            {request.credentialUri ? (
              <Image
                source={{ uri: request.credentialUri }}
                style={{ width: 56, height: 56, borderRadius: 10 }}
                resizeMode="cover"
              />
            ) : (
              <View className="bg-canvas h-14 w-14 items-center justify-center rounded-xl">
                <FileImage size={20} color={COLORS.muted} strokeWidth={2} />
              </View>
            )}

            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-ink text-[15px] font-semibold">{request.talentName}</Text>
                {request.status === 'approved' ? (
                  <BadgeCheck size={15} color={COLORS.brand} strokeWidth={2.2} />
                ) : null}
              </View>
              <Text className="text-muted mt-0.5 text-[12px]">
                {request.region}・送審 {formatRelativeTime(request.submittedAt)}
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {request.tags.map((tag) => (
                  <StaticTag key={tag} label={tag} tone="brand" />
                ))}
              </View>
            </View>

            <StaticTag
              label={STATUS_LABEL[request.status]}
              tone={
                request.status === 'approved'
                  ? 'brand'
                  : request.status === 'pending'
                    ? 'coral'
                    : 'neutral'
              }
            />
          </View>

          {request.note ? (
            <Text className="text-ink-soft mt-3 text-[12px] leading-5">
              審核備註：{request.note}
            </Text>
          ) : null}

          {request.aiReview ? (
            <AiReviewCard result={request.aiReview} title="AI 判定結果" className="mt-3" />
          ) : null}

          {request.status === 'pending' ? (
            <View className="border-hairline mt-4 flex-row gap-2 border-t pt-4">
              <View className="flex-1">
                <Button size="md" onPress={() => handleDecision(request, 'approved')}>
                  <Button.Label>放行</Button.Label>
                </Button>
              </View>
              <View className="flex-1">
                <Button
                  size="md"
                  variant="tertiary"
                  onPress={() => handleDecision(request, 'rejected')}
                >
                  <Button.Label>退回</Button.Label>
                </Button>
              </View>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}
