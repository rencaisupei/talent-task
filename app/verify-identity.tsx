import { useState } from 'react';
import { BadgeCheck, Camera, Check, IdCard, MailCheck, ScanFace } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { GlowButton, OutlineButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { KYC_DOC_LABEL, KYC_STATUS_LABEL, type KycStatus, useAuthStore } from '@/lib/stores/auth';
import { GRADIENT, NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { maskEmail } from '@/lib/validation';

const STATUS_TONE: Record<KycStatus, string> = {
  none: 'text-muted',
  pending: 'text-warning',
  verified: 'text-success',
  rejected: 'text-danger',
};

export default function VerifyIdentityScreen() {
  const identityVerified = useAuthStore((state) => state.identityVerified);
  const setIdentityVerified = useAuthStore((state) => state.setIdentityVerified);
  const emailVerified = useAuthStore((state) => state.emailVerified);
  const email = useAuthStore((state) => state.email);
  const kyc = useAuthStore((state) => state.kyc);
  const resetKyc = useAuthStore((state) => state.resetKyc);
  const [photoMatched, setPhotoMatched] = useState(identityVerified);

  const kycDone = kyc.status === 'verified';
  const allDone = emailVerified && kycDone && photoMatched;

  return (
    <Screen>
      <ScreenHeader
        back
        fallback="/(tabs)/me"
        title="真人認證"
        subtitle="認證帳號的曝光平均高出 4 倍"
      />

      <ScrollView contentContainerClassName="gap-6 px-4 pb-8">
        <LinearGradient
          colors={identityVerified ? GRADIENT.like : GRADIENT.plus}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="items-center gap-3 rounded-3xl p-6"
        >
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white/20">
            {identityVerified ? (
              <BadgeCheck color="#ffffff" size={30} />
            ) : (
              <Camera color="#ffffff" size={28} />
            )}
          </View>
          <Txt weight="bold" className="text-xl text-white">
            {identityVerified ? '你已通過真人認證' : '完成三步就能取得認證標章'}
          </Txt>
          <Txt className="text-center text-[12px] leading-5 text-white/85">
            {identityVerified
              ? '認證標章會顯示在你的檔案與卡片上，也能被「只看已認證」的篩選找到。'
              : '認證資料只用於驗證，不會顯示在你的檔案上，也不會提供給其他使用者。'}
          </Txt>
        </LinearGradient>

        <Section title="認證項目">
          <View className="gap-3">
            <StepCard
              icon={<MailCheck color={NEON.violet} size={20} />}
              title="電子郵件驗證"
              body={
                emailVerified
                  ? `已驗證 ${email ? maskEmail(email) : ''}`
                  : '註冊時輸入信箱驗證碼即可完成。'
              }
              completed={emailVerified}
            />

            <StepCard
              icon={<IdCard color={NEON.amber} size={20} />}
              title="實名認證（KYC）"
              body={
                kycDone
                  ? `${kyc.legalName} · ${KYC_DOC_LABEL[kyc.docType]} ${kyc.maskedIdNumber}`
                  : '上傳證件與手持自拍，確認年齡與身分。'
              }
              status={KYC_STATUS_LABEL[kyc.status]}
              statusClassName={STATUS_TONE[kyc.status]}
              completed={kycDone}
              onPress={kycDone ? undefined : () => router.push('/kyc')}
            />

            <StepCard
              icon={<ScanFace color={NEON.cyan} size={20} />}
              title="照片比對"
              body="依提示做一個手勢自拍，系統會和你的主照片比對。"
              completed={photoMatched}
              onPress={() => setPhotoMatched(!photoMatched)}
            />
          </View>
        </Section>

        <View className="bg-surface border-border/60 gap-2 rounded-3xl border p-4">
          <Txt weight="medium" className="text-foreground text-[13px]">
            示範模式說明
          </Txt>
          <Txt className="text-muted text-[11px] leading-5">
            點一下「照片比對」即可標記完成。正式版會開啟相機取得手勢自拍、做人臉相似度比對，證件影像則加密後交給審核團隊。
          </Txt>
        </View>
      </ScrollView>

      <View className="pb-safe-offset-4 gap-3 px-4">
        {identityVerified ? (
          <>
            <OutlineButton label="重新送交實名認證" onPress={() => router.push('/kyc')} />
            <GlowButton
              label="取消認證狀態"
              colors={['#6B6478', '#3A2C4C']}
              size="lg"
              onPress={() => {
                resetKyc();
                setPhotoMatched(false);
              }}
            />
          </>
        ) : (
          <GlowButton
            label={
              kycDone
                ? allDone
                  ? '送出認證'
                  : '完成照片比對'
                : kyc.status === 'pending'
                  ? '實名認證審核中'
                  : '前往實名認證'
            }
            size="lg"
            disabled={kyc.status === 'pending'}
            onPress={() => {
              if (!kycDone) {
                router.push('/kyc');
                return;
              }
              if (!photoMatched) {
                setPhotoMatched(true);
                return;
              }
              setIdentityVerified(true);
            }}
          />
        )}
      </View>
    </Screen>
  );
}

function StepCard({
  icon,
  title,
  body,
  completed,
  status,
  statusClassName,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  completed: boolean;
  status?: string;
  statusClassName?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-2xl border">
        {icon}
      </View>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Txt weight="medium" className="text-foreground text-[14px]">
            {title}
          </Txt>
          {status ? (
            <Txt className={cn('text-[11px]', statusClassName ?? 'text-muted')}>{status}</Txt>
          ) : null}
        </View>
        <Txt className="text-muted text-[12px] leading-5">{body}</Txt>
      </View>
      <View
        className={cn(
          'h-6 w-6 items-center justify-center rounded-full border-2',
          completed ? 'border-[#2FD68A] bg-[#2FD68A]' : 'border-border',
        )}
      >
        {completed ? <Check color="#171021" size={14} /> : null}
      </View>
    </>
  );

  const className = cn(
    'flex-row items-start gap-3 rounded-3xl border p-4',
    completed ? 'border-[#2FD68A]/40 bg-[#2FD68A]/10' : 'border-border/60 bg-surface',
  );

  if (!onPress) {
    return <View className={className}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ checked: completed }}
      accessibilityLabel={title}
      onPress={onPress}
      className={cn(className, 'active:opacity-80')}
    >
      {content}
    </Pressable>
  );
}
