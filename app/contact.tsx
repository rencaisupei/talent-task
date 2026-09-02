import { useMemo, useState } from 'react';
import {
  Check,
  CircleCheck,
  Mail,
  MessageSquareText,
  Send,
  SmartphoneNfc,
} from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Switch, useThemeColor } from 'heroui-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

import { GlowButton, OutlineButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { ChoiceChips } from '@/components/ui/SettingsUI';
import { Txt } from '@/components/ui/Txt';
import { APP_VERSION, COMPANY } from '@/lib/company';
import { relativeTime } from '@/lib/format';
import { goBackOrReplace } from '@/lib/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import {
  SUPPORT_REPLY_DAYS,
  SUPPORT_STATUS_LABEL,
  SUPPORT_TOPIC_HINT,
  SUPPORT_TOPIC_LABEL,
  SUPPORT_TOPICS,
  type SupportTicket,
  type SupportTopic,
  useSupportStore,
} from '@/lib/stores/support';
import { NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { isValidEmail } from '@/lib/validation';

const TOPIC_OPTIONS = SUPPORT_TOPICS.map((key) => ({
  key,
  label: SUPPORT_TOPIC_LABEL[key],
}));

const SUBJECT_MAX = 60;
const MESSAGE_MAX = 1000;
const MESSAGE_MIN = 10;

export default function ContactScreen() {
  const [muted] = useThemeColor(['muted']);
  const accountEmail = useAuthStore((state) => state.email);
  const tickets = useSupportStore((state) => state.tickets);
  const submitTicket = useSupportStore((state) => state.submit);
  const closeTicket = useSupportStore((state) => state.closeTicket);

  const [topic, setTopic] = useState<SupportTopic>('account');
  const [email, setEmail] = useState(accountEmail);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachInfo, setAttachInfo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<SupportTicket | null>(null);

  const deviceInfo = useMemo(
    () =>
      [
        `版本 ${APP_VERSION}`,
        `建置 ${Application.nativeBuildVersion ?? '—'}`,
        `${Platform.OS} ${String(Platform.Version)}`,
        Device.modelName ?? '網頁瀏覽器',
      ].join(' · '),
    [],
  );

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0;

  const reset = () => {
    setTopic('account');
    setEmail(accountEmail);
    setSubject('');
    setMessage('');
    setAttachInfo(true);
    setError(null);
    setSent(null);
  };

  const send = () => {
    if (!isValidEmail(email)) {
      setError('請填寫可以收到回覆的電子郵件地址');
      return;
    }
    if (subject.trim().length < 2) {
      setError('主旨請至少填 2 個字');
      return;
    }
    if (message.trim().length < MESSAGE_MIN) {
      setError(`問題描述請至少填 ${MESSAGE_MIN} 個字，方便我們判斷狀況`);
      return;
    }

    setError(null);
    const ticket = submitTicket({
      topic,
      email,
      subject,
      message,
      deviceInfo: attachInfo ? deviceInfo : null,
    });
    setSent(ticket);
  };

  return (
    <Screen>
      <ScreenHeader back fallback="/settings" title="聯絡我們" subtitle="填表單，我們用信箱回覆" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-6 px-4 pb-10"
        >
          {sent ? (
            <SentCard ticket={sent} onAgain={reset} />
          ) : (
            <>
              <View className="bg-surface border-border/60 gap-4 rounded-3xl border p-4">
                <View className="gap-2">
                  <Txt weight="semibold" className="text-foreground text-[15px]">
                    這次要問什麼？
                  </Txt>
                  <ChoiceChips options={TOPIC_OPTIONS} value={topic} onChange={setTopic} />
                  <Txt className="text-muted text-[11px] leading-4">
                    {SUPPORT_TOPIC_HINT[topic]}
                  </Txt>
                </View>
              </View>

              <View className="bg-surface border-border/60 gap-4 rounded-3xl border p-4">
                <FieldLabel label="回覆用電子郵件" hint="我們只會用這個信箱回覆，不會公開" />
                <View className="bg-glass border-border/60 flex-row items-center gap-3 rounded-2xl border px-4">
                  <Mail color={NEON.violet} size={17} />
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
                    placeholder="you@example.com"
                    placeholderTextColor={muted}
                    className="text-foreground flex-1 py-3.5 text-[15px]"
                  />
                </View>

                <FieldLabel label="主旨" />
                <View className="bg-glass border-border/60 rounded-2xl border px-4">
                  <TextInput
                    value={subject}
                    onChangeText={(value) => {
                      setSubject(value.slice(0, SUBJECT_MAX));
                      setError(null);
                    }}
                    placeholder="一句話說明你的問題"
                    placeholderTextColor={muted}
                    className="text-foreground py-3.5 text-[15px]"
                  />
                </View>

                <FieldLabel label="問題描述" hint="附上發生時間、對方暱稱或訂單編號會更快處理" />
                <View className="bg-glass border-border/60 rounded-2xl border px-4 py-3">
                  <TextInput
                    value={message}
                    onChangeText={(value) => {
                      setMessage(value.slice(0, MESSAGE_MAX));
                      setError(null);
                    }}
                    placeholder="請描述你遇到的狀況與想要的處理方式"
                    placeholderTextColor={muted}
                    multiline
                    textAlignVertical="top"
                    className="text-foreground min-h-32 text-[15px] leading-6"
                  />
                </View>
                <Txt className="text-muted px-1 text-right text-[11px]">
                  {message.length} / {MESSAGE_MAX}
                </Txt>

                <View className="border-border/40 flex-row items-center gap-3 border-t pt-4">
                  <SmartphoneNfc color={NEON.cyan} size={18} />
                  <View className="flex-1 gap-0.5">
                    <Txt className="text-foreground text-[14px]">附上版本與裝置資訊</Txt>
                    <Txt className="text-muted text-[11px] leading-4">{deviceInfo}</Txt>
                  </View>
                  <Switch isSelected={attachInfo} onSelectedChange={setAttachInfo} />
                </View>

                {error ? <Txt className="text-danger text-[12px] leading-5">{error}</Txt> : null}

                <GlowButton
                  label="送出表單"
                  size="lg"
                  icon={<Send color="#ffffff" size={16} />}
                  disabled={!canSubmit}
                  onPress={send}
                />
                <Txt className="text-muted text-center text-[11px] leading-4">
                  一般問題會在 {SUPPORT_REPLY_DAYS} 個工作日內回覆；涉及人身安全的案件會優先處理。
                </Txt>
              </View>
            </>
          )}

          {tickets.length > 0 ? (
            <Section title="我送出的表單" subtitle={`最近 ${tickets.length} 筆`}>
              <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
                {tickets.map((ticket, index) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    onClose={() => closeTicket(ticket.id)}
                    last={index === tickets.length - 1}
                  />
                ))}
              </View>
            </Section>
          ) : null}

          <Section title="其他聯絡方式">
            <View className="gap-3">
              <OutlineButton
                label={`客服信箱 ${COMPANY.supportEmail}`}
                icon={<Mail color={NEON.violet} size={16} />}
                onPress={() => void Linking.openURL(`mailto:${COMPANY.supportEmail}`)}
              />
              <OutlineButton
                label="安全中心與檢舉說明"
                icon={<MessageSquareText color={NEON.coral} size={16} />}
                onPress={() => router.push('/safety')}
              />
            </View>
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <View className="gap-1">
      <Txt weight="medium" className="text-foreground text-[13px]">
        {label}
      </Txt>
      {hint ? <Txt className="text-muted text-[11px] leading-4">{hint}</Txt> : null}
    </View>
  );
}

