import { Button, Input, Label, TextField } from 'heroui-native';
import { CircleCheck, Inbox, Mail, TriangleAlert } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ReadOnlyNotice } from '@/components/admin/ReadOnlyNotice';
import { CloudListState } from '@/components/CloudListState';
import { SectionHeading } from '@/components/SectionHeading';
import { SegmentedTabs, type SegmentOption } from '@/components/SegmentedTabs';
import { StaticTag } from '@/components/TagChip';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { COLORS } from '@/lib/colors';
import { formatClockTime, formatDate, formatRelativeTime } from '@/lib/format';
import { SUPPORT_EMAIL } from '@/lib/legalCopy';
import { useAdminContentStore } from '@/lib/stores/adminContent';
import { useAdminCan } from '@/lib/stores/adminAuth';
import { SUPPORT_CATEGORY_LABEL, type SupportTicket } from '@/lib/types';

type Filter = 'open' | 'resolved' | 'all';

export default function AdminSupportScreen() {
  const canManage = useAdminCan('review:manage');
  const tickets = useAdminContentStore((state) => state.tickets);
  const loadState = useAdminContentStore((state) => state.ticketLoadState);
  const errorMessage = useAdminContentStore((state) => state.errorMessage);
  const isMutating = useAdminContentStore((state) => state.isMutating);
  const refreshTickets = useAdminContentStore((state) => state.refreshTickets);
  const resolveTicket = useAdminContentStore((state) => state.resolveTicket);
  const logAction = useAuditLogger();

  const [filter, setFilter] = useState<Filter>('open');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    if (canManage) void refreshTickets();
  }, [canManage, refreshTickets]);

  useEffect(() => {
    load();
  }, [load]);

  const openCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'open').length,
    [tickets],
  );

  const visible = useMemo(() => {
    if (filter === 'all') return tickets;
    return tickets.filter((ticket) => ticket.status === filter);
  }, [filter, tickets]);

  const options: SegmentOption<Filter>[] = [
    { id: 'open', label: '待處理', count: openCount },
    { id: 'resolved', label: '已處理', count: tickets.length - openCount },
    { id: 'all', label: '全部', count: tickets.length },
  ];

  const handleResolve = async (ticket: SupportTicket) => {
    const note = notes[ticket.id] ?? '';
    const done = await resolveTicket(ticket.id, note.length > 0 ? note : undefined);
    if (!done) return;

    logAction({
      kind: 'report',
      summary: `處理客服留言（${SUPPORT_CATEGORY_LABEL[ticket.category]}）${note.length > 0 ? `：${note}` : ''}`,
      targetId: ticket.id,
      targetLabel: ticket.email,
    });
    setNotes((current) => ({ ...current, [ticket.id]: '' }));
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AdminHeader
        title="客服留言"
        caption={canManage ? `待處理 ${openCount} 則・共 ${tickets.length} 則` : '需要審核權限'}
      />

      <ScrollView
        contentContainerClassName="px-5 py-5 pb-12 gap-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="border-hairline flex-row items-start gap-2 rounded-xl border bg-white px-3 py-2.5">
          <Mail size={15} color={COLORS.brandStrong} strokeWidth={2.2} />
          <Text className="text-ink-soft flex-1 text-[12px] leading-4">
            這些是「聯絡我們」的站內留言（含未登入訪客）。回覆一律寄到留言者填寫的信箱，平台不會在
            App 內回信；公開客服信箱為 {SUPPORT_EMAIL}。
          </Text>
        </View>

        {canManage ? null : (
          <ReadOnlyNotice permission="review:manage" action="檢視與處理客服留言" />
        )}

        {canManage ? (
          <>
            <SegmentedTabs options={options} value={filter} onChange={setFilter} />

            {visible.length === 0 ? (
              <CloudListState
                loadState={loadState}
                errorMessage={errorMessage}
                onRetry={load}
                loadingLabel="正在讀取客服留言…"
                emptyTitle={filter === 'open' ? '沒有待處理留言' : '沒有符合的留言'}
                emptyCaption="使用者從「聯絡我們」送出的留言會出現在這裡。"
                emptyIcon={<Inbox size={22} color={COLORS.muted} strokeWidth={2.1} />}
              />
            ) : (
              <View className="gap-3">
                <SectionHeading
                  title="留言清單"
                  caption="處理結果會寫入稽核紀錄，並記錄處理的管理員"
                />
                {visible.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    note={notes[ticket.id] ?? ''}
                    isMutating={isMutating}
                    onNoteChange={(text) =>
                      setNotes((current) => ({ ...current, [ticket.id]: text }))
                    }
                    onResolve={() => void handleResolve(ticket)}
                  />
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface TicketCardProps {
  ticket: SupportTicket;
  note: string;
  isMutating: boolean;
  onNoteChange: (text: string) => void;
  onResolve: () => void;
}

function TicketCard({ ticket, note, isMutating, onNoteChange, onResolve }: TicketCardProps) {
  const isOpen = ticket.status === 'open';

  return (
    <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
      <View className="flex-row items-start gap-3">
        <View className="bg-canvas h-10 w-10 items-center justify-center rounded-xl">
          {isOpen ? (
            <TriangleAlert size={16} color={COLORS.coral} strokeWidth={2.2} />
          ) : (
            <CircleCheck size={16} color={COLORS.brandStrong} strokeWidth={2.2} />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-ink text-[15px] font-semibold">
            {ticket.name.length > 0 ? ticket.name : '未留稱呼'}
          </Text>
          <Text className="text-muted mt-0.5 text-[12px]">{ticket.email}</Text>
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            <StaticTag label={SUPPORT_CATEGORY_LABEL[ticket.category]} tone="brand" />
            {isOpen ? <StaticTag label="待處理" tone="coral" /> : null}
            {ticket.userId === null ? <StaticTag label="訪客留言" /> : null}
          </View>
          <Text className="text-muted mt-2 text-[11px]">
            {formatDate(ticket.createdAt)} {formatClockTime(ticket.createdAt)}・
            {formatRelativeTime(ticket.createdAt)}
          </Text>
        </View>
      </View>

      <Text className="text-ink-soft bg-canvas rounded-xl p-3 text-[13px] leading-5">
        {ticket.message}
      </Text>

      {isOpen ? (
        <>
          <TextField>
            <Label>處理備註（選填）</Label>
            <Input
              value={note}
              onChangeText={onNoteChange}
              placeholder="例如：已回信說明驗證碼寄送問題"
            />
          </TextField>
          <Button size="md" isDisabled={isMutating} onPress={onResolve}>
            <Button.Label>標記已處理</Button.Label>
          </Button>
        </>
      ) : (
        <Text className="text-muted text-[12px] leading-4">
          {ticket.resolvedBy ?? '管理員'} 於{' '}
          {ticket.resolvedAt === null ? '—' : formatRelativeTime(ticket.resolvedAt)} 標記已處理
          {ticket.adminNote === null ? '' : `・${ticket.adminNote}`}
        </Text>
      )}
    </View>
  );
}
