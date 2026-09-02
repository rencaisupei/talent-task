import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Minus, Plus, Sparkles, Wand2 } from 'lucide-react-native';

import { AdminOnly } from '@/components/admin/AdminOnly';
import { GlowButton, OutlineButton } from '@/components/ui/GlowButton';
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
import { CADENCE_LABEL, KIND_LABEL, TONE_LABEL } from '@/lib/data/ai';
import { DARE_CARDS, QUICK_QUESTIONS, TRUTH_CARDS } from '@/lib/data/games';
import { relativeTime } from '@/lib/format';
import { useAiStore } from '@/lib/stores/ai';
import { NEON } from '@/lib/theme';
import type { AiCadence, AiContentKind, AiTone } from '@/lib/types';
import { cn } from '@/lib/utils';

const KINDS: AiContentKind[] = ['quick', 'truth', 'dare'];

const CADENCE_OPTIONS: { key: AiCadence; label: string }[] = [
  { key: 'manual', label: CADENCE_LABEL.manual },
  { key: 'daily', label: CADENCE_LABEL.daily },
  { key: 'weekly', label: CADENCE_LABEL.weekly },
];

const TONE_OPTIONS: { key: AiTone; label: string }[] = [
  { key: 'warm', label: TONE_LABEL.warm },
  { key: 'balanced', label: TONE_LABEL.balanced },
  { key: 'bold', label: TONE_LABEL.bold },
];

const MIN_BATCH = 2;
const MAX_BATCH = 12;

/** AI 出題與遊戲更新屬於營運工具，只有管理員能開啟。 */
export default function AiContentScreen() {
  return (
    <AdminOnly title="AI 出題與遊戲更新">
      <AiContentContent />
    </AdminOnly>
  );
}

