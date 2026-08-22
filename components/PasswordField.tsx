import { Input, Label, TextField } from 'heroui-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View, type TextInputProps } from 'react-native';

import { FieldStatusBadge } from '@/components/FieldStatus';
import { COLORS } from '@/lib/colors';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  /** 新密碼欄位：提示系統產生／儲存新密碼，而不是自動填入舊的。 */
  isNew?: boolean;
  editable?: boolean;
  /** 必填狀態標籤；未完成＝橘色，完成＝品牌藍實心（與同意框一致）。 */
  status?: { complete: boolean; pendingLabel?: string; completeLabel?: string };
  /** 未完成時顯示在欄位下方的橘字提示，說明還缺什麼。 */
  hint?: string | null;
  onSubmitEditing?: () => void;
  returnKeyType?: TextInputProps['returnKeyType'];
}

/**
 * 密碼輸入欄位：可切換顯示／隱藏，並沿用 FieldStatus 的必填狀態語言。
 * 登入、註冊與重設密碼共用同一個欄位，避免各畫面重複實作眼睛按鈕。
 */
export function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  isNew = false,
  editable = true,
  status,
  hint,
  onSubmitEditing,
  returnKeyType,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const showHint = hint !== null && hint !== undefined && status?.complete !== true;

  return (
    <TextField>
      <View className="flex-row items-center justify-between gap-3">
        <Label>{label}</Label>
        {status ? (
          <FieldStatusBadge
            complete={status.complete}
            pendingLabel={status.pendingLabel}
            completeLabel={status.completeLabel}
          />
        ) : null}
      </View>

      <View className="w-full flex-row items-center">
        <Input
          className="flex-1 pr-12"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={isNew ? 'new-password' : 'current-password'}
          textContentType={isNew ? 'newPassword' : 'password'}
          editable={editable}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
        />
        <Pressable
          onPress={() => setVisible((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={visible ? '隱藏密碼' : '顯示密碼'}
          hitSlop={8}
          className="absolute right-3.5"
        >
          {visible ? (
            <EyeOff size={17} color={COLORS.muted} strokeWidth={2.1} />
          ) : (
            <Eye size={17} color={COLORS.muted} strokeWidth={2.1} />
          )}
        </Pressable>
      </View>

      {showHint ? (
        <Text className="text-coral-strong mt-1 text-[12px] leading-4 font-semibold">{hint}</Text>
      ) : null}
    </TextField>
  );
}
