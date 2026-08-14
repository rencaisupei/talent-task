import { Button } from 'heroui-native';
import { Modal, Pressable, Text, View } from 'react-native';

export interface ConfirmAction {
  id: string;
  label: string;
  tone?: 'primary' | 'danger' | 'neutral';
}

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  actions: ConfirmAction[];
  onSelect: (actionId: string) => void;
  onCancel: () => void;
  cancelLabel?: string;
}

/**
 * 跨平台確認底部表單。
 * 原生 Alert 在網頁版不會顯示，管理端的破壞性動作一律改用此元件確認。
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  actions,
  onSelect,
  onCancel,
  cancelLabel = '取消',
}: ConfirmSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 justify-end">
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="關閉確認視窗"
          className="absolute inset-0 bg-black/40"
        />
        <View className="pb-safe-offset-4 gap-3 rounded-t-3xl bg-white px-5 pt-5">
          <Text className="text-ink text-[17px] font-bold tracking-tight">{title}</Text>
          {message ? <Text className="text-ink-soft text-[13px] leading-5">{message}</Text> : null}

          <View className="mt-1 gap-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                size="md"
                variant={action.tone === 'neutral' ? 'tertiary' : 'primary'}
                className={action.tone === 'danger' ? 'bg-coral' : undefined}
                onPress={() => onSelect(action.id)}
              >
                <Button.Label>{action.label}</Button.Label>
              </Button>
            ))}
            <Button size="md" variant="tertiary" onPress={onCancel}>
              <Button.Label>{cancelLabel}</Button.Label>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
