import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { MessageCircle, ShieldCheck, TriangleAlert } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChatQuotaPill } from '@/components/ChatQuotaPill';
import { CloudListState } from '@/components/CloudListState';
import { SectionHeading } from '@/components/SectionHeading';
import { SignInNotice } from '@/components/SignInNotice';
import { StaticTag } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { formatRelativeTime } from '@/lib/format';
import { useBlockedIds } from '@/lib/stores/blocks';
import { useChatStore } from '@/lib/stores/chat';
import { useIsSignedIn, useMyUserId, useSessionStore } from '@/lib/stores/session';
import { conversationCounterpart } from '@/lib/types';

export default function ChatListScreen() {
  const role = useSessionStore((state) => state.role);
  const userId = useMyUserId();
  const isSignedIn = useIsSignedIn();

  const conversations = useChatStore((state) => state.conversations);
  const unread = useChatStore((state) => state.unread);
  const loadState = useChatStore((state) => state.loadState);
  const isRefreshing = useChatStore((state) => state.isRefreshing);
  const errorMessage = useChatStore((state) => state.errorMessage);
  const refreshConversations = useChatStore((state) => state.refreshConversations);
  const blockedIds = useBlockedIds();

  // 被封鎖的人不該再出現在收件匣（伺服器端也已擋掉他們的訊息）。
  const visible = useMemo(
    () =>
      blockedIds.size === 0
        ? conversations
        : conversations.filter((item) => !blockedIds.has(conversationCounterpart(item, userId).id)),
    [conversations, blockedIds, userId],
  );

  return (
    <View className="bg-background flex-1">
      <FlashList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={isSignedIn ? () => void refreshConversations() : undefined}
        ListHeaderComponent={
          <View className="pt-safe-offset-4 gap-4 pb-4">
            <Text className="text-ink text-[26px] font-bold tracking-tight">對話</Text>

            {isSignedIn ? null : (
              <SignInNotice caption="對話需要帳號才能跨裝置同步。登入後即可與發案者或人才聯繫。" />
            )}

            {role === 'talent' ? (
              <ChatQuotaPill onPress={() => router.push('/subscription')} />
            ) : null}

            <View className="border-hairline bg-canvas flex-row items-start gap-2 rounded-xl border px-4 py-3">
              <ShieldCheck size={16} color={COLORS.brandStrong} strokeWidth={2.1} />
              <Text className="text-ink-soft flex-1 text-[12px] leading-5">
                所有訊息皆在伺服器端建立並自動審核，命中詐騙關鍵字時會標記並送交專責人員複核；請全程於平台內溝通與交易。
              </Text>
            </View>

            {visible.length > 0 ? <SectionHeading title={`${visible.length} 組對話`} /> : null}
          </View>
        }
        renderItem={({ item }) => {
          const peer = conversationCounterpart(item, userId);
          const unreadCount = unread[item.id] ?? 0;

          return (
            <Pressable
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
              accessibilityRole="button"
              className="border-hairline mb-3 rounded-xl border bg-white p-4"
            >
              <View className="flex-row items-center gap-3">
                <View className="bg-brand-soft h-11 w-11 items-center justify-center rounded-xl">
                  <Text className="text-brand-strong text-[16px] font-bold">
                    {peer.name.slice(0, 1)}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-ink flex-1 text-[15px] font-semibold">{peer.name}</Text>
                    <Text className="text-muted text-[11px]">
                      {formatRelativeTime(item.lastMessageAt)}
                    </Text>
                  </View>
                  <View className="mt-1 flex-row items-center gap-2">
                    <Text
                      numberOfLines={1}
                      className={
                        unreadCount > 0
                          ? 'text-ink flex-1 text-[13px] font-semibold'
                          : 'text-muted flex-1 text-[13px]'
                      }
                    >
                      {item.lastMessageText.length > 0 ? item.lastMessageText : '尚無訊息'}
                    </Text>
                    {unreadCount > 0 ? (
                      <View className="bg-brand min-w-5 items-center justify-center rounded-full px-1.5 py-0.5">
                        <Text className="text-[11px] font-bold text-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              <View className="mt-3 flex-row items-center gap-2">
                <StaticTag label={item.tag} tone="brand" />
                {item.flaggedCount > 0 ? (
                  <View className="border-coral/25 bg-coral-soft flex-row items-center gap-1 rounded-lg border px-2 py-1">
                    <TriangleAlert size={12} color={COLORS.coral} strokeWidth={2.2} />
                    <Text className="text-coral text-[11px] font-semibold">已標記待審核</Text>
                  </View>
                ) : null}
                {item.reportState === 'open' ? <StaticTag label="已檢舉" tone="coral" /> : null}
                {item.reportState === 'resolved' ? <StaticTag label="檢舉已處理" /> : null}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          isSignedIn ? (
            <CloudListState
              loadState={loadState}
              errorMessage={errorMessage}
              onRetry={() => void refreshConversations()}
              loadingLabel="正在讀取雲端對話…"
              emptyTitle="還沒有任何對話"
              emptyCaption={
                role === 'talent'
                  ? '在任務牆點選任務並開啟對話，即可與發案者聯繫。'
                  : '發布任務後，認證人才會主動開啟對話。'
              }
              emptyIcon={<MessageCircle size={22} color={COLORS.brand} strokeWidth={2.1} />}
            />
          ) : null
        }
      />
    </View>
  );
}
