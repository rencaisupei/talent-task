import { useState } from 'react';
import { View } from 'react-native';
import { BellRing } from 'lucide-react-native';

import { AdminScreen } from '@/components/admin/AdminScreen';
import {
  ActionButton,
  AdminField,
  AdminGroup,
  AdminInput,
  DataRow,
  FilterChips,
  StatusPill,
} from '@/components/admin/AdminUI';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { AUDIENCE_LABEL, AUDIENCE_REACH } from '@/lib/data/admin';
import { relativeTime } from '@/lib/format';
import { useAdminStore } from '@/lib/stores/admin';
import type { PushAudience } from '@/lib/types';

const AUDIENCES: PushAudience[] = ['all', 'free', 'plus', 'vip', 'inactive', 'players'];

const TEMPLATES = [
  { title: '雙倍代幣週開跑', body: '今天開始所有遊戲獎勵 ×2，快找對手開一局！' },
  { title: '有人在等你回訊息', body: '你的配對對象傳了新訊息，回一句話讓話題繼續。' },
  { title: '午夜狼人祭 22:00 開場', body: '限定房間即將開放，勝場積分 ×1.5。' },
];

export default function AdminPushScreen() {
  const campaigns = useAdminStore((state) => state.campaigns);
  const sendCampaign = useAdminStore((state) => state.sendCampaign);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<PushAudience>('all');
  const [sentInfo, setSentInfo] = useState<string | null>(null);

  const canSend = title.trim().length > 0 && body.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    const reach = sendCampaign({ title: title.trim(), body: body.trim(), audience });
    setSentInfo(`已送出給 ${AUDIENCE_LABEL[audience]}，觸及 ${reach.toLocaleString()} 人`);
    setTitle('');
    setBody('');
  };

  return (
    <AdminScreen title="推播通知" subtitle={`已發送 ${campaigns.length} 則`}>
      <Section title="撰寫推播" subtitle="送出後會同時寫入 App 內的通知中心">
        <View className="bg-surface border-border/60 gap-3 rounded-3xl border p-4">
          <AdminField label="標題">
            <AdminInput value={title} onChangeText={setTitle} placeholder="例如：雙倍代幣週開跑" />
          </AdminField>
          <AdminField label="內容" hint="建議 60 字內，避免被系統截斷">
            <AdminInput
              value={body}
              onChangeText={setBody}
              placeholder="說明活動內容與行動指引"
              multiline
            />
          </AdminField>

          <View className="gap-2">
            <Txt className="text-muted text-[11px]">受眾</Txt>
            <FilterChips<PushAudience>
              options={AUDIENCES.map((key) => ({
                key,
                label: AUDIENCE_LABEL[key],
                count: AUDIENCE_REACH[key],
              }))}
              value={audience}
              onChange={setAudience}
            />
          </View>

          <View className="gap-2">
            <Txt className="text-muted text-[11px]">快速範本</Txt>
            <View className="flex-row flex-wrap gap-2">
              {TEMPLATES.map((template) => (
                <ActionButton
                  key={template.title}
                  label={template.title}
                  onPress={() => {
                    setTitle(template.title);
                    setBody(template.body);
                  }}
                />
              ))}
            </View>
          </View>

          <ActionButton
            label={`送出推播（${AUDIENCE_REACH[audience].toLocaleString()} 人）`}
            tone="primary"
            disabled={!canSend}
            icon={<BellRing color="#ffffff" size={14} />}
            onPress={send}
          />

          {sentInfo ? <Txt className="text-success text-[12px]">{sentInfo}</Txt> : null}
        </View>
      </Section>

      <Section title="發送紀錄">
        <AdminGroup>
          {campaigns.length === 0 ? (
            <DataRow title="尚未發送過推播" subtitle="送出後會在這裡看到觸及人數與時間" last />
          ) : (
            campaigns.map((campaign, index) => (
              <DataRow
                key={campaign.id}
                title={campaign.title}
                subtitle={`${campaign.body} · ${campaign.sentBy} · ${relativeTime(campaign.sentAt)}`}
                right={
                  <View className="items-end gap-1">
                    <StatusPill label={AUDIENCE_LABEL[campaign.audience]} tone="primary" />
                    <Txt className="text-muted text-[10px]">
                      {campaign.reach.toLocaleString()} 人
                    </Txt>
                  </View>
                }
                last={index === campaigns.length - 1}
              />
            ))
          )}
        </AdminGroup>
      </Section>

      <View className="border-border/60 bg-surface/60 rounded-2xl border px-3 py-2.5">
        <Txt className="text-muted text-[11px] leading-4">
          目前推播以 App 內通知模擬。接上後端與 Expo 推播服務後，把送出動作改成呼叫推播 API 即可，
          畫面與受眾邏輯不需調整。裝置權限可在「設定 → 裝置權限」檢查。
        </Txt>
      </View>
    </AdminScreen>
  );
}
