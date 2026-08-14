import { Button } from 'heroui-native';
import { BadgeCheck, FileImage, ShieldQuestion } from 'lucide-react-native';
import { Image, Text, View } from 'react-native';

import { EmptyState, SectionHeading } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { formatRelativeTime } from '@/lib/format';
import { useAdminStore } from '@/lib/stores/admin';
import type { VerificationStatus } from '@/lib/types';

const STATUS_LABEL: Record<VerificationStatus, string> = {
  none: '未送審',
  pending: '待審核',
  approved: '已核准',
  rejected: '已拒絕',
};

export function VerificationQueue() {
  const verifications = useAdminStore((state) => state.verifications);
  const approveVerification = useAdminStore((state) => state.approveVerification);
  const rejectVerification = useAdminStore((state) => state.rejectVerification);

  const pending = verifications.filter((item) => item.status === 'pending');
  const processed = verifications.filter((item) => item.status !== 'pending');

  return (
    <View className="gap-4">
      <SectionHeading
        title="非同步驗證佇列"
        caption={`待審核 ${pending.length} 件・已處理 ${processed.length} 件`}
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
              憑證備註：{request.note}
            </Text>
          ) : null}

          {request.status === 'pending' ? (
            <View className="border-hairline mt-4 flex-row gap-2 border-t pt-4">
              <View className="flex-1">
                <Button size="md" onPress={() => approveVerification(request.id)}>
                  <Button.Label>核准</Button.Label>
                </Button>
              </View>
              <View className="flex-1">
                <Button size="md" variant="tertiary" onPress={() => rejectVerification(request.id)}>
                  <Button.Label>拒絕</Button.Label>
                </Button>
              </View>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}
