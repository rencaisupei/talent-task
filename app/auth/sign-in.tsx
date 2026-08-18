import { router } from 'expo-router';
import { Button, Input, InputOTP, Label, TextField } from 'heroui-native';
import { ArrowLeft, BadgeCheck, Mail, Pencil, ShieldCheck, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { BrandWordmark } from '@/components/BrandLogo';
import { PrivacyConsentCard } from '@/components/PrivacyConsentCard';
import { RoleChoiceCards, RoleIcon, ROLE_TITLES } from '@/components/RoleChoiceCards';
import { isValidEmail, normalizeEmail, sendLoginCode, verifyLoginCode } from '@/lib/auth';
import { IS_BILT_CONFIGURED } from '@/lib/bilt';
import { COLORS } from '@/lib/colors';
import { goBackOrReplace } from '@/lib/navigation';
import { useSessionStore } from '@/lib/stores/session';
import type { UserRole } from '@/lib/types';

const CODE_LENGTH = 6;
const APP_PATH = '/(tabs)';

/** 先選使用身分，再走 Email 驗證碼登入；身分也適用於不登入的訪客。 */
type Step = 'role' | 'email' | 'code';

const HEADINGS: Record<Step, { title: string; caption: string }> = {
  role: {
    title: '選擇你的使用身分',
    caption:
      '先告訴我們你要發需求還是接案，介面會依身分調整。身分可隨時在「帳戶」分頁切換；登入是選用的，不登入也能瀏覽任務牆。',
  },
  email: {
    title: '登入即時發',
    caption:
      '登入後身分、技能標籤與地區會跨裝置同步，收藏、通知與評價也會保存在帳號裡。第一次登入會自動建立帳號。',
  },
  code: { title: '輸入驗證碼', caption: '' },
};

export default function SignInScreen() {
  const storedRole = useSessionStore((state) => state.role);
  const chooseRole = useSessionStore((state) => state.chooseRole);
  const privacyAccepted = useSessionStore((state) => state.privacyAccepted);
  const setPrivacyAccepted = useSessionStore((state) => state.setPrivacyAccepted);

  // 已經選過身分（例如訪客先逛過任務牆）就直接進 Email 步驟，仍可回頭更改。
  const [step, setStep] = useState<Step>(storedRole === null ? 'role' : 'email');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(storedRole);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const emailReady = isValidEmail(email);
  const roleReady = selectedRole !== null && privacyAccepted;

  /** 把選好的身分寫進 session store（訪客也會保留，登入後同步到帳號）。 */
  const commitRole = (): boolean => {
    if (selectedRole === null || !privacyAccepted) return false;
    chooseRole(selectedRole);
    return true;
  };

  const handleRoleContinue = () => {
    if (!commitRole()) return;
    setError(null);
    setStep('email');
  };

  const handleBrowseAsGuest = () => {
    if (!commitRole()) return;
    // 人才身分且還沒選技能標籤時，(tabs) 版面會自動接到技能設定頁。
    router.replace(APP_PATH);
  };

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

  const heading = HEADINGS[step];

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
        <View className="flex-row items-center justify-between gap-3">
          <BrandWordmark size={56} />
          <Pressable
            onPress={() => goBackOrReplace(APP_PATH)}
            accessibilityRole="button"
            accessibilityLabel="關閉登入頁"
            disabled={busy}
            hitSlop={8}
            className="border-hairline bg-canvas h-9 w-9 items-center justify-center rounded-xl border"
          >
            <X size={17} color={COLORS.ink} strokeWidth={2.2} />
          </Pressable>
        </View>

        <View>
          <Text
            accessibilityRole="header"
            className="text-ink text-[28px] leading-9 font-bold tracking-tight"
          >
            {heading.title}
          </Text>
          <Text className="text-muted mt-2 text-[15px] leading-6">
            {step === 'code'
              ? `已寄出 6 位數驗證碼到 ${normalizeEmail(email)}，請於 10 分鐘內輸入。`
              : heading.caption}
          </Text>
        </View>

        {step === 'role' ? (
          <>
            <RoleChoiceCards selected={selectedRole} onSelect={setSelectedRole} />

            <PrivacyConsentCard accepted={privacyAccepted} onAcceptedChange={setPrivacyAccepted} />

            <View className="gap-3">
              <Button size="lg" isDisabled={!roleReady} onPress={handleRoleContinue}>
                <Button.Label>
                  {selectedRole === null
                    ? '請先選擇身分'
                    : privacyAccepted
                      ? '繼續：登入或註冊'
                      : '請先同意隱私權政策'}
                </Button.Label>
              </Button>

              <Button
                size="lg"
                variant="tertiary"
                isDisabled={!roleReady}
                onPress={handleBrowseAsGuest}
              >
                <Button.Label>先不登入，直接瀏覽任務牆</Button.Label>
              </Button>
            </View>

            <View className="flex-row items-center gap-2">
              <BadgeCheck size={16} color={COLORS.brand} strokeWidth={2.1} />
              <Text className="text-muted text-[12px]">
                人才須通過證照審核才會顯示認證徽章；發布任務、投遞提案與開啟新對話需要登入
              </Text>
            </View>
          </>
        ) : (
          <>
            {selectedRole !== null ? (
              <Pressable
                onPress={() => setStep('role')}
                accessibilityRole="button"
                accessibilityLabel="更改使用身分"
                disabled={busy}
                className="border-hairline bg-canvas flex-row items-center gap-2 self-start rounded-xl border px-3 py-2"
              >
                <RoleIcon role={selectedRole} size={15} />
                <Text className="text-ink text-[13px] font-semibold">
                  身分：{ROLE_TITLES[selectedRole]}
                </Text>
                <Pencil size={13} color={COLORS.muted} strokeWidth={2.2} />
              </Pressable>
            ) : null}

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
                    <Text className="text-brand-strong text-[13px] font-semibold">
                      重新寄送驗證碼
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </>
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
              這個版本讀不到後端連線設定，暫時無法登入。請重新整理／重新開啟這個版本再試；
              若是自行部署的網站，請填好 bilt-config.js 裡的連線設定。
            </Text>
          </View>
        )}

        {step === 'role' ? null : (
          <View className="border-hairline bg-canvas gap-2 rounded-xl border p-4">
            <View className="flex-row items-center gap-2">
              <ShieldCheck size={17} color={COLORS.brandStrong} strokeWidth={2.1} />
              <Text className="text-ink text-[15px] font-semibold">為什麼需要登入</Text>
            </View>
            <Text className="text-ink-soft text-[13px] leading-5">
              登入後身分、技能標籤與服務地區會存在你的帳號下，換手機或重裝 App 都會保留；
              媒合雙方也需要可辨識的身分才能建立信任度。
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
