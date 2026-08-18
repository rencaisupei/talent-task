import { Briefcase, Search } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { CATEGORY_COUNT } from '@/lib/omniTags';
import type { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RoleCard {
  role: UserRole;
  title: string;
  caption: string;
  bullets: string[];
}

/** 兩種使用身分的說明；登入頁與 onboarding 共用同一份文案。 */
export const ROLE_CARDS: RoleCard[] = [
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

export const ROLE_TITLES: Record<UserRole, string> = {
  client: '尋找專家',
  talent: '我要接案',
};

export function RoleIcon({
  role,
  size = 20,
  color = COLORS.brandStrong,
}: {
  role: UserRole;
  size?: number;
  color?: string;
}) {
  const Icon = role === 'client' ? Search : Briefcase;
  return <Icon size={size} color={color} strokeWidth={2} />;
}

/**
 * 身分選擇卡片（尋找專家 / 我要接案）。
 * 只負責顯示與回報選擇，寫入 session store 由呼叫端決定時機。
 */
export function RoleChoiceCards({
  selected,
  onSelect,
  disabled = false,
}: {
  selected: UserRole | null;
  onSelect: (role: UserRole) => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row gap-3">
      {ROLE_CARDS.map((card) => {
        const isActive = selected === card.role;
        return (
          <Pressable
            key={card.role}
            onPress={() => onSelect(card.role)}
            accessibilityRole="button"
            accessibilityLabel={`選擇身分：${card.title}`}
            accessibilityState={{ selected: isActive, disabled }}
            disabled={disabled}
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
              <RoleIcon role={card.role} color={isActive ? COLORS.white : COLORS.brandStrong} />
            </View>

            <Text className="text-ink mt-3 text-[18px] font-bold tracking-tight">{card.title}</Text>
            <Text className="text-coral mt-1 text-[12px] font-medium">{card.caption}</Text>

            <View className="mt-3 gap-2">
              {card.bullets.map((bullet) => (
                <View key={bullet} className="flex-row gap-2">
                  <View className="bg-brand mt-1.5 h-1.5 w-1.5 rounded-full" />
                  <Text className="text-ink-soft flex-1 text-[12px] leading-[18px]">{bullet}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
