import { Linking, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import {
  BellRing,
  Camera,
  Contact,
  Images,
  MapPin,
  Mic,
  RefreshCw,
  ShieldQuestion,
} from 'lucide-react-native';

import { CopyrightFooter } from '@/components/ui/CopyrightFooter';
import { OutlineButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { COMPANY } from '@/lib/company';
import {
  type PermissionInfo,
  type PermissionKey,
  openSystemSettings,
  useDevicePermissions,
} from '@/lib/permissions';
import { NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';

const ICONS: Record<PermissionKey, { icon: typeof Camera; tint: string }> = {
  camera: { icon: Camera, tint: NEON.cyan },
  photos: { icon: Images, tint: NEON.violet },
  microphone: { icon: Mic, tint: NEON.rose },
  location: { icon: MapPin, tint: NEON.lime },
  notifications: { icon: BellRing, tint: NEON.amber },
  contacts: { icon: Contact, tint: NEON.coral },
  tracking: { icon: ShieldQuestion, tint: NEON.pink },
};

const STATE_LABEL = {
  granted: '已允許',
  denied: '已拒絕',
  undetermined: '尚未詢問',
  unsupported: '此平台不支援',
} as const;

const STATE_STYLE = {
  granted: 'bg-success/15 border-success/40 text-success',
  denied: 'bg-danger/15 border-danger/40 text-danger',
  undetermined: 'bg-glass border-border/60 text-muted',
  unsupported: 'bg-glass border-border/60 text-muted',
} as const;

export default function PermissionsScreen() {
  const { items, request, refresh, pending } = useDevicePermissions();

  return (
    <Screen>
      <ScreenHeader
        back
        fallback="/settings"
        title="裝置權限"
        subtitle="檢查 App 使用到的系統權限"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="重新檢查權限"
            hitSlop={8}
            onPress={() => void refresh()}
            className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
          >
            <RefreshCw color="#8C8397" size={16} />
          </Pressable>
        }
      />

      <ScrollView contentContainerClassName="gap-6 px-4 pb-6">
        <View className="border-border/60 bg-surface/60 rounded-2xl border px-3.5 py-3">
          <Txt className="text-muted text-[11px] leading-4">
            JiMatch 只在需要時才會請求權限，你可以隨時在系統設定中調整。拒絕權限不影響基本瀏覽，
            但相關功能會停用（例如關閉相機後無法完成真人認證）。
          </Txt>
        </View>

        <Section title="功能權限">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            {items.map((item, index) => (
              <PermissionRow
                key={item.key}
                item={item}
                busy={pending === item.key}
                onRequest={() => void request(item.key)}
                last={index === items.length - 1}
              />
            ))}
          </View>
        </Section>

        <Section title="系統設定">
          <View className="gap-3">
            <OutlineButton label="開啟系統設定" onPress={() => void openSystemSettings()} />
            <Txt className="text-muted px-1 text-[11px] leading-4">
              已被拒絕的權限必須在系統設定中手動開啟。網頁版由瀏覽器自行控管權限。
            </Txt>
          </View>
        </Section>

        <Section title="資料與隱私">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            <PushRow
              label="隱私政策"
              hint="資料蒐集項目、保存期限與你的權利"
              onPress={() => router.push('/legal/privacy')}
            />
            <PushRow
              label="服務條款"
              hint="使用資格、實名認證、付費與退款規定"
              onPress={() => router.push('/legal/terms')}
            />
            <PushRow
              label="資料刪除與客服"
              hint="用聯絡表單提出刪除或查詢個資的請求"
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

function PermissionRow({
  item,
  busy,
  onRequest,
  last,
}: {
  item: PermissionInfo;
  busy: boolean;
  onRequest: () => void;
  last: boolean;
}) {
  const { icon: Icon, tint } = ICONS[item.key];
  const actionable = item.state === 'undetermined';

  return (
    <View
      className={cn(
        'flex-row items-center gap-3 px-4 py-3.5',
        last ? '' : 'border-border/40 border-b',
      )}
    >
      <View className="bg-glass h-9 w-9 items-center justify-center rounded-2xl">
        <Icon color={tint} size={17} />
      </View>
      <View className="flex-1 gap-0.5">
        <Txt className="text-foreground text-[14px]">{item.label}</Txt>
        <Txt className="text-muted text-[11px] leading-4">{item.purpose}</Txt>
      </View>
      {actionable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`請求${item.label}權限`}
          onPress={onRequest}
          disabled={busy}
          className={cn(
            'bg-accent rounded-full px-3 py-1.5 active:opacity-70',
            busy && 'opacity-50',
          )}
        >
          <Txt weight="medium" className="text-accent-foreground text-[11px]">
            {busy ? '請求中' : '允許'}
          </Txt>
        </Pressable>
      ) : (
        <View className={cn('rounded-full border px-2.5 py-1', STATE_STYLE[item.state])}>
          <Txt weight="medium" className={cn('text-[10px]', STATE_STYLE[item.state])}>
            {STATE_LABEL[item.state]}
          </Txt>
        </View>
      )}
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
