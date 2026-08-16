import { router } from 'expo-router';
import { Button, ControlField, Description, Label } from 'heroui-native';
import { BadgeCheck, Briefcase, ChevronRight, Search, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BrandWordmark } from '@/components/BrandLogo';
import { COLORS } from '@/lib/colors';
import { PRIVACY_POLICY_SUMMARY } from '@/lib/legalCopy';
import { CATEGORY_COUNT } from '@/lib/omniTags';
import { useSessionStore } from '@/lib/stores/session';
import type { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';

const ROLE_CARDS: {
  role: UserRole;
  title: string;
  caption: string;
  bullets: string[];
}[] = [
  {
    role: 'client',
    title: '尋找專家',
    caption: '30 秒發布需求',
    bullets: [
      `全台 ${CATEGORY_COUNT} 大類別即時媒合`,
      '免費發布任務不限件數',
      '對話前先看評價與實績',
    ],
  },
  {
    role: 'talent',
    title: '我要接案',
    caption: '認證技能接單',
    bullets: ['最多選擇 5 項專業標籤', '證照審核後顯示認證徽章', '任務牆依你的標籤即時推播'],
  },
];

export default function RoleSelectScreen() {
  const chooseRole = useSessionStore((state) => state.chooseRole);
  const privacyAccepted = useSessionStore((state) => state.privacyAccepted);
  const setPrivacyAccepted = useSessionStore((state) => state.setPrivacyAccepted);
  const [selected, setSelected] = useState<UserRole | null>(null);

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

        <View className="flex-row gap-3">
          {ROLE_CARDS.map((card) => {
            const isActive = selected === card.role;
            const Icon = card.role === 'client' ? Search : Briefcase;
            return (
              <Pressable
                key={card.role}
                onPress={() => setSelected(card.role)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                className={cn(
                  'flex-1 rounded-xl border bg-white p-4',
                  isActive ? 'border-brand bg-brand-soft' : 'border-hairline',
                )}
                style={{
                  shadowColor: '#000000',
                  shadowOpacity: 0.03,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 1,
                }}
              >
                <View
                  className={cn(
                    'h-11 w-11 items-center justify-center rounded-xl',
                    isActive ? 'bg-brand' : 'bg-canvas',
                  )}
                >
                  <Icon
                    size={20}
                    color={isActive ? COLORS.white : COLORS.brandStrong}
                    strokeWidth={2}
                  />
                </View>

                <Text className="text-ink mt-3 text-[18px] font-bold tracking-tight">
                  {card.title}
                </Text>
                <Text className="text-coral mt-1 text-[12px] font-medium">{card.caption}</Text>

                <View className="mt-3 gap-2">
                  {card.bullets.map((bullet) => (
                    <View key={bullet} className="flex-row gap-2">
                      <View className="bg-brand mt-1.5 h-1.5 w-1.5 rounded-full" />
                      <Text className="text-ink-soft flex-1 text-[12px] leading-[18px]">
                        {bullet}
                      </Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="border-hairline bg-canvas rounded-xl border p-4">
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={18} color={COLORS.brandStrong} strokeWidth={2.1} />
            <Text className="text-ink text-[15px] font-semibold">隱私權與聊天安全</Text>
          </View>
          <Text className="text-ink-soft mt-2 text-[13px] leading-5">{PRIVACY_POLICY_SUMMARY}</Text>

          <Pressable
            onPress={() => router.push('/privacy')}
            accessibilityRole="button"
            className="mt-3 flex-row items-center gap-1 self-start"
          >
            <Text className="text-brand-strong text-[13px] font-semibold">閱讀完整隱私權政策</Text>
            <ChevronRight size={15} color={COLORS.brandStrong} strokeWidth={2.2} />
          </Pressable>

          <View className="border-hairline mt-4 border-t pt-4">
            <ControlField isSelected={privacyAccepted} onSelectedChange={setPrivacyAccepted}>
              <ControlField.Indicator variant="checkbox" />
              <View className="flex-1">
                <Label>我已閱讀並同意隱私權政策</Label>
                <Description>包含伺服器端聊天審核與防詐關鍵字比對機制。</Description>
              </View>
            </ControlField>
          </View>
        </View>

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
