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
 * 身分選擇頁。兩種進入方式：
 * 1. 冷啟動且還沒選過身分（未註冊、未登入或剛建立帳號）——(tabs) 版面會把人導到這裡，
 *    選過之後就直接進任務牆，不會每次啟動都再問一次。
 * 2. 從「帳戶」分頁切換身分。
 * 卡片與隱私權同意區塊與登入頁（app/auth/sign-in.tsx）共用同一組元件。
 */
export default function RoleSelectScreen() {
  const storedRole = useSessionStore((state) => state.role);
  const chooseRole = useSessionStore((state) => state.chooseRole);
  const authStatus = useSessionStore((state) => state.authStatus);
  const privacyAccepted = useSessionStore((state) => state.privacyAccepted);
  const setPrivacyAccepted = useSessionStore((state) => state.setPrivacyAccepted);
  const [selected, setSelected] = useState<UserRole | null>(storedRole);

  const canContinue = selected !== null && privacyAccepted;

  /** 把已選好的身分寫進 session store；沒選滿條件就不寫。 */
  const commitRole = (): boolean => {
    if (selected === null || !privacyAccepted) return false;
    chooseRole(selected);
    return true;
  };

  const handleContinue = () => {
    if (!commitRole()) return;
    if (selected === 'talent') router.replace('/onboarding/skills');
    else router.replace('/(tabs)');
  };

  // 已有帳號的人不必先選身分：能先寫入就寫入（登入頁會直接跳到 Email 步驟），
  // 還沒選好也放行，登入頁的第一步就是同一組身分卡片。
  const handleSignIn = () => {
    commitRole();
    router.push('/auth/sign-in');
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
            {selected === null
              ? '請先選擇身分'
              : !privacyAccepted
                ? '請先同意隱私權政策'
                : selected === 'talent'
                  ? '下一步：技能認證'
                  : '開始尋找專家'}
          </Button.Label>
        </Button>

        {authStatus === 'signedIn' ? null : (
          <Button size="lg" variant="tertiary" className="mt-2" onPress={handleSignIn}>
            <Button.Label>已有帳號？直接登入</Button.Label>
          </Button>
        )}
      </View>
    </View>
  );
}
