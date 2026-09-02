import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Txt } from '@/components/ui/Txt';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center gap-3 px-10 py-16', className)}>
      {icon ? (
        <View className="bg-glass border-border/60 h-16 w-16 items-center justify-center rounded-full border">
          {icon}
        </View>
      ) : null}
      <Txt weight="semibold" className="text-foreground text-center text-base">
        {title}
      </Txt>
      {description ? (
        <Txt className="text-muted text-center text-[13px] leading-5">{description}</Txt>
      ) : null}
      {action ? <View className="mt-2">{action}</View> : null}
    </View>
  );
}
