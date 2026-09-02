import { View } from 'react-native';

interface CheckerPatternProps {
  /** 單格邊長。 */
  cell?: number;
  rows?: number;
  cols?: number;
  opacity?: number;
  tint?: string;
}

/**
 * 裝飾用的棋盤格紋路。用一排排小方塊畫出，不需要 SVG pattern，
 * 在 Expo web 與原生的呈現一致。
 */
export function CheckerPattern({
  cell = 22,
  rows = 6,
  cols = 22,
  opacity = 1,
  tint = 'rgba(255,255,255,0.07)',
}: CheckerPatternProps) {
  return (
    <View
      pointerEvents="none"
      className="absolute top-0 left-0 flex-row flex-wrap"
      style={{ width: cell * cols, height: cell * rows, opacity }}
    >
      {Array.from({ length: rows * cols }, (_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const filled = (row + col) % 2 === 0;
        return (
          <View
            key={`${row}-${col}`}
            style={{
              width: cell,
              height: cell,
              backgroundColor: filled ? tint : 'transparent',
            }}
          />
        );
      })}
    </View>
  );
}
