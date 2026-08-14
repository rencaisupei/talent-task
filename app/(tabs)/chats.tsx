import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { MessageCircle, ShieldCheck, TriangleAlert } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChatQuotaPill } from '@/components/ChatQuotaPill';
import { EmptyState, SectionHeading } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { formatRelativeTime } from '@/lib/format';
import { useChatStore } from '@/lib/stores/chat';
import { useSessionStore } from '@/lib/stores/session';

export default function ChatListScreen() {
  const role = useSessionStore((state) => state.role);
  const userId = useSessionStore((state) => state.userId);
  const conversations = useChatStore((state) => state.conversations);
  const messages = useChatStore((state) => state.messages);

  const myConversations = useMemo(() => {
    const scoped = conversations.filter((conversation) =>
      role === 'talent' ? conversation.talentId === userId : conversation.clientId === userId,
    );
    return [...scoped].sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }, [conversations, role, userId]);

  return (
    <View className="bg-background flex-1">
      <FlashList
        data={myConversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="pt-safe-offset-4 gap-4 pb-4">
            <Text className="text-ink text-[26px] font-bold tracking-tight">對話</Text>

            {role === 'talent' ? (
              <ChatQuotaPill onPress={() => router.push('/subscription')} />
            ) : null}

            <View className="border-hairline bg-canvas flex-row items-start gap-2 rounded-xl border px-4 py-3">
              <ShieldCheck size={16} color={COLORS.brandStrong} strokeWidth={2.1} />
              <Text className="text-ink-soft flex-1 text-[12px] leading-5">
                所有訊息皆經伺服器端安全審核，命中詐騙關鍵字時會標記並送交專責人員複核。
              </Text>
            </View>

            <SectionHeading title={`${myConversations.length} 組對話`} />
          </View>
        }
        renderItem={({ item }) => {
          const thread = messages[item.id] ?? [];
          const lastMessage = thread[thread.length - 1];
          const hasFlagged = thread.some((message) => message.moderation === 'flagged');
          const counterpart = role === 'talent' ? item.clientName : item.talentName;

          return (
            <Pressable
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
              accessibilityRole="button"
              className="border-hairline mb-3 rounded-xl border bg-white p-4"
            >
              <View className="flex-row items-center gap-3">
                <View className="bg-brand-soft h-11 w-11 items-center justify-center rounded-xl">
                  <Text className="text-brand-strong text-[16px] font-bold">
                    {counterpart.slice(0, 1)}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-ink flex-1 text-[15px] font-semibold">{counterpart}</Text>
                    <Text className="text-muted text-[11px]">
                      {formatRelativeTime(item.lastMessageAt)}
                    </Text>
                  </View>
                  <Text numberOfLines={1} className="text-muted mt-1 text-[13px]">
                    {lastMessage?.text ?? '尚無訊息'}
                  </Text>
                </View>
              </View>

              <View className="mt-3 flex-row items-center gap-2">
                <StaticTag label={item.tag} tone="brand" />
                {hasFlagged ? (
                  <View className="border-coral/25 bg-coral-soft flex-row items-center gap-1 rounded-lg border px-2 py-1">
                    <TriangleAlert size={12} color={COLORS.coral} strokeWidth={2.2} />
                    <Text className="text-coral text-[11px] font-semibold">已標記待審核</Text>
                  </View>
                ) : null}
                {item.isReported ? <StaticTag label="已檢舉" tone="coral" /> : null}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="還沒有任何對話"
            caption={
              role === 'talent'
                ? '在任務牆點選任務並開啟對話，即可與客戶聯繫。'
                : '發布任務後，認證人才會主動開啟對話。'
            }
            icon={<MessageCircle size={22} color={COLORS.brand} strokeWidth={2.1} />}
          />
        }
      />
    </View>
  );
}
