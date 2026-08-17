import { Button } from 'heroui-native';
import {
  Ban,
  CloudOff,
  LockOpen,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ConfirmSheet } from '@/components/ConfirmSheet';
import { ReadOnlyNotice } from '@/components/admin/ReadOnlyNotice';
import { EmptyState, SectionHeading } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { COLORS } from '@/lib/colors';
import { formatClockTime, formatRelativeTime } from '@/lib/format';
import { segmentTranscript } from '@/lib/moderation';
import { useAdminStore } from '@/lib/stores/admin';
import { useAdminCan } from '@/lib/stores/adminAuth';
import { useAdminContentStore } from '@/lib/stores/adminContent';
import type { Conversation } from '@/lib/types';

/**
 * 對話安全審核。
 *
 * 對話與訊息在雲端且受 RLS 保護（只有對話雙方讀得到），
 * 因此這裡走 admin-content 函式，只取回被檢舉或命中詐騙關鍵字的對話。
 * 封禁引擎目前仍是管理端本機狀態（尚未接後端）。
 */
export function SecurityAudit() {
  const conversations = useAdminContentStore((state) => state.conversations);
  const chatMessages = useAdminContentStore((state) => state.chatMessages);
  const chatLoadState = useAdminContentStore((state) => state.chatLoadState);
  const errorMessage = useAdminContentStore((state) => state.errorMessage);
  const refreshChats = useAdminContentStore((state) => state.refreshChats);
  const resolveReport = useAdminContentStore((state) => state.resolveReport);

  const bannedUserIds = useAdminStore((state) => state.bannedUserIds);
  const banUser = useAdminStore((state) => state.banUser);
  const unbanUser = useAdminStore((state) => state.unbanUser);

  const canReview = useAdminCan('review:manage');
  const canBan = useAdminCan('users:manage');
  const logAction = useAuditLogger();

  const [banTarget, setBanTarget] = useState<{ id: string; name: string; reason: string } | null>(
    null,
  );

  useEffect(() => {
    if (!canReview) return;
    void refreshChats();
  }, [canReview, refreshChats]);

  if (!canReview) {
    return (
      <View className="gap-4">
        <SectionHeading title="對話安全審核" caption="檢舉與命中詐騙關鍵字的對話紀錄" />
        <ReadOnlyNotice permission="review:manage" action="檢視對話紀錄與處理檢舉" />
      </View>
    );
  }

  const openReports = conversations.filter((item) => item.reportState === 'open');
  const flaggedOnly = conversations.filter(
    (item) => item.reportState !== 'open' && item.flaggedCount > 0,
  );

  /** 被檢舉人＝檢舉人以外的另一方；沒有檢舉時以命中關鍵字最多的一方為主。 */
  const reportedParty = (conversation: Conversation): { id: string; name: string } => {
    const thread = chatMessages[conversation.id] ?? [];
    const flagged = thread.filter((message) => message.moderation === 'flagged');
    const senderId = flagged[flagged.length - 1]?.senderId;
    if (senderId !== undefined) {
      return senderId === conversation.clientId
        ? { id: conversation.clientId, name: conversation.clientName }
        : { id: conversation.talentId, name: conversation.talentName };
    }
    return conversation.reporterName === conversation.clientName
      ? { id: conversation.talentId, name: conversation.talentName }
      : { id: conversation.clientId, name: conversation.clientName };
  };

  const handleConfirmBan = () => {
    if (!banTarget) return;
    banUser(banTarget.id);
    logAction({
      kind: 'ban',
      summary: `封禁帳號：${banTarget.reason}`,
      targetId: banTarget.id,
      targetLabel: banTarget.name,
    });
    setBanTarget(null);
  };

  const handleUnban = (userId: string, userName: string) => {
    unbanUser(userId);
    logAction({
      kind: 'ban',
      summary: '解除封禁：恢復帳號使用權限',
      targetId: userId,
      targetLabel: userName,
    });
  };

  const handleResolve = async (conversation: Conversation, userName: string) => {
    const ok = await resolveReport(conversation.id, '已檢視對話紀錄並完成處置');
    if (!ok) return;
    logAction({
      kind: 'report',
      summary: '標記檢舉已處理',
      targetId: conversation.id,
      targetLabel: userName,
    });
  };

  const renderConversation = (conversation: Conversation) => {
    const party = reportedParty(conversation);
    const isBanned = bannedUserIds.includes(party.id);
    const thread = chatMessages[conversation.id] ?? [];

    return (
      <View key={conversation.id} className="border-hairline rounded-xl border bg-white p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-ink text-[15px] font-semibold">被檢舉人：{party.name}</Text>
            <Text className="text-muted mt-0.5 text-[12px]">
              {conversation.reporterName === undefined
                ? '系統自動標記'
                : `檢舉人 ${conversation.reporterName}`}
              ・{formatRelativeTime(conversation.reportedAt ?? conversation.lastMessageAt)}
            </Text>
          </View>
          <View className="items-end gap-1.5">
            {isBanned ? <StaticTag label="已封禁" tone="coral" /> : null}
            {conversation.reportState === 'resolved' ? <StaticTag label="已結案" /> : null}
          </View>
        </View>

        <View className="border-coral/25 bg-coral-soft mt-3 flex-row items-center gap-2 rounded-xl border px-3 py-2">
          <TriangleAlert size={15} color={COLORS.coral} strokeWidth={2.2} />
          <Text className="text-coral flex-1 text-[12px] font-semibold">
            {conversation.reportReason ?? '伺服器自動標記高風險內容'}・命中關鍵字訊息{' '}
            {conversation.flaggedCount} 則
          </Text>
        </View>

        <Text className="text-muted mt-3 text-[12px]">
          任務「{conversation.gigTitle}」・{conversation.clientName} ↔ {conversation.talentName}
        </Text>

        <View className="border-hairline bg-canvas mt-3 gap-2 rounded-xl border p-3">
          <Text className="text-muted text-[11px] font-semibold">對話紀錄（依時間排序）</Text>
          {thread.length === 0 ? (
            <Text className="text-muted text-[12px]">這組對話目前沒有訊息紀錄。</Text>
          ) : (
            thread.map((message) => (
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
            ))
          )}
        </View>

        {conversation.reportState === 'resolved' && conversation.resolvedBy !== undefined ? (
          <Text className="text-muted mt-3 text-[11px]">
            由 {conversation.resolvedBy} 於{' '}
            {formatRelativeTime(conversation.resolvedAt ?? conversation.lastMessageAt)}處理
            {conversation.resolutionNote === undefined ? '' : `・${conversation.resolutionNote}`}
          </Text>
        ) : null}

        <View className="border-hairline mt-4 gap-2 border-t pt-4">
          {canBan ? (
            <View className="flex-row gap-2">
              <View className="flex-1">
                {isBanned ? (
                  <Button
                    size="md"
                    variant="tertiary"
                    onPress={() => handleUnban(party.id, party.name)}
                  >
                    <Button.Label>解除封禁</Button.Label>
                  </Button>
                ) : (
                  <Button
                    size="md"
                    onPress={() =>
                      setBanTarget({
                        id: party.id,
                        name: party.name,
                        reason: conversation.reportReason ?? '對話命中詐騙關鍵字',
                      })
                    }
                  >
                    <Button.Label>封禁帳號</Button.Label>
                  </Button>
                )}
              </View>
              <View className="flex-1">
                <Button
                  size="md"
                  variant="tertiary"
                  isDisabled={conversation.reportState !== 'open'}
                  onPress={() => void handleResolve(conversation, party.name)}
                >
                  <Button.Label>
                    {conversation.reportState === 'resolved' ? '已結案' : '標記已處理'}
                  </Button.Label>
                </Button>
              </View>
            </View>
          ) : (
            <>
              <Button
                size="md"
                variant="tertiary"
                isDisabled={conversation.reportState !== 'open'}
                onPress={() => void handleResolve(conversation, party.name)}
              >
                <Button.Label>
                  {conversation.reportState === 'resolved' ? '已結案' : '標記已處理'}
                </Button.Label>
              </Button>
              <ReadOnlyNotice permission="users:manage" action="封禁與解除封禁帳號" />
            </>
          )}
        </View>

        <View className="mt-3 flex-row items-center gap-1.5">
          {isBanned ? (
            <Ban size={13} color={COLORS.coral} strokeWidth={2.2} />
          ) : (
            <LockOpen size={13} color={COLORS.muted} strokeWidth={2.2} />
          )}
          <Text className="text-muted text-[11px]">帳號代碼 {party.id}</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <SectionHeading
            title="對話安全審核與封禁引擎"
            caption={`待處理檢舉 ${openReports.length} 件・自動標記 ${flaggedOnly.length} 組・已封禁帳號 ${bannedUserIds.length} 個`}
          />
        </View>
        <Pressable
          onPress={() => void refreshChats()}
          accessibilityRole="button"
          accessibilityLabel="重新讀取對話紀錄"
          className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
        >
          <RefreshCw size={16} color={COLORS.ink} strokeWidth={2.2} />
        </Pressable>
      </View>

      {chatLoadState === 'error' ? (
        <View className="border-coral/25 bg-coral-soft flex-row items-start gap-2 rounded-xl border px-4 py-3">
          <CloudOff size={15} color={COLORS.coral} strokeWidth={2.1} />
          <Text className="text-coral flex-1 text-[12px] leading-5">
            {errorMessage ?? '無法讀取雲端對話紀錄，請確認網路後重試。'}
          </Text>
        </View>
      ) : null}

      {conversations.length === 0 && chatLoadState === 'ready' ? (
        <EmptyState
          title="沒有需要處理的對話"
          caption="伺服器會在訊息命中詐騙關鍵字時自動標記，使用者檢舉也會出現在這裡。"
          icon={<ShieldCheck size={22} color={COLORS.brand} strokeWidth={2.1} />}
        />
      ) : null}

      {openReports.length > 0 ? (
        <SectionHeading title="使用者檢舉" caption="需要人工判定並回覆處理結果。" />
      ) : null}
      {openReports.map(renderConversation)}

      {flaggedOnly.length > 0 ? (
        <SectionHeading title="系統自動標記" caption="訊息命中詐騙關鍵字，尚未被檢舉。" />
      ) : null}
      {flaggedOnly.map(renderConversation)}

      <ConfirmSheet
        visible={banTarget !== null}
        title="封禁此帳號？"
        message={`${banTarget?.name ?? ''} 將無法登入、投遞提案或開啟新對話，動作會寫入稽核紀錄。`}
        actions={[{ id: 'confirm', label: '確認封禁', tone: 'danger' }]}
        onSelect={handleConfirmBan}
        onCancel={() => setBanTarget(null)}
      />
    </View>
  );
}