function SentCard({ ticket, onAgain }: { ticket: SupportTicket; onAgain: () => void }) {
  return (
    <View className="bg-surface border-border/60 items-center gap-3 rounded-3xl border p-6">
      <View className="bg-success/15 border-success/40 h-14 w-14 items-center justify-center rounded-3xl border">
        <CircleCheck color={NEON.lime} size={26} />
      </View>
      <Txt weight="bold" className="text-foreground text-lg">
        表單已送出
      </Txt>
      <Txt className="text-muted text-center text-[12px] leading-5">
        單號 {ticket.ref}。我們會在 {SUPPORT_REPLY_DAYS} 個工作日內寄信到 {ticket.email}
        。信件可能被歸到垃圾信件匣，記得一起檢查。
      </Txt>
      <View className="mt-1 w-full gap-3">
        <GlowButton label="回到設定" size="lg" onPress={() => goBackOrReplace('/settings')} />
        <OutlineButton label="再填一張表單" onPress={onAgain} />
      </View>
    </View>
  );
}

function TicketRow({
  ticket,
  onClose,
  last,
}: {
  ticket: SupportTicket;
  onClose: () => void;
  last: boolean;
}) {
  const open = ticket.status !== 'closed';

  return (
    <View className={cn('gap-2 px-4 py-3.5', last ? '' : 'border-border/40 border-b')}>
      <View className="flex-row items-center gap-2">
        <Txt weight="medium" className="text-foreground flex-1 text-[14px]" numberOfLines={1}>
          {ticket.subject}
        </Txt>
        <View
          className={cn(
            'rounded-full border px-2.5 py-1',
            open ? 'bg-accent-soft border-accent/40' : 'bg-glass border-border/60',
          )}
        >
          <Txt weight="medium" className={cn('text-[10px]', open ? 'text-accent' : 'text-muted')}>
            {SUPPORT_STATUS_LABEL[ticket.status]}
          </Txt>
        </View>
      </View>
      <Txt className="text-muted text-[11px] leading-4" numberOfLines={2}>
        {ticket.message}
      </Txt>
      <View className="flex-row items-center gap-2">
        <Txt className="text-muted flex-1 text-[10px]">
          {SUPPORT_TOPIC_LABEL[ticket.topic]} · {ticket.ref} · {relativeTime(ticket.createdAt)}
        </Txt>
        {open ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="標記為已解決"
            hitSlop={6}
            onPress={onClose}
            className="flex-row items-center gap-1 active:opacity-70"
          >
            <Check color={NEON.lime} size={13} />
            <Txt className="text-muted text-[11px]">已解決</Txt>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
