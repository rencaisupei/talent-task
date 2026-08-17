import { router, Stack } from 'expo-router';
import { Button } from 'heroui-native';
import { Compass } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { COLORS } from '@/lib/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '找不到頁面', headerShown: false }} />
      <View className="bg-background flex-1 items-center justify-center gap-5 px-8">
        <View className="bg-brand-soft h-16 w-16 items-center justify-center rounded-2xl">
          <Compass size={28} color={COLORS.brandStrong} strokeWidth={2.1} />
        </View>

        <View className="items-center gap-2">
          <Text className="text-ink text-[20px] font-bold tracking-tight">找不到這個頁面</Text>
          <Text className="text-ink-soft text-center text-[14px] leading-6">
            這個連結可能已失效，或內容已被移除。回到首頁繼續發布任務或瀏覽任務牆。
          </Text>
        </View>

        <Button size="lg" onPress={() => router.replace('/(tabs)')} className="w-full">
          <Button.Label>回到首頁</Button.Label>
        </Button>
      </View>
    </>
  );
}
