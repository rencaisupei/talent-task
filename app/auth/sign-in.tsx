import { Button, Input, InputOTP, Label, TextField } from 'heroui-native';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { BrandWordmark } from '@/components/BrandLogo';
import { isValidEmail, normalizeEmail, sendLoginCode, verifyLoginCode } from '@/lib/auth';
import { IS_BILT_CONFIGURED } from '@/lib/bilt';
import { COLORS } from '@/lib/colors';

const CODE_LENGTH = 6;

type Step = 'email' | 'code';

export default function SignInScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const emailReady = isValidEmail(email);

  const handleSendCode = async () => {
    if (!emailReady || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await sendLoginCode(email);
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setCode('');
    setStep('code');
    setNotice(`驗證碼已寄到 ${normalizeEmail(email)}`);
  };

  const handleVerify = async (value: string) => {
    if (value.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError(null);

    const result = await verifyLoginCode(email, value);

    if (!result.ok) {
      setBusy(false);
      setCode('');
      setError(result.message);
      return;
    }
    // 成功後由 AuthGate 監聽到登入狀態並導向主畫面，這裡維持忙碌狀態避免重複送出。
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCode('');
    setError(null);
    setNotice(null);
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-safe-offset-10 pb-10 gap-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BrandWordmark size={56} />

        <View>
          <Text
            accessibilityRole="header"
            className="text-ink text-[28px] leading-9 font-bold tracking-tight"
          >
            {step === 'email' ? '登入即時發' : '輸入驗證碼'}
          </Text>
          <Text className="text-muted mt-2 text-[15px] leading-6">
            {step === 'email'
              ? '用 Email 收 6 位數驗證碼登入，不需要記密碼。第一次登入會自動建立帳號。'
              : `已寄出 6 位數驗證碼到 ${normalizeEmail(email)}，請於 10 分鐘內輸入。`}
          </Text>
        </View>

        {step === 'email' ? (
          <View className="border-hairline gap-4 rounded-xl border bg-white p-4">
            <TextField>
              <Label>Email</Label>
              <Input
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError(null);
                }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!busy}
                onSubmitEditing={() => void handleSendCode()}
                returnKeyType="send"
              />
            </TextField>

            <Button
              size="lg"
              isDisabled={!emailReady || busy}
              onPress={() => void handleSendCode()}
            >
              <Button.Label>{busy ? '寄送中…' : '寄送驗證碼'}</Button.Label>
            </Button>
          </View>
        ) : (
          <View className="border-hairline gap-4 rounded-xl border bg-white p-4">
            <InputOTP
              maxLength={CODE_LENGTH}
              value={code}
              onChange={setCode}
              onComplete={(value) => void handleVerify(value)}
              isDisabled={busy}
              isInvalid={error !== null}
            >
              <InputOTP.Group>
                {({ slots }) => (
                  <>
                    {slots.map((slot) => (
                      <InputOTP.Slot key={slot.index} index={slot.index} />
                    ))}
                  </>
                )}
              </InputOTP.Group>
            </InputOTP>

            <Button
              size="lg"
              isDisabled={code.length !== CODE_LENGTH || busy}
              onPress={() => void handleVerify(code)}
            >
              <Button.Label>{busy ? '驗證中…' : '登入'}</Button.Label>
            </Button>

            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={handleBackToEmail}
                accessibilityRole="button"
                disabled={busy}
                className="flex-row items-center gap-1"
              >
                <ArrowLeft size={15} color={COLORS.muted} strokeWidth={2.2} />
                <Text className="text-muted text-[13px] font-semibold">改用其他 Email</Text>
              </Pressable>

              <Pressable
                onPress={() => void handleSendCode()}
                accessibilityRole="button"
                disabled={busy}
              >
                <Text className="text-brand-strong text-[13px] font-semibold">重新寄送驗證碼</Text>
              </Pressable>
            </View>
          </View>
        )}

        {error !== null ? (
          <View className="border-coral/30 bg-coral-soft rounded-xl border p-3">
            <Text className="text-ink text-[13px] leading-5">{error}</Text>
          </View>
        ) : notice !== null ? (
          <View className="border-hairline bg-canvas rounded-xl border p-3">
            <View className="flex-row items-center gap-2">
              <Mail size={15} color={COLORS.brandStrong} strokeWidth={2.2} />
              <Text className="text-ink-soft flex-1 text-[13px] leading-5">{notice}</Text>
            </View>
          </View>
        ) : null}

        {IS_BILT_CONFIGURED ? null : (
          <View className="border-coral/30 bg-coral-soft rounded-xl border p-3">
            <Text className="text-ink text-[13px] leading-5">
              這個版本沒有帶入後端連線設定，暫時無法登入。請重新建置並提供連線資訊。
            </Text>
          </View>
        )}

        <View className="border-hairline bg-canvas gap-2 rounded-xl border p-4">
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={17} color={COLORS.brandStrong} strokeWidth={2.1} />
            <Text className="text-ink text-[15px] font-semibold">為什麼需要登入</Text>
          </View>
          <Text className="text-ink-soft text-[13px] leading-5">
            任務、提案與對話都存在你的帳號下，換手機或重裝 App
            都會完整保留；媒合雙方也需要可辨識的身分才能建立信任度。
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
