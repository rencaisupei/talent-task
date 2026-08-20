import { Button, Description, Input, Label, TextArea, TextField } from 'heroui-native';
import {
  ArrowLeft,
  CircleCheck,
  Mail,
  MessageSquare,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { SectionHeading } from '@/components/SectionHeading';
import { SegmentedTabs, type SegmentOption } from '@/components/SegmentedTabs';
import { COLORS } from '@/lib/colors';
import { formatClockTime, formatDate } from '@/lib/format';
import {
  CONTACT_FORM_NOTE,
  CONTACT_INTRO,
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  SUPPORT_RESPONSE_NOTE,
} from '@/lib/legalCopy';
import { goBackOrReplace } from '@/lib/navigation';
import { submitSupportTicket } from '@/lib/remote/support';
import { useMyUserId, useSessionStore } from '@/lib/stores/session';
import { SUPPORT_CATEGORY_LABEL, type SupportCategory, type SupportTicket } from '@/lib/types';

const CATEGORY_OPTIONS: SegmentOption<SupportCategory>[] = (
  ['account', 'gig', 'payment', 'report', 'suggestion', 'other'] as const
).map((id) => ({ id, label: SUPPORT_CATEGORY_LABEL[id] }));

export default function ContactScreen() {
  const userId = useMyUserId();
  const accountEmail = useSessionStore((state) => state.email);
  const displayName = useSessionStore((state) => state.displayName);

  const [category, setCategory] = useState<SupportCategory>('account');
  const [name, setName] = useState(displayName === '我' ? '' : displayName);
  const [email, setEmail] = useState(accountEmail ?? '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<SupportTicket | null>(null);

  const openMailApp = () => {
    const subject = encodeURIComponent(`【人才速配】${SUPPORT_CATEGORY_LABEL[category]}`);
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`);
  };

  const handleSubmit = async () => {
    setSending(true);
    setError(null);
    const result = await submitSupportTicket({ userId, name, email, category, message });
    setSending(false);

    if (result.status === 'error') {
      setError(result.message);
      return;
    }

    setSent(result.data);
    setMessage('');
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="border-hairline pt-safe-offset-3 flex-row items-center gap-3 border-b bg-white px-5 pb-4">
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)/profile')}
          accessibilityRole="button"
          accessibilityLabel="返回"
          className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
        >
          <ArrowLeft size={18} color={COLORS.ink} strokeWidth={2.2} />
        </Pressable>
        <Text className="text-ink text-[17px] font-semibold">聯絡我們</Text>
      </View>

      <ScrollView
        contentContainerClassName="px-5 py-6 gap-5 pb-16"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="border-brand/20 bg-brand-soft gap-2 rounded-xl border p-4">
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={16} color={COLORS.brandStrong} strokeWidth={2.2} />
            <Text className="text-ink text-[14px] font-semibold">我們怎麼協助你</Text>
          </View>
          <Text className="text-ink-soft text-[13px] leading-5">{CONTACT_INTRO}</Text>
        </View>

        <Pressable
          onPress={openMailApp}
          accessibilityRole="button"
          accessibilityLabel={`寄信到客服信箱 ${SUPPORT_EMAIL}`}
          className="border-hairline flex-row items-center gap-3 rounded-xl border bg-white p-4"
        >
          <View className="bg-canvas h-10 w-10 items-center justify-center rounded-xl">
            <Mail size={18} color={COLORS.brandStrong} strokeWidth={2.2} />
          </View>
          <View className="flex-1">
            <Text className="text-ink text-[15px] font-semibold">客服信箱</Text>
            <Text className="text-brand-strong mt-0.5 text-[13px] font-semibold">
              {SUPPORT_EMAIL}
            </Text>
            <Text className="text-muted mt-1 text-[12px] leading-4">服務時間：{SUPPORT_HOURS}</Text>
          </View>
        </Pressable>

        {sent === null ? (
          <View className="border-hairline gap-4 rounded-xl border bg-white p-4">
            <View className="flex-row items-center gap-2">
              <MessageSquare size={16} color={COLORS.ink} strokeWidth={2.2} />
              <Text className="text-ink text-[15px] font-semibold">站內留言</Text>
            </View>

            <View className="gap-2">
              <Text className="text-ink text-[13px] font-semibold">問題類型</Text>
              <SegmentedTabs options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
            </View>

            <TextField>
              <Label>你的稱呼</Label>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="例如：王先生"
                autoCorrect={false}
              />
            </TextField>

            <TextField>
              <Label>聯絡信箱</Label>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
              <Description>我們只會用這個信箱回覆你的問題。</Description>
            </TextField>

            <TextField>
              <Label>問題內容</Label>
              <TextArea
                value={message}
                onChangeText={setMessage}
                placeholder="請說明發生時間、任務名稱與畫面上的訊息"
                numberOfLines={6}
                className="min-h-32"
              />
              <Description>至少 5 個字。</Description>
            </TextField>

            <Text className="text-muted text-[11px] leading-4">{CONTACT_FORM_NOTE}</Text>

            {error === null ? null : (
              <View className="border-coral/25 bg-coral-soft flex-row items-start gap-2 rounded-xl border px-3 py-2.5">
                <TriangleAlert size={15} color={COLORS.coral} strokeWidth={2.2} />
                <Text className="text-coral flex-1 text-[12px] leading-4 font-semibold">
                  {error}
                </Text>
              </View>
            )}

            <Button
              size="md"
              isDisabled={sending || message.trim().length === 0 || email.trim().length === 0}
              onPress={() => void handleSubmit()}
            >
              <Button.Label>{sending ? '送出中…' : '送出留言'}</Button.Label>
            </Button>
          </View>
        ) : (
          <View className="border-brand/25 gap-3 rounded-xl border bg-white p-4">
            <View className="flex-row items-center gap-2">
              <CircleCheck size={16} color={COLORS.brandStrong} strokeWidth={2.2} />
              <Text className="text-ink text-[15px] font-semibold">已收到你的留言</Text>
            </View>
            <Text className="text-ink-soft text-[13px] leading-5">
              受理時間 {formatDate(sent.createdAt)} {formatClockTime(sent.createdAt)}・類型
              {SUPPORT_CATEGORY_LABEL[sent.category]}。{SUPPORT_RESPONSE_NOTE}
            </Text>
            <Text className="text-muted text-[12px] leading-4">
              我們會回覆到 {sent.email}。若一直沒收到回覆，請檢查垃圾郵件匣，或直接寄信到{' '}
              {SUPPORT_EMAIL}。
            </Text>
            <Button size="md" variant="tertiary" onPress={() => setSent(null)}>
              <Button.Label>再送一則留言</Button.Label>
            </Button>
          </View>
        )}

        <View className="gap-2">
          <SectionHeading title="常見問題怎麼問比較快" />
          <View className="border-hairline gap-2 rounded-xl border bg-white p-4">
            <Text className="text-ink-soft text-[12px] leading-5">
              ・登不進來：請附上你註冊的信箱，以及有沒有收到 6 位數驗證碼。
            </Text>
            <Text className="text-ink-soft text-[12px] leading-5">
              ・任務沒出現在任務牆：請附上任務名稱與發布時間，我們會查是否還在 AI 認證複審。
            </Text>
            <Text className="text-ink-soft text-[12px] leading-5">
              ・遇到要求私下匯款：請直接在對話裡按檢舉，再到這裡留言補充，我們會調閱該對話紀錄。
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
