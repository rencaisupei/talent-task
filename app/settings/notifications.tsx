import { ScrollView, View } from 'react-native';
import { Switch } from 'heroui-native';

import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { useNotificationsStore } from '@/lib/stores/notifications';
import { cn } from '@/lib/utils';

const ROWS = [
  { key: 'newMatches', label: '新配對', hint: '有人和你互相喜歡時通知' },
  { key: 'messages', label: '新訊息', hint: '收到訊息時推播' },
  { key: 'likes', label: '喜歡與超級喜歡', hint: '有人喜歡你時通知' },
  { key: 'calls', label: '通話與未接來電', hint: '來電、未接與通話結束提醒' },
  { key: 'moments', label: '動態互動', hint: '你的動態被按讚或留言' },
  { key: 'promotions', label: '優惠與活動', hint: '訂閱折扣、節慶活動' },
  { key: 'quietHours', label: '勿擾時段', hint: '凌晨 0 點到早上 8 點不推播' },
] as const;

export default function NotificationSettingsScreen() {
  const prefs = useNotificationsStore((state) => state.prefs);
  const setPref = useNotificationsStore((state) => state.setPref);

  return (
    <Screen>
      <ScreenHeader back fallback="/settings" title="通知" subtitle="只留下真正需要的提醒" />

      <ScrollView contentContainerClassName="gap-6 px-4 pb-10">
        <Section title="推播項目">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            {ROWS.map((row, index) => (
              <View
                key={row.key}
                className={cn(
                  'flex-row items-center gap-3 px-4 py-3.5',
                  index === ROWS.length - 1 ? '' : 'border-border/40 border-b',
                )}
              >
                <View className="flex-1">
                  <Txt className="text-foreground text-[14px]">{row.label}</Txt>
                  <Txt className="text-muted mt-0.5 text-[11px] leading-4">{row.hint}</Txt>
                </View>
                <Switch
                  isSelected={prefs[row.key]}
                  onSelectedChange={(value) => setPref(row.key, value)}
                />
              </View>
            ))}
          </View>
        </Section>

        <View className="bg-surface border-border/60 gap-2 rounded-3xl border p-4">
          <Txt weight="medium" className="text-foreground text-[13px]">
            系統層級權限
          </Txt>
          <Txt className="text-muted text-[11px] leading-5">
            這些開關只影響 JiMatch 內的通知類別。如果完全收不到推播，請到手機的系統設定確認已允許
            JiMatch 傳送通知。
          </Txt>
        </View>
      </ScrollView>
    </Screen>
  );
}
