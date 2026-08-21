import { router } from 'expo-router';
import { Check, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { PRIVACY_POLICY_SUMMARY } from '@/lib/legalCopy';

/**
 * 隱私權說明與同意勾選；選擇使用身分時必須同意才能繼續。
 * 登入頁與 onboarding 共用，文案只維護一份。
 *
 * 勾選框刻意不用 HeroUI 的預設樣式：未勾選時預設是透明底＋淺灰細邊，
 * 在白底卡片上幾乎看不見。這裡改成未勾選＝橘色提示底＋白色實心方框（提醒待處理），
 * 已勾選＝藍色實心方框＋淡藍底。狀態文字壓縮成右側小標籤（必填／已同意），
 * 不要再擴回整行說明句，否則版面會被推長一行。
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

      <Pressable
        onPress={() => onAcceptedChange(!accepted)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        accessibilityLabel="我已閱讀並同意隱私權政策與服務條款"
        hitSlop={6}
        className={
          accepted
            ? 'border-brand bg-brand-soft mt-4 flex-row items-start gap-3 rounded-xl border-2 p-3'
            : 'border-coral bg-coral-soft mt-4 flex-row items-start gap-3 rounded-xl border-2 p-3'
        }
      >
        <View
          className={
            accepted
              ? 'bg-brand border-brand h-6 w-6 items-center justify-center rounded-md border-2'
              : 'border-coral-strong h-6 w-6 items-center justify-center rounded-md border-2 bg-white'
          }
        >
          {accepted ? <Check size={16} color={COLORS.white} strokeWidth={3} /> : null}
        </View>

        <View className="flex-1">
          <Text className="text-ink text-[14px] leading-5 font-semibold">
            我已閱讀並同意隱私權政策與服務條款
          </Text>
          <Text className="text-ink-soft mt-1 text-[12px] leading-4">
            包含伺服器端聊天審核與防詐關鍵字比對機制。
          </Text>
        </View>

        <View
          className={
            accepted
              ? 'bg-brand mt-0.5 rounded-full px-2 py-0.5'
              : 'border-coral-strong mt-0.5 rounded-full border bg-white px-2 py-0.5'
          }
        >
          <Text
            className={
              accepted
                ? 'text-[11px] font-bold text-white'
                : 'text-coral-strong text-[11px] font-bold'
            }
          >
            {accepted ? '已同意' : '必填'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
