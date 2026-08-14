import { Button, Input, Label, TextArea, TextField } from 'heroui-native';
import { BellRing, Megaphone, Trash2, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { EmptyState, SectionHeading } from '@/components/SectionHeading';
import { SegmentedTabs, type SegmentOption } from '@/components/SegmentedTabs';
import { StaticTag } from '@/components/TagChip';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { estimateRecipients } from '@/lib/adminSeed';
import { COLORS } from '@/lib/colors';
import { formatNumber, formatRelativeTime } from '@/lib/format';
import { useAdminAuthStore } from '@/lib/stores/adminAuth';
import { useAnnouncementStore } from '@/lib/stores/announcements';
import { type Announcement, type AnnouncementAudience, AUDIENCE_LABEL } from '@/lib/types';

const AUDIENCE_OPTIONS: SegmentOption<AnnouncementAudience>[] = [
  { id: 'all', label: AUDIENCE_LABEL.all },
  { id: 'client', label: AUDIENCE_LABEL.client },
  { id: 'talent', label: AUDIENCE_LABEL.talent },
  { id: 'premium', label: AUDIENCE_LABEL.premium },
  { id: 'free', label: AUDIENCE_LABEL.free },
];

export default function AdminAnnouncementsScreen() {
  const announcements = useAnnouncementStore((state) => state.announcements);
  const publish = useAnnouncementStore((state) => state.publish);
  const remove = useAnnouncementStore((state) => state.remove);
  const currentAdmin = useAdminAuthStore((state) => state.currentAdmin);
  const logAction = useAuditLogger();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('all');
  const [error, setError] = useState<string | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Announcement | null>(null);

  const recipients = useMemo(() => estimateRecipients(audience), [audience]);

  const handlePublish = () => {
    if (title.trim().length < 2 || body.trim().length < 5) {
      setError('請填寫公告標題與內容（內容至少 5 個字）。');
      setConfirmPublish(false);
      return;
    }

    const announcement = publish({
      title,
      body,
      audience,
      adminName: currentAdmin?.name ?? '管理員',
    });

    logAction({
      kind: 'announcement',
      summary: `發布系統公告：${announcement.title}（${AUDIENCE_LABEL[audience]}）`,
      targetId: announcement.id,
      targetLabel: announcement.title,
    });

    setTitle('');
    setBody('');
    setAudience('all');
    setError(null);
    setConfirmPublish(false);
  };

  const handleRemove = () => {
    if (!removeTarget) return;
    remove(removeTarget.id);
    logAction({
      kind: 'announcement',
      summary: `撤回系統公告：${removeTarget.title}`,
      targetId: removeTarget.id,
      targetLabel: removeTarget.title,
    });
    setRemoveTarget(null);
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AdminHeader title="系統公告與推播" caption={`${announcements.length} 則公告已發布`} />

      <ScrollView
        contentContainerClassName="px-5 py-5 pb-12 gap-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="border-hairline gap-4 rounded-xl border bg-white p-4">
          <View className="flex-row items-center gap-2">
            <Megaphone size={16} color={COLORS.brandStrong} strokeWidth={2.2} />
            <Text className="text-ink text-[15px] font-semibold">建立公告</Text>
          </View>

          <TextField>
            <Label>公告標題</Label>
            <Input value={title} onChangeText={setTitle} placeholder="例如：連假急件加給提醒" />
          </TextField>

          <TextField>
            <Label>公告內容</Label>
            <TextArea
              value={body}
              onChangeText={setBody}
              placeholder="說明時間、影響範圍與使用者需要採取的行動"
              numberOfLines={5}
              style={{ minHeight: 110 }}
            />
          </TextField>

          <View className="gap-2">
            <Text className="text-ink text-[13px] font-semibold">推播受眾</Text>
            <SegmentedTabs options={AUDIENCE_OPTIONS} value={audience} onChange={setAudience} />
          </View>

          <View className="border-hairline bg-canvas flex-row items-center gap-2 rounded-xl border px-3 py-2.5">
            <Users size={15} color={COLORS.ink} strokeWidth={2.2} />
            <Text className="text-ink-soft flex-1 text-[12px]">
              預估推播 {formatNumber(recipients)} 位使用者・公告會進入通知中心
            </Text>
          </View>

          {error ? <Text className="text-coral text-[12px] font-semibold">{error}</Text> : null}

          <Button size="lg" onPress={() => setConfirmPublish(true)}>
            <Button.Label>發布公告並推播</Button.Label>
          </Button>
        </View>

        <View className="gap-3">
          <SectionHeading title="已發布公告" caption="依時間排序，可撤回" />

          {announcements.length === 0 ? (
            <EmptyState
              title="尚未發布公告"
              caption="建立第一則公告後會顯示在這裡。"
              icon={<BellRing size={22} color={COLORS.brand} strokeWidth={2.1} />}
            />
          ) : (
            announcements.map((announcement) => (
              <View
                key={announcement.id}
                className="border-hairline gap-2 rounded-xl border bg-white p-4"
              >
                <View className="flex-row items-start gap-3">
                  <View className="flex-1">
                    <Text className="text-ink text-[15px] font-semibold">{announcement.title}</Text>
                    <Text className="text-muted mt-0.5 text-[12px]">
                      {announcement.adminName}・{formatRelativeTime(announcement.createdAt)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setRemoveTarget(announcement)}
                    accessibilityRole="button"
                    accessibilityLabel={`撤回公告 ${announcement.title}`}
                    className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
                  >
                    <Trash2 size={16} color={COLORS.coral} strokeWidth={2.2} />
                  </Pressable>
                </View>

                <Text className="text-ink-soft text-[13px] leading-5">{announcement.body}</Text>

                <View className="flex-row flex-wrap items-center gap-1.5">
                  <StaticTag label={AUDIENCE_LABEL[announcement.audience]} tone="brand" />
                  <StaticTag label={`推播 ${formatNumber(announcement.recipientCount)} 人`} />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <ConfirmSheet
        visible={confirmPublish}
        title="發布這則公告？"
        message={`將推播給${AUDIENCE_LABEL[audience]}，預估 ${formatNumber(recipients)} 位使用者收到通知。`}
        actions={[{ id: 'confirm', label: '確認發布', tone: 'primary' }]}
        onSelect={handlePublish}
        onCancel={() => setConfirmPublish(false)}
      />

      <ConfirmSheet
        visible={removeTarget !== null}
        title="撤回這則公告？"
        message={`「${removeTarget?.title ?? ''}」將從公告列表移除，已送出的通知不會回收。`}
        actions={[{ id: 'confirm', label: '確認撤回', tone: 'danger' }]}
        onSelect={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </KeyboardAvoidingView>
  );
}
