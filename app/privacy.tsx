import { ScrollView, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { COLORS } from '@/lib/colors';
import { PRIVACY_POLICY_SECTIONS, PRIVACY_POLICY_SUMMARY } from '@/lib/legalCopy';
import { goBackOrReplace } from '@/lib/navigation';

export default function PrivacyScreen() {
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
        <Text className="text-ink text-[17px] font-semibold">隱私權政策</Text>
      </View>

      <ScrollView
        contentContainerClassName="px-5 py-6 gap-5 pb-16"
        showsVerticalScrollIndicator={false}
      >
        <View className="border-brand/20 bg-brand-soft rounded-xl border p-4">
          <Text className="text-ink text-[13px] leading-5">{PRIVACY_POLICY_SUMMARY}</Text>
        </View>

        {PRIVACY_POLICY_SECTIONS.map((section) => (
          <View key={section.title} className="gap-2">
            <Text className="text-ink text-[15px] font-semibold">{section.title}</Text>
            <Text className="text-ink-soft text-[13px] leading-6">{section.body}</Text>
          </View>
        ))}

        <Text className="text-muted text-[12px]">最後更新：2026 年 8 月</Text>
      </ScrollView>
    </View>
  );
}
