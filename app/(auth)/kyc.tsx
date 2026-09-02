import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck,
  Camera,
  Check,
  IdCard,
  Lock,
  ScanFace,
  ShieldCheck,
} from 'lucide-react-native';
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
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ChoiceChips } from '@/components/ui/SettingsUI';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { useKeyboardSafePad } from '@/hooks/useKeyboardInset';
import { useAdminStore } from '@/lib/stores/admin';
import {
  KYC_DOC_LABEL,
  KYC_SLOT_LABEL,
  type KycDocSlot,
  type KycDocType,
  useAuthStore,
} from '@/lib/stores/auth';
import { GRADIENT, NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';
import {
  MIN_AGE,
  birthDateIssue,
  formatBirthInput,
  isValidNationalId,
  isValidPassportNumber,
  isValidResidentId,
  normalizeIdNumber,
} from '@/lib/validation';

const DOC_OPTIONS: { key: KycDocType; label: string }[] = [
  { key: 'idCard', label: KYC_DOC_LABEL.idCard },
  { key: 'residentId', label: KYC_DOC_LABEL.residentId },
  { key: 'passport', label: KYC_DOC_LABEL.passport },
];

const DOC_HINT: Record<KycDocType, string> = {
  idCard: '輸入格式為 1 個英文字母加 9 位數字，例如 A123456789。',
  residentId: '新式居留證為 1 個英文字母加 9 位數字，舊式為 2 個英文字母加 8 位數字。',
  passport: '請輸入護照上的號碼，6 至 12 位英數字。',
};

const SLOT_ICON: Record<KycDocSlot, React.ReactNode> = {
  front: <IdCard color={NEON.amber} size={20} />,
  back: <IdCard color={NEON.cyan} size={20} />,
  selfie: <ScanFace color={NEON.violet} size={20} />,
};

const SLOT_HINT: Record<KycDocSlot, string> = {
  front: '四角完整、文字清楚，避免反光。',
  back: '需看得到發證日期與地址欄位。',
  selfie: '手持證件與臉部同時入鏡。',
};

/** 審核模擬時間，正式版由後端與人工審核回傳結果。 */
const REVIEW_DELAY_MS = 1800;

export default function KycScreen() {
  const [muted] = useThemeColor(['muted']);
  const kyc = useAuthStore((state) => state.kyc);
  const submitKyc = useAuthStore((state) => state.submitKyc);
  const setKycStatus = useAuthStore((state) => state.setKycStatus);
  const onboarded = useAuthStore((state) => state.onboarded);
  const logAgent = useAdminStore((state) => state.logAgent);
  const padBottom = useKeyboardSafePad(4);

  const [docType, setDocType] = useState<KycDocType>(kyc.docType);
  const [legalName, setLegalName] = useState(kyc.legalName);
  const [idNumber, setIdNumber] = useState('');
  const [birthDate, setBirthDate] = useState(kyc.birthDate);
  const [slots, setSlots] = useState<KycDocSlot[]>([]);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const requiredSlots = useMemo<KycDocSlot[]>(
    () => (docType === 'passport' ? ['front', 'selfie'] : ['front', 'back', 'selfie']),
    [docType],
  );

  const verified = kyc.status === 'verified';

  const toggleSlot = (slot: KycDocSlot) => {
    setError(null);
    setSlots((current) =>
      current.includes(slot) ? current.filter((item) => item !== slot) : [...current, slot],
    );
  };

  const validate = (): string | null => {
    if (legalName.trim().length < 2) return '請輸入與證件相同的真實姓名';
    const id = normalizeIdNumber(idNumber);
    if (docType === 'idCard' && !isValidNationalId(id)) return '身分證號碼格式或檢核碼不正確';
    if (docType === 'residentId' && !isValidResidentId(id)) return '居留證號碼格式或檢核碼不正確';
    if (docType === 'passport' && !isValidPassportNumber(id)) return '護照號碼格式不正確';
    const birthIssue = birthDateIssue(birthDate);
    if (birthIssue) return birthIssue;
    const missing = requiredSlots.filter((slot) => !slots.includes(slot));
    if (missing.length > 0) {
      return `還需要上傳：${missing.map((slot) => KYC_SLOT_LABEL[slot]).join('、')}`;
    }
    if (!consent) return '請先閱讀並同意個資處理說明';
    return null;
  };

  const submit = () => {
    const issue = validate();
    if (issue) {
      setError(issue);
      return;
    }
    setError(null);
    setReviewing(true);
    submitKyc({
      legalName,
      idNumber,
      docType,
      birthDate,
      uploadedSlots: requiredSlots,
    });
    logAgent('實名認證系統', '收到實名認證申請', legalName.trim());

    timerRef.current = setTimeout(() => {
      setKycStatus('verified');
      logAgent('實名認證系統', '實名認證審核通過', legalName.trim());
      setReviewing(false);
    }, REVIEW_DELAY_MS);
  };

  if (verified) {
    return (
      <Screen>
        <ScreenHeader title="實名認證" subtitle="已完成" />
        <View className="pb-safe-offset-6 flex-1 justify-between px-6">
          <LinearGradient
            colors={GRADIENT.like}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="mt-4 items-center gap-3 rounded-3xl p-6"
          >
            <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white/20">
              <BadgeCheck color="#ffffff" size={30} />
            </View>
            <Txt weight="bold" className="text-xl text-white">
              實名認證已通過
            </Txt>
            <Txt className="text-center text-[12px] leading-5 text-white/85">
              {kyc.legalName} · {KYC_DOC_LABEL[kyc.docType]} {kyc.maskedIdNumber}
              {'\n'}證件影像已加密保存，不會顯示給其他使用者。
            </Txt>
          </LinearGradient>

          <GlowButton
            label={onboarded ? '回到 JiMatch' : '接著設定個人檔案'}
            size="lg"
            onPress={() => router.replace(onboarded ? '/(tabs)' : '/onboarding')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        back
        fallback="/verify"
        title="實名認證（KYC）"
        subtitle="法規要求，也讓大家確定彼此是真人"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-6 px-5 pb-8">
          <View className="border-border/50 bg-glass w-full flex-row items-start gap-3 rounded-3xl border p-4">
            <ShieldCheck color={NEON.lime} size={20} />
            <View className="flex-1 gap-1">
              <Txt weight="medium" className="text-foreground text-[13px]">
                為什麼需要實名認證
              </Txt>
              <Txt className="text-muted text-[11px] leading-5">
                JiMatch 只對 {MIN_AGE}{' '}
                歲以上開放，實名認證用來確認年齡與身分、阻擋假帳號與詐騙帳號。認證資料不會出現在你的個人檔案，也不會提供給其他使用者。
              </Txt>
            </View>
          </View>

          <Block label="證件類型" hint={DOC_HINT[docType]}>
            <ChoiceChips
              options={DOC_OPTIONS}
              value={docType}
              onChange={(next) => {
                setDocType(next);
                setSlots([]);
                setError(null);
              }}
            />
          </Block>

          <Block label="真實姓名" hint="需與證件上的姓名完全相同，包含中間的間隔號。">
            <Input
              value={legalName}
              onChangeText={(value) => {
                setLegalName(value);
                setError(null);
              }}
              placeholder="例如：林佩宜"
              placeholderTextColor={muted}
            />
          </Block>

          <Block label="證件號碼">
            <Input
              value={idNumber}
              onChangeText={(value) => {
                setIdNumber(normalizeIdNumber(value));
                setError(null);
              }}
              placeholder={docType === 'passport' ? '例如：312345678' : '例如：A123456789'}
              placeholderTextColor={muted}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
            />
          </Block>

          <Block label="出生年月日" hint={`滿 ${MIN_AGE} 歲才能使用 JiMatch。`}>
            <Input
              value={birthDate}
              onChangeText={(value) => {
                setBirthDate(formatBirthInput(value));
                setError(null);
              }}
              placeholder="1996-05-08"
              placeholderTextColor={muted}
              keyboardType="number-pad"
              maxLength={10}
            />
          </Block>

          <Block label="證件影像" hint="示範模式點一下即可標記完成，正式版會開啟相機。">
            <View className="w-full gap-3">
              {requiredSlots.map((slot) => {
                const uploaded = slots.includes(slot);
                return (
                  <Pressable
                    key={slot}
                    accessibilityRole="button"
                    accessibilityState={{ checked: uploaded }}
                    accessibilityLabel={KYC_SLOT_LABEL[slot]}
                    onPress={() => toggleSlot(slot)}
                    className={cn(
                      'w-full flex-row items-center gap-3 rounded-2xl border p-3.5 active:opacity-80',
                      uploaded
                        ? 'border-[#2FD68A]/40 bg-[#2FD68A]/10'
                        : 'border-border/60 bg-surface border-dashed',
                    )}
                  >
                    <View className="bg-glass border-border/60 h-10 w-10 shrink-0 items-center justify-center rounded-2xl border">
                      {uploaded ? <Camera color="#2FD68A" size={20} /> : SLOT_ICON[slot]}
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Txt
                        weight="medium"
                        className="text-foreground text-[13px]"
                        numberOfLines={1}
                      >
                        {KYC_SLOT_LABEL[slot]}
                      </Txt>
                      <Txt className="text-muted text-[11px] leading-4" numberOfLines={2}>
                        {SLOT_HINT[slot]}
                      </Txt>
                    </View>
                    <View
                      className={cn(
                        'h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                        uploaded ? 'border-[#2FD68A] bg-[#2FD68A]' : 'border-border',
                      )}
                    >
                      {uploaded ? <Check color="#171021" size={14} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Block>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
            accessibilityLabel="同意個資處理說明"
            onPress={() => {
              setConsent(!consent);
              setError(null);
            }}
            className="bg-surface border-border/60 flex-row items-start gap-3 rounded-3xl border p-4 active:opacity-80"
          >
            <View
              className={cn(
                'mt-0.5 h-5 w-5 items-center justify-center rounded-md border-2',
                consent ? 'border-accent bg-accent' : 'border-border',
              )}
            >
              {consent ? <Check color="#ffffff" size={13} /> : null}
            </View>
            <View className="flex-1 gap-1">
              <Txt className="text-foreground text-[12px] leading-5">
                我同意 JiMatch 為身分與年齡驗證的目的蒐集、處理及利用上述證件資料。
              </Txt>
              <View className="flex-row flex-wrap items-center gap-x-1">
                <Txt className="text-muted text-[11px]">詳細做法請看</Txt>
                <LegalLink label="隱私權政策" onPress={() => router.push('/legal/privacy')} />
                <Txt className="text-muted text-[11px]">與</Txt>
                <LegalLink label="服務條款" onPress={() => router.push('/legal/terms')} />
                <Txt className="text-muted text-[11px]">。</Txt>
              </View>
            </View>
          </Pressable>

          <View className="border-border/50 bg-glass w-full flex-row items-start gap-3 rounded-2xl border p-4">
            <Lock color={muted} size={16} />
            <Txt className="text-muted flex-1 text-[11px] leading-5">
              證件影像僅供審核使用，通過後 30
              天內刪除，系統只保留遮罩後的號碼與審核結果。你可以隨時要求查詢或刪除這些資料。
            </Txt>
          </View>

          {error ? <Txt className="text-danger text-[12px] leading-5">{error}</Txt> : null}
        </ScrollView>

        <View className={cn('gap-2 px-5', padBottom)}>
          <GlowButton
            label={reviewing ? '審核中' : '送出實名認證'}
            size="lg"
            loading={reviewing}
            disabled={reviewing}
            onPress={submit}
          />
          <Txt className="text-muted text-center text-[11px]">
            {reviewing ? '正在比對證件與自拍，請稍候…' : '一般案件會在 10 分鐘內完成自動審核。'}
          </Txt>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Block({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="w-full gap-2">
      <Txt weight="medium" className="text-foreground text-[13px]">
        {label}
      </Txt>
      {hint ? <Txt className="text-muted w-full text-[11px] leading-4">{hint}</Txt> : null}
      {children}
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      className="bg-surface border-border/60 text-foreground rounded-2xl border px-4 py-3.5 text-[15px]"
    />
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