/** AI 自動出遊戲題目：產生題目草稿、發佈後直接更新遊戲題庫。 */
function AiContentContent() {
  const content = useAiStore((state) => state.content);
  const drafts = useAiStore((state) => state.drafts);
  const published = useAiStore((state) => state.published);
  const updates = useAiStore((state) => state.updates);
  const contentVersion = useAiStore((state) => state.contentVersion);
  const lastPublishAt = useAiStore((state) => state.lastPublishAt);
  const setContent = useAiStore((state) => state.setContent);
  const toggleContentKind = useAiStore((state) => state.toggleContentKind);
  const generateDrafts = useAiStore((state) => state.generateDrafts);
  const publishDrafts = useAiStore((state) => state.publishDrafts);
  const rejectDraft = useAiStore((state) => state.rejectDraft);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const pendingDrafts = drafts.filter((draft) => draft.status === 'draft');
  const updateRows = updates.slice(0, 6);

  const generate = () => {
    if (busy) return;
    setBusy(true);
    timerRef.current = setTimeout(() => {
      const created = generateDrafts('manual');
      if (created.length === 0) {
        setNotice('素材組合已經用完，先發佈或略過現有草稿再產生新題目。');
      } else if (content.autoPublish) {
        publishDrafts(created, 'manual');
        setNotice(`產生並上線 ${created.length} 則新題目。`);
      } else {
        setNotice(`產生 ${created.length} 則草稿，確認後再發佈。`);
      }
      setBusy(false);
    }, 700);
  };

  const publishAll = () => {
    const count = publishDrafts(
      pendingDrafts.map((draft) => draft.id),
      'manual',
    );
    setNotice(count > 0 ? `已發佈 ${count} 則題目並更新遊戲。` : '目前沒有待發佈的草稿。');
  };

  return (
    <Screen>
      <ScreenHeader back fallback="/settings" title="AI 出題與遊戲更新" />

      <ScrollView contentContainerClassName="gap-6 px-4 pb-10">
        <View className="bg-surface border-border/60 gap-4 rounded-3xl border p-4">
          <View className="flex-row items-center gap-3">
            <IconBadge tint={NEON.violet}>
              <Sparkles color={NEON.violet} size={20} />
            </IconBadge>
            <View className="flex-1">
              <Txt weight="semibold" className="text-foreground text-[15px]">
                AI 題庫產生器
              </Txt>
              <Txt className="text-muted mt-0.5 text-[11px]">
                {content.enabled
                  ? `${CADENCE_LABEL[content.cadence]}產生 ${content.batchSize} 則，${content.autoPublish ? '自動上線' : '需人工發佈'}`
                  : '目前停用，只能手動產生'}
              </Txt>
            </View>
            <View
              className={cn(
                'rounded-full border px-2.5 py-1',
                content.enabled ? 'bg-success/15 border-success/45' : 'bg-glass border-border/60',
              )}
            >
              <Txt
                weight="medium"
                className={cn('text-[10px]', content.enabled ? 'text-success' : 'text-muted')}
              >
                {content.enabled ? '運行中' : '已停用'}
              </Txt>
            </View>
          </View>

          <StatTrio
            items={[
              { label: '題庫版本', value: `v${contentVersion}`, tint: NEON.cyan },
              { label: '待發佈草稿', value: `${pendingDrafts.length}`, tint: NEON.amber },
              {
                label: '上次更新',
                value: lastPublishAt ? relativeTime(lastPublishAt) : '尚未更新',
              },
            ]}
          />

          <View className="gap-2.5">
            <GlowButton
              label={busy ? '產生中…' : `立即產生 ${content.batchSize} 則`}
              icon={<Wand2 color="#ffffff" size={16} />}
              loading={busy}
              onPress={generate}
            />
            <OutlineButton
              label="全部發佈並更新遊戲"
              disabled={pendingDrafts.length === 0}
              onPress={publishAll}
            />
          </View>

          {notice ? (
            <Txt className="text-muted text-center text-[11px] leading-4">{notice}</Txt>
          ) : null}
        </View>

        <Section title="產生設定">
          <SettingsGroup>
            <SettingsToggle
              label="開啟自動出題"
              hint="依頻率自動補新題目進題庫"
              value={content.enabled}
              onChange={(value) => setContent({ enabled: value })}
            />
            <SettingsToggle
              label="產生後自動上線"
              hint="關閉時要人工按發佈才會進遊戲"
              value={content.autoPublish}
              onChange={(value) => setContent({ autoPublish: value })}
              last
            />
          </SettingsGroup>

          <View className="bg-surface border-border/60 gap-4 rounded-3xl border p-4">
            <FieldBlock label="產生頻率">
              <ChoiceChips
                options={CADENCE_OPTIONS}
                value={content.cadence}
                onChange={(next) => setContent({ cadence: next })}
              />
            </FieldBlock>

            <FieldBlock label="題目語氣" hint="大膽會出現更直接、更曖昧的題目">
              <ChoiceChips
                options={TONE_OPTIONS}
                value={content.tone}
                onChange={(next) => setContent({ tone: next })}
              />
            </FieldBlock>

            <FieldBlock label="每批數量">
              <View className="flex-row items-center gap-3">
                <ChipButton
                  label="減少"
                  icon={<Minus color="#8C8397" size={14} />}
                  disabled={content.batchSize <= MIN_BATCH}
                  onPress={() => setContent({ batchSize: content.batchSize - 1 })}
                />
                <Txt weight="bold" className="text-foreground w-10 text-center text-[16px]">
                  {content.batchSize}
                </Txt>
                <ChipButton
                  label="增加"
                  icon={<Plus color="#8C8397" size={14} />}
                  disabled={content.batchSize >= MAX_BATCH}
                  onPress={() => setContent({ batchSize: content.batchSize + 1 })}
                />
              </View>
            </FieldBlock>
          </View>
        </Section>

        <Section title="產生類型" subtitle="至少要留一種才會產生題目">
          <SettingsGroup>
            {KINDS.map((kind, index) => (
              <SettingsToggle
                key={kind}
                label={KIND_LABEL[kind]}
                value={content.kinds.includes(kind)}
                onChange={() => toggleContentKind(kind)}
                last={index === KINDS.length - 1}
              />
            ))}
          </SettingsGroup>
        </Section>

        <Section title={`待發佈草稿（${pendingDrafts.length}）`}>
          {pendingDrafts.length === 0 ? (
            <View className="bg-surface border-border/60 rounded-3xl border p-4">
              <Txt className="text-muted text-[12px] leading-5">
                目前沒有草稿。按「立即產生」就會依語氣重新組合出新題目。
              </Txt>
            </View>
          ) : (
            <View className="gap-3">
              {pendingDrafts.map((draft) => (
                <View
                  key={draft.id}
                  className="bg-surface border-border/60 gap-2.5 rounded-3xl border p-4"
                >
                  <View className="flex-row items-center gap-2">
                    <View className="bg-accent-soft border-accent/40 rounded-full border px-2.5 py-1">
                      <Txt weight="medium" className="text-accent text-[10px]">
                        {KIND_LABEL[draft.kind]}
                      </Txt>
                    </View>
                    <Txt className="text-muted flex-1 text-[10px]">
                      {relativeTime(draft.createdAt)}產生
                    </Txt>
                  </View>

                  <Txt className="text-foreground text-[13px] leading-5">{draft.text}</Txt>

                  {draft.options ? (
                    <View className="flex-row gap-2">
                      {draft.options.map((option) => (
                        <View
                          key={option}
                          className="bg-glass border-border/50 flex-1 rounded-2xl border px-3 py-2"
                        >
                          <Txt className="text-muted text-[11px]" numberOfLines={2}>
                            {option}
                          </Txt>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <View className="flex-row gap-2">
                    <ChipButton
                      label="發佈上線"
                      tone="primary"
                      className="flex-1"
                      onPress={() => publishDrafts([draft.id], 'manual')}
                    />
                    <ChipButton
                      label="略過"
                      className="flex-1"
                      onPress={() => rejectDraft(draft.id)}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </Section>

        <Section title="目前上線題庫">
          <SettingsGroup>
            <ContentCountRow
              label={KIND_LABEL.quick}
              base={QUICK_QUESTIONS.length}
              added={published.quick.length}
            />
            <ContentCountRow
              label={KIND_LABEL.truth}
              base={TRUTH_CARDS.length}
              added={published.truth.length}
            />
            <ContentCountRow
              label={KIND_LABEL.dare}
              base={DARE_CARDS.length}
              added={published.dare.length}
              last
            />
          </SettingsGroup>
        </Section>

        {updateRows.length > 0 ? (
          <Section title="更新紀錄">
            <SettingsGroup>
              {updateRows.map((entry, index) => (
                <View
                  key={entry.id}
                  className={cn(
                    'flex-row items-center gap-3 px-4 py-3',
                    index === updateRows.length - 1 ? '' : 'border-border/40 border-b',
                  )}
                >
                  <View className="flex-1">
                    <Txt className="text-foreground text-[13px]">
                      v{entry.version} · {entry.trigger === 'auto' ? '自動更新' : '手動更新'}
                    </Txt>
                    <Txt className="text-muted mt-0.5 text-[11px]">
                      {KINDS.filter((kind) => entry.counts[kind] > 0)
                        .map((kind) => `${KIND_LABEL[kind]} ${entry.counts[kind]}`)
                        .join(' · ')}
                    </Txt>
                  </View>
                  <Txt className="text-muted text-[11px]">{relativeTime(entry.createdAt)}</Txt>
                </View>
              ))}
            </SettingsGroup>
          </Section>
        ) : null}

        <View className="border-border/60 bg-glass gap-1 rounded-3xl border px-4 py-3.5">
          <Txt weight="medium" className="text-foreground text-[12px]">
            題目怎麼來的
          </Txt>
          <Txt className="text-muted text-[11px] leading-5">
            目前用內建素材依語氣重新組合，會自動避開重複題目，發佈後極速開局、大富翁與派對房
            立刻使用新題庫。要改成呼叫線上模型生成，需要接上後端與模型金鑰。
          </Txt>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ContentCountRow({
  label,
  base,
  added,
  last = false,
}: {
  label: string;
  base: number;
  added: number;
  last?: boolean;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-3 px-4 py-3',
        last ? '' : 'border-border/40 border-b',
      )}
    >
      <Txt className="text-foreground flex-1 text-[14px]">{label}</Txt>
      <Txt className="text-muted text-[12px]">
        內建 {base} 則{added > 0 ? ` · AI +${added}` : ''}
      </Txt>
    </View>
  );
}
