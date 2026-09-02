import { useState } from 'react';
import { View } from 'react-native';

import { AdminScreen } from '@/components/admin/AdminScreen';
import {
  ActionButton,
  AdminField,
  AdminInput,
  FilterChips,
  StatusPill,
} from '@/components/admin/AdminUI';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { formatDate, relativeTime } from '@/lib/format';
import { useAdminStore } from '@/lib/stores/admin';

const MULTIPLIERS = [
  { key: '1', label: '無加成' },
  { key: '1.5', label: '1.5 倍' },
  { key: '2', label: '2 倍' },
  { key: '3', label: '3 倍' },
] as const;

type MultiplierKey = (typeof MULTIPLIERS)[number]['key'];

export default function AdminEventsScreen() {
  const events = useAdminStore((state) => state.events);
  const announcements = useAdminStore((state) => state.announcements);
  const addEvent = useAdminStore((state) => state.addEvent);
  const toggleEvent = useAdminStore((state) => state.toggleEvent);
  const removeEvent = useAdminStore((state) => state.removeEvent);
  const addAnnouncement = useAdminStore((state) => state.addAnnouncement);
  const toggleAnnouncement = useAdminStore((state) => state.toggleAnnouncement);
  const toggleAnnouncementPin = useAdminStore((state) => state.toggleAnnouncementPin);
  const removeAnnouncement = useAdminStore((state) => state.removeAnnouncement);

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [multiplier, setMultiplier] = useState<MultiplierKey>('2');

  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');

  const createEvent = () => {
    if (!name.trim()) return;
    addEvent({
      name: name.trim(),
      tag: tag.trim() || '#限時活動',
      description: description.trim() || '限時活動進行中。',
      multiplier: Number(multiplier),
    });
    setName('');
    setTag('');
    setDescription('');
  };

  const createNotice = () => {
    if (!noticeTitle.trim() || !noticeBody.trim()) return;
    addAnnouncement({ title: noticeTitle.trim(), body: noticeBody.trim() });
    setNoticeTitle('');
    setNoticeBody('');
  };

  return (
    <AdminScreen
      title="活動與公告"
      subtitle={`${events.filter((e) => e.active).length} 個活動進行中`}
    >
      <Section title="新增活動">
        <View className="bg-surface border-border/60 gap-3 rounded-3xl border p-4">
          <AdminField label="活動名稱">
            <AdminInput value={name} onChangeText={setName} placeholder="例如：心動雙倍週" />
          </AdminField>
          <AdminField label="標籤">
            <AdminInput value={tag} onChangeText={setTag} placeholder="#雙倍代幣" />
          </AdminField>
          <AdminField label="活動說明">
            <AdminInput
              value={description}
              onChangeText={setDescription}
              placeholder="說明加成規則與期間"
              multiline
            />
          </AdminField>
          <View className="gap-2">
            <Txt className="text-muted text-[11px]">獎勵倍率</Txt>
            <FilterChips<MultiplierKey>
              options={MULTIPLIERS.map((item) => ({ key: item.key, label: item.label }))}
              value={multiplier}
              onChange={setMultiplier}
            />
          </View>
          <ActionButton
            label="建立活動（預設 7 天）"
            tone="primary"
            disabled={!name.trim()}
            onPress={createEvent}
          />
        </View>
      </Section>

      <Section title={`活動列表（${events.length}）`}>
        <View className="gap-3">
          {events.map((event) => (
            <View
              key={event.id}
              className="bg-surface border-border/60 gap-3 rounded-3xl border p-4"
            >
              <View className="flex-row items-start gap-3">
                <View className="flex-1 gap-1">
                  <Txt weight="semibold" className="text-foreground text-[14px]">
                    {event.name}
                  </Txt>
                  <Txt className="text-accent text-[11px]">{event.tag}</Txt>
                  <Txt className="text-muted text-[11px] leading-4">{event.description}</Txt>
                  <Txt className="text-muted text-[10px]">
                    {formatDate(event.startAt)} – {formatDate(event.endAt)} · 獎勵 ×
                    {event.multiplier}
                  </Txt>
                </View>
                <StatusPill
                  label={event.active ? '進行中' : '已暫停'}
                  tone={event.active ? 'success' : 'neutral'}
                />
              </View>
              <View className="flex-row flex-wrap gap-2">
                <ActionButton
                  label={event.active ? '暫停活動' : '啟用活動'}
                  tone={event.active ? 'warning' : 'success'}
                  onPress={() => toggleEvent(event.id)}
                />
                <ActionButton label="刪除" tone="danger" onPress={() => removeEvent(event.id)} />
              </View>
            </View>
          ))}
        </View>
      </Section>

      <Section title="發佈公告">
        <View className="bg-surface border-border/60 gap-3 rounded-3xl border p-4">
          <AdminField label="公告標題">
            <AdminInput
              value={noticeTitle}
              onChangeText={setNoticeTitle}
              placeholder="例如：版本 1.0.2 更新說明"
            />
          </AdminField>
          <AdminField label="公告內容">
            <AdminInput
              value={noticeBody}
              onChangeText={setNoticeBody}
              placeholder="說明更新內容或注意事項"
              multiline
            />
          </AdminField>
          <ActionButton
            label="發佈公告"
            tone="primary"
            disabled={!noticeTitle.trim() || !noticeBody.trim()}
            onPress={createNotice}
          />
        </View>
      </Section>

      <Section title={`公告列表（${announcements.length}）`}>
        <View className="gap-3">
          {announcements.map((notice) => (
            <View
              key={notice.id}
              className="bg-surface border-border/60 gap-3 rounded-3xl border p-4"
            >
              <View className="flex-row items-start gap-3">
                <View className="flex-1 gap-1">
                  <Txt weight="semibold" className="text-foreground text-[14px]">
                    {notice.title}
                  </Txt>
                  <Txt className="text-muted text-[11px] leading-4">{notice.body}</Txt>
                  <Txt className="text-muted text-[10px]">{relativeTime(notice.createdAt)}發佈</Txt>
                </View>
                <View className="items-end gap-1">
                  <StatusPill
                    label={notice.active ? '上架中' : '已下架'}
                    tone={notice.active ? 'success' : 'neutral'}
                  />
                  {notice.pinned ? <StatusPill label="置頂" tone="primary" /> : null}
                </View>
              </View>
              <View className="flex-row flex-wrap gap-2">
                <ActionButton
                  label={notice.active ? '下架' : '上架'}
                  tone={notice.active ? 'warning' : 'success'}
                  onPress={() => toggleAnnouncement(notice.id)}
                />
                <ActionButton
                  label={notice.pinned ? '取消置頂' : '置頂'}
                  tone={notice.pinned ? 'neutral' : 'primary'}
                  onPress={() => toggleAnnouncementPin(notice.id)}
                />
                <ActionButton
                  label="刪除"
                  tone="danger"
                  onPress={() => removeAnnouncement(notice.id)}
                />
              </View>
            </View>
          ))}
        </View>
      </Section>
    </AdminScreen>
  );
}
