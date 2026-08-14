import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  caption?: string;
  tone?: 'brand' | 'coral' | 'ink';
  className?: string;
}

export function KpiCard({ label, value, caption, tone = 'ink', className }: KpiCardProps) {
  const valueClass =
    tone === 'brand' ? 'text-brand-strong' : tone === 'coral' ? 'text-coral' : 'text-ink';

  return (
    <View
      className={cn('border-hairline rounded-xl border bg-white p-4', className)}
      style={{
        shadowColor: '#000000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
      }}
    >
      <Text className="text-muted text-[12px] font-medium">{label}</Text>
      <Text className={cn('mt-2 text-[24px] font-bold tracking-tight', valueClass)}>{value}</Text>
      {caption ? <Text className="text-muted mt-1 text-[12px] leading-4">{caption}</Text> : null}
    </View>
  );
}
