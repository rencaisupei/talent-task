import { router } from 'expo-router';
import { Button, Switch } from 'heroui-native';
import { ArrowLeft, BellRing, Info, ShieldCheck } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { SectionHeading } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { goBackOrReplace } from '@/lib/navigation';
import {
  isPushSupported,
  pushDeviceLabel,
  requestPushPermission,
  sendTestPush,
  syncPushPermission,
} from '@/lib/push';
import { usePushPrefsStore } from '@/lib/stores/pushPrefs';
import { PUSH_CHANNEL_LABEL, type PushChannel } from '@/lib/types';

const CHANNEL_ORDER: PushChannel[] = [
  'chat',
  'call',
  'bid',
  'match',
  'review',
  'moderation',
  'system',
];

export default function NotificationSettingsScreen() {
  const enabled = usePushPrefsStore((state) => state.enabled);
  const setEnabled = usePushPrefsStore((state) => state.setEnabled);
  const permission = usePushPrefsStore((state) => state.permission);
  const channels = usePushPrefsStore((state) => state.channels);
  const toggleChannel = usePushPrefsStore((state) => state.toggleChannel);
  const showPreview = usePushPrefsStore((state) => state.showPreview);
  const setShowPreview = usePushPrefsStore((state) => state.setShowPreview);

  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    void syncPushPermission();
  }, []);

  const handleToggleEnabled = useCallback(
    (next: boolean) => {
      setEnabled(next);
      setTestResult(null);
      if (next) void requestPushPermission();
    },
    [setEnabled],
  );

  const handleTest = async () => {
    const delivered = await sendTestPush();
    setTestResult(
      delivered
        ? '測試推播已送出，請查看裝置通知列。'
        : isPushSupported
          ? '尚未取得系統推播權限，請於裝置設定開啟「即時發」的通知。'
          : '網頁版無法顯示裝置推播，請在 iOS 或 Android App 測試。',
    );
  };

  const permissionTag =
    permission === 'granted'
      ? { label: '權限已開啟', tone: 'brand' as const }
      : permission === 'denied'
        ? { label: '權限未開啟', tone: 'coral' as const }
        : permission === 'unsupported'
          ? { label: '此平台不支援', tone: 'neutral' as const }
          : { label: '尚未詢問權限', tone: 'neutral' as const };

  return (
    <View className="bg-background flex-1">
      <View className="border-hairline pt-safe-offset-3 flex-row items-center gap-3 border-b bg-white px-5 pb-4">
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)/profile')}
          accessibilityRole="button"
          accessibilityLabel="返回"
          className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
        >
          <ArrowLeft size={18} color={COLORS.ink} strokeWidth={2.2} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-ink text-[17px] font-semibold">推播通知設定</Text>
          <Text className="text-muted text-[12px]">{pushDeviceLabel()}</Text>
        </View>
        <StaticTag label={permissionTag.label} tone={permissionTag.tone} />
      </View>

      <ScrollView
        contentContainerClassName="px-5 py-5 gap-5 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="border-hairline rounded-xl border bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="bg-brand-soft h-10 w-10 items-center justify-center rounded-xl">
              <BellRing size={18} color={COLORS.brandStrong} strokeWidth={2.1} />
            </View>
            <View className="flex-1">
              <Text className="text-ink text-[15px] font-semibold">接收裝置推播</Text>
              <Text className="text-muted mt-0.5 text-[12px]">
                關閉後仍可在通知中心查看所有動態
              </Text>
            </View>
            <Switch isSelected={enabled} onSelectedChange={handleToggleEnabled} />
          </View>

          <View className="border-hairline mt-4 flex-row items-center gap-3 border-t pt-4">
            <View className="flex-1">
              <Text className="text-ink text-[14px] font-semibold">顯示訊息內容預覽</Text>
              <Text className="text-muted mt-0.5 text-[12px]">
                關閉後推播只顯示標題，不帶對話內容
              </Text>
            </View>
            <Switch isSelected={showPreview} onSelectedChange={setShowPreview} />
          </View>
        </View>

        <SectionHeading title="推播分類" caption="可分別決定哪些動態要即時通知你。" />

        <View className="border-hairline overflow-hidden rounded-xl border bg-white">
          {CHANNEL_ORDER.map((channel, index) => (
            <View key={channel}>
              {index > 0 ? <View className="bg-hairline h-px" /> : null}
              <View className="flex-row items-center gap-3 px-4 py-3.5">
                <View className="flex-1">
                  <Text className="text-ink text-[14px] font-semibold">
                    {PUSH_CHANNEL_LABEL[channel].title}
                  </Text>
                  <Text className="text-muted mt-0.5 text-[12px]">
                    {PUSH_CHANNEL_LABEL[channel].caption}
                  </Text>
                </View>
                <Switch
                  isSelected={enabled && channels[channel]}
                  isDisabled={!enabled}
                  onSelectedChange={() => toggleChannel(channel)}
                />
              </View>
            </View>
          ))}
        </View>

        <Button size="lg" variant="secondary" onPress={() => void handleTest()}>
          <Button.Label>送出測試推播</Button.Label>
        </Button>

        {testResult ? (
          <View className="border-hairline bg-canvas flex-row items-start gap-2 rounded-xl border px-4 py-3">
            <Info size={15} color={COLORS.brandStrong} strokeWidth={2.1} />
            <Text className="text-ink-soft flex-1 text-[12px] leading-5">{testResult}</Text>
          </View>
        ) : null}

        <View className="border-hairline bg-canvas flex-row items-start gap-2 rounded-xl border px-4 py-3">
          <ShieldCheck size={15} color={COLORS.brandStrong} strokeWidth={2.1} />
          <Text className="text-ink-soft flex-1 text-[12px] leading-5">
            推播內容不含金融資訊。平台不會以推播要求你匯款或提供帳戶資料，收到這類訊息請直接檢舉。
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/notifications')}
          accessibilityRole="button"
          className="border-hairline rounded-xl border bg-white px-4 py-3.5"
        >
          <Text className="text-brand-strong text-[14px] font-semibold">前往通知中心</Text>
          <Text className="text-muted mt-0.5 text-[12px]">查看所有提案、來電與審核紀錄</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
