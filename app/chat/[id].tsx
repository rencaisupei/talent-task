import { useLocalSearchParams } from 'expo-router';
import { Button, Spinner } from 'heroui-native';
import { ArrowLeft, Flag, ShieldCheck, TriangleAlert } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ConfirmSheet } from '@/components/ConfirmSheet';
import { EmptyState } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { formatClockTime } from '@/lib/format';
import { goBackOrReplace } from '@/lib/navigation';
import { useChatStore } from '@/lib/stores/chat';
import { useMyUserId } from '@/lib/stores/session';
import { conversationCounterpart } from '@/lib/types';
import { cn } from '@/lib/utils';

const REPORT_REASONS = ['要求私下匯款或離開平台', '疑似詐騙或投資話術', '言語騷擾或不當內容'];
/** 與伺服器端 send_message 的截斷長度一致。 */
const MESSAGE_MAX_LENGTH = 1000;

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id ?? '';

  const conversations = useChatStore((state) => state.conversations);
  const messagesMap = useChatStore((state) => state.messages);
  const threadState = useChatStore((state) => state.threadState);
  const listState = useChatStore((state) => state.loadState);
  const errorMessage = useChatStore((state) => state.errorMessage);
  const refreshMessages = useChatStore((state) => state.refreshMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const markRead = useChatStore((state) => state.markRead);
  const setOpenConversation = useChatStore((state) => state.setOpenConversation);
  const reportConversation = useChatStore((state) => state.reportConversation);

  const userId = useMyUserId();

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [warning, setWarning] = useState<string[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const conversation = conversations.find((item) => item.id === conversationId);
  const thread = useMemo(
    () => (conversationId.length > 0 ? (messagesMap[conversationId] ?? []) : []),
    [conversationId, messagesMap],
  );

  useEffect(() => {
    if (conversationId.length === 0) return undefined;

    setOpenConversation(conversationId);
    void refreshMessages(conversationId);

    return () => setOpenConversation(null);
  }, [conversationId, refreshMessages, setOpenConversation]);

  // 訊息可能在畫面開著時才抵達，因此已讀要跟著最後一則訊息更新。
  const lastMessageAt = conversation?.lastMessageAt ?? 0;
  useEffect(() => {
    if (conversationId.length === 0 || lastMessageAt === 0) return;
    void markRead(conversationId);
  }, [conversationId, lastMessageAt, markRead]);

  if (!conversation) {
    if (listState === 'loading' || listState === 'idle') {
      return (
        <View className="bg-background flex-1 items-center justify-center gap-3 px-6">
          <Spinner size="md" />
          <Text className="text-muted text-[13px]">正在讀取對話…</Text>
        </View>
      );
    }

    return (
      <View className="bg-background flex-1 items-center justify-center px-6">
        <EmptyState
          title="找不到這組對話"
          caption={
            listState === 'error'
              ? (errorMessage ?? '目前無法連線到雲端對話，請確認網路後重試。')
              : '對話可能已結束或你已不是這組對話的成員。'
          }
        />
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)/chats')}
          className="mt-4"
          accessibilityRole="button"
        >
          <Text className="text-brand-strong text-[14px] font-semibold">返回對話列表</Text>
        </Pressable>
      </View>
    );
  }

  const peer = conversationCounterpart(conversation, userId);
  const isLoadingThread =
    thread.length === 0 &&
    (threadState[conversation.id] === 'loading' || threadState[conversation.id] === undefined);

  const handleSend = async () => {
    const text = draft.trim();
    if (text.length === 0 || sending) return;

    setSending(true);
    setSendError(null);
    const result = await sendMessage(conversation.id, text);
    setSending(false);

    if (result.status === 'error') {
      setSendError(result.message);
      return;
    }

    setDraft('');
    setWarning(result.data.moderation === 'flagged' ? result.data.flaggedTerms : []);
  };

  const handleReport = (reason: string) => {
    setReportOpen(false);
    if (!REPORT_REASONS.includes(reason)) return;
    void reportConversation(conversation.id, reason);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="bg-background flex-1"
    >
      <View className="border-hairline pt-safe-offset-3 flex-row items-center gap-2 border-b bg-white px-5 pb-4">
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)/chats')}
          accessibilityRole="button"
          accessibilityLabel="返回"
          className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
        >
          <ArrowLeft size={18} color={COLORS.ink} strokeWidth={2.2} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-ink text-[16px] font-semibold">{peer.name}</Text>
          <Text numberOfLines={1} className="text-muted text-[12px]">
            {conversation.gigTitle}
          </Text>
        </View>
        <Pressable
          onPress={() => setReportOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="檢舉對話"
          className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
        >
          <Flag size={17} color={COLORS.coral} strokeWidth={2.1} />
        </Pressable>
      </View>

      <View className="border-hairline bg-canvas flex-row items-center gap-2 border-b px-5 py-2.5">
        <ShieldCheck size={14} color={COLORS.brandStrong} strokeWidth={2.1} />
        <Text className="text-ink-soft flex-1 text-[11px]">
          訊息由伺服器建立並自動審核，請勿私下匯款或離開平台交易。
        </Text>
        <StaticTag label={conversation.tag} tone="brand" />
      </View>

      {conversation.reportState === 'open' ? (
        <View className="border-coral/25 bg-coral-soft mx-5 mt-3 rounded-xl border px-4 py-3">
          <Text className="text-coral text-[12px] font-semibold">此對話已送交安全審核</Text>
          <Text className="text-ink-soft mt-1 text-[11px] leading-4">
            {conversation.reportReason ?? '審核人員會檢視完整對話紀錄，處理結果會以通知告知。'}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={thread}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 py-4 gap-3"
        showsVerticalScrollIndicator={false}
        renderItem={({ item: message }) => {
          const isMine = message.senderId === userId;
          return (
            <View className={cn('max-w-[82%]', isMine ? 'self-end' : 'self-start')}>
              <View
                className={cn(
                  'rounded-xl px-3.5 py-2.5',
                  isMine ? 'bg-brand' : 'border-hairline border bg-white',
                )}
              >
                <Text className={cn('text-[14px] leading-5', isMine ? 'text-white' : 'text-ink')}>
                  {message.text}
                </Text>
              </View>
              <View
                className={cn('mt-1 flex-row items-center gap-1.5', isMine ? 'justify-end' : '')}
              >
                <Text className="text-muted text-[10px]">{formatClockTime(message.at)}</Text>
                {message.moderation === 'flagged' ? (
                  <View className="flex-row items-center gap-1">
                    <TriangleAlert size={11} color={COLORS.coral} strokeWidth={2.3} />
                    <Text className="text-coral text-[10px] font-semibold">已標記待審核</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          isLoadingThread ? (
            <View className="items-center gap-3 py-16">
              <Spinner size="md" />
              <Text className="text-muted text-[13px]">正在讀取訊息…</Text>
            </View>
          ) : (
            <EmptyState
              title="開始你們的第一則訊息"
              caption="說明需求細節、時間與地點，媒合會更快完成。"
            />
          )
        }
      />

      {warning.length > 0 ? (
        <View className="border-coral/25 bg-coral-soft mx-5 mb-2 rounded-xl border px-4 py-3">
          <Text className="text-coral text-[12px] font-semibold">
            訊息命中風險關鍵字：{warning.join('、')}
          </Text>
          <Text className="text-ink-soft mt-1 text-[11px] leading-4">
            該訊息已送交安全審核，請透過平台完成交易以保障雙方權益。
          </Text>
        </View>
      ) : null}

      {sendError !== null ? (
        <View className="border-coral/25 bg-coral-soft mx-5 mb-2 rounded-xl border px-4 py-3">
          <Text className="text-coral text-[12px] leading-5">{sendError}</Text>
        </View>
      ) : null}

      <View className="border-hairline pb-safe-or-4 flex-row items-end gap-2 border-t bg-white px-5 pt-3">
        <View className="border-hairline bg-canvas flex-1 rounded-xl border px-3.5 py-2.5">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="輸入訊息"
            placeholderTextColor={COLORS.muted}
            maxLength={MESSAGE_MAX_LENGTH}
            multiline
            className="text-ink max-h-24 text-[14px]"
          />
        </View>
        <Button
          size="md"
          isDisabled={draft.trim().length === 0 || sending}
          onPress={() => void handleSend()}
        >
          <Button.Label>{sending ? '傳送中' : '傳送'}</Button.Label>
        </Button>
      </View>

      <ConfirmSheet
        visible={reportOpen}
        title="檢舉這組對話"
        message="請選擇檢舉原因，我們會將對話紀錄交由安全審核人員複核。"
        actions={REPORT_REASONS.map((reason) => ({
          id: reason,
          label: reason,
          tone: 'danger' as const,
        }))}
        onSelect={handleReport}
        onCancel={() => setReportOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}
