import { router } from 'expo-router';
import { Button } from 'heroui-native';
import { BadgeCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { BrandWordmark } from '@/components/BrandLogo';
import { PrivacyConsentCard } from '@/components/PrivacyConsentCard';
import { RoleChoiceCards } from '@/components/RoleChoiceCards';
import { COLORS } from '@/lib/colors';
import { useSessionStore } from '@/lib/stores/session';
import type { UserRole } from '@/lib/types';

/**
 * 身分切換頁（從「帳戶」分頁進入）。
 * 首次進入 App 的身分選擇已移到登入頁第一步（app/auth/sign-in.tsx），兩處共用同一組卡片。
 */
export default function RoleSelectScreen() {
  const storedRole = useSessionStore((state) => state.role);
  const chooseRole = useSessionStore((state) => state.chooseRole);
  const privacyAccepted = useSessionStore((state) => state.privacyAccepted);
  const setPrivacyAccepted = useSessionStore((state) => state.setPrivacyAccepted);
  const [selected, setSelected] = useState<UserRole | null>(storedRole);

  const canContinue = selected !== null && privacyAccepted;

  const handleContinue = () => {
    if (!selected) return;
    chooseRole(selected);
    if (selected === 'talent') router.replace('/onboarding/skills');
    else router.replace('/(tabs)');
  };

  return (
    <View className="bg-background flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-safe-offset-6 pb-8 gap-6"
        showsVerticalScrollIndicator={false}
      >
        <BrandWordmark size={56} />

        <View>
          <Text className="text-ink text-[28px] leading-9 font-bold tracking-tight">
            選擇你的使用身分
          </Text>
          <Text className="text-muted mt-2 text-[15px] leading-6">
            身分可隨時在帳戶頁切換，資料與對話紀錄會保留。
          </Text>
        </View>

        <RoleChoiceCards selected={selected} onSelect={setSelected} />

        <PrivacyConsentCard accepted={privacyAccepted} onAcceptedChange={setPrivacyAccepted} />

        <View className="flex-row items-center gap-2">
          <BadgeCheck size={16} color={COLORS.brand} strokeWidth={2.1} />
          <Text className="text-muted text-[12px]">人才須通過證照審核才會顯示認證徽章</Text>
        </View>
      </ScrollView>

      <View className="border-hairline pb-safe-or-5 border-t bg-white px-5 pt-4">
        <Button size="lg" isDisabled={!canContinue} onPress={handleContinue}>
          <Button.Label>
            {selected === 'talent'
              ? '下一步：技能認證'
              : selected === 'client'
                ? '開始尋找專家'
                : '請先選擇身分'}
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}
