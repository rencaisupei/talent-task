import { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Lock, ShieldCheck } from 'lucide-react-native';
import { useThemeColor } from 'heroui-native';

import { CopyrightFooter } from '@/components/ui/CopyrightFooter';
import { GlowButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Txt } from '@/components/ui/Txt';
import { useAdminStore } from '@/lib/stores/admin';
import { NEON } from '@/lib/theme';

export default function AdminLoginScreen() {
  const authed = useAdminStore((state) => state.authed);
  const login = useAdminStore((state) => state.login);
  const loginError = useAdminStore((state) => state.loginError);
  const clearLoginError = useAdminStore((state) => state.clearLoginError);
  const [muted] = useThemeColor(['muted']);
  const [passcode, setPasscode] = useState('');

  if (authed) return <Redirect href="/admin" />;

  const submit = () => {
    if (login(passcode)) {
      setPasscode('');
      router.replace('/admin');
    }
  };

  return (
    <Screen>
      <ScreenHeader back fallback="/settings" title="管理員平台" />

      <KeyboardAvoidingView
        className="flex-1 justify-between"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="gap-6 px-6 pt-8">
          <View className="items-center gap-3">
            <View className="bg-accent-soft border-accent/40 h-16 w-16 items-center justify-center rounded-3xl border">
              <ShieldCheck color={NEON.coral} size={28} />
            </View>
            <Txt weight="bold" className="text-foreground text-xl">
              管理員登入
            </Txt>
            <Txt className="text-muted text-center text-[13px] leading-5">
              這個區域僅供營運人員使用，包含使用者管理、檢舉審核、金流與系統設定。
            </Txt>
          </View>

          <View className="bg-surface border-border/60 gap-2 rounded-3xl border px-4 py-3.5">
            <Txt className="text-muted text-[11px]">管理員密碼</Txt>
            <View className="flex-row items-center gap-2">
              <Lock color={muted} size={16} />
              <TextInput
                value={passcode}
                onChangeText={(value) => {
                  setPasscode(value);
                  if (loginError) clearLoginError();
                }}
                placeholder="請輸入管理員密碼"
                placeholderTextColor={muted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={submit}
                className="text-foreground flex-1 text-[15px]"
              />
            </View>
          </View>

          {loginError ? <Txt className="text-danger -mt-3 text-[12px]">{loginError}</Txt> : null}

          <GlowButton label="進入管理平台" size="lg" onPress={submit} disabled={!passcode.trim()} />

          <Txt className="text-muted text-center text-[11px] leading-4">
            密碼由開發端設定於 lib/data/admin.ts；接上後端後改為管理員帳號登入。
          </Txt>
        </View>

        <CopyrightFooter showVersion />
      </KeyboardAvoidingView>
    </Screen>
  );
}
