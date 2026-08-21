import { router } from 'expo-router';
import { ArrowLeft, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { TERMS_OF_SERVICE_SECTIONS, TERMS_SUMMARY, TERMS_UPDATED_AT } from '@/lib/legalCopy';
import { goBackOrReplace } from '@/lib/navigation';

export default function TermsScreen() {
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
        <Text className="text-ink text-[17px] font-semibold">服務條款</Text>
      </View>

      <ScrollView
        contentContainerClassName="px-5 py-6 gap-5 pb-16"
        showsVerticalScrollIndicator={false}
      >
        <View className="border-brand/20 bg-brand-soft rounded-xl border p-4">
          <Text className="text-ink text-[13px] leading-5">{TERMS_SUMMARY}</Text>
        </View>

        {TERMS_OF_SERVICE_SECTIONS.map((section) => (
          <View key={section.title} className="gap-2">
            <Text className="text-ink text-[15px] font-semibold">{section.title}</Text>
            <Text className="text-ink-soft text-[13px] leading-6">{section.body}</Text>
          </View>
        ))}

        <Pressable
          onPress={() => router.push('/privacy')}
          accessibilityRole="button"
          accessibilityLabel="前往隱私權政策"
          className="border-hairline flex-row items-center gap-3 rounded-xl border bg-white p-4"
        >
          <View className="bg-canvas h-10 w-10 items-center justify-center rounded-xl">
            <ShieldCheck size={18} color={COLORS.brandStrong} strokeWidth={2.2} />
          </View>
          <View className="flex-1">
            <Text className="text-ink text-[14px] font-semibold">隱私權政策</Text>
            <Text className="text-muted mt-0.5 text-[12px] leading-4">
              資料收集範圍、AI 認證與伺服器端聊天審核說明
            </Text>
          </View>
          <ChevronRight size={16} color={COLORS.muted} strokeWidth={2.2} />
        </Pressable>

        <Text className="text-muted text-[12px]">最後更新：{TERMS_UPDATED_AT}</Text>
      </ScrollView>
    </View>
  );
}
