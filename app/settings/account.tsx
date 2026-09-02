import { useState } from 'react';
import {
  BadgeCheck,
  Check,
  ChevronRight,
  KeyRound,
  Mail,
  MessageSquareText,
  Pause,
  Trash2,
} from 'lucide-react-native';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { GlowButton, OutlineButton } from '@/components/ui/GlowButton';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { KYC_STATUS_LABEL, useAuthStore } from '@/lib/stores/auth';
import { TIER_LABEL, useSubscriptionStore } from '@/lib/stores/subscription';
import { NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { PASSWORD_MIN_LENGTH } from '@/lib/validation';

const LANGUAGES = ['繁體中文', 'English', '日本語'];

export default function AccountSettingsScreen() {
  const email = useAuthStore((state) => state.email);
  const emailVerified = useAuthStore((state) => state.emailVerified);
  const kyc = useAuthStore((state) => state.kyc);
  const changePassword = useAuthStore((state) => state.changePassword);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const tier = useSubscriptionStore((state) => state.tier);

  const [language, setLanguage] = useState('繁體中文');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [paused, setPaused] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <Screen>
      <ScreenHeader back fallback="/settings" title="帳號設定" />

      <ScrollView contentContainerClassName="gap-6 px-4 pb-10">
        <Section title="登入資訊">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            <InfoRow
              icon={<Mail color={NEON.violet} size={18} />}
              label="電子郵件"
              value={email || '未設定'}
              hint={emailVerified ? '已完成信箱驗證' : '尚未驗證，請重新登入完成驗證'}
            />
            <ActionRow
              icon={<KeyRound color={NEON.cyan} size={18} />}
              label="密碼"
              value="變更"
              hint={`至少 ${PASSWORD_MIN_LENGTH} 個字元，需含英文字母與數字`}
              onPress={() => setPasswordOpen(true)}
            />
            <ActionRow
              icon={<BadgeCheck color={NEON.lime} size={18} />}
              label="實名認證"
              value={KYC_STATUS_LABEL[kyc.status]}
              hint={
                kyc.status === 'verified'
                  ? `${kyc.legalName} · ${kyc.maskedIdNumber}`
                  : '完成後才能使用配對與付費功能'
              }
              onPress={() => router.push('/verify-identity')}
              last
            />
          </View>
        </Section>

        <Section title="語言">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            {LANGUAGES.map((item, index) => (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ selected: language === item }}
                accessibilityLabel={item}
                onPress={() => setLanguage(item)}
                className={cn(
                  'flex-row items-center justify-between px-4 py-3.5 active:opacity-70',
                  index === LANGUAGES.length - 1 ? '' : 'border-border/40 border-b',
                )}
              >
                <Txt className="text-foreground text-[14px]">{item}</Txt>
                {language === item ? <Check color={NEON.coral} size={16} /> : null}
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="訂閱">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="管理訂閱"
            onPress={() => router.push('/subscribe')}
            className="bg-surface border-border/60 flex-row items-center justify-between rounded-3xl border px-4 py-3.5 active:opacity-70"
          >
            <View>
              <Txt className="text-foreground text-[14px]">目前方案</Txt>
              <Txt className="text-muted mt-0.5 text-[11px]">
                在 App Store / Google Play 的訂閱設定也可以隨時取消
              </Txt>
            </View>
            <Txt weight="medium" className="text-accent text-[13px]">
              {TIER_LABEL[tier]}
            </Txt>
          </Pressable>
        </Section>

        <Section title="暫停或結束使用">
          <View className="gap-3">
            <OutlineButton
              label={paused ? '恢復我的帳號' : '暫時隱藏我的帳號'}
              icon={<Pause color={NEON.amber} size={16} />}
              onPress={() => setPaused(!paused)}
            />
            {paused ? (
              <View className="border-neon-amber/40 bg-neon-amber/10 rounded-2xl border px-4 py-3">
                <Txt className="text-foreground text-[12px] leading-5">
                  你的檔案已隱藏，不會出現在別人的探索頁。既有的對話仍然保留，隨時可以恢復。
                </Txt>
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="刪除帳號"
              onPress={() => setConfirmDelete(true)}
              className="border-danger/50 bg-danger/10 flex-row items-center justify-center gap-2 rounded-full border py-3.5 active:opacity-70"
            >
              <Trash2 color="#EF4B57" size={16} />
              <Txt weight="medium" className="text-danger text-[14px]">
                永久刪除帳號
              </Txt>
            </Pressable>
          </View>
        </Section>

        <View className="bg-surface border-border/60 gap-3 rounded-3xl border p-4">
          <Txt weight="medium" className="text-foreground text-[13px]">
            法律文件
          </Txt>
          <Txt className="text-muted text-[11px] leading-5">
            使用 JiMatch 表示你同意服務條款與隱私權政策。我們不會販售你的個人資料，帳號刪除後 30
            天內完成清除。
          </Txt>
          <View className="flex-row gap-3">
            <OutlineButton
              label="服務條款"
              className="flex-1"
              onPress={() => router.push('/legal/terms')}
            />
            <OutlineButton
              label="隱私權政策"
              className="flex-1"
              onPress={() => router.push('/legal/privacy')}
            />
          </View>
        </View>
        <View className="bg-surface border-border/60 gap-3 rounded-3xl border p-4">
          <Txt weight="medium" className="text-foreground text-[13px]">
            需要協助
          </Txt>
          <Txt className="text-muted text-[11px] leading-5">
            無法登入、扣款有疑問，或想查詢與刪除個人資料，填一張聯絡表單就好，客服會用你的信箱回覆。
          </Txt>
          <OutlineButton
            label="聯絡我們"
            icon={<MessageSquareText color={NEON.cyan} size={16} />}
            onPress={() => router.push('/contact')}
          />
        </View>
      </ScrollView>

      <PasswordModal
        visible={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSubmit={changePassword}
      />

      <Modal
        visible={confirmDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDelete(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/75 px-8">
          <View className="bg-surface border-border/60 w-full gap-4 rounded-3xl border p-6">
            <Txt weight="bold" className="text-foreground text-lg">
              確定要刪除帳號嗎？
            </Txt>
            <Txt className="text-muted text-[13px] leading-5">
              所有配對、對話、動態、通話紀錄與實名認證資料都會被刪除，無法復原。訂閱需要另外到 App
              Store 或 Google Play 取消。
            </Txt>
            <GlowButton
              label="我了解，刪除帳號"
              colors={['#EF4B57', '#B3323C']}
              size="lg"
              onPress={() => {
                setConfirmDelete(false);
                deleteAccount();
                router.replace('/welcome');
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="取消"
              onPress={() => setConfirmDelete(false)}
              className="items-center py-1 active:opacity-70"
            >
              <Txt className="text-muted text-[13px]">先不要</Txt>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function PasswordModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { current: string; next: string; confirm: string }) => {
    ok: boolean;
    error?: string;
  };
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const close = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
    setDone(false);
    onClose();
  };

  const submit = () => {
    const result = onSubmit({ current, next, confirm });
    if (!result.ok) {
      setError(result.error ?? '無法變更密碼');
      return;
    }
    setError(null);
    setDone(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 items-center justify-center bg-black/75 px-8"
      >
        <View className="bg-surface border-border/60 w-full gap-4 rounded-3xl border p-6">
          <Txt weight="bold" className="text-foreground text-lg">
            變更密碼
          </Txt>

          {done ? (
            <>
              <Txt className="text-muted text-[13px] leading-5">
                密碼已更新。下次登入請使用新密碼。
              </Txt>
              <GlowButton label="完成" size="lg" onPress={close} />
            </>
          ) : (
            <>
              <PasswordInput
                value={current}
                onChangeText={(value) => {
                  setCurrent(value);
                  setError(null);
                }}
                placeholder="目前的密碼"
                autoComplete="current-password"
                tone="glass"
              />
              <PasswordInput
                value={next}
                onChangeText={(value) => {
                  setNext(value);
                  setError(null);
                }}
                placeholder={`新密碼（至少 ${PASSWORD_MIN_LENGTH} 個字元）`}
                autoComplete="new-password"
                tone="glass"
              />
              <PasswordInput
                value={confirm}
                onChangeText={(value) => {
                  setConfirm(value);
                  setError(null);
                }}
                placeholder="再輸入一次新密碼"
                autoComplete="new-password"
                tone="glass"
              />
              {error ? <Txt className="text-danger text-[12px] leading-5">{error}</Txt> : null}
              <GlowButton
                label="更新密碼"
                size="lg"
                disabled={current.length === 0 || next.length === 0 || confirm.length === 0}
                onPress={submit}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="取消"
                onPress={close}
                className="items-center py-1 active:opacity-70"
              >
                <Txt className="text-muted text-[13px]">取消</Txt>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function InfoRow({
  icon,
  label,
  value,
  hint,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  last?: boolean;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-3 px-4 py-3.5',
        last ? '' : 'border-border/40 border-b',
      )}
    >
      <View className="w-6 items-center">{icon}</View>
      <View className="flex-1 gap-0.5">
        <Txt className="text-foreground text-[14px]">{label}</Txt>
        {hint ? <Txt className="text-muted text-[11px] leading-4">{hint}</Txt> : null}
      </View>
      <Txt className="text-muted max-w-[42%] text-right text-[12px]" numberOfLines={1}>
        {value}
      </Txt>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  value,
  hint,
  onPress,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-3 px-4 py-3.5 active:opacity-70',
        last ? '' : 'border-border/40 border-b',
      )}
    >
      <View className="w-6 items-center">{icon}</View>
      <View className="flex-1 gap-0.5">
        <Txt className="text-foreground text-[14px]">{label}</Txt>
        {hint ? <Txt className="text-muted text-[11px] leading-4">{hint}</Txt> : null}
      </View>
      <Txt className="text-muted text-[12px]">{value}</Txt>
      <ChevronRight color="#8C8397" size={16} />
    </Pressable>
  );
}
