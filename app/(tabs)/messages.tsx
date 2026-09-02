import { useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { BellOff, MessageCircle, Phone, Pin, Search } from 'lucide-react-native';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useThemeColor } from 'heroui-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { GlowButton, IconButton } from '@/components/ui/GlowButton';
import { Photo } from '@/components/ui/Photo';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Txt } from '@/components/ui/Txt';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { getProfileById, getProfiles } from '@/lib/data/profiles';
import { messagePreview, relativeTime } from '@/lib/format';
import { lastMessageOf, useChatStore, useSortedConversations } from '@/lib/stores/chat';
import { useMatchesStore } from '@/lib/stores/matches';
import { NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';

export default function MessagesScreen() {
  const [muted] = useThemeColor(['muted']);
  const conversations = useSortedConversations();
  const messages = useChatStore((state) => state.messages);
  const togglePin = useChatStore((state) => state.togglePin);
  const ensureConversation = useChatStore((state) => state.ensureConversation);
  const matchedIds = useMatchesStore((state) => state.matchedIds);
  const [query, setQuery] = useState('');

  const newMatches = getProfiles(matchedIds).filter((profile) => {
    const conversation = conversations.find((item) => item.userId === profile.id);
    if (!conversation) return true;
    return !messages.some(
      (message) => message.conversationId === conversation.id && message.kind !== 'system',
    );
  });

  const filtered = conversations.filter((conversation) => {
    if (!query.trim()) return true;
    const profile = getProfileById(conversation.userId);
    return profile?.name.includes(query.trim()) ?? false;
  });

  return (
    <Screen>
      <ScreenHeader
        title="訊息"
        subtitle={`${conversations.length} 個對話`}
        right={
          <IconButton label="通話紀錄" onPress={() => router.push('/call/history')}>
            <Phone color={NEON.cyan} size={18} />
          </IconButton>
        }
      />

      <View className="px-4 pb-3">
        <View className="bg-surface border-border/60 flex-row items-center gap-2 rounded-2xl border px-3.5 py-2.5">
          <Search color={muted} size={16} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="搜尋對話"
            placeholderTextColor={muted}
            className="text-foreground flex-1 text-[14px]"
          />
        </View>
      </View>

      {newMatches.length > 0 ? (
        <View className="gap-2 pb-4">
          <Txt weight="semibold" className="text-foreground px-5 text-[13px]">
            新配對 · 還沒開始聊
          </Txt>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3 px-4"
          >
            {newMatches.map((profile) => (
              <Pressable
                key={profile.id}
                accessibilityRole="button"
                accessibilityLabel={`和 ${profile.name} 開始聊天`}
                onPress={() => router.push(`/chat/${ensureConversation(profile.id)}`)}
                className="w-[76px] items-center gap-1.5 active:opacity-80"
              >
                <View className="border-accent overflow-hidden rounded-2xl border-2">
                  <Photo uri={profile.photos[0] ?? ''} width={72} height={90} radius={14} />
                </View>
                <Txt className="text-muted text-[11px]" numberOfLines={1}>
                  {profile.name}
                </Txt>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <FlashList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <EmptyState
            icon={<MessageCircle color={NEON.coral} size={24} />}
            title="還沒有對話"
            description="配對之後就可以開始聊天，主動開場的人被回應的機率高很多。"
            action={<GlowButton label="去找人聊" onPress={() => router.push('/discover')} />}
          />
        }
        renderItem={({ item }) => {
          const profile = getProfileById(item.userId);
          const last = lastMessageOf(messages, item.id);
          if (!profile) return null;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`打開和 ${profile.name} 的對話`}
              onPress={() => router.push(`/chat/${item.id}`)}
              onLongPress={() => togglePin(item.id)}
              className="flex-row items-center gap-3 px-4 py-3 active:opacity-70"
            >
              <UserAvatar
                uri={profile.photos[0]}
                name={profile.name}
                size={56}
                online={profile.online}
                ring={item.unread > 0}
              />
              <View className="flex-1 gap-1">
                <View className="flex-row items-center gap-2">
                  <Txt
                    weight="semibold"
                    className="text-foreground flex-1 text-[15px]"
                    numberOfLines={1}
                  >
                    {profile.name}
                  </Txt>
                  {item.pinned ? <Pin color={NEON.amber} size={12} /> : null}
                  {item.muted ? <BellOff color="#8C8397" size={12} /> : null}
                  <Txt className="text-muted text-[11px]">{relativeTime(item.lastMessageAt)}</Txt>
                </View>
                <View className="flex-row items-center gap-2">
                  <Txt
                    className={cn(
                      'flex-1 text-[13px]',
                      item.typing
                        ? 'text-accent'
                        : item.unread > 0
                          ? 'text-foreground'
                          : 'text-muted',
                    )}
                    numberOfLines={1}
                  >
                    {item.typing
                      ? '正在輸入…'
                      : last
                        ? `${last.senderId === 'me' ? '你：' : ''}${messagePreview(last.kind, last.text)}`
                        : '打個招呼吧'}
                  </Txt>
                  {item.unread > 0 ? (
                    <View className="bg-accent min-w-5 items-center justify-center rounded-full px-1.5 py-0.5">
                      <Txt weight="semibold" className="text-[10px] text-white">
                        {item.unread}
                      </Txt>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
