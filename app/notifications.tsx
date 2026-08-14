import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import {
  ArrowLeft,
  BellOff,
  Handshake,
  Inbox,
  MessageCircle,
  PhoneCall,
  ScanEye,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ConfirmSheet } from '@/components/ConfirmSheet';
import { EmptyState } from '@/components/SectionHeading';
import { COLORS } from '@/lib/colors';
import { formatRelativeTime } from '@/lib/format';
import { goBackOrReplace } from '@/lib/navigation';
import { countUnread, useNotificationStore } from '@/lib/stores/notifications';
import type { AppNotification, NotificationKind } from '@/lib/types';
import { cn } from '@/lib/utils';

const KIND_LABEL: Record<NotificationKind, string> = {
  bid: '提案動態',
  match: '媒合結果',
  review: '評價提醒',
  chat: '對話訊息',
  verification: '認證審核',
  system: '系統公告',
  call: '語音通話',
  moderation: '發布審核',
};

function KindIcon({ kind }: { kind: NotificationKind }) {
  const size = 17;
  if (kind === 'bid') return <Inbox size={size} color={COLORS.brandStrong} strokeWidth={2.2} />;
  if (kind === 'match')
    return <Handshake size={size} color={COLORS.brandStrong} strokeWidth={2.2} />;
  if (kind === 'review') return <Star size={size} color={COLORS.coral} strokeWidth={2.2} />;
  if (kind === 'chat')
    return <MessageCircle size={size} color={COLORS.brandStrong} strokeWidth={2.2} />;
  if (kind === 'call') return <PhoneCall size={size} color={COLORS.brandStrong} strokeWidth={2.2} />;
  if (kind === 'moderation') return <ScanEye size={size} color={COLORS.coral} strokeWidth={2.2} />;
  if (kind === 'verification') {
    return <ShieldCheck size={size} color={COLORS.brandStrong} strokeWidth={2.2} />;
  }
  return <Sparkles size={size} color={COLORS.muted} strokeWidth={2.2} />;
}

export default function NotificationsScreen() {
  const items = useNotificationStore((state) => state.items);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const clearAll = useNotificationStore((state) => state.clearAll);

  const [clearVisible, setClearVisible] = useState(false);

  const unread = countUnread(items);

  const handlePress = (item: AppNotification) => {
    markRead(item.id);
    if (item.conversationId) {
      router.push({ pathname: '/chat/[id]', params: { id: item.conversationId } });
      return;
    }
    if (item.gigId) {
      router.push({ pathname: '/gig/[id]', params: { id: item.gigId } });
      return;
    }
    if (item.talentId) {
      router.push({ pathname: '/talent/[id]', params: { id: item.talentId } });
    }
  };

  const handleClear = () => setClearVisible(true);

  return (
    <View className="bg-background flex-1">
      <View className="border-hairline pt-safe-offset-3 flex-row items-center gap-3 border-b bg-white px-5 pb-4">
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="返回"
          className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
        >
          <ArrowLeft size={18} color={COLORS.ink} strokeWidth={2.2} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-ink text-[17px] font-semibold">通知中心</Text>
          <Text className="text-muted mt-0.5 text-[12px]">
            {unread > 0 ? `${unread} 則未讀動態` : '全部已讀'}
          </Text>
        </View>
        {unread > 0 ? (
          <Pressable onPress={markAllRead} accessibilityRole="button">
            <Text className="text-brand-strong text-[13px] font-semibold">全部已讀</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => router.push('/notification-settings')}
          accessibilityRole="button"
          accessibilityLabel="推播通知設定"
          className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
        >
          <Settings size={17} color={COLORS.ink} strokeWidth={2.1} />
        </Pressable>
      </View>

      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePress(item)}
            accessibilityRole="button"
            className={cn(
              'mb-3 flex-row gap-3 rounded-xl border p-4',
              item.isRead ? 'border-hairline bg-white' : 'border-brand/25 bg-brand-soft',
            )}
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-white">
              <KindIcon kind={item.kind} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-muted text-[11px] font-medium">{KIND_LABEL[item.kind]}</Text>
                <Text className="text-muted text-[11px]">{formatRelativeTime(item.createdAt)}</Text>
              </View>
              <Text className="text-ink mt-1 text-[15px] font-semibold">{item.title}</Text>
              <Text className="text-ink-soft mt-1 text-[13px] leading-5">{item.body}</Text>
            </View>
            {!item.isRead ? <View className="bg-coral mt-1 h-2 w-2 rounded-full" /> : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="目前沒有通知"
            caption="提案、媒合結果與評價提醒都會出現在這裡。"
            icon={<BellOff size={22} color={COLORS.muted} strokeWidth={2.1} />}
          />
        }
        ListFooterComponent={
          items.length > 0 ? (
            <Pressable
              onPress={handleClear}
              accessibilityRole="button"
              className="items-center py-4"
            >
              <Text className="text-muted text-[13px] font-medium">清空所有通知</Text>
            </Pressable>
          ) : null
        }
      />

      <ConfirmSheet
        visible={clearVisible}
        title="清空所有通知？"
        message="清空後將無法復原歷史動態。"
        actions={[{ id: 'confirm', label: '確認清空', tone: 'danger' }]}
        onSelect={() => {
          clearAll();
          setClearVisible(false);
        }}
        onCancel={() => setClearVisible(false)}
      />
    </View>
  );
}
