import { router } from 'expo-router';
import { Button, Input, Label, Switch, TextField } from 'heroui-native';
import { KeyRound, Lock, ShieldCheck, TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { useAccessIdentity } from '@/hooks/useAccessIdentity';
import { ADMIN_ACCOUNTS } from '@/lib/adminAccounts';
import { COLORS } from '@/lib/colors';
import { ADMIN_LOCK_THRESHOLD, useAdminAuthStore } from '@/lib/stores/adminAuth';
import { ADMIN_ROLE_LABEL } from '@/lib/types';

export default function AdminLoginScreen() {
  const signIn = useAdminAuthStore((state) => state.signIn);
  const lockedUntil = useAdminAuthStore((state) => state.lockedUntil);
  const accessIdentity = useAccessIdentity();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleSignIn = () => {
    if (email.trim().length === 0 || password.length === 0) {
      setError('請輸入管理員帳號與密碼。');
      return;
    }

    const result = signIn(email, password);
    if (result === 'ok') {
      setError(null);
      setPassword('');
      router.replace('/admin');
      return;
    }

    if (result === 'locked') {
      setError('連續登入失敗次數過多，請稍候再試。');
      return;
    }

    const attempts = useAdminAuthStore.getState().failedAttempts;
    setError(`帳號或密碼不正確，還可嘗試 ${ADMIN_LOCK_THRESHOLD - attempts} 次。`);
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
            此區僅供即時發營運團隊在網頁版使用，所有操作都會寫入稽核紀錄。
          </Text>
        </View>

        <View className="border-hairline gap-4 rounded-xl border bg-white p-4">
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={16} color={COLORS.brandStrong} strokeWidth={2.2} />
            <Text className="text-ink text-[15px] font-semibold">管理員登入</Text>
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

          <TextField>
            <Label>管理員帳號</Label>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="name@instantgig.tw"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </TextField>

          <TextField>
            <Label>密碼</Label>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="輸入管理員密碼"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showPassword}
            />
          </TextField>

          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-ink text-[13px] font-semibold">顯示密碼</Text>
              <Text className="text-muted mt-0.5 text-[12px]">確認輸入內容是否正確</Text>
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

          <Button size="lg" isDisabled={isLocked} onPress={handleSignIn}>
            <Button.Label>{isLocked ? `鎖定中（${lockSeconds} 秒）` : '登入管理後台'}</Button.Label>
          </Button>
        </View>

        {!__DEV__ ? null : (
          <View className="border-hairline bg-canvas gap-3 rounded-xl border p-4">
            <View className="flex-row items-center gap-2">
              <KeyRound size={15} color={COLORS.ink} strokeWidth={2.2} />
              <Text className="text-ink text-[14px] font-semibold">開發模式帳號快速填入</Text>
            </View>
            {ADMIN_ACCOUNTS.map((account) => (
              <Pressable
                key={account.id}
                onPress={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                  setError(null);
                }}
                accessibilityRole="button"
                accessibilityLabel={`填入 ${account.name} 帳號`}
                className="border-hairline flex-row items-center gap-3 rounded-xl border bg-white px-3 py-2.5"
              >
                <View className="flex-1">
                  <Text className="text-ink text-[13px] font-semibold">
                    {account.name}・{ADMIN_ROLE_LABEL[account.role]}
                  </Text>
                  <Text className="text-muted mt-0.5 text-[12px]">
                    {account.email}／{account.password}
                  </Text>
                </View>
                <Text className="text-brand-strong text-[12px] font-semibold">一鍵填入</Text>
              </Pressable>
            ))}
            <Text className="text-muted text-[11px] leading-4">
              此區塊只在開發模式顯示，正式建置不會出現。帳密清單在 lib/adminAccounts.ts。
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
