import { useState } from 'react';
import { Lock } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { Switch } from 'heroui-native';

import { UpgradeSheet } from '@/components/subscription/UpgradeSheet';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { useAuthStore } from '@/lib/stores/auth';
import { useEntitlements } from '@/lib/stores/subscription';
import { NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';

export default function PrivacySettingsScreen() {
  const incognito = useAuthStore((state) => state.incognito);
  const showOnlineStatus = useAuthStore((state) => state.showOnlineStatus);
  const showDistance = useAuthStore((state) => state.showDistance);
  const setPrivacy = useAuthStore((state) => state.setPrivacy);
  const entitlements = useEntitlements();

  const [hideAge, setHideAge] = useState(false);
  const [momentsMatchesOnly, setMomentsMatchesOnly] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [paywall, setPaywall] = useState(false);

  return (
    <Screen>
      <ScreenHeader back fallback="/settings" title="隱私與可見度" subtitle="控制別人能看到什麼" />

      <ScrollView contentContainerClassName="gap-6 px-4 pb-10">
        <Section title="瀏覽方式">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            <ToggleRow
              label="隱身瀏覽"
              hint="看別人的檔案時不留下訪客紀錄"
              value={incognito && entitlements.incognito}
              locked={!entitlements.incognito}
              onChange={(value) => {
                if (!entitlements.incognito) {
                  setPaywall(true);
                  return;
                }
                setPrivacy({ incognito: value });
              }}
            />
            <ToggleRow
              label="顯示線上狀態"
              hint="關閉後別人看不到你是否在線"
              value={showOnlineStatus}
              onChange={(value) => setPrivacy({ showOnlineStatus: value })}
            />
            <ToggleRow
              label="顯示距離"
              hint="關閉後只顯示城市，不顯示公里數"
              value={showDistance}
              onChange={(value) => setPrivacy({ showDistance: value })}
              last
            />
          </View>
        </Section>

        <Section title="檔案資訊">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            <ToggleRow
              label="隱藏年齡"
              hint="仍會用於年齡篩選，只是不顯示數字"
              value={hideAge}
              onChange={setHideAge}
            />
            <ToggleRow
              label="動態只給配對看"
              hint="非配對的人不會在動態頁看到你"
              value={momentsMatchesOnly}
              onChange={setMomentsMatchesOnly}
              last
            />
          </View>
        </Section>

        <Section title="聊天">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            <ToggleRow
              label="傳送已讀回執"
              hint={
                entitlements.readReceipts
                  ? '關閉後你也看不到對方的已讀狀態'
                  : '已讀回執是 Plus 會員功能'
              }
              value={readReceipts && entitlements.readReceipts}
              locked={!entitlements.readReceipts}
              onChange={(value) => {
                if (!entitlements.readReceipts) {
                  setPaywall(true);
                  return;
                }
                setReadReceipts(value);
              }}
              last
            />
          </View>
        </Section>

        <View className="bg-surface border-border/60 gap-2 rounded-3xl border p-4">
          <Txt weight="medium" className="text-foreground text-[13px]">
            關於位置資料
          </Txt>
          <Txt className="text-muted text-[11px] leading-5">
            我們只儲存大致距離，不會保留你的精確座標，也不會把位置資料提供給其他使用者或第三方。
          </Txt>
        </View>
      </ScrollView>

      <UpgradeSheet
        visible={paywall}
        onClose={() => setPaywall(false)}
        title="這是會員功能"
        description="隱身瀏覽與已讀回執需要付費方案才能開啟。"
        bullets={['隱身瀏覽（VIP）', '已讀回執（Plus）', '無限喜歡', '看見喜歡你的人']}
      />
    </Screen>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
  locked = false,
  last = false,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  locked?: boolean;
  last?: boolean;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-3 px-4 py-3.5',
        last ? '' : 'border-border/40 border-b',
      )}
    >
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Txt className="text-foreground text-[14px]">{label}</Txt>
          {locked ? <Lock color={NEON.amber} size={12} /> : null}
        </View>
        {hint ? <Txt className="text-muted mt-0.5 text-[11px] leading-4">{hint}</Txt> : null}
      </View>
      {locked ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} 需要升級`}
          onPress={() => onChange(true)}
          className="bg-glass border-border/60 rounded-full border px-3 py-1.5 active:opacity-70"
        >
          <Txt className="text-neon-amber text-[11px]">升級</Txt>
        </Pressable>
      ) : (
        <Switch isSelected={value} onSelectedChange={onChange} />
      )}
    </View>
  );
}
