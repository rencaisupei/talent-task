import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  caption?: string;
  right?: React.ReactNode;
  /** 'start' 讓右側元素與標題對齊（狀態標籤用），預設 'end' 對齊說明文字底線（文字連結用）。 */
  rightAlign?: 'start' | 'end';
  className?: string;
}

export function SectionHeading({
  title,
  caption,
  right,
  rightAlign = 'end',
  className,
}: SectionHeadingProps) {
  return (
    <View
      className={cn(
        'flex-row justify-between gap-3',
        rightAlign === 'start' ? 'items-start' : 'items-end',
        className,
      )}
    >
      <View className="flex-1">
        <Text className="text-ink text-[17px] font-semibold tracking-tight">{title}</Text>
        {caption ? <Text className="text-muted mt-1 text-[13px] leading-5">{caption}</Text> : null}
      </View>
      {right}
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  caption?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, caption, icon }: EmptyStateProps) {
  return (
    <View className="border-hairline bg-canvas items-center justify-center gap-3 rounded-xl border px-6 py-12">
      {icon}
      <Text className="text-ink text-[15px] font-semibold">{title}</Text>
      {caption ? (
        <Text className="text-muted text-center text-[13px] leading-5">{caption}</Text>
      ) : null}
    </View>
  );
}
