import { Pressable, ScrollView, Text, View } from 'react-native';

import { cn } from '@/lib/utils';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface SegmentedTabsProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

/** 可橫向捲動的分段切換列。 */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedTabsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 pr-2"
      className={className}
    >
      {options.map((option) => {
        const isActive = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            className={cn(
              'flex-row items-center gap-1.5 rounded-xl border px-3.5 py-2',
              isActive ? 'border-brand bg-brand' : 'border-hairline bg-canvas',
            )}
          >
            <Text
              className={cn('text-[13px] font-semibold', isActive ? 'text-white' : 'text-ink-soft')}
            >
              {option.label}
            </Text>
            {option.count !== undefined ? (
              <View
                className={cn(
                  'min-w-5 items-center rounded-md px-1.5 py-0.5',
                  isActive ? 'bg-white/25' : 'bg-white',
                )}
              >
                <Text
                  className={cn('text-[11px] font-bold', isActive ? 'text-white' : 'text-muted')}
                >
                  {option.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
