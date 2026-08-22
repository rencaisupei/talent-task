import { Image, Text, View } from 'react-native';

import { BRAND_MARK_SOURCE, BRAND_WORDMARK_SOURCE } from '@/lib/brandAssets';
import { cn } from '@/lib/utils';

/** 中文品牌名。 */
export const BRAND_NAME = '人才速配';

/** 英文品牌名。 */
export const BRAND_NAME_EN = 'Talent Match';

/** 品牌標語：顯示於品牌名下方。 */
export const BRAND_TAGLINE = '專家齊聚・使命必達';

/**
 * 圖片抵達前的底圖：品牌色圓環。
 *
 * 刻意不用 onLoad 切換狀態 —— 標誌圖本身是不透明白底，載入後會完全蓋住這個圓環，
 * 所以圖已在快取時也不會出現「先閃一格佔位圖」的情形。
 */
function MarkPlaceholder({ size }: { size: number }) {
  return (
    <View
      className="border-brand/30 absolute rounded-full border-2"
      style={{ width: size, height: size }}
    />
  );
}

interface BrandLogoProps {
  size?: number;
  className?: string;
}

/** 品牌圖示：藍色齒輪與上升箭頭 + 橘金色人物握手，置於純白容器圖塊上。 */
export function BrandLogo({ size = 56, className }: BrandLogoProps) {
  const imageSize = Math.round(size * 0.82);

  return (
    <View
      className={cn(
        'border-hairline items-center justify-center rounded-xl border bg-white',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <MarkPlaceholder size={Math.round(size * 0.56)} />
      <Image
        source={BRAND_MARK_SOURCE}
        style={{ width: imageSize, height: imageSize }}
        resizeMode="contain"
        accessibilityLabel={`${BRAND_NAME}標誌`}
      />
    </View>
  );
}

interface BrandWordmarkProps {
  subtitle?: string;
  size?: number;
  className?: string;
}

/** 品牌鎖定組合：圖示圖塊 + 中文品牌名 + 標語。 */
export function BrandWordmark({
  subtitle = BRAND_TAGLINE,
  size = 52,
  className,
}: BrandWordmarkProps) {
  return (
    <View className={cn('flex-row items-center gap-3', className)}>
      <BrandLogo size={size} />
      <View className="flex-1">
        <Text className="text-ink text-[22px] font-bold tracking-tight">{BRAND_NAME}</Text>
        {subtitle ? <Text className="text-muted mt-0.5 text-[13px]">{subtitle}</Text> : null}
      </View>
    </View>
  );
}

/** 橫式標誌圖：圖示 + Talent Match 人才速配 + 標語，僅用於登入等大版面。 */
// 實際檔案是 816×445 的 UI 縮小版；比例沿用原始圖檔（1380/752，差 0.08%，contain 下看不出來）。
const LOCKUP_ASPECT_RATIO = 1380 / 752;

interface BrandLockupProps {
  width?: number;
  className?: string;
}

export function BrandLockup({ width = 268, className }: BrandLockupProps) {
  const height = Math.round(width / LOCKUP_ASPECT_RATIO);

  return (
    <View className={cn('bg-canvas items-center justify-center rounded-xl', className)}>
      <MarkPlaceholder size={Math.round(height * 0.34)} />
      <Image
        source={BRAND_WORDMARK_SOURCE}
        // Expo web ignores className sizing on Image; keep width/height in style.
        style={{ width, height }}
        resizeMode="contain"
        accessibilityLabel={`${BRAND_NAME_EN} ${BRAND_NAME}：${BRAND_TAGLINE}`}
      />
    </View>
  );
}
