import { Star } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { cn } from '@/lib/utils';

const STAR_INDEXES = [1, 2, 3, 4, 5];

interface RatingStarsProps {
  value: number;
  size?: number;
  showValue?: boolean;
  count?: number;
  className?: string;
}

/** 星等顯示（輔色珊瑚橙）。 */
export function RatingStars({
  value,
  size = 14,
  showValue = true,
  count,
  className,
}: RatingStarsProps) {
  return (
    <View className={cn('flex-row items-center gap-1.5', className)}>
      <View className="flex-row items-center gap-0.5">
        {STAR_INDEXES.map((index) => {
          const isFilled = value >= index - 0.25;
          return (
            <Star
              key={index}
              size={size}
              color={isFilled ? COLORS.coral : COLORS.hairline}
              fill={isFilled ? COLORS.coral : 'transparent'}
              strokeWidth={2}
            />
          );
        })}
      </View>
      {showValue ? (
        <Text className="text-ink text-[12px] font-semibold">
          {value > 0 ? value.toFixed(1) : '—'}
        </Text>
      ) : null}
      {count !== undefined ? <Text className="text-muted text-[12px]">{count} 則評價</Text> : null}
    </View>
  );
}

const STAR_LABELS = ['非常不滿意', '不滿意', '尚可', '滿意', '非常滿意'];

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
}

/** 評價星等輸入。 */
export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        {STAR_INDEXES.map((index) => {
          const isFilled = value >= index;
          return (
            <Pressable
              key={index}
              onPress={() => onChange(index)}
              accessibilityRole="button"
              accessibilityLabel={`給 ${index} 星`}
              accessibilityState={{ selected: isFilled }}
              hitSlop={6}
              className={cn(
                'h-12 w-12 items-center justify-center rounded-xl border',
                isFilled ? 'border-coral/30 bg-coral-soft' : 'border-hairline bg-canvas',
              )}
            >
              <Star
                size={22}
                color={isFilled ? COLORS.coral : COLORS.muted}
                fill={isFilled ? COLORS.coral : 'transparent'}
                strokeWidth={2.1}
              />
            </Pressable>
          );
        })}
      </View>
      <Text className="text-ink-soft text-[13px] font-medium">
        {value > 0 ? STAR_LABELS[value - 1] : '請點選星等'}
      </Text>
    </View>
  );
}
