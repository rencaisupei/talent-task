import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { countUnread, useNotificationStore } from '@/lib/stores/notifications';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  className?: string;
}

/** 通知中心入口，含未讀紅點計數。 */
export function NotificationBell({ className }: NotificationBellProps) {
  const items = useNotificationStore((state) => state.items);
  const unread = countUnread(items);

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `通知中心，${unread} 則未讀` : '通知中心'}
      className={cn(
        'border-hairline bg-canvas h-10 w-10 items-center justify-center rounded-xl border',
        className,
      )}
    >
      <Bell size={18} color={COLORS.ink} strokeWidth={2.1} />
      {unread > 0 ? (
        <View className="bg-coral absolute -top-1 -right-1 h-5 min-w-5 items-center justify-center rounded-full px-1">
          <Text className="text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
