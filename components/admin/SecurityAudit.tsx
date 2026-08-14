import { Button } from 'heroui-native';
import { Ban, LockOpen, ShieldCheck, TriangleAlert } from 'lucide-react-native';
import { Alert, Text, View } from 'react-native';

import { EmptyState, SectionHeading } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { formatClockTime, formatRelativeTime } from '@/lib/format';
import { segmentTranscript } from '@/lib/moderation';
import { useAdminStore } from '@/lib/stores/admin';

export function SecurityAudit() {
  const reports = useAdminStore((state) => state.reports);
  const bannedUserIds = useAdminStore((state) => state.bannedUserIds);
  const banUser = useAdminStore((state) => state.banUser);
  const unbanUser = useAdminStore((state) => state.unbanUser);
  const resolveReport = useAdminStore((state) => state.resolveReport);

  const openReports = reports.filter((report) => !report.resolved);

  const handleBan = (userId: string, userName: string) => {
    Alert.alert('封禁此帳號？', `${userName} 將無法登入或開啟新對話。`, [
      { text: '取消', style: 'cancel' },
      { text: '確認封禁', style: 'destructive', onPress: () => banUser(userId) },
    ]);
  };

  return (
    <View className="gap-4">
      <SectionHeading
        title="安全審核與封禁引擎"
        caption={`未處理檢舉 ${openReports.length} 件・已封禁帳號 ${bannedUserIds.length} 個`}
      />

      {reports.length === 0 ? (
        <EmptyState
          title="沒有待處理的檢舉"
          caption="系統會自動彙整命中詐騙關鍵字的對話。"
          icon={<ShieldCheck size={22} color={COLORS.brand} strokeWidth={2.1} />}
        />
      ) : null}

      {reports.map((report) => {
        const isBanned = bannedUserIds.includes(report.reportedUserId);
        const flaggedCount = report.transcript.filter(
          (message) => message.moderation === 'flagged',
        ).length;

        return (
          <View key={report.id} className="border-hairline rounded-xl border bg-white p-4">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-ink text-[15px] font-semibold">
                  被檢舉人：{report.reportedUserName}
                </Text>
                <Text className="text-muted mt-0.5 text-[12px]">
                  檢舉人 {report.reporterName}・{formatRelativeTime(report.createdAt)}
                </Text>
              </View>
              <View className="items-end gap-1.5">
                {isBanned ? <StaticTag label="已封禁" tone="coral" /> : null}
                {report.resolved ? <StaticTag label="已結案" /> : null}
              </View>
            </View>

            <View className="border-coral/25 bg-coral-soft mt-3 flex-row items-center gap-2 rounded-xl border px-3 py-2">
              <TriangleAlert size={15} color={COLORS.coral} strokeWidth={2.2} />
              <Text className="text-coral flex-1 text-[12px] font-semibold">
                {report.reason}・命中關鍵字訊息 {flaggedCount} 則
              </Text>
            </View>

            <View className="border-hairline bg-canvas mt-3 gap-2 rounded-xl border p-3">
              <Text className="text-muted text-[11px] font-semibold">
                已解密對話紀錄（依時間排序）
              </Text>
              {report.transcript.map((message) => (
                <View key={message.id} className="gap-0.5">
                  <Text className="text-muted text-[11px]">
                    {formatClockTime(message.at)}・{message.senderName}
                  </Text>
                  <Text className="text-ink text-[13px] leading-5">
                    {segmentTranscript(message).map((segment) => (
                      <Text
                        key={`${message.id}_${segment.offset}`}
                        className={segment.isFlagged ? 'text-coral font-bold' : 'text-ink'}
                      >
                        {segment.text}
                      </Text>
                    ))}
                  </Text>
                </View>
              ))}
            </View>

            <View className="border-hairline mt-4 flex-row gap-2 border-t pt-4">
              <View className="flex-1">
                {isBanned ? (
                  <Button
                    size="md"
                    variant="tertiary"
                    onPress={() => unbanUser(report.reportedUserId)}
                  >
                    <Button.Label>解除封禁</Button.Label>
                  </Button>
                ) : (
                  <Button
                    size="md"
                    onPress={() => handleBan(report.reportedUserId, report.reportedUserName)}
                  >
                    <Button.Label>封禁帳號</Button.Label>
                  </Button>
                )}
              </View>
              <View className="flex-1">
                <Button
                  size="md"
                  variant="tertiary"
                  isDisabled={report.resolved}
                  onPress={() => resolveReport(report.id)}
                >
                  <Button.Label>{report.resolved ? '已結案' : '標記已處理'}</Button.Label>
                </Button>
              </View>
            </View>

            <View className="mt-3 flex-row items-center gap-1.5">
              {isBanned ? (
                <Ban size={13} color={COLORS.coral} strokeWidth={2.2} />
              ) : (
                <LockOpen size={13} color={COLORS.muted} strokeWidth={2.2} />
              )}
              <Text className="text-muted text-[11px]">帳號代碼 {report.reportedUserId}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
