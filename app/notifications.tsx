import {
  Bell,
  CheckCheck,
  Eye,
  Heart,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
} from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Txt } from '@/components/ui/Txt';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { getProfileById } from '@/lib/data/profiles';
import { relativeTime } from '@/lib/format';
import { useChatStore } from '@/lib/stores/chat';
import { useNotificationsStore } from '@/lib/stores/notifications';
import { NEON } from '@/lib/theme';
import type { AppNotification, NotificationKind } from '@/lib/types';
import { cn } from '@/lib/utils';

const ICONS: Record<NotificationKind, React.ReactNode> = {
  like: <Heart color={NEON.coral} size={16} />,
  superlike: <Star color={NEON.cyan} size={16} />,
  match: <Sparkles color={NEON.amber} size={16} />,
  message: <MessageCircle color={NEON.rose} size={16} />,
  visit: <Eye color={NEON.violet} size={16} />,
  call: <Phone color="#2FD68A" size={16} />,
  system: <Bell color="#8C8397" size={16} />,
};

export default function NotificationsScreen() {
  const items = useNotificationsStore((state) => state.items);
  const markRead = useNotificationsStore((state) => state.markRead);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);
  const ensureConversation = useChatStore((state) => state.ensureConversation);

  const open = (item: AppNotification) => {
    markRead(item.id);
    if (!item.userId) return;
    if (item.kind === 'message') {
      router.push(`/chat/${ensureConversation(item.userId)}`);
      return;
    }
    if (item.kind === 'call') {
      router.push('/call/history');
      return;
    }
    router.push(`/profile/${item.userId}`);
  };

  return (
    <Screen>
      <ScreenHeader
        back
        fallback="/(tabs)"
        title="通知"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="全部標記為已讀"
            hitSlop={8}
            onPress={markAllRead}
            className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
          >
            <CheckCheck color={NEON.cyan} size={17} />
          </Pressable>
        }
      />

      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <EmptyState
            icon={<Bell color={NEON.amber} size={22} />}
            title="目前沒有通知"
            description="有人喜歡你或傳訊息時會出現在這裡。"
          />
        }
        renderItem={({ item }) => {
          const profile = getProfileById(item.userId);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() => open(item)}
              className={cn(
                'flex-row items-center gap-3 rounded-3xl border p-3.5 active:opacity-75',
                item.read ? 'border-border/50 bg-surface' : 'border-accent/40 bg-accent/10',
              )}
            >
              {profile ? (
                <UserAvatar uri={profile.photos[0]} name={profile.name} size={44} />
              ) : (
                <View className="bg-glass border-border/60 h-11 w-11 items-center justify-center rounded-full border">
                  {ICONS[item.kind]}
                </View>
              )}

              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  {profile ? <View className="w-4">{ICONS[item.kind]}</View> : null}
                  <Txt
                    weight="semibold"
                    className="text-foreground flex-1 text-[14px]"
                    numberOfLines={1}
                  >
                    {item.title}
                  </Txt>
                </View>
                <Txt className="text-muted text-[12px] leading-4" numberOfLines={2}>
                  {item.body}
                </Txt>
                <Txt className="text-muted mt-0.5 text-[10px]">{relativeTime(item.createdAt)}</Txt>
              </View>

              {!item.read ? <View className="bg-accent h-2 w-2 rounded-full" /> : null}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
