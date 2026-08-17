import { Button, Spinner } from 'heroui-native';
import {
  ArrowLeft,
  CheckCircle2,
  CircleSlash,
  Clock,
  Download,
  RefreshCw,
  TriangleAlert,
  Wrench,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { SectionHeading } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { applyAppUpdate } from '@/lib/appUpdate';
import { COLORS } from '@/lib/colors';
import { formatDate, formatRelativeTime } from '@/lib/format';
import {
  MESSAGES_KEEP_PER_CONVERSATION,
  NOTIFICATION_RETENTION_DAYS,
  runDeviceMaintenance,
  STALE_GIG_DAYS,
} from '@/lib/maintenance';
import { goBackOrReplace } from '@/lib/navigation';
import {
  type DeviceMaintenanceRun,
  type DeviceMaintenanceTask,
  MAINTENANCE_TRIGGER_LABEL,
  useMaintenanceStore,
} from '@/lib/stores/maintenance';

export default function MaintenanceScreen() {
  const runs = useMaintenanceStore((state) => state.runs);
  const running = useMaintenanceStore((state) => state.running);
  const updateStatus = useMaintenanceStore((state) => state.updateStatus);

  const [applying, setApplying] = useState(false);

  const latest = runs[0] ?? null;
  const history = runs.slice(1);

  const handleRunNow = () => {
    if (running) return;
    void runDeviceMaintenance('manual');
  };

  const handleApplyUpdate = () => {
    setApplying(true);
    void applyAppUpdate().finally(() => setApplying(false));
  };

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
          <Text className="text-ink text-[17px] font-semibold">系統維護</Text>
          <Text className="text-muted text-[12px]">每天開啟 App 時自動執行一次</Text>
        </View>
        {running ? <Spinner size="sm" /> : null}
      </View>

      <ScrollView
        contentContainerClassName="px-5 py-5 gap-5 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="border-hairline rounded-xl border bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="bg-brand-soft h-10 w-10 items-center justify-center rounded-xl">
              <Wrench size={18} color={COLORS.brandStrong} strokeWidth={2.1} />
            </View>
            <View className="flex-1">
              <Text className="text-ink text-[15px] font-semibold">
                {latest === null ? '尚未執行過維護' : '上次維護'}
              </Text>
              <Text className="text-muted mt-0.5 text-[12px]">
                {latest === null
                  ? '開啟 App 後會自動執行第一次維護。'
                  : `${formatRelativeTime(latest.at)}・${formatDate(latest.at)}・${MAINTENANCE_TRIGGER_LABEL[latest.trigger]}`}
              </Text>
            </View>
          </View>

          <View className="border-hairline mt-4 gap-3 border-t pt-4">
            <Button size="md" onPress={handleRunNow} isDisabled={running}>
              <Button.Label>{running ? '維護進行中…' : '立即執行維護'}</Button.Label>
            </Button>
            <Text className="text-muted text-[12px] leading-5">
              維護只處理這台裝置上的資料，不會刪除未讀通知或進行中的任務。
            </Text>
          </View>
        </View>

        {updateStatus === 'available' ? (
          <View className="border-brand/25 bg-brand-soft gap-3 rounded-xl border p-4">
            <View className="flex-row items-center gap-2">
              <Download size={17} color={COLORS.brandStrong} strokeWidth={2.2} />
              <Text className="text-ink flex-1 text-[15px] font-semibold">有新版本可以套用</Text>
            </View>
            <Text className="text-ink-soft text-[13px] leading-5">
              新版本已下載完成，重新啟動後即會套用。
            </Text>
            <Button size="md" onPress={handleApplyUpdate} isDisabled={applying}>
              <Button.Label>{applying ? '正在套用…' : '重新啟動並套用'}</Button.Label>
            </Button>
          </View>
        ) : null}

        {latest === null ? null : (
          <View className="gap-3">
            <SectionHeading
              title="上次維護結果"
              caption={`耗時 ${Math.max(1, Math.round(latest.durationMs / 100) / 10)} 秒`}
            />
            <View className="border-hairline overflow-hidden rounded-xl border bg-white">
              {latest.tasks.map((task, index) => (
                <View key={task.key}>
                  {index === 0 ? null : <View className="bg-hairline h-px" />}
                  <TaskRow task={task} />
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="border-hairline gap-2 rounded-xl border bg-white p-4">
          <Text className="text-ink text-[14px] font-semibold">維護內容</Text>
          <MaintenanceBullet text={`逾期 ${STALE_GIG_DAYS} 天仍未成交的任務自動結案，停止曝光。`} />
          <MaintenanceBullet text="每月第一次維護時重置免費版的新對話配額。" />
          <MaintenanceBullet
            text={`通知中心保留最近 ${NOTIFICATION_RETENTION_DAYS} 天的已讀通知，未讀通知一律保留。`}
          />
          <MaintenanceBullet
            text={`每則對話保留最近 ${MESSAGES_KEEP_PER_CONVERSATION} 條訊息，並清掉已消失對話的殘留訊息。`}
          />
          <MaintenanceBullet text="檢查是否有新版本，有的話先下載，由你決定何時重新啟動套用。" />
        </View>

        {history.length === 0 ? null : (
          <View className="gap-3">
            <SectionHeading title="維護紀錄" caption={`最近 ${history.length} 次`} />
            <View className="border-hairline overflow-hidden rounded-xl border bg-white">
              {history.map((run, index) => (
                <View key={run.id}>
                  {index === 0 ? null : <View className="bg-hairline h-px" />}
                  <HistoryRow run={run} />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TaskRow({ task }: { task: DeviceMaintenanceTask }) {
  const icon =
    task.status === 'failed' ? (
      <TriangleAlert size={16} color={COLORS.coral} strokeWidth={2.2} />
    ) : task.status === 'skipped' ? (
      <CircleSlash size={16} color={COLORS.muted} strokeWidth={2.2} />
    ) : (
      <CheckCircle2 size={16} color={COLORS.brand} strokeWidth={2.2} />
    );

  return (
    <View className="flex-row items-start gap-3 px-4 py-3.5">
      <View className="mt-0.5">{icon}</View>
      <View className="flex-1">
        <Text className="text-ink text-[14px] font-semibold">{task.label}</Text>
        <Text className="text-muted mt-0.5 text-[12px] leading-5">{task.message}</Text>
      </View>
      {task.affected > 0 ? <StaticTag label={`${task.affected} 筆`} tone="brand" /> : null}
    </View>
  );
}

function HistoryRow({ run }: { run: DeviceMaintenanceRun }) {
  const handled = run.tasks.reduce((total, task) => total + task.affected, 0);
  const failed = run.tasks.filter((task) => task.status === 'failed').length;

  return (
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      <Clock size={15} color={COLORS.muted} strokeWidth={2.1} />
      <View className="flex-1">
        <Text className="text-ink text-[13px] font-semibold">
          {formatDate(run.at)}・{MAINTENANCE_TRIGGER_LABEL[run.trigger]}
        </Text>
        <Text className="text-muted mt-0.5 text-[12px]">
          {handled === 0 ? '沒有需要處理的項目' : `處理 ${handled} 筆`}
          {failed > 0 ? `・${failed} 項失敗` : ''}
        </Text>
      </View>
      <Text className="text-muted text-[12px]">{formatRelativeTime(run.at)}</Text>
    </View>
  );
}

function MaintenanceBullet({ text }: { text: string }) {
  return (
    <View className="flex-row items-start gap-2">
      <RefreshCw size={13} color={COLORS.brandStrong} strokeWidth={2.2} />
      <Text className="text-ink-soft flex-1 text-[12px] leading-5">{text}</Text>
    </View>
  );
}
