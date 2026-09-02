import { useState } from 'react';
import { Lock, Mail, ShieldCheck } from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useThemeColor } from 'heroui-native';

import { GlowButton } from '@/components/ui/GlowButton';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Txt } from '@/components/ui/Txt';
import { useKeyboardSafePad } from '@/hooks/useKeyboardInset';
import { nextAuthRoute, useAuthStore } from '@/lib/stores/auth';
import { NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { PASSWORD_MIN_LENGTH, passwordStrength } from '@/lib/validation';

type Mode = 'register' | 'signin';

const STRENGTH_LABEL = ['', '偏弱', '可以', '不錯'] as const;
const STRENGTH_COLOR = ['', NEON.coral, NEON.amber, NEON.lime] as const;

export default function LoginScreen() {
  const [muted] = useThemeColor(['muted']);
  const register = useAuthStore((state) => state.register);
  const signIn = useAuthStore((state) => state.signIn);
  const registeredEmail = useAuthStore((state) => state.email);
  const registered = useAuthStore((state) => state.registered);
  const padBottom = useKeyboardSafePad(6);

  const [mode, setMode] = useState<Mode>(registered ? 'signin' : 'register');
  const [email, setEmail] = useState(registered ? registeredEmail : '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';
  const strength = passwordStrength(password);
  const canSubmit =
    email.trim().length > 0 && password.length > 0 && (!isRegister || confirm.length > 0);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setConfirm('');
  };

  const submit = () => {
    if (!canSubmit) return;

    if (isRegister) {
      const result = register({ email, password, confirm });
      if (!result.ok) {
        setError(result.error ?? '無法建立帳號');
        return;
      }
      setError(null);
      router.push('/verify');
      return;
    }

    const result = signIn({ email, password });
    if (!result.ok) {
      setError(result.error ?? '無法登入');
      return;
    }
    setError(null);
    const target = nextAuthRoute(useAuthStore.getState());
    if (target === '/(tabs)') {
      router.replace('/(tabs)');
      return;
    }
    router.push(target);
  };

  return (
    <Screen>
      <ScreenHeader back fallback="/welcome" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName={cn('grow justify-between px-6 pt-2', padBottom)}
        >
          <View className="gap-7">
            <View className="bg-surface border-border/60 flex-row rounded-full border p-1">
              <ModeTab
                label="註冊新帳號"
                active={isRegister}
                onPress={() => switchMode('register')}
              />
              <ModeTab label="登入" active={!isRegister} onPress={() => switchMode('signin')} />
            </View>

            <View className="gap-2">
              <Txt weight="bold" className="text-foreground text-2xl">
                {isRegister ? '用電子郵件建立帳號' : '歡迎回來'}
              </Txt>
              <Txt className="text-muted text-[13px] leading-5">
                {isRegister
                  ? '我們會寄一組六位數驗證碼到你的信箱，接著完成實名認證就能開始配對。'
                  : '輸入註冊時使用的信箱與密碼。信箱不會顯示在你的個人檔案上。'}
              </Txt>
            </View>

            <View className="gap-4">
              <Field label="電子郵件" icon={<Mail color={NEON.violet} size={17} />}>
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
                  textContentType="emailAddress"
                  placeholder="you@example.com"
                  placeholderTextColor={muted}
                  className="text-foreground flex-1 py-3.5 text-[16px]"
                />
              </Field>

              <PasswordInput
                label="密碼"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setError(null);
                }}
                icon={<Lock color={NEON.cyan} size={17} />}
                placeholder={`至少 ${PASSWORD_MIN_LENGTH} 個字元`}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                onSubmitEditing={isRegister ? undefined : submit}
              />

              {isRegister ? null : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="忘記密碼"
                  hitSlop={6}
                  onPress={() => router.push('/forgot-password')}
                  className="self-end active:opacity-70"
                >
                  <Txt weight="medium" className="text-accent text-[12px]">
                    忘記密碼？
                  </Txt>
                </Pressable>
              )}

              {isRegister ? (
                <>
                  <PasswordInput
                    label="再輸入一次密碼"
                    value={confirm}
                    onChangeText={(value) => {
                      setConfirm(value);
                      setError(null);
                    }}
                    icon={<Lock color={NEON.cyan} size={17} />}
                    placeholder="確認密碼"
                    autoComplete="new-password"
                    onSubmitEditing={submit}
                  />

                  <View className="gap-2">
                    <View className="flex-row gap-1.5">
                      {[1, 2, 3].map((level) => (
                        <View
                          key={level}
                          className="h-1 flex-1 rounded-full"
                          style={{
                            backgroundColor:
                              strength >= level
                                ? STRENGTH_COLOR[strength]
                                : 'rgba(255,255,255,0.1)',
                          }}
                        />
                      ))}
                    </View>
                    <Txt className="text-muted text-[11px] leading-4">
                      {strength > 0
                        ? `密碼強度：${STRENGTH_LABEL[strength]}。建議混合英文字母、數字與符號。`
                        : '密碼需要至少 8 個字元，並包含英文字母與數字。'}
                    </Txt>
                  </View>
                </>
              ) : null}

              {error ? <Txt className="text-danger text-[12px] leading-5">{error}</Txt> : null}
            </View>

            {isRegister ? (
              <View className="border-border/50 bg-glass flex-row items-start gap-3 rounded-2xl border p-4">
                <ShieldCheck color={NEON.lime} size={18} />
                <Txt className="text-muted flex-1 text-[11px] leading-5">
                  註冊後需要完成實名認證（KYC）才能開始使用。認證資料只用於確認年齡與身分，不會顯示在你的檔案上。
                </Txt>
              </View>
            ) : null}
          </View>

          <View className="mt-8 gap-4">
            <GlowButton
              label={isRegister ? '建立帳號' : '登入'}
              size="lg"
              disabled={!canSubmit}
              onPress={submit}
            />
            <View className="flex-row flex-wrap items-center justify-center gap-x-1">
              <Txt className="text-muted text-[11px]">
                {isRegister ? '建立帳號' : '登入'}代表你已閱讀並同意
              </Txt>
              <LegalLink label="服務條款" onPress={() => router.push('/legal/terms')} />
              <Txt className="text-muted text-[11px]">與</Txt>
              <LegalLink label="隱私權政策" onPress={() => router.push('/legal/privacy')} />
              <Txt className="text-muted text-[11px]">。</Txt>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ModeTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        'flex-1 items-center rounded-full py-2.5 active:opacity-70',
        active ? 'bg-accent' : '',
      )}
    >
      <Txt
        weight={active ? 'semibold' : 'medium'}
        className={cn('text-[13px]', active ? 'text-accent-foreground' : 'text-muted')}
      >
        {label}
      </Txt>
    </Pressable>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Txt className="text-muted px-1 text-[12px]">{label}</Txt>
      <View className="bg-surface border-border/60 flex-row items-center gap-3 rounded-2xl border px-4">
        {icon}
        {children}
      </View>
    </View>
  );
}

function LegalLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      className="active:opacity-70"
    >
      <Txt weight="medium" className="text-accent text-[11px] underline">
        {label}
      </Txt>
    </Pressable>
  );
}
