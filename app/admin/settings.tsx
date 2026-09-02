import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { X } from 'lucide-react-native';

import { AdminScreen } from '@/components/admin/AdminScreen';
import {
  ActionButton,
  AdminField,
  AdminGroup,
  AdminInput,
  DataRow,
  FilterChips,
  StatusPill,
  ToggleRow,
} from '@/components/admin/AdminUI';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { ADMIN_ACCOUNTS, ADMIN_ROLE_LABEL } from '@/lib/data/admin';
import { relativeTime } from '@/lib/format';
import { useAdminStore } from '@/lib/stores/admin';
import { NEON } from '@/lib/theme';

const MULTIPLIER_OPTIONS = [
  { key: '1', label: '1 倍' },
  { key: '1.5', label: '1.5 倍' },
  { key: '2', label: '2 倍' },
] as const;

type MultiplierKey = (typeof MULTIPLIER_OPTIONS)[number]['key'];

function toMultiplierKey(value: number): MultiplierKey {
  const match = MULTIPLIER_OPTIONS.find((option) => Number(option.key) === value);
  return match?.key ?? '1';
}

export default function AdminSettingsScreen() {
  const flags = useAdminStore((state) => state.flags);
  const setFlag = useAdminStore((state) => state.setFlag);
  const addBannedWord = useAdminStore((state) => state.addBannedWord);
  const removeBannedWord = useAdminStore((state) => state.removeBannedWord);

  const [notice, setNotice] = useState(flags.maintenanceNotice);
  const [minVersion, setMinVersion] = useState(flags.minVersion);
  const [coinRate, setCoinRate] = useState(String(flags.coinRate));
  const [word, setWord] = useState('');

  const multiplierKey = toMultiplierKey(flags.rewardMultiplier);

  const submitWord = () => {
    addBannedWord(word);
    setWord('');
  };

  return (
    <AdminScreen title="系統設定" subtitle="功能旗標與營運參數">
      <Section title="服務狀態">
        <AdminGroup>
          <ToggleRow
            label="維護模式"
            hint="開啟後前台顯示維護公告"
            value={flags.maintenance}
            onChange={(value) => setFlag('maintenance', value)}
          />
          <ToggleRow
            label="開放新註冊"
            value={flags.registrationOpen}
            onChange={(value) => setFlag('registrationOpen', value)}
          />
          <ToggleRow
            label="強制真人認證"
            hint="未完成認證的帳號無法配對與開局"
            value={flags.requireIdVerification}
            onChange={(value) => setFlag('requireIdVerification', value)}
            last
          />
        </AdminGroup>
      </Section>

      <Section title="功能開關">
        <AdminGroup>
          <ToggleRow
            label="動態牆"
            value={flags.momentsEnabled}
            onChange={(value) => setFlag('momentsEnabled', value)}
          />
          <ToggleRow
            label="語音／視訊通話"
            value={flags.callsEnabled}
            onChange={(value) => setFlag('callsEnabled', value)}
          />
          <ToggleRow
            label="禮物商店"
            value={flags.giftsEnabled}
            onChange={(value) => setFlag('giftsEnabled', value)}
          />
          <ToggleRow
            label="自動審核"
            hint="命中敏感詞的內容自動排入待審佇列"
            value={flags.autoModeration}
            onChange={(value) => setFlag('autoModeration', value)}
            last
          />
        </AdminGroup>
      </Section>

      <Section title="遊戲參數">
        <View className="bg-surface border-border/60 gap-4 rounded-3xl border p-4">
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Txt className="text-foreground text-[14px]">體力回復間隔</Txt>
              <Txt weight="semibold" className="text-accent text-[13px]">
                {flags.staminaRegenMinutes} 分鐘 / 點
              </Txt>
            </View>
            <View className="flex-row gap-2">
              <ActionButton
                label="-1 分鐘"
                disabled={flags.staminaRegenMinutes <= 1}
                onPress={() =>
                  setFlag('staminaRegenMinutes', Math.max(1, flags.staminaRegenMinutes - 1))
                }
              />
              <ActionButton
                label="+1 分鐘"
                onPress={() => setFlag('staminaRegenMinutes', flags.staminaRegenMinutes + 1)}
              />
              <ActionButton
                label="回復預設 12"
                onPress={() => setFlag('staminaRegenMinutes', 12)}
              />
            </View>
          </View>

          <View className="gap-2">
            <Txt className="text-foreground text-[14px]">全站獎勵倍率</Txt>
            <FilterChips<MultiplierKey>
              options={MULTIPLIER_OPTIONS.map((item) => ({ key: item.key, label: item.label }))}
              value={multiplierKey}
              onChange={(next) => setFlag('rewardMultiplier', Number(next))}
            />
          </View>
        </View>
      </Section>

      <Section title="營運參數">
        <View className="bg-surface border-border/60 gap-3 rounded-3xl border p-4">
          <AdminField label="維護公告文字">
            <AdminInput value={notice} onChangeText={setNotice} multiline />
          </AdminField>
          <ActionButton
            label="儲存維護公告"
            tone="primary"
            onPress={() => setFlag('maintenanceNotice', notice)}
          />

          <AdminField label="最低支援版本" hint="低於此版本的 App 會被要求更新">
            <AdminInput value={minVersion} onChangeText={setMinVersion} placeholder="1.0.0" />
          </AdminField>
          <ActionButton
            label="儲存版本限制"
            tone="primary"
            onPress={() => setFlag('minVersion', minVersion.trim() || '1.0.0')}
          />

          <AdminField label="代幣兌換率" hint="1 元新台幣可換得的心動代幣">
            <AdminInput
              value={coinRate}
              onChangeText={setCoinRate}
              keyboardType="number-pad"
              placeholder="1.2"
            />
          </AdminField>
          <ActionButton
            label="儲存兌換率"
            tone="primary"
            onPress={() => {
              const parsed = Number(coinRate);
              if (Number.isFinite(parsed) && parsed > 0) setFlag('coinRate', parsed);
            }}
          />
        </View>
      </Section>

      <Section title={`敏感詞（${flags.bannedWords.length}）`}>
        <View className="bg-surface border-border/60 gap-3 rounded-3xl border p-4">
          <View className="flex-row flex-wrap gap-2">
            {flags.bannedWords.length === 0 ? (
              <Txt className="text-muted text-[12px]">尚未設定敏感詞。</Txt>
            ) : (
              flags.bannedWords.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={`移除敏感詞 ${item}`}
                  onPress={() => removeBannedWord(item)}
                  className="bg-danger/15 border-danger/40 flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 active:opacity-70"
                >
                  <Txt className="text-danger text-[12px]">{item}</Txt>
                  <X color={NEON.coral} size={12} />
                </Pressable>
              ))
            )}
          </View>
          <AdminField label="新增敏感詞">
            <AdminInput
              value={word}
              onChangeText={setWord}
              placeholder="輸入後按新增"
              onSubmitEditing={submitWord}
            />
          </AdminField>
          <ActionButton
            label="新增敏感詞"
            tone="primary"
            disabled={!word.trim()}
            onPress={submitWord}
          />
        </View>
      </Section>

      <Section title="管理員帳號" subtitle="接上後端後可在此新增或移除人員">
        <AdminGroup>
          {ADMIN_ACCOUNTS.map((account, index) => (
            <DataRow
              key={account.id}
              title={account.name}
              subtitle={`${account.email} · ${relativeTime(account.lastActiveAt)}活躍`}
              right={
                <StatusPill
                  label={ADMIN_ROLE_LABEL[account.role]}
                  tone={account.role === 'owner' ? 'primary' : 'neutral'}
                />
              }
              last={index === ADMIN_ACCOUNTS.length - 1}
            />
          ))}
        </AdminGroup>
      </Section>
    </AdminScreen>
  );
}
