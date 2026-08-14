import { useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { COLORS } from '@/lib/colors';
import { formatNumber } from '@/lib/format';
import type { WeeklyPoint } from '@/lib/types';

interface TrendLineChartProps {
  points: WeeklyPoint[];
  title: string;
  caption?: string;
  /** 數值顯示格式，預設為千分位數字。 */
  formatValue?: (value: number) => string;
  /** 無障礙說明的單位，預設「件任務」。 */
  unitLabel?: string;
}

const CHART_HEIGHT = 196;
const PADDING_X = 14;
const PADDING_TOP = 18;
const PADDING_BOTTOM = 26;

/** 互動式折線圖：可點選任一週查看數值。 */
export function TrendLineChart({
  points,
  title,
  caption,
  formatValue = formatNumber,
  unitLabel = '件任務',
}: TrendLineChartProps) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(points.length - 1);

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const safeIndex = Math.min(activeIndex, points.length - 1);
  const activePoint = points[safeIndex];
  const maxValue = Math.max(...points.map((point) => point.value), 1) * 1.12;
  const innerWidth = Math.max(width - PADDING_X * 2, 1);
  const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const coordinates = points.map((point, index) => {
    const x = PADDING_X + (innerWidth * index) / Math.max(points.length - 1, 1);
    const y = PADDING_TOP + innerHeight * (1 - point.value / maxValue);
    return { x, y, point };
  });

  const linePath = coordinates
    .map((coord, index) => `${index === 0 ? 'M' : 'L'}${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`)
    .join(' ');

  const areaPath =
    coordinates.length > 0
      ? `${linePath} L${coordinates[coordinates.length - 1].x.toFixed(2)} ${(
          PADDING_TOP + innerHeight
        ).toFixed(2)} L${coordinates[0].x.toFixed(2)} ${(PADDING_TOP + innerHeight).toFixed(2)} Z`
      : '';

  return (
    <View
      className="border-hairline rounded-xl border bg-white p-4"
      style={{
        shadowColor: '#000000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
      }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-ink text-[15px] font-semibold">{title}</Text>
          {caption ? <Text className="text-muted mt-1 text-[12px]">{caption}</Text> : null}
        </View>
        <View className="items-end">
          <Text className="text-muted text-[12px]">{activePoint?.weekLabel}</Text>
          <Text className="text-brand-strong text-[20px] font-bold">
            {formatValue(activePoint?.value ?? 0)}
          </Text>
        </View>
      </View>

      <View className="mt-3" onLayout={handleLayout} style={{ height: CHART_HEIGHT }}>
        {width > 0 ? (
          <>
            <Svg width={width} height={CHART_HEIGHT}>
              <Defs>
                <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={COLORS.brand} stopOpacity="0.16" />
                  <Stop offset="1" stopColor={COLORS.brand} stopOpacity="0" />
                </LinearGradient>
              </Defs>

              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <Line
                  key={ratio}
                  x1={PADDING_X}
                  x2={width - PADDING_X}
                  y1={PADDING_TOP + innerHeight * ratio}
                  y2={PADDING_TOP + innerHeight * ratio}
                  stroke={COLORS.hairline}
                  strokeWidth={1}
                />
              ))}

              <Path d={areaPath} fill="url(#trendFill)" />
              <Path
                d={linePath}
                stroke={COLORS.brand}
                strokeWidth={2.4}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {coordinates.map((coord, index) => (
                <Circle
                  key={coord.point.weekLabel}
                  cx={coord.x}
                  cy={coord.y}
                  r={index === safeIndex ? 5.5 : 3}
                  fill={index === safeIndex ? COLORS.coral : COLORS.white}
                  stroke={index === safeIndex ? COLORS.coral : COLORS.brand}
                  strokeWidth={2}
                />
              ))}
            </Svg>

            <View className="absolute inset-0 flex-row">
              {points.map((point, index) => (
                <Pressable
                  key={point.weekLabel}
                  onPress={() => setActiveIndex(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`${point.weekLabel} 共 ${formatValue(point.value)} ${unitLabel}`}
                  className="flex-1"
                />
              ))}
            </View>
          </>
        ) : null}
      </View>

      <View className="flex-row justify-between">
        {points.map((point, index) => (
          <Text
            key={point.weekLabel}
            className={
              index === safeIndex
                ? 'text-coral text-[10px] font-semibold'
                : 'text-muted text-[10px]'
            }
          >
            {index % 2 === 0 || index === safeIndex ? point.weekLabel.replace('第', '') : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}
