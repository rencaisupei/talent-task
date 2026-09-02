import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { MailCheck } from 'lucide-react-native';

import { GlowButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Txt } from '@/components/ui/Txt';
import { useKeyboardSafePad } from '@/hooks/useKeyboardInset';
import { EMAIL_CODE_LENGTH, useAuthStore } from '@/lib/stores/auth';
import { NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { maskEmail } from '@/lib/validation';

const SLOTS = Array.from({ length: EMAIL_CODE_LENGTH }, (_, index) => index);

export default function VerifyScreen() {
  const email = useAuthStore((state) => state.email);
  const verifyEmailCode = useAuthStore((state) => state.verifyEmailCode);
  const inputRef = useRef<TextInput>(null);
  const padBottom = useKeyboardSafePad(6);
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(45);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const submit = () => {
    Keyboard.dismiss();
    if (!verifyEmailCode(code)) {
      setError(`驗證碼要 ${EMAIL_CODE_LENGTH} 位數字`);
      return;
    }
    setError(null);
    router.push('/kyc');
  };

  const complete = code.length === EMAIL_CODE_LENGTH;

  return (
    <Screen>
      <ScreenHeader back fallback="/login" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName={cn('grow justify-between gap-8 px-6 pt-2', padBottom)}
        >
          <View className="gap-7">
            <View className="gap-3">
              <View className="bg-accent-soft border-accent/40 h-12 w-12 items-center justify-center rounded-2xl border">
                <MailCheck color={NEON.violet} size={22} />
              </View>
              <Txt weight="bold" className="text-foreground text-2xl">
                驗證你的電子郵件
              </Txt>
              <Txt className="text-muted text-[13px] leading-5">
                我們寄了一組 {EMAIL_CODE_LENGTH} 位數驗證碼到{' '}
                {email ? maskEmail(email) : '你的信箱'}
                。示範模式下輸入任意 {EMAIL_CODE_LENGTH} 位數字即可通過。
              </Txt>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="輸入驗證碼"
              onPress={() => inputRef.current?.focus()}
              className="flex-row justify-center gap-2"
            >
              {SLOTS.map((slot) => (
                <View
                  key={slot}
                  className={cn(
                    'h-14 flex-1 items-center justify-center rounded-2xl border',
                    code.length === slot
                      ? 'border-accent bg-accent/10'
                      : 'border-border/60 bg-surface',
                  )}
                >
                  <Txt weight="bold" className="text-foreground text-xl">
                    {code[slot] ?? ''}
                  </Txt>
                </View>
              ))}
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={(value) => {
                  const digits = value.replace(/\D/g, '').slice(0, EMAIL_CODE_LENGTH);
                  setCode(digits);
                  setError(null);
                  // 數字鍵盤沒有送出鍵，輸滿就收起鍵盤，讓下方按鈕露出來。
                  if (digits.length === EMAIL_CODE_LENGTH) Keyboard.dismiss();
                }}
                keyboardType="number-pad"
                maxLength={EMAIL_CODE_LENGTH}
                autoFocus
                className="absolute h-14 w-full opacity-0"
              />
            </Pressable>

            {error ? (
              <Txt className="text-danger text-center text-[12px]">{error}</Txt>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="重新寄送驗證碼"
                disabled={seconds > 0}
                onPress={() => setSeconds(45)}
                className="items-center active:opacity-70"
              >
                <Txt className={cn('text-[12px]', seconds > 0 ? 'text-muted' : 'text-accent')}>
                  {seconds > 0 ? `${seconds} 秒後可重新寄送` : '重新寄送驗證碼'}
                </Txt>
              </Pressable>
            )}
          </View>

          <View className="gap-4">
            <GlowButton label="驗證並繼續" size="lg" disabled={!complete} onPress={submit} />
            <View className="border-border/50 bg-glass rounded-2xl border p-4">
              <Txt className="text-muted text-[11px] leading-5">
                沒收到信？請檢查垃圾信件匣，或確認信箱是否輸入正確。驗證碼 10 分鐘內有效。
              </Txt>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
