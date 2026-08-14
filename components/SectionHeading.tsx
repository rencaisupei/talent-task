import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  caption?: string;
  right?: React.ReactNode;
  className?: string;
}

export function SectionHeading({ title, caption, right, className }: SectionHeadingProps) {
  return (
    <View className={cn('flex-row items-end justify-between gap-3', className)}>
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
