import { useCallback, useEffect, useRef, useState } from 'react';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { ChevronLeft, MoreVertical, Phone, Video, X } from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ChatComposer } from '@/components/chat/ChatComposer';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { UpgradeSheet } from '@/components/subscription/UpgradeSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlowButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useScrollToEndOnKeyboard } from '@/hooks/useKeyboardInset';
import { getProfileById } from '@/lib/data/profiles';
import { ICEBREAKERS } from '@/lib/data/seed';
import { activityLabel } from '@/lib/format';
import { goBackOrReplace } from '@/lib/navigation';
import { useCallsStore } from '@/lib/stores/calls';
import { useChatStore, useConversationMessages } from '@/lib/stores/chat';
import { useEntitlements } from '@/lib/stores/subscription';
import { NEON } from '@/lib/theme';
import type { CallKind, Message } from '@/lib/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id ?? '';

  const conversations = useChatStore((state) => state.conversations);
  const drafts = useChatStore((state) => state.drafts);
  const setDraft = useChatStore((state) => state.setDraft);
  const sendText = useChatStore((state) => state.sendText);
  const sendImage = useChatStore((state) => state.sendImage);
  const sendVoice = useChatStore((state) => state.sendVoice);
  const markRead = useChatStore((state) => state.markRead);
  const toggleMute = useChatStore((state) => state.toggleMute);
  const startOutgoing = useCallsStore((state) => state.startOutgoing);
  const entitlements = useEntitlements();
  const messages = useConversationMessages(conversationId);

  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const listRef = useRef<FlashListRef<Message>>(null);
  // 使用者往上翻歷史訊息時就不要把畫面拉回底部。
  const atBottomRef = useRef(true);

  const conversation = conversations.find((item) => item.id === conversationId);
  const profile = getProfileById(conversation?.userId);

  const scrollToEnd = useCallback((animated: boolean) => {
    listRef.current?.scrollToEnd({ animated });
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromEnd = contentSize.height - layoutMeasurement.height - contentOffset.y;
    atBottomRef.current = distanceFromEnd <= 120;
  }, []);

  useScrollToEndOnKeyboard(
    useCallback(
      (animated: boolean) => {
        if (atBottomRef.current) scrollToEnd(animated);
      },
      [scrollToEnd],
    ),
  );

  useEffect(() => {
    if (conversationId) markRead(conversationId);
  }, [conversationId, markRead]);

  useEffect(() => {
    const timer = setTimeout(() => scrollToEnd(true), 80);
    return () => clearTimeout(timer);
  }, [messages.length, scrollToEnd]);

  if (!conversation || !profile) {
    return (
      <Screen>
        <View className="pt-safe-offset-4 flex-1">
          <EmptyState
            title="找不到這個對話"
            description="它可能已經被刪除了。"
            action={
              <GlowButton label="回到訊息" onPress={() => router.replace('/(tabs)/messages')} />
            }
          />
        </View>
      </Screen>
    );
  }

  const draft = drafts[conversationId] ?? '';

  const call = (kind: CallKind) => {
    if (kind === 'video' && !entitlements.videoCalls) {
      setPaywall(true);
      return;
    }
    startOutgoing(profile.id, kind);
    router.push('/call/active');
  };

  return (
    <Screen glow={false}>
      <View className="pt-safe-offset-2 border-border/60 bg-background flex-row items-center gap-3 border-b px-3 pb-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="返回"
          hitSlop={8}
          onPress={() => goBackOrReplace('/(tabs)/messages')}
          className="active:opacity-70"
        >
          <ChevronLeft color="#F6F1F8" size={24} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`查看 ${profile.name} 的檔案`}
          onPress={() => router.push(`/profile/${profile.id}`)}
          className="flex-1 flex-row items-center gap-3 active:opacity-70"
        >
          <UserAvatar
            uri={profile.photos[0]}
            name={profile.name}
            size={40}
            online={profile.online}
          />
          <View className="flex-1">
            <Txt weight="semibold" className="text-foreground text-[15px]" numberOfLines={1}>
              {profile.name}
            </Txt>
            <Txt
              className={conversation.typing ? 'text-accent text-[11px]' : 'text-muted text-[11px]'}
            >
              {conversation.typing
                ? '正在輸入…'
                : activityLabel(profile.online, profile.lastActiveMinutes)}
            </Txt>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="語音通話"
          hitSlop={6}
          onPress={() => call('voice')}
          className="bg-glass border-border/60 h-9 w-9 items-center justify-center rounded-full border active:opacity-70"
        >
          <Phone color="#2FD68A" size={16} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="視訊通話"
          hitSlop={6}
          onPress={() => call('video')}
          className="bg-glass border-border/60 h-9 w-9 items-center justify-center rounded-full border active:opacity-70"
        >
          <Video color={NEON.cyan} size={16} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="更多選項"
          hitSlop={6}
          onPress={() => setShowMore(true)}
          className="active:opacity-70"
        >
          <MoreVertical color="#8C8397" size={18} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <FlashList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{
            autoscrollToBottomThreshold: 0.2,
            startRenderingFromBottom: true,
          }}
          ListFooterComponent={
            conversation.typing ? (
              <View className="flex-row items-center gap-2 py-2">
                <UserAvatar uri={profile.photos[0]} name={profile.name} size={24} />
                <View className="bg-surface border-border/60 flex-row gap-1 rounded-full border px-3 py-2">
                  <View className="bg-muted h-1.5 w-1.5 rounded-full" />
                  <View className="bg-muted h-1.5 w-1.5 rounded-full" />
                  <View className="bg-muted h-1.5 w-1.5 rounded-full" />
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <MessageBubble message={item} showReadReceipt={entitlements.readReceipts} />
          )}
        />

        <ChatComposer
          value={draft}
          onChangeText={(value) => setDraft(conversationId, value)}
          onSend={() => {
            sendText(conversationId, draft);
            setDraft(conversationId, '');
          }}
          onPickImage={() =>
            sendImage(conversationId, `https://picsum.photos/seed/chat-${Date.now()}/700/700`)
          }
          onSendVoice={(durationSec) => sendVoice(conversationId, durationSec)}
          onOpenGifts={() => router.push({ pathname: '/gifts', params: { conversationId } })}
          onOpenIcebreakers={() => setShowIcebreakers(true)}
        />
      </KeyboardAvoidingView>

      <Modal
        visible={showIcebreakers}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIcebreakers(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="關閉"
          onPress={() => setShowIcebreakers(false)}
          className="flex-1 justify-end bg-black/70"
        >
          <Pressable
            accessibilityRole="none"
            onPress={() => undefined}
            className="bg-surface border-border/60 pb-safe-offset-6 gap-3 rounded-t-[32px] border-t px-6 pt-6"
          >
            <View className="flex-row items-center justify-between">
              <Txt weight="semibold" className="text-foreground text-base">
                破冰話題
              </Txt>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="關閉"
                hitSlop={8}
                onPress={() => setShowIcebreakers(false)}
                className="bg-glass border-border/60 h-9 w-9 items-center justify-center rounded-full border active:opacity-70"
              >
                <X color="#ffffff" size={16} />
              </Pressable>
            </View>
            <ScrollView className="max-h-80" contentContainerClassName="gap-2">
              {ICEBREAKERS.map((line) => (
                <Pressable
                  key={line}
                  accessibilityRole="button"
                  accessibilityLabel={line}
                  onPress={() => {
                    setDraft(conversationId, line);
                    setShowIcebreakers(false);
                  }}
                  className="bg-background border-border/60 rounded-2xl border px-4 py-3.5 active:opacity-70"
                >
                  <Txt className="text-foreground text-[14px] leading-5">{line}</Txt>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showMore}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMore(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="關閉"
          onPress={() => setShowMore(false)}
          className="flex-1 justify-end bg-black/70"
        >
          <Pressable
            accessibilityRole="none"
            onPress={() => undefined}
            className="bg-surface border-border/60 pb-safe-offset-6 gap-2 rounded-t-[32px] border-t px-6 pt-6"
          >
            <MoreRow
              label={conversation.muted ? '開啟這個對話的通知' : '關閉這個對話的通知'}
              onPress={() => {
                toggleMute(conversationId);
                setShowMore(false);
              }}
            />
            <MoreRow
              label="查看完整檔案"
              onPress={() => {
                setShowMore(false);
                router.push(`/profile/${profile.id}`);
              }}
            />
            <MoreRow
              label="送禮物"
              onPress={() => {
                setShowMore(false);
                router.push({ pathname: '/gifts', params: { conversationId } });
              }}
            />
            <MoreRow
              label="安全中心"
              onPress={() => {
                setShowMore(false);
                router.push('/safety');
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <UpgradeSheet
        visible={paywall}
        onClose={() => setPaywall(false)}
        title="視訊通話是 VIP 功能"
        description="在見面之前先確認彼此的感覺，安全也比較安心。"
        bullets={['無限視訊通話', '通話畫質優先', '已讀回執', '隱身瀏覽']}
      />
    </Screen>
  );
}

function MoreRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="bg-background border-border/60 rounded-2xl border px-4 py-3.5 active:opacity-70"
    >
      <Txt className="text-foreground text-[14px]">{label}</Txt>
    </Pressable>
  );
}
