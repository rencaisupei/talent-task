import { useEffect, useRef, useState } from 'react';
import { CircleCheck, KeyRound, Lock, Mail, MailCheck } from 'lucide-react-native';
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
import { useThemeColor } from 'heroui-native';

import { GlowButton, OutlineButton } from '@/components/ui/GlowButton';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Txt } from '@/components/ui/Txt';
import { useKeyboardSafePad } from '@/hooks/useKeyboardInset';
import { EMAIL_CODE_LENGTH, useAuthStore } from '@/lib/stores/auth';
import { NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { PASSWORD_MIN_LENGTH, maskEmail } from '@/lib/validation';

type Step = 'email' | 'code' | 'password' | 'done';

const SLOTS = Array.from({ length: EMAIL_CODE_LENGTH }, (_, index) => index);
const RESEND_SECONDS = 60;

/** 示範模式在畫面上顯示驗證碼；接上後端後改由信件寄出。 */
function makeCode() {
  return Array.from({ length: EMAIL_CODE_LENGTH }, () => Math.floor(Math.random() * 10)).join('');
}

export default function ForgotPasswordScreen() {
  const [muted] = useThemeColor(['muted']);
  const registeredEmail = useAuthStore((state) => state.email);
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const codeRef = useRef<TextInput>(null);
  const padBottom = useKeyboardSafePad(6);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(registeredEmail);
  const [sentCode, setSentCode] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const sendCode = () => {
    const result = requestPasswordReset(email);
    if (!result.ok) {
      setError(result.error ?? '無法寄送重設信');
      return;
    }
    setSentCode(makeCode());
    setCode('');
    setError(null);
    setSeconds(RESEND_SECONDS);
    setStep('code');
  };

  const checkCode = () => {
    if (code !== sentCode) {
      setError('驗證碼不正確，請確認信件內容或重新寄送');
      return;
    }
    setError(null);
    setStep('password');
  };

  const savePassword = () => {
    const result = resetPassword({ email, next: password, confirm });
    if (!result.ok) {
      setError(result.error ?? '無法重設密碼');
      return;
    }
    setError(null);
    setStep('done');
  };

  return (
    <Screen>
      <ScreenHeader back fallback="/login" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName={cn('grow justify-between gap-8 px-6 pt-2', padBottom)}
        >
          {step === 'email' ? (
            <>
              <View className="gap-7">
                <Intro
                  icon={<KeyRound color={NEON.cyan} size={22} />}
                  title="忘記密碼？"
                  body="輸入註冊時使用的電子郵件，我們會寄一組六位數驗證碼給你，驗證後就能設定新密碼。"
                />

                <View className="gap-2">
                  <Txt className="text-muted px-1 text-[12px]">電子郵件</Txt>
                  <View className="bg-surface border-border/60 flex-row items-center gap-3 rounded-2xl border px-4">
                    <Mail color={NEON.violet} size={17} />
                    <TextInput
                      value={email}
                      onChangeText={(value) => {
                        setEmail(value);
                        setError(null);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      placeholder="you@example.com"
                      placeholderTextColor={muted}
                      onSubmitEditing={sendCode}
                      className="text-foreground flex-1 py-3.5 text-[16px]"
                    />
                  </View>
                  {error ? <Txt className="text-danger text-[12px] leading-5">{error}</Txt> : null}
                </View>
              </View>

              <View className="gap-4">
                <GlowButton
                  label="寄送驗證碼"
                  size="lg"
                  disabled={email.trim().length === 0}
                  onPress={sendCode}
                />
                <OutlineButton label="想起來了，回去登入" onPress={() => router.back()} />
              </View>
            </>
          ) : null}

          {step === 'code' ? (
            <>
              <View className="gap-7">
                <Intro
                  icon={<MailCheck color={NEON.violet} size={22} />}
                  title="輸入驗證碼"
                  body={`驗證碼已寄到 ${maskEmail(email)}，10 分鐘內有效。示範模式的驗證碼是 ${sentCode}。`}
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="輸入驗證碼"
                  onPress={() => codeRef.current?.focus()}
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
                    ref={codeRef}
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
                    onPress={sendCode}
                    className="items-center active:opacity-70"
                  >
                    <Txt className={cn('text-[12px]', seconds > 0 ? 'text-muted' : 'text-accent')}>
                      {seconds > 0 ? `${seconds} 秒後可重新寄送` : '重新寄送驗證碼'}
                    </Txt>
                  </Pressable>
                )}
              </View>

              <View className="gap-4">
                <GlowButton
                  label="驗證並繼續"
                  size="lg"
                  disabled={code.length < EMAIL_CODE_LENGTH}
                  onPress={checkCode}
                />
                <OutlineButton
                  label="換一個信箱"
                  onPress={() => {
                    setStep('email');
                    setError(null);
                  }}
                />
              </View>
            </>
          ) : null}

          {step === 'password' ? (
            <>
              <View className="gap-7">
                <Intro
                  icon={<Lock color={NEON.lime} size={22} />}
                  title="設定新密碼"
                  body={`密碼需要至少 ${PASSWORD_MIN_LENGTH} 個字元，並包含英文字母與數字。可以按眼睛圖示確認自己打的內容。`}
                />

                <View className="gap-4">
                  <PasswordInput
                    label="新密碼"
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      setError(null);
                    }}
                    icon={<Lock color={NEON.cyan} size={17} />}
                    placeholder={`至少 ${PASSWORD_MIN_LENGTH} 個字元`}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <PasswordInput
                    label="再輸入一次新密碼"
                    value={confirm}
                    onChangeText={(value) => {
                      setConfirm(value);
                      setError(null);
                    }}
                    icon={<Lock color={NEON.cyan} size={17} />}
                    placeholder="確認新密碼"
                    autoComplete="new-password"
                    onSubmitEditing={savePassword}
                  />
                  {error ? <Txt className="text-danger text-[12px] leading-5">{error}</Txt> : null}
                </View>
              </View>

              <GlowButton
                label="儲存新密碼"
                size="lg"
                disabled={password.length === 0 || confirm.length === 0}
                onPress={savePassword}
              />
            </>
          ) : null}

          {step === 'done' ? (
            <>
              <View className="gap-7">
                <Intro
                  icon={<CircleCheck color={NEON.lime} size={22} />}
                  title="密碼已更新"
                  body={`${maskEmail(email)} 的密碼已重設完成。請用新密碼登入，舊密碼即刻失效。`}
                />
              </View>

              <GlowButton label="用新密碼登入" size="lg" onPress={() => router.replace('/login')} />
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Intro({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <View className="gap-3">
      <View className="bg-accent-soft border-accent/40 h-12 w-12 items-center justify-center rounded-2xl border">
        {icon}
      </View>
      <Txt weight="bold" className="text-foreground text-2xl">
        {title}
      </Txt>
      <Txt className="text-muted text-[13px] leading-5">{body}</Txt>
    </View>
  );
}
