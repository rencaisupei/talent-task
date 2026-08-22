import { router } from 'expo-router';
import { Button, Input, InputOTP, Label, TextField } from 'heroui-native';
import { ArrowLeft, BadgeCheck, KeyRound, Mail, Pencil, ShieldCheck, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { BrandLockup, BrandWordmark } from '@/components/BrandLogo';
import { FieldStatusBadge } from '@/components/FieldStatus';
import { PasswordField } from '@/components/PasswordField';
import { PrivacyConsentCard } from '@/components/PrivacyConsentCard';
import { RoleChoiceCards, RoleIcon, ROLE_TITLES } from '@/components/RoleChoiceCards';
import { SegmentedTabs, type SegmentOption } from '@/components/SegmentedTabs';
import {
  describePasswordProblem,
  isValidEmail,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  resendSignUpCode,
  sendLoginCode,
  sendPasswordResetCode,
  setPasswordRecoveryInProgress,
  signInWithPassword,
  signUpWithPassword,
  updatePassword,
  verifyLoginCode,
  verifyPasswordResetCode,
} from '@/lib/auth';
import { IS_BILT_CONFIGURED } from '@/lib/bilt';
import { COLORS } from '@/lib/colors';
import { goBackOrReplace } from '@/lib/navigation';
import { useSessionStore } from '@/lib/stores/session';
import type { UserRole } from '@/lib/types';

const CODE_LENGTH = 6;
const APP_PATH = '/(tabs)';

/**
 * 先選使用身分，再選登入方式：帳號密碼登入、註冊新帳號，或不設密碼的 Email 驗證碼。
 * 身分也適用於不登入的訪客。
 */
type Step = 'role' | 'credentials' | 'code' | 'newPassword';

/** 三種進入方式合併成一個選擇列，避免「登入方式」與「登入／註冊」兩層切換。 */
type AuthMode = 'signIn' | 'signUp' | 'code';

/** 驗證碼的用途：驗證碼登入、完成註冊、重設密碼。 */
type CodePurpose = 'email' | 'signup' | 'recovery';

const MODE_OPTIONS: SegmentOption<AuthMode>[] = [
  { id: 'signIn', label: '密碼登入' },
  { id: 'signUp', label: '註冊新帳號' },
  { id: 'code', label: 'Email 驗證碼' },
];

const ROLE_HEADING = {
  title: '選擇你的使用身分',
  caption:
    '先告訴我們你要發需求還是接案，介面會依身分調整。身分可隨時在「帳戶」分頁切換；登入是選用的，不登入也能瀏覽任務牆。',
};

const MODE_HEADINGS: Record<AuthMode, { title: string; caption: string }> = {
  signIn: {
    title: '登入人才速配',
    caption:
      '輸入註冊時設定的 Email 與密碼。登入後身分、技能標籤與地區會跨裝置同步，收藏、通知與評價也會保存在帳號裡。',
  },
  signUp: {
    title: '註冊新帳號',
    caption: `用 Email 設定一組密碼（至少 ${MIN_PASSWORD_LENGTH} 個字），下次直接用密碼登入。註冊後會寄一組 6 位數驗證碼確認信箱。`,
  },
  code: {
    title: '用驗證碼登入',
    caption:
      '不想記密碼就用這個方式：輸入 Email，我們寄一組 6 位數驗證碼給你。第一次會自動建立帳號。',
  },
};

const CODE_CAPTIONS: Record<CodePurpose, (email: string) => string> = {
  email: (email) => `已寄出 6 位數驗證碼到 ${email}，請於 10 分鐘內輸入。`,
  signup: (email) => `輸入寄到 ${email} 的 6 位數驗證碼，完成帳號註冊。`,
  recovery: (email) => `輸入寄到 ${email} 的 6 位數驗證碼，接著就能設定新密碼。`,
};

export default function SignInScreen() {
  const storedRole = useSessionStore((state) => state.role);
  const chooseRole = useSessionStore((state) => state.chooseRole);
  const privacyAccepted = useSessionStore((state) => state.privacyAccepted);
  const setPrivacyAccepted = useSessionStore((state) => state.setPrivacyAccepted);

  // 已經選過身分（例如訪客先逛過任務牆）就直接進登入步驟，仍可回頭更改。
  const [step, setStep] = useState<Step>(storedRole === null ? 'role' : 'credentials');
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [codePurpose, setCodePurpose] = useState<CodePurpose>('email');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(storedRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 離開登入頁時解除重設密碼的導向抑制，否則中途放棄會讓之後的登入卡在這一頁。
  useEffect(() => () => setPasswordRecoveryInProgress(false), []);

  const emailReady = isValidEmail(email);
  const roleReady = selectedRole !== null && privacyAccepted;
  const passwordProblem = describePasswordProblem(password);
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const signUpReady = emailReady && passwordProblem === null && passwordsMatch;
  const newPasswordReady = passwordProblem === null && passwordsMatch;
  const maskedEmail = normalizeEmail(email);

  /** 把選好的身分寫進 session store（訪客也會保留，登入後同步到帳號）。 */
  const commitRole = (): boolean => {
    if (selectedRole === null || !privacyAccepted) return false;
    chooseRole(selectedRole);
    return true;
  };

  const handleRoleContinue = () => {
    if (!commitRole()) return;
    setError(null);
    setStep('credentials');
  };

  const handleBrowseAsGuest = () => {
    if (!commitRole()) return;
    // 人才身分且還沒選技能標籤時，(tabs) 版面會自動接到技能設定頁。
    router.replace(APP_PATH);
  };

  const handleModeChange = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setConfirmPassword('');
  };

  const goToCodeStep = (purpose: CodePurpose, message: string) => {
    setCode('');
    setCodePurpose(purpose);
    setStep('code');
    setNotice(message);
  };

  const handleSignIn = async () => {
    if (!emailReady || password.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await signInWithPassword(email, password);
    if (result.ok) {
      // 成功後由 AuthGate 監聽到登入狀態並導向主畫面，維持忙碌狀態避免重複送出。
      return;
    }

    if (result.needsEmailVerification) {
      const resend = await resendSignUpCode(email);
      setBusy(false);
      if (!resend.ok) {
        setError(resend.message);
        return;
      }
      goToCodeStep('signup', `這個帳號還沒完成驗證，已重新寄出驗證碼到 ${maskedEmail}`);
      return;
    }

    setBusy(false);
    setError(result.message);
  };

  const handleSignUp = async () => {
    if (!signUpReady || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await signUpWithPassword(email, password);
    if (!result.ok) {
      setBusy(false);
      setError(result.message);
      // 信箱已註冊過就直接切到登入，密碼已經填好了，不必重打。
      if (result.alreadyRegistered) {
        setMode('signIn');
        setConfirmPassword('');
      }
      return;
    }
    if (!result.needsEmailVerification) {
      // 後端沒開 Email 驗證：註冊完成即已登入，交給 AuthGate 導向。
      return;
    }

    setBusy(false);
    goToCodeStep('signup', `驗證碼已寄到 ${maskedEmail}，輸入後就完成註冊`);
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
    goToCodeStep('email', `驗證碼已寄到 ${maskedEmail}`);
  };

  const handleForgotPassword = async () => {
    if (!emailReady || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await sendPasswordResetCode(email);
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    goToCodeStep('recovery', `重設密碼的驗證碼已寄到 ${maskedEmail}`);
  };

  const handleResend = () => {
    if (codePurpose === 'recovery') {
      void handleForgotPassword();
      return;
    }
    if (codePurpose === 'signup') {
      void (async () => {
        setBusy(true);
        setError(null);
        const result = await resendSignUpCode(email);
        setBusy(false);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setNotice(`已重新寄出驗證碼到 ${maskedEmail}`);
      })();
      return;
    }
    void handleSendCode();
  };

  const handleVerify = async (value: string) => {
    if (value.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError(null);

    if (codePurpose === 'recovery') {
      // 驗證成功的當下就已建立 session，但要留在這一頁設定新密碼，先讓 AuthGate 別導向。
      setPasswordRecoveryInProgress(true);
      const result = await verifyPasswordResetCode(email, value);
      setBusy(false);

      if (!result.ok) {
        setPasswordRecoveryInProgress(false);
        setCode('');
        setError(result.message);
        return;
      }
      setPassword('');
      setConfirmPassword('');
      setStep('newPassword');
      setNotice('驗證成功，請設定新密碼');
      return;
    }

    const result = await verifyLoginCode(email, value, codePurpose);
    if (!result.ok) {
      setBusy(false);
      setCode('');
      setError(result.message);
      return;
    }
    // 成功後由 AuthGate 監聽到登入狀態並導向主畫面，這裡維持忙碌狀態避免重複送出。
  };

  const handleUpdatePassword = async () => {
    if (!newPasswordReady || busy) return;
    setBusy(true);
    setError(null);

    const result = await updatePassword(password);
    if (!result.ok) {
      setBusy(false);
      setError(result.message);
      return;
    }
    setPasswordRecoveryInProgress(false);
    router.replace(APP_PATH);
  };

  const handleBackToCredentials = () => {
    setPasswordRecoveryInProgress(false);
    setStep('credentials');
    setCode('');
    setError(null);
    setNotice(null);
  };

  const heading =
    step === 'role'
      ? ROLE_HEADING
      : step === 'newPassword'
        ? {
            title: '設定新密碼',
            caption: `輸入新的登入密碼（至少 ${MIN_PASSWORD_LENGTH} 個字），完成後就會直接進入 App。`,
          }
        : step === 'code'
          ? { title: '輸入驗證碼', caption: CODE_CAPTIONS[codePurpose](maskedEmail) }
          : MODE_HEADINGS[mode];

  /** 主按鈕文案同時說明還缺什麼，避免只是變灰卻不說原因。 */
  const primaryLabel = (): string => {
    if (mode === 'code') return busy ? '寄送中…' : '寄送驗證碼';
    if (!emailReady) return '請輸入正確的 Email';
    if (mode === 'signIn') return busy ? '登入中…' : '登入';
    if (passwordProblem !== null) return `請設定至少 ${MIN_PASSWORD_LENGTH} 個字的密碼`;
    if (!passwordsMatch) return '兩次輸入的密碼不一致';
    return busy ? '建立帳號中…' : '建立帳號';
  };

  const handlePrimary = () => {
    if (mode === 'code') {
      void handleSendCode();
      return;
    }
    if (mode === 'signUp') {
      void handleSignUp();
      return;
    }
    void handleSignIn();
  };

  const primaryDisabled =
    busy ||
    (mode === 'code'
      ? !emailReady
      : mode === 'signUp'
        ? !signUpReady
        : !emailReady || password.length === 0);

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
          <Text className="text-muted mt-2 text-[15px] leading-6">{heading.caption}</Text>
        </View>

        {step === 'role' ? (
          <>
            <BrandLockup className="self-center" width={272} />

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
            {selectedRole !== null && step !== 'newPassword' ? (
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

            {step === 'credentials' ? (
              <View className="gap-3">
                <SegmentedTabs options={MODE_OPTIONS} value={mode} onChange={handleModeChange} />

                <View className="border-hairline gap-4 rounded-xl border bg-white p-4">
                  <TextField>
                    <View className="flex-row items-center justify-between gap-3">
                      <Label>Email</Label>
                      <FieldStatusBadge complete={emailReady} completeLabel="格式正確" />
                    </View>
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
                      onSubmitEditing={mode === 'code' ? () => void handleSendCode() : undefined}
                      returnKeyType={mode === 'code' ? 'send' : 'next'}
                    />
                  </TextField>

                  {mode === 'code' ? null : (
                    <PasswordField
                      label={mode === 'signUp' ? '設定密碼' : '密碼'}
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        setError(null);
                      }}
                      placeholder={
                        mode === 'signUp' ? `至少 ${MIN_PASSWORD_LENGTH} 個字` : '輸入密碼'
                      }
                      isNew={mode === 'signUp'}
                      editable={!busy}
                      status={
                        mode === 'signUp'
                          ? { complete: passwordProblem === null }
                          : { complete: password.length > 0, completeLabel: '已輸入' }
                      }
                      hint={mode === 'signUp' ? passwordProblem : null}
                      onSubmitEditing={mode === 'signIn' ? () => void handleSignIn() : undefined}
                      returnKeyType={mode === 'signIn' ? 'go' : 'next'}
                    />
                  )}

                  {mode === 'signUp' ? (
                    <PasswordField
                      label="再次輸入密碼"
                      value={confirmPassword}
                      onChangeText={(value) => {
                        setConfirmPassword(value);
                        setError(null);
                      }}
                      placeholder="再輸入一次確認"
                      isNew
                      editable={!busy}
                      status={{ complete: passwordsMatch, completeLabel: '相符' }}
                      hint={
                        confirmPassword.length === 0
                          ? '請再輸入一次剛設定的密碼。'
                          : '兩次輸入的密碼不一致。'
                      }
                      onSubmitEditing={() => void handleSignUp()}
                      returnKeyType="go"
                    />
                  ) : null}

                  <Button size="lg" isDisabled={primaryDisabled} onPress={handlePrimary}>
                    <Button.Label>{primaryLabel()}</Button.Label>
                  </Button>

                  {mode === 'signIn' ? (
                    <Pressable
                      onPress={() => void handleForgotPassword()}
                      accessibilityRole="button"
                      accessibilityLabel="忘記密碼，用 Email 驗證碼重設"
                      disabled={busy || !emailReady}
                      hitSlop={6}
                      className="self-start"
                    >
                      <Text
                        className={
                          emailReady
                            ? 'text-brand-strong text-[13px] font-semibold'
                            : 'text-muted text-[13px] font-semibold'
                        }
                      >
                        {emailReady ? '忘記密碼？寄驗證碼重設' : '忘記密碼？請先填 Email'}
                      </Text>
                    </Pressable>
                  ) : null}

                  {mode === 'signIn' ? (
                    <Text className="text-muted text-[12px] leading-4">
                      以前都用 Email 驗證碼登入、還沒設過密碼？用上面的「忘記密碼」就能設定一組。
                    </Text>
                  ) : null}

                  {mode === 'signUp' ? (
                    <View className="flex-row items-start gap-2">
                      <KeyRound size={15} color={COLORS.muted} strokeWidth={2.1} />
                      <Text className="text-muted flex-1 text-[12px] leading-4">
                        密碼只用於登入，不會顯示給其他使用者。之後也能改用 Email 驗證碼登入。
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : step === 'code' ? (
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
                  <Button.Label>
                    {busy
                      ? '驗證中…'
                      : codePurpose === 'recovery'
                        ? '驗證並設定新密碼'
                        : codePurpose === 'signup'
                          ? '完成註冊'
                          : '登入'}
                  </Button.Label>
                </Button>

                <View className="flex-row items-center justify-between">
                  <Pressable
                    onPress={handleBackToCredentials}
                    accessibilityRole="button"
                    disabled={busy}
                    className="flex-row items-center gap-1"
                  >
                    <ArrowLeft size={15} color={COLORS.muted} strokeWidth={2.2} />
                    <Text className="text-muted text-[13px] font-semibold">返回上一步</Text>
                  </Pressable>

                  <Pressable onPress={handleResend} accessibilityRole="button" disabled={busy}>
                    <Text className="text-brand-strong text-[13px] font-semibold">
                      重新寄送驗證碼
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="border-hairline gap-4 rounded-xl border bg-white p-4">
                <PasswordField
                  label="新密碼"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setError(null);
                  }}
                  placeholder={`至少 ${MIN_PASSWORD_LENGTH} 個字`}
                  isNew
                  editable={!busy}
                  status={{ complete: passwordProblem === null }}
                  hint={passwordProblem}
                  returnKeyType="next"
                />

                <PasswordField
                  label="再次輸入新密碼"
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    setError(null);
                  }}
                  placeholder="再輸入一次確認"
                  isNew
                  editable={!busy}
                  status={{ complete: passwordsMatch, completeLabel: '相符' }}
                  hint={
                    confirmPassword.length === 0 ? '請再輸入一次新密碼。' : '兩次輸入的密碼不一致。'
                  }
                  onSubmitEditing={() => void handleUpdatePassword()}
                  returnKeyType="go"
                />

                <Button
                  size="lg"
                  isDisabled={!newPasswordReady || busy}
                  onPress={() => void handleUpdatePassword()}
                >
                  <Button.Label>
                    {busy
                      ? '更新中…'
                      : passwordProblem !== null
                        ? `請設定至少 ${MIN_PASSWORD_LENGTH} 個字的密碼`
                        : !passwordsMatch
                          ? '兩次輸入的密碼不一致'
                          : '更新密碼並登入'}
                  </Button.Label>
                </Button>
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
