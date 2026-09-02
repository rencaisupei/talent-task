import { useState } from 'react';
import { Check, Flag, X } from 'lucide-react-native';
import { Modal, Pressable, View } from 'react-native';

import { GlowButton } from '@/components/ui/GlowButton';
import { Txt } from '@/components/ui/Txt';
import { cn } from '@/lib/utils';

const REASONS = [
  '照片不是本人',
  '騙錢或投資邀約',
  '騷擾或不當言論',
  '未成年',
  '廣告或商業帳號',
  '其他原因',
];

interface ReportSheetProps {
  visible: boolean;
  name: string;
  onClose: () => void;
  onSubmit: (reason: string, block: boolean) => void;
}

export function ReportSheet({ visible, name, onClose, onSubmit }: ReportSheetProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [block, setBlock] = useState(true);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="關閉"
        onPress={onClose}
        className="flex-1 justify-end bg-black/70"
      >
        <Pressable
          accessibilityRole="none"
          onPress={() => undefined}
          className="bg-surface border-border/60 pb-safe-offset-6 gap-4 rounded-t-[32px] border-t px-6 pt-6"
        >
          <View className="flex-row items-center gap-3">
            <View className="border-danger/40 bg-danger/15 h-11 w-11 items-center justify-center rounded-2xl border">
              <Flag color="#EF4B57" size={20} />
            </View>
            <View className="flex-1">
              <Txt weight="semibold" className="text-foreground text-base">
                檢舉 {name}
              </Txt>
              <Txt className="text-muted text-[12px]">
                我們會在 24 小時內審核，你的身分不會被透露
              </Txt>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="關閉"
              hitSlop={8}
              onPress={onClose}
              className="bg-glass border-border/60 h-9 w-9 items-center justify-center rounded-full border active:opacity-70"
            >
              <X color="#ffffff" size={16} />
            </Pressable>
          </View>

          <View className="gap-2">
            {REASONS.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ selected: reason === item }}
                accessibilityLabel={item}
                onPress={() => setReason(item)}
                className={cn(
                  'flex-row items-center justify-between rounded-2xl border px-4 py-3 active:opacity-80',
                  reason === item ? 'border-danger bg-danger/10' : 'border-border/60 bg-background',
                )}
              >
                <Txt className="text-foreground text-[14px]">{item}</Txt>
                {reason === item ? <Check color="#EF4B57" size={16} /> : null}
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: block }}
            accessibilityLabel="同時封鎖對方"
            onPress={() => setBlock(!block)}
            className="flex-row items-center gap-3 px-1 py-1 active:opacity-70"
          >
            <View
              className={cn(
                'h-5 w-5 items-center justify-center rounded-md border-2',
                block ? 'border-danger bg-danger' : 'border-border',
              )}
            >
              {block ? <Check color="#ffffff" size={12} /> : null}
            </View>
            <Txt className="text-foreground text-[13px]">同時封鎖，之後不再看到對方</Txt>
          </Pressable>

          <GlowButton
            label="送出檢舉"
            size="lg"
            colors={['#EF4B57', '#B3323C']}
            disabled={!reason}
            onPress={() => {
              if (!reason) return;
              onSubmit(reason, block);
              setReason(null);
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
