import { Platform, Text, type TextProps } from 'react-native';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

const NATIVE_FAMILY: Record<Weight, string> = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

const WEIGHT: Record<Weight, '400' | '500' | '600' | '700'> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export interface TxtProps extends TextProps {
  weight?: Weight;
}

/**
 * 系統字體放大的上限。密集排版（比較表、說明文字）在 200% 字體下會被推出畫面，
 * 因此統一設一個上限，仍保留放大空間但不會破版。個別畫面可覆寫。
 */
const MAX_FONT_SCALE = 1.25;

/** Inter-typed text that keeps the same face on web and native. */
export function Txt({ weight = 'regular', style, ...rest }: TxtProps) {
  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...rest}
      style={[
        {
          fontFamily: Platform.OS === 'web' ? 'Inter' : NATIVE_FAMILY[weight],
          fontWeight: WEIGHT[weight],
        },
        style,
      ]}
    />
  );
}
