import type { Href } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { goBackOrReplace } from '@/lib/navigation';

interface AdminHeaderProps {
  title: string;
  caption?: string;
  /** 直接開啟此頁時的返回目標，預設回到管理主控台。 */
  fallback?: Href;
  right?: React.ReactNode;
}

/** 管理員專屬平台的共用頁首。 */
export function AdminHeader({ title, caption, fallback = '/admin', right }: AdminHeaderProps) {
  return (
    <View className="border-hairline pt-safe-offset-3 border-b bg-white px-5 pb-3">
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => goBackOrReplace(fallback)}
          accessibilityRole="button"
          accessibilityLabel="返回"
          className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
        >
          <ArrowLeft size={18} color={COLORS.ink} strokeWidth={2.2} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-ink text-[18px] font-bold tracking-tight">{title}</Text>
          {caption ? <Text className="text-muted mt-0.5 text-[12px]">{caption}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}
