import { Crown, MessageSquarePlus } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

import { COLORS } from '@/lib/colors';
import { FREE_MONTHLY_CHAT_QUOTA, useIsPremium, useSessionStore } from '@/lib/stores/session';
import { cn } from '@/lib/utils';

interface ChatQuotaPillProps {
  onPress?: () => void;
  className?: string;
}

/** 對話配額藥丸標籤：發案與接案共用同一份配額。 */
export function ChatQuotaPill({ onPress, className }: ChatQuotaPillProps) {
  const isPremium = useIsPremium();
  const remaining = useSessionStore((state) => state.chatQuotaRemaining);

  if (isPremium) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        className={cn(
          'border-brand/20 bg-brand-soft flex-row items-center gap-2 self-start rounded-xl border px-3 py-2',
          className,
        )}
      >
        <Crown size={15} color={COLORS.brandStrong} strokeWidth={2.1} />
        <Text className="text-brand-strong text-[13px] font-semibold">
          進階版・本月無限開啟新對話
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={cn(
        'border-coral/25 bg-coral-soft flex-row items-center gap-2 self-start rounded-xl border px-3 py-2',
        className,
      )}
    >
      <MessageSquarePlus size={15} color={COLORS.coral} strokeWidth={2.1} />
      <Text className="text-coral text-[13px] font-semibold">
        本月剩餘可開啟新對話：{remaining} / {FREE_MONTHLY_CHAT_QUOTA}
      </Text>
    </Pressable>
  );
}
