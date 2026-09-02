import type { ReactNode } from 'react';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';
import { useThemeColor } from 'heroui-native';

import { Txt } from '@/components/ui/Txt';
import { cn } from '@/lib/utils';

interface PasswordInputProps {
  value: string;
  onChangeText: (value: string) => void;
  /** 欄位上方的標籤，省略時不顯示。 */
  label?: string;
  placeholder?: string;
  icon?: ReactNode;
  autoComplete?: 'new-password' | 'current-password';
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  /** surface 用在整頁表單，glass 用在彈窗裡。 */
  tone?: 'surface' | 'glass';
  className?: string;
}

const TONE = {
  surface: 'bg-surface border-border/60',
  glass: 'bg-glass border-border/60',
} as const;

/**
 * 密碼輸入框，內建「顯示／隱藏密碼」切換。
 * 每個欄位各自記住自己的顯示狀態，切換一個不會連帶顯示其他欄位。
 */
export function PasswordInput({
  value,
  onChangeText,
  label,
  placeholder,
  icon,
  autoComplete,
  autoFocus = false,
  onSubmitEditing,
  tone = 'surface',
  className,
}: PasswordInputProps) {
  const [muted] = useThemeColor(['muted']);
  const [visible, setVisible] = useState(false);

  return (
    <View className="gap-2">
      {label ? <Txt className="text-muted px-1 text-[12px]">{label}</Txt> : null}
      <View
        className={cn('flex-row items-center gap-3 rounded-2xl border px-4', TONE[tone], className)}
      >
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder={placeholder}
          placeholderTextColor={muted}
          onSubmitEditing={onSubmitEditing}
          className="text-foreground flex-1 py-3.5 text-[16px]"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? '隱藏密碼' : '顯示密碼'}
          hitSlop={8}
          onPress={() => setVisible((current) => !current)}
          className="pl-1 active:opacity-70"
        >
          {visible ? <EyeOff color={muted} size={17} /> : <Eye color={muted} size={17} />}
        </Pressable>
      </View>
    </View>
  );
}
