import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Txt } from '@/components/ui/Txt';
import { cn } from '@/lib/utils';

interface SectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  subtitle?: string;
}

export function Section({ title, subtitle, action, children, className }: SectionProps) {
  return (
    <View className={cn('gap-3', className)}>
      <View className="flex-row items-end justify-between px-1">
        <View className="flex-1">
          <Txt weight="semibold" className="text-foreground text-[15px]">
            {title}
          </Txt>
          {subtitle ? <Txt className="text-muted mt-0.5 text-xs">{subtitle}</Txt> : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Tag({ label, className }: { label: string; className?: string }) {
  return (
    <View className={cn('bg-glass border-border/70 rounded-full border px-3 py-1.5', className)}>
      <Txt className="text-foreground text-xs">{label}</Txt>
    </View>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={cn('bg-surface border-border/60 rounded-3xl border p-4', className)}>
      {children}
    </View>
  );
}
