import { Image, Text, View } from 'react-native';

import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

/** 品牌圖示：橘色閃電 + 青色紙飛機，置於純白容器圖塊上。 */
export function BrandLogo({ size = 56, className }: BrandLogoProps) {
  const imageSize = Math.round(size * 0.7);

  return (
    <View
      className={cn(
        'border-hairline items-center justify-center rounded-xl border bg-white',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        source={require('../assets/instantgig-mark.png')}
        style={{ width: imageSize, height: imageSize }}
        resizeMode="contain"
        accessibilityLabel="即時發標誌"
      />
    </View>
  );
}

interface BrandWordmarkProps {
  subtitle?: string;
  size?: number;
  className?: string;
}

/** 品牌標語：顯示於品牌名下方。 */
export const BRAND_TAGLINE = '全台需求及專家的媒合平台';

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
        <Text className="text-ink text-[22px] font-bold tracking-tight">即時發</Text>
        {subtitle ? <Text className="text-muted mt-0.5 text-[13px]">{subtitle}</Text> : null}
      </View>
    </View>
  );
}
