import { Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

import { CopyrightFooter } from '@/components/ui/CopyrightFooter';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { APP_VERSION, COMPANY } from '@/lib/company';
import { cn } from '@/lib/utils';

export default function AboutScreen() {
  const buildVersion = Application.nativeBuildVersion ?? '—';
  const bundleId = Application.applicationId ?? 'me.bilt.jimatch';
  const deviceName = Device.modelName ?? '網頁瀏覽器';

  return (
    <Screen>
      <ScreenHeader back fallback="/settings" title="關於 JiMatch" />

      <ScrollView contentContainerClassName="gap-6 px-4 pb-6">
        <View className="bg-surface border-border/60 gap-2 rounded-3xl border p-4">
          <Txt weight="bold" className="text-foreground text-lg">
            {COMPANY.product}
          </Txt>
          <Txt className="text-muted text-[12px] leading-5">
            用互動遊戲認識新朋友。極速開局、大富翁與多人派對房，邊玩邊配對，聊得來再約見面。
          </Txt>
          <Txt className="text-accent text-[12px]">{COMPANY.name}</Txt>
        </View>

        <Section title="版本資訊">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            <InfoRow label="App 版本" value={APP_VERSION} />
            <InfoRow label="建置版號" value={buildVersion} />
            <InfoRow label="套件識別碼" value={bundleId} />
            <InfoRow label="執行平台" value={`${Platform.OS} ${String(Platform.Version)}`} />
            <InfoRow label="裝置" value={deviceName} last />
          </View>
        </Section>

        <Section title="法律與隱私">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            <PushRow
              label="服務條款"
              hint="使用資格、實名認證、付費與退款規定"
              onPress={() => router.push('/legal/terms')}
            />
            <PushRow
              label="隱私權政策"
              hint="資料蒐集項目、保存期限與你的權利"
              onPress={() => router.push('/legal/privacy')}
            />
            <PushRow
              label="裝置權限"
              hint="檢查相機、相簿、麥克風、位置、通知"
              onPress={() => router.push('/settings/permissions')}
            />
            <PushRow
              label="聯絡我們"
              hint="填寫客服表單，我們用電子郵件回覆"
              onPress={() => router.push('/contact')}
            />
            <LinkRow
              label="客服信箱"
              hint={COMPANY.supportEmail}
              url={`mailto:${COMPANY.supportEmail}`}
              last
            />
          </View>
        </Section>

        <CopyrightFooter showVersion />
      </ScrollView>
    </Screen>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-3 px-4 py-3.5',
        last ? '' : 'border-border/40 border-b',
      )}
    >
      <Txt className="text-foreground flex-1 text-[14px]">{label}</Txt>
      <Txt className="text-muted text-[12px]">{value}</Txt>
    </View>
  );
}

function LinkRow({
  label,
  hint,
  url,
  last = false,
}: {
  label: string;
  hint: string;
  url: string;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => void Linking.openURL(url)}
      className={cn(
        'gap-0.5 px-4 py-3.5 active:opacity-70',
        last ? '' : 'border-border/40 border-b',
      )}
    >
      <Txt className="text-foreground text-[14px]">{label}</Txt>
      <Txt className="text-muted text-[11px]">{hint}</Txt>
    </Pressable>
  );
}

function PushRow({
  label,
  hint,
  onPress,
  last = false,
}: {
  label: string;
  hint: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        'gap-0.5 px-4 py-3.5 active:opacity-70',
        last ? '' : 'border-border/40 border-b',
      )}
    >
      <Txt className="text-foreground text-[14px]">{label}</Txt>
      <Txt className="text-muted text-[11px]">{hint}</Txt>
    </Pressable>
  );
}
