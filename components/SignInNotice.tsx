import { Button } from 'heroui-native';
import { LogIn } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { goToSignIn } from '@/lib/authGuard';
import { COLORS } from '@/lib/colors';
import { cn } from '@/lib/utils';

interface SignInNoticeProps {
  title?: string;
  caption: string;
  actionLabel?: string;
  className?: string;
}

/**
 * 訪客提示卡：瀏覽任務不需要登入，但發布、投標、對話會綁定帳號，
 * 因此需要身分的區塊改顯示這張卡而不是空白。
 */
export function SignInNotice({
  title = '登入後才能使用這個功能',
  caption,
  actionLabel = '登入或註冊',
  className,
}: SignInNoticeProps) {
  return (
    <View className={cn('border-brand/25 bg-brand-soft gap-3 rounded-xl border p-4', className)}>
      <View className="flex-row items-center gap-2">
        <LogIn size={16} color={COLORS.brandStrong} strokeWidth={2.1} />
        <Text className="text-ink flex-1 text-[15px] font-semibold">{title}</Text>
      </View>
      <Text className="text-ink-soft text-[13px] leading-5">{caption}</Text>
      <Button size="md" onPress={goToSignIn}>
        <Button.Label>{actionLabel}</Button.Label>
      </Button>
    </View>
  );
}
