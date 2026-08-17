import { Button, Spinner } from 'heroui-native';
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Server,
  Smartphone,
  TriangleAlert,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ReadOnlyNotice } from '@/components/admin/ReadOnlyNotice';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { SectionHeading } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import {
  adminFetchMaintenanceConfig,
  adminFetchMaintenanceRuns,
  adminRotateMaintenanceKey,
  adminRunMaintenance,
  MAINTENANCE_RUN_STATUS_LABEL,
  MAINTENANCE_SOURCE_LABEL,
  type MaintenanceRunRecord,
  type MaintenanceScheduleConfig,
} from '@/lib/adminApi';
import { COLORS } from '@/lib/colors';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { taipeiDayKey } from '@/lib/maintenance';
import { useAdminAuthStore, useAdminCan } from '@/lib/stores/adminAuth';

const FORBIDDEN_MESSAGE = '你的角色沒有執行系統維護的權限。';

export default function AdminMaintenanceScreen() {
  const token = useAdminAuthStore((state) => state.token);
  const refreshSession = useAdminAuthStore((state) => state.refreshSession);
  const canRun = useAdminCan('maintenance:run');
  const canManageKey = useAdminCan('admins:manage');
  const logAction = useAuditLogger();

  const [runs, setRuns] = useState<MaintenanceRunRecord[]>([]);
  const [config, setConfig] = useState<MaintenanceScheduleConfig | null>(null);
  const [keyVisible, setKeyVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rotateVisible, setRotateVisible] = useState(false);

  const load = useCallback(async () => {
    if (token === null) return;

    setLoading(true);
    const result = await adminFetchMaintenanceRuns(token, 30);
    setLoading(false);

    if (result.kind === 'ok') {
      setRuns(result.runs);
      setExpandedId(result.runs[0]?.id ?? null);
      setError(null);
      return;
    }
    if (result.kind === 'expired') {
      void refreshSession();
      setError('登入狀態已過期，請重新登入。');
      return;
    }
    setError(result.kind === 'forbidden' ? '你的角色沒有檢視維護紀錄的權限。' : result.message);
  }, [refreshSession, token]);

  const loadConfig = useCallback(async () => {
    if (token === null || !canManageKey) return;

    const result = await adminFetchMaintenanceConfig(token);
    if (result.kind === 'ok') setConfig(result.config);
  }, [canManageKey, token]);

  useEffect(() => {
    void load();
    void loadConfig();
  }, [load, loadConfig]);

  const today = taipeiDayKey();
  const latest = runs[0] ?? null;
  const ranToday = runs.some((run) => run.dayKey === today);

  const handleRun = async (force: boolean) => {
    if (token === null || running) return;

    setRunning(true);
    setError(null);
    setNotice(null);
    const result = await adminRunMaintenance(token, force);
    setRunning(false);

    if (result.kind === 'ok') {
      logAction({
        kind: 'maintenance',
        summary: force ? '手動重新執行伺服器端每日維護' : '手動執行伺服器端每日維護',
        targetId: result.run.id,
        targetLabel: result.run.dayKey,
      });
      setNotice(
        `維護完成（${MAINTENANCE_RUN_STATUS_LABEL[result.run.status]}），共處理 ${result.run.tasks.reduce((total, task) => total + task.affected, 0)} 筆資料。`,
      );
      await load();
      return;
    }

    if (result.kind === 'skipped') {
      setNotice(`${result.message}若要重新執行，請按下方「仍要重新執行」。`);
      if (result.run !== null) await load();
      return;
    }

    if (result.kind === 'expired') {
      void refreshSession();
      setError('登入狀態已過期，請重新登入。');
      return;
    }

    setError(result.kind === 'forbidden' ? FORBIDDEN_MESSAGE : result.message);
  };

  const handleRotate = async () => {
    setRotateVisible(false);
    if (token === null) return;

    const result = await adminRotateMaintenanceKey(token);
    if (result.kind === 'ok') {
      setConfig(result.config);
      setKeyVisible(true);
      setNotice('已重新產生排程金鑰，請同步更新排程服務的設定，舊金鑰已失效。');
      logAction({ kind: 'maintenance', summary: '重新產生每日維護的排程金鑰' });
      return;
    }

    if (result.kind === 'expired') {
      void refreshSession();
      setError('登入狀態已過期，請重新登入。');
      return;
    }
    setError(result.kind === 'forbidden' ? FORBIDDEN_MESSAGE : result.message);
  };

  return (
    <View className="bg-background flex-1">
      <AdminHeader
        title="每日系統維護"
        caption="伺服器端排程與維護紀錄"
        right={running || loading ? <Spinner size="sm" /> : undefined}
      />

      <ScrollView
        contentContainerClassName="px-5 py-5 pb-12 gap-5"
        showsVerticalScrollIndicator={false}
      >
        {error === null ? null : (
          <View className="border-coral/25 bg-coral-soft flex-row items-start gap-2 rounded-xl border px-4 py-3">
            <TriangleAlert size={15} color={COLORS.coral} strokeWidth={2.2} />
            <Text className="text-ink-soft flex-1 text-[12px] leading-5">{error}</Text>
          </View>
        )}

        {notice === null ? null : (
          <View className="border-brand/25 bg-brand-soft flex-row items-start gap-2 rounded-xl border px-4 py-3">
            <CheckCircle2 size={15} color={COLORS.brandStrong} strokeWidth={2.2} />
            <Text className="text-ink-soft flex-1 text-[12px] leading-5">{notice}</Text>
          </View>
        )}

        <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="bg-brand-soft h-10 w-10 items-center justify-center rounded-xl">
              <Server size={18} color={COLORS.brandStrong} strokeWidth={2.1} />
            </View>
            <View className="flex-1">
              <Text className="text-ink text-[15px] font-semibold">
                {ranToday ? '今天已完成維護' : '今天尚未執行維護'}
              </Text>
              <Text className="text-muted mt-0.5 text-[12px]">
                {latest === null
                  ? '尚無任何維護紀錄。'
                  : `上次 ${formatRelativeTime(latest.at)}・${MAINTENANCE_SOURCE_LABEL[latest.source]}・${MAINTENANCE_RUN_STATUS_LABEL[latest.status]}`}
              </Text>
            </View>
            <StaticTag label={ranToday ? '已完成' : '待執行'} tone={ranToday ? 'brand' : 'coral'} />
          </View>

          {canRun ? (
            <View className="border-hairline gap-2 border-t pt-3">
              <Button size="md" onPress={() => void handleRun(false)} isDisabled={running}>
                <Button.Label>{running ? '維護進行中…' : '執行今天的維護'}</Button.Label>
              </Button>
              {ranToday ? (
                <Button
                  size="md"
                  variant="tertiary"
                  onPress={() => void handleRun(true)}
                  isDisabled={running}
                >
                  <Button.Label>仍要重新執行</Button.Label>
                </Button>
              ) : null}
              <Text className="text-muted text-[12px] leading-5">
                伺服器端維護會清除過期的管理員工作階段、解除到期的帳號鎖定、清理 90 天前的登入紀錄與
                180 天前的維護紀錄。
              </Text>
            </View>
          ) : (
            <View className="border-hairline border-t pt-3">
              <ReadOnlyNotice permission="maintenance:run" action="手動執行系統維護" />
            </View>
          )}
        </View>

        {canManageKey ? (
          <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
            <SectionHeading
              title="排程設定"
              caption="讓外部排程服務每天固定呼叫一次，不必等管理員登入。"
            />

            {config === null ? (
              <Text className="text-muted text-[12px] leading-5">
                讀取排程設定中…若持續顯示，請確認後端連線設定。
              </Text>
            ) : (
              <View className="gap-3">
                <View className="border-hairline bg-canvas gap-1 rounded-xl border px-3 py-2.5">
                  <Text className="text-muted text-[11px]">呼叫網址（GET 或 POST）</Text>
                  <Text className="text-ink text-[12px] leading-5">{config.endpoint}</Text>
                </View>

                <View className="border-hairline bg-canvas gap-1 rounded-xl border px-3 py-2.5">
                  <View className="flex-row items-center gap-2">
                    <KeyRound size={13} color={COLORS.muted} strokeWidth={2.2} />
                    <Text className="text-muted flex-1 text-[11px]">
                      排程金鑰（標頭 x-maintenance-key）
                    </Text>
                    <Pressable
                      onPress={() => setKeyVisible((visible) => !visible)}
                      accessibilityRole="button"
                      accessibilityLabel={keyVisible ? '隱藏金鑰' : '顯示金鑰'}
                    >
                      {keyVisible ? (
                        <EyeOff size={15} color={COLORS.ink} strokeWidth={2.2} />
                      ) : (
                        <Eye size={15} color={COLORS.ink} strokeWidth={2.2} />
                      )}
                    </Pressable>
                  </View>
                  <Text className="text-ink text-[12px] leading-5">
                    {keyVisible ? config.cronKey : '••••••••••••••••••••••••'}
                  </Text>
                  <Text className="text-muted text-[11px]">
                    最後更新 {formatDate(config.rotatedAt)}
                    {config.envKeyConfigured ? '・另有環境變數金鑰可用' : ''}
                  </Text>
                </View>

                <View className="flex-row gap-2">
                  <Button
                    size="sm"
                    variant="tertiary"
                    className="flex-1"
                    onPress={() => setKeyVisible((visible) => !visible)}
                  >
                    <Button.Label>{keyVisible ? '隱藏金鑰' : '顯示金鑰'}</Button.Label>
                  </Button>
                  <Button
                    size="sm"
                    variant="tertiary"
                    className="flex-1"
                    onPress={() => setRotateVisible(true)}
                  >
                    <Button.Label>重新產生</Button.Label>
                  </Button>
                </View>

                <View className="flex-row items-start gap-2">
                  <Copy size={13} color={COLORS.brandStrong} strokeWidth={2.2} />
                  <Text className="text-ink-soft flex-1 text-[12px] leading-5">
                    在排程服務（例如 cron-job.org 或任何每日排程）設定每天呼叫一次上面的網址，並帶上
                    x-maintenance-key 標頭。同一天重複呼叫不會重跑，會直接回報已完成。
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : null}

        <View className="border-hairline flex-row items-start gap-2 rounded-xl border bg-white p-4">
          <Smartphone size={15} color={COLORS.brandStrong} strokeWidth={2.2} />
          <Text className="text-ink-soft flex-1 text-[12px] leading-5">
            手機 App
            的維護（逾期任務自動結案、通知與對話紀錄清理、配額重置、版本更新檢查）在使用者裝置上每天執行一次，紀錄留在該裝置的「帳戶
            → 系統維護」，不會出現在這裡。
          </Text>
        </View>

        <View className="gap-3">
          <SectionHeading title="維護紀錄" caption={`最近 ${runs.length} 次伺服器端維護`} />

          {runs.length === 0 ? (
            <View className="border-hairline items-center gap-2 rounded-xl border bg-white px-4 py-8">
              <RefreshCw size={20} color={COLORS.muted} strokeWidth={2.1} />
              <Text className="text-ink text-[14px] font-semibold">尚無維護紀錄</Text>
              <Text className="text-muted text-center text-[12px] leading-5">
                設定排程或按上方「執行今天的維護」後，紀錄會出現在這裡。
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {runs.map((run) => (
                <RunCard
                  key={run.id}
                  run={run}
                  expanded={expandedId === run.id}
                  onToggle={() => setExpandedId(expandedId === run.id ? null : run.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ConfirmSheet
        visible={rotateVisible}
        title="重新產生排程金鑰？"
        message="舊金鑰會立即失效，正在使用舊金鑰的排程服務會呼叫失敗，需要同步更新設定。"
        actions={[{ id: 'rotate', label: '確認重新產生', tone: 'danger' }]}
        onSelect={() => void handleRotate()}
        onCancel={() => setRotateVisible(false)}
      />
    </View>
  );
}

interface RunCardProps {
  run: MaintenanceRunRecord;
  expanded: boolean;
  onToggle: () => void;
}

function RunCard({ run, expanded, onToggle }: RunCardProps) {
  const handled = run.tasks.reduce((total, task) => total + task.affected, 0);
  const failed = run.tasks.filter((task) => task.status === 'failed').length;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      className="border-hairline gap-2 rounded-xl border bg-white p-4"
    >
      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="text-ink text-[14px] font-semibold">
            {formatDate(run.at)}・{MAINTENANCE_SOURCE_LABEL[run.source]}
          </Text>
          <Text className="text-muted mt-0.5 text-[12px]">
            {formatRelativeTime(run.at)}・處理 {handled} 筆・耗時{' '}
            {Math.max(1, Math.round(run.durationMs / 100) / 10)} 秒
            {run.triggeredBy === null ? '' : `・${run.triggeredBy}`}
          </Text>
        </View>
        <StaticTag
          label={MAINTENANCE_RUN_STATUS_LABEL[run.status]}
          tone={run.status === 'ok' ? 'brand' : 'coral'}
        />
      </View>

      {expanded ? (
        <View className="border-hairline gap-2 border-t pt-2">
          {run.tasks.map((task) => (
            <View key={task.key} className="flex-row items-start gap-2">
              {task.status === 'failed' ? (
                <TriangleAlert size={14} color={COLORS.coral} strokeWidth={2.2} />
              ) : (
                <CheckCircle2 size={14} color={COLORS.brand} strokeWidth={2.2} />
              )}
              <View className="flex-1">
                <Text className="text-ink text-[12px] font-semibold">{task.label}</Text>
                <Text className="text-muted text-[12px] leading-5">{task.message}</Text>
              </View>
            </View>
          ))}
          {run.note === null ? null : (
            <Text className="text-muted text-[11px]">備註：{run.note}</Text>
          )}
        </View>
      ) : (
        <Text className="text-muted text-[11px]">
          {failed > 0 ? `${failed} 項失敗・` : ''}點一下查看每項維護結果
        </Text>
      )}
    </Pressable>
  );
}
