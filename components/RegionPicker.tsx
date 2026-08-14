import { Check, ChevronDown, X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { REGION_OPTIONS } from '@/lib/regions';
import { cn } from '@/lib/utils';

interface RegionPickerProps {
  value: string;
  onChange: (region: string) => void;
  label?: string;
  options?: string[];
  className?: string;
}

/** 全台地區下拉選單（GPS 定位的替代方案）。 */
export function RegionPicker({
  value,
  onChange,
  label,
  options = REGION_OPTIONS,
  className,
}: RegionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className={className}>
      {label ? <Text className="text-ink-soft mb-2 text-[13px] font-medium">{label}</Text> : null}

      <Pressable
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        className="border-hairline bg-canvas flex-row items-center justify-between rounded-xl border px-4 py-3.5"
      >
        <Text className="text-ink text-[15px]">{value}</Text>
        <ChevronDown size={18} color={COLORS.muted} strokeWidth={2} />
      </Pressable>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/25">
          <Pressable
            className="flex-1"
            onPress={() => setIsOpen(false)}
            accessibilityRole="button"
          />
          <View className="pb-safe-or-4 max-h-[70%] rounded-t-3xl bg-white">
            <View className="border-hairline flex-row items-center justify-between border-b px-5 py-4">
              <Text className="text-ink text-[16px] font-semibold">選擇服務地區</Text>
              <Pressable
                onPress={() => setIsOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="關閉"
                className="bg-canvas h-8 w-8 items-center justify-center rounded-full"
              >
                <X size={16} color={COLORS.ink} strokeWidth={2.2} />
              </Pressable>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = item === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item);
                      setIsOpen(false);
                    }}
                    accessibilityRole="button"
                    className={cn(
                      'flex-row items-center justify-between px-5 py-3.5',
                      isSelected ? 'bg-brand-soft' : 'bg-white',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-[15px]',
                        isSelected ? 'text-brand-strong font-semibold' : 'text-ink',
                      )}
                    >
                      {item}
                    </Text>
                    {isSelected ? <Check size={18} color={COLORS.brand} strokeWidth={2.4} /> : null}
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => <View className="bg-hairline h-px" />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
