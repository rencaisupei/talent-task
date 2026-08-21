import { router } from 'expo-router';
import { ControlField, Description, Label } from 'heroui-native';
import { ChevronRight, ShieldCheck } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { PRIVACY_POLICY_SUMMARY } from '@/lib/legalCopy';

/**
 * 隱私權說明與同意勾選；選擇使用身分時必須同意才能繼續。
 * 登入頁與 onboarding 共用，文案只維護一份。
 */
export function PrivacyConsentCard({
  accepted,
  onAcceptedChange,
}: {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
}) {
  return (
    <View className="border-hairline bg-canvas rounded-xl border p-4">
      <View className="flex-row items-center gap-2">
        <ShieldCheck size={18} color={COLORS.brandStrong} strokeWidth={2.1} />
        <Text className="text-ink text-[15px] font-semibold">隱私權與聊天安全</Text>
      </View>
      <Text className="text-ink-soft mt-2 text-[13px] leading-5">{PRIVACY_POLICY_SUMMARY}</Text>

      <View className="mt-3 gap-2">
        <Pressable
          onPress={() => router.push('/privacy')}
          accessibilityRole="button"
          className="flex-row items-center gap-1 self-start"
        >
          <Text className="text-brand-strong text-[13px] font-semibold">閱讀完整隱私權政策</Text>
          <ChevronRight size={15} color={COLORS.brandStrong} strokeWidth={2.2} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/terms')}
          accessibilityRole="button"
          className="flex-row items-center gap-1 self-start"
        >
          <Text className="text-brand-strong text-[13px] font-semibold">閱讀服務條款</Text>
          <ChevronRight size={15} color={COLORS.brandStrong} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View className="border-hairline mt-4 border-t pt-4">
        <ControlField isSelected={accepted} onSelectedChange={onAcceptedChange}>
          <ControlField.Indicator variant="checkbox" />
          <View className="flex-1">
            <Label>我已閱讀並同意隱私權政策與服務條款</Label>
            <Description>包含伺服器端聊天審核與防詐關鍵字比對機制。</Description>
          </View>
        </ControlField>
      </View>
    </View>
  );
}
