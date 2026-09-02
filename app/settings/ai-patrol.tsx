import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Radar, ShieldCheck, Trash2 } from 'lucide-react-native';

import { AdminOnly } from '@/components/admin/AdminOnly';
import { GlowButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import {
  ChipButton,
  ChoiceChips,
  FieldBlock,
  IconBadge,
  SettingsGroup,
  SettingsToggle,
  StatTrio,
} from '@/components/ui/SettingsUI';
import { Txt } from '@/components/ui/Txt';
import {
  ACTION_HINT,
  ACTION_LABEL,
  PATROL_INTERVALS,
  SCOPE_LABEL,
  SENSITIVITY_HINT,
  SENSITIVITY_LABEL,
  SEVERITY_LABEL,
} from '@/lib/data/ai';
import { displayName } from '@/lib/data/profiles';
import { relativeTime } from '@/lib/format';
import { useAiStore } from '@/lib/stores/ai';
import { NEON } from '@/lib/theme';
import type { AiPatrolAction, AiPatrolScope, AiSensitivity, AiSeverity } from '@/lib/types';
import { cn } from '@/lib/utils';

const SCOPES: AiPatrolScope[] = ['moments', 'comments', 'chats', 'profiles'];

const SENSITIVITY_OPTIONS: { key: AiSensitivity; label: string }[] = [
  { key: 'loose', label: SENSITIVITY_LABEL.loose },
  { key: 'standard', label: SENSITIVITY_LABEL.standard },
  { key: 'strict', label: SENSITIVITY_LABEL.strict },
];

const ACTION_OPTIONS: { key: AiPatrolAction; label: string }[] = [
  { key: 'log', label: ACTION_LABEL.log },
  { key: 'queue', label: ACTION_LABEL.queue },
  { key: 'hide', label: ACTION_LABEL.hide },
];

const INTERVAL_OPTIONS = PATROL_INTERVALS.map((minutes) => ({
  key: String(minutes),
  label: minutes >= 60 ? `${minutes / 60} 小時` : `${minutes} 分鐘`,
}));

const SEVERITY_STYLE: Record<AiSeverity, { box: string; text: string }> = {
  low: { box: 'bg-glass border-border/60', text: 'text-muted' },
  medium: { box: 'bg-warning/15 border-warning/45', text: 'text-warning' },
  high: { box: 'bg-danger/15 border-danger/45', text: 'text-danger' },
};

/** AI 自動巡邏審核屬於營運工具，只有管理員能開啟。 */
export default function AiPatrolScreen() {
  return (
    <AdminOnly title="AI 自動巡邏審核">
      <AiPatrolContent />
    </AdminOnly>
  );
}

/** AI 自動巡邏審核：設定巡邏範圍與強度，並處理命中的內容。 */
function AiPatrolContent() {
  const patrol = useAiStore((state) => state.patrol);
  const findings = useAiStore((state) => state.findings);
  const runs = useAiStore((state) => state.runs);
  const lastPatrolAt = useAiStore((state) => state.lastPatrolAt);
  const setPatrol = useAiStore((state) => state.setPatrol);
  const togglePatrolScope = useAiStore((state) => state.togglePatrolScope);
  const runPatrol = useAiStore((state) => state.runPatrol);
  const resolveFinding = useAiStore((state) => state.resolveFinding);
  const clearFindings = useAiStore((state) => state.clearFindings);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ scanned: number; flagged: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const pending = findings.filter((item) => item.status === 'pending');
  const removed = findings.filter((item) => item.status === 'removed');
  const runRows = runs.slice(0, 6);

  const startPatrol = () => {
    if (busy) return;
    setBusy(true);
    timerRef.current = setTimeout(() => {
      setResult(runPatrol('manual'));
      setBusy(false);
    }, 700);
  };

  return (
    <Screen>
      <ScreenHeader back fallback="/settings" title="AI 自動巡邏審核" />

      <ScrollView contentContainerClassName="gap-6 px-4 pb-10">
        <View className="bg-surface border-border/60 gap-4 rounded-3xl border p-4">
          <View className="flex-row items-center gap-3">
            <IconBadge tint={NEON.coral}>
              <ShieldCheck color={NEON.coral} size={20} />
            </IconBadge>
            <View className="flex-1">
              <Txt weight="semibold" className="text-foreground text-[15px]">
                AI 巡邏員
              </Txt>
              <Txt className="text-muted mt-0.5 text-[11px]">
                {patrol.enabled
                  ? `每 ${patrol.intervalMinutes} 分鐘自動掃一次全站內容`
                  : '目前停用，只能手動巡邏'}
              </Txt>
            </View>
            <View
              className={cn(
                'rounded-full border px-2.5 py-1',
                patrol.enabled ? 'bg-success/15 border-success/45' : 'bg-glass border-border/60',
              )}
            >
              <Txt
                weight="medium"
                className={cn('text-[10px]', patrol.enabled ? 'text-success' : 'text-muted')}
              >
                {patrol.enabled ? '運行中' : '已停用'}
              </Txt>
            </View>
          </View>

          <StatTrio
            items={[
              { label: '待處理命中', value: `${pending.length}`, tint: NEON.amber },
              { label: '已下架', value: `${removed.length}` },
              {
                label: '上次巡邏',
                value: lastPatrolAt ? relativeTime(lastPatrolAt) : '尚未執行',
              },
            ]}
          />

          <GlowButton
            label={busy ? '巡邏中…' : '立即巡邏一次'}
            icon={<Radar color="#ffffff" size={16} />}
            loading={busy}
            onPress={startPatrol}
          />

          {result ? (
            <Txt className="text-muted text-center text-[11px]">
              掃描 {result.scanned} 筆內容，命中 {result.flagged} 筆
              {result.flagged > 0 ? '，已依設定處理' : '，沒有發現問題'}
            </Txt>
          ) : null}
        </View>

        <Section title="巡邏設定">
          <SettingsGroup>
            <SettingsToggle
              label="開啟自動巡邏"
              hint="App 開著的時候依間隔自動執行"
              value={patrol.enabled}
              onChange={(value) => setPatrol({ enabled: value })}
            />
            <SettingsToggle
              label="命中時通知我"
              hint="有可疑內容就推播提醒"
              value={patrol.notifyAdmin}
              onChange={(value) => setPatrol({ notifyAdmin: value })}
              last
            />
          </SettingsGroup>

          <View className="bg-surface border-border/60 gap-4 rounded-3xl border p-4">
            <FieldBlock label="巡邏間隔">
              <ChoiceChips
                options={INTERVAL_OPTIONS}
                value={String(patrol.intervalMinutes)}
                onChange={(next) => setPatrol({ intervalMinutes: Number(next) })}
              />
            </FieldBlock>

            <FieldBlock label="審核強度" hint={SENSITIVITY_HINT[patrol.sensitivity]}>
              <ChoiceChips
                options={SENSITIVITY_OPTIONS}
                value={patrol.sensitivity}
                onChange={(next) => setPatrol({ sensitivity: next })}
              />
            </FieldBlock>

            <FieldBlock label="命中後處理" hint={ACTION_HINT[patrol.action]}>
              <ChoiceChips
                options={ACTION_OPTIONS}
                value={patrol.action}
                onChange={(next) => setPatrol({ action: next })}
              />
            </FieldBlock>
          </View>
        </Section>

        <Section title="巡邏範圍" subtitle="至少要留一項才會掃到內容">
          <SettingsGroup>
            {SCOPES.map((scope, index) => (
              <SettingsToggle
                key={scope}
                label={SCOPE_LABEL[scope]}
                value={patrol.scopes.includes(scope)}
                onChange={() => togglePatrolScope(scope)}
                last={index === SCOPES.length - 1}
              />
            ))}
          </SettingsGroup>
        </Section>

        <Section
          title={`命中紀錄（${findings.length}）`}
          action={
            findings.length > 0 ? (
              <ChipButton
                label="清空"
                icon={<Trash2 color="#8C8397" size={13} />}
                onPress={clearFindings}
              />
            ) : undefined
          }
        >
          {findings.length === 0 ? (
            <View className="bg-surface border-border/60 rounded-3xl border p-4">
              <Txt className="text-muted text-[12px] leading-5">
                還沒有命中紀錄。按上面的「立即巡邏一次」可以馬上檢查站上目前的內容。
              </Txt>
            </View>
          ) : (
            <View className="gap-3">
              {findings.slice(0, 20).map((finding) => (
                <View
                  key={finding.id}
                  className="bg-surface border-border/60 gap-2.5 rounded-3xl border p-4"
                >
                  <View className="flex-row items-center gap-2">
                    <View
                      className={cn(
                        'rounded-full border px-2.5 py-1',
                        SEVERITY_STYLE[finding.severity].box,
                      )}
                    >
                      <Txt
                        weight="medium"
                        className={cn('text-[10px]', SEVERITY_STYLE[finding.severity].text)}
                      >
                        {SEVERITY_LABEL[finding.severity]}
                      </Txt>
                    </View>
                    <Txt className="text-muted flex-1 text-[11px]" numberOfLines={1}>
                      {SCOPE_LABEL[finding.scope]} · {displayName(finding.userId, '匿名用戶')}
                    </Txt>
                    <Txt className="text-muted text-[10px]">{relativeTime(finding.createdAt)}</Txt>
                  </View>

                  <Txt weight="medium" className="text-foreground text-[13px]">
                    {finding.rule}
                  </Txt>
                  <Txt className="text-muted text-[12px] leading-5">「{finding.excerpt}」</Txt>

                  {finding.status === 'pending' ? (
                    <View className="flex-row gap-2">
                      <ChipButton
                        label="判定沒問題"
                        tone="success"
                        className="flex-1"
                        onPress={() => resolveFinding(finding.id, true)}
                      />
                      <ChipButton
                        label={finding.momentId ? '下架這則內容' : '記為違規'}
                        tone="danger"
                        className="flex-1"
                        onPress={() => resolveFinding(finding.id, false)}
                      />
                    </View>
                  ) : (
                    <Txt className="text-muted text-[11px]">
                      {finding.status === 'kept' ? '已人工判定保留' : '已下架處理'}
                    </Txt>
                  )}
                </View>
              ))}
            </View>
          )}
        </Section>

        {runRows.length > 0 ? (
          <Section title="最近巡邏">
            <SettingsGroup>
              {runRows.map((run, index) => (
                <View
                  key={run.id}
                  className={cn(
                    'flex-row items-center gap-3 px-4 py-3',
                    index === runRows.length - 1 ? '' : 'border-border/40 border-b',
                  )}
                >
                  <View className="flex-1">
                    <Txt className="text-foreground text-[13px]">
                      {run.trigger === 'auto' ? '自動巡邏' : '手動巡邏'}
                    </Txt>
                    <Txt className="text-muted mt-0.5 text-[11px]">
                      掃描 {run.scanned} 筆 · 命中 {run.flagged} 筆
                    </Txt>
                  </View>
                  <Txt className="text-muted text-[11px]">{relativeTime(run.startedAt)}</Txt>
                </View>
              ))}
            </SettingsGroup>
          </Section>
        ) : null}

        <View className="border-border/60 bg-glass gap-1 rounded-3xl border px-4 py-3.5">
          <Txt weight="medium" className="text-foreground text-[12px]">
            關於 24 小時巡邏
          </Txt>
          <Txt className="text-muted text-[11px] leading-5">
            目前巡邏在 App 開啟時執行，命中會同步排進管理員平台的待審佇列。要做到全天候不間斷、
            以及送進真正的模型判讀圖片與語意，需要接上後端排程與模型服務。
          </Txt>
        </View>
      </ScrollView>
    </Screen>
  );
}
