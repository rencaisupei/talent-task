import { Check } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { cn } from '@/lib/utils';

/**
 * 必填欄位的共用狀態語言，與 PrivacyConsentCard 的同意框一致：
 * 未完成＝橘色（白底 + coral-strong 邊框與文字），完成＝品牌藍實心 + 白色文字 + 勾號。
 *
 * 橘色淡底上的文字一律用 coral-strong，不要用 coral（#F28B3C 對比只有約 2:1）。
 * 標籤刻意只放短詞（必填／已完成／已選擇的值），說明句放 caption 或 hint，
 * 不要把整句塞進標籤，否則欄位標題會被推成兩行。
 */
export function FieldStatusBadge({
  complete,
  pendingLabel = '必填',
  completeLabel = '已完成',
  className,
}: {
  complete: boolean;
  pendingLabel?: string;
  completeLabel?: string;
  className?: string;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-1 rounded-full px-2 py-0.5',
        complete ? 'bg-brand' : 'border-coral-strong border bg-white',
        className,
      )}
    >
      {complete ? <Check size={11} color={COLORS.white} strokeWidth={3.2} /> : null}
      <Text
        className={cn('text-[11px] font-bold', complete ? 'text-white' : 'text-coral-strong')}
        numberOfLines={1}
      >
        {complete ? completeLabel : pendingLabel}
      </Text>
    </View>
  );
}

/**
 * 獨立必填欄位的外框。未完成時整塊轉成橘色提示態（和同意框一樣看得出待處理），
 * 完成後回到白底 + 淡藍外框，避免整個表單都是橘色或都是藍底。
 * 兩種狀態都用 border-2，切換時不會有 1px 的版面跳動。
 */
export function RequiredFieldCard({
  complete,
  title,
  caption,
  hint,
  pendingLabel,
  completeLabel,
  className,
  children,
}: {
  complete: boolean;
  title: string;
  caption?: string;
  /** 未完成時顯示在欄位下方的提示，說明還缺什麼。 */
  hint?: string;
  pendingLabel?: string;
  completeLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      className={cn(
        'gap-3 rounded-xl border-2 p-4',
        complete ? 'border-brand/25 bg-white' : 'border-coral bg-coral-soft',
        className,
      )}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-ink text-[15px] font-semibold">{title}</Text>
          {caption ? (
            <Text className="text-muted mt-1 text-[12px] leading-4">{caption}</Text>
          ) : null}
        </View>
        <FieldStatusBadge
          complete={complete}
          pendingLabel={pendingLabel}
          completeLabel={completeLabel}
          className="mt-0.5"
        />
      </View>

      {children}

      {!complete && hint ? (
        <Text className="text-coral-strong text-[12px] leading-4 font-semibold">{hint}</Text>
      ) : null}
    </View>
  );
}
