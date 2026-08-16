import { router } from 'expo-router';
import { Button, Input, Label, Switch, TextField } from 'heroui-native';
import { KeyRound, Lock, ServerCog, ShieldCheck, TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { useAccessIdentity } from '@/hooks/useAccessIdentity';
import { COLORS } from '@/lib/colors';
import { useAdminAuthStore } from '@/lib/stores/adminAuth';

type LoginMode = 'password' | 'setup';

export default function AdminLoginScreen() {
  const signIn = useAdminAuthStore((state) => state.signIn);
  const completeSetup = useAdminAuthStore((state) => state.completeSetup);
  const connectionError = useAdminAuthStore((state) => state.connectionError);
  const accessIdentity = useAccessIdentity();

  const [mode, setMode] = useState<LoginMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockSeconds, setLockSeconds] = useState(0);

  useEffect(() => {
    if (lockedUntil === null) {
      setLockSeconds(0);
      return undefined;
    }
    const tick = () => setLockSeconds(Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const isLocked = lockSeconds > 0;
  const isBusy = submitting || isLocked;

  const handleSignIn = async () => {
    if (email.trim().length === 0 || password.length === 0) {
      setError('請輸入管理員帳號與密碼。');
      return;
    }

    setSubmitting(true);
    setError(null);
    const outcome = await signIn(email, password);
    setSubmitting(false);

    switch (outcome.kind) {
      case 'ok':
        setPassword('');
        router.replace('/admin');
        return;
      case 'setup-required':
        setMode('setup');
        setEmail(outcome.email);
        setNotice(`${outcome.name}：這組是一次性啟用碼，請設定只有你知道的密碼。`);
        return;
      case 'locked':
        setLockedUntil(outcome.lockedUntil);
        setError('連續登入失敗次數過多，此帳號已暫時鎖定。');
        return;
      case 'rejected':
        setError(outcome.message);
        return;
      default:
        setError(outcome.message);
    }
  };

  const handleCompleteSetup = async () => {
    if (newPassword !== confirmPassword) {
      setError('兩次輸入的新密碼不一致。');
      return;
    }

    setSubmitting(true);
    setError(null);
    const outcome = await completeSetup(email, password, newPassword);
    setSubmitting(false);

    if (outcome.kind === 'ok') {
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      router.replace('/admin');
      return;
    }

    if (outcome.kind === 'locked') {
      setLockedUntil(outcome.lockedUntil);
      setError('此帳號已暫時鎖定，請稍後再試。');
      return;
    }

    if (outcome.kind === 'setup-required') {
      setError('啟用碼已使用過，請重新登入或向總管理員索取新的啟用碼。');
      return;
    }

    setError(outcome.message);
  };

  const backToPasswordMode = () => {
    setMode('password');
    setNotice(null);
    setError(null);
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="px-5 pt-safe-offset-8 pb-12 gap-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center gap-3">
          <BrandLogo size={64} />
          <Text className="text-ink text-[24px] font-bold tracking-tight">管理員專屬平台</Text>
          <Text className="text-muted text-center text-[13px] leading-5">
            帳號與密碼存放在伺服器端（密碼以 PBKDF2 雜湊），登入後取得有效 12 小時的工作階段。
          </Text>
        </View>

        {connectionError === null ? null : (
          <View className="border-coral/25 bg-coral-soft flex-row items-start gap-2 rounded-xl border px-3 py-2.5">
            <ServerCog size={15} color={COLORS.coral} strokeWidth={2.2} />
            <Text className="text-coral flex-1 text-[12px] leading-4 font-semibold">
              {connectionError}
            </Text>
          </View>
        )}

        <View className="border-hairline gap-4 rounded-xl border bg-white p-4">
          <View className="flex-row items-center gap-2">
            {mode === 'password' ? (
              <ShieldCheck size={16} color={COLORS.brandStrong} strokeWidth={2.2} />
            ) : (
              <KeyRound size={16} color={COLORS.brandStrong} strokeWidth={2.2} />
            )}
            <Text className="text-ink text-[15px] font-semibold">
              {mode === 'password' ? '管理員登入' : '設定專屬密碼'}
            </Text>
          </View>

          {accessIdentity === null ? null : (
            <View className="border-brand/25 bg-brand-soft gap-1 rounded-xl border px-3 py-2.5">
              <Text className="text-ink text-[12px] font-semibold">
                Cloudflare Access 已驗證此網域存取
              </Text>
              <Text className="text-muted text-[11px] leading-4">
                {accessIdentity.email}・請繼續輸入管理員帳號與密碼完成第二道驗證。
              </Text>
            </View>
          )}

          {notice === null ? null : (
            <View className="border-hairline bg-canvas rounded-xl border px-3 py-2.5">
              <Text className="text-ink-soft text-[12px] leading-4">{notice}</Text>
            </View>
          )}

          <TextField>
            <Label>管理員帳號</Label>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="name@instantgig.tw"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              isDisabled={mode === 'setup'}
            />
          </TextField>

          <TextField>
            <Label>{mode === 'password' ? '密碼' : '一次性啟用碼'}</Label>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'password' ? '輸入管理員密碼' : 'XXXX-XXXX-XXXX'}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={mode === 'password' && !showPassword}
            />
          </TextField>

          {mode === 'setup' ? (
            <>
              <TextField>
                <Label>新密碼</Label>
                <Input
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="至少 10 個字元，含英文與數字"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showPassword}
                />
              </TextField>
              <TextField>
                <Label>再次輸入新密碼</Label>
                <Input
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="確認新密碼"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showPassword}
                />
              </TextField>
            </>
          ) : null}

          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-ink text-[13px] font-semibold">顯示輸入內容</Text>
              <Text className="text-muted mt-0.5 text-[12px]">確認密碼是否輸入正確</Text>
            </View>
            <Switch isSelected={showPassword} onSelectedChange={setShowPassword} />
          </View>

          {error ? (
            <View className="border-coral/25 bg-coral-soft flex-row items-center gap-2 rounded-xl border px-3 py-2">
              <TriangleAlert size={15} color={COLORS.coral} strokeWidth={2.2} />
              <Text className="text-coral flex-1 text-[12px] font-semibold">{error}</Text>
            </View>
          ) : null}

          {isLocked ? (
            <View className="border-hairline bg-canvas flex-row items-center gap-2 rounded-xl border px-3 py-2">
              <Lock size={15} color={COLORS.muted} strokeWidth={2.2} />
              <Text className="text-ink-soft flex-1 text-[12px]">
                帳號暫時鎖定，{lockSeconds} 秒後可再次登入。
              </Text>
            </View>
          ) : null}

          <Button
            size="lg"
            isDisabled={isBusy}
            onPress={() => {
              void (mode === 'password' ? handleSignIn() : handleCompleteSetup());
            }}
          >
            <Button.Label>
              {isLocked
                ? `鎖定中（${lockSeconds} 秒）`
                : submitting
                  ? '驗證中…'
                  : mode === 'password'
                    ? '登入管理後台'
                    : '設定密碼並登入'}
            </Button.Label>
          </Button>

          {mode === 'setup' ? (
            <Button size="md" variant="tertiary" onPress={backToPasswordMode}>
              <Button.Label>改用既有密碼登入</Button.Label>
            </Button>
          ) : null}
        </View>

        <View className="border-hairline bg-canvas gap-2 rounded-xl border p-4">
          <Text className="text-ink text-[13px] font-semibold">忘記密碼或啟用碼過期？</Text>
          <Text className="text-muted text-[12px] leading-5">
            請總管理員在「管理員帳號管理」重設你的密碼，系統會產生新的一次性啟用碼；
            首次登入時以啟用碼取代密碼，設定完成後啟用碼即失效。
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
