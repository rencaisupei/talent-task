import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { AdminScreen } from '@/components/admin/AdminScreen';
import { ActionButton, FilterChips, StatusPill } from '@/components/admin/AdminUI';
import { Txt } from '@/components/ui/Txt';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  REPORT_KIND_LABEL,
  REPORT_STATUS_LABEL,
  REPORT_STATUS_TONE,
  SEVERITY_LABEL,
  SEVERITY_TONE,
} from '@/lib/data/admin';
import { getProfileById } from '@/lib/data/profiles';
import { relativeTime } from '@/lib/format';
import { useAdminStore } from '@/lib/stores/admin';
import type { AdminReport, AdminReportStatus } from '@/lib/types';

type Filter = 'all' | AdminReportStatus;

export default function AdminReportsScreen() {
  const reports = useAdminStore((state) => state.reports);
  const [filter, setFilter] = useState<Filter>('pending');

  const counts = {
    all: reports.length,
    pending: reports.filter((item) => item.status === 'pending').length,
    resolved: reports.filter((item) => item.status === 'resolved').length,
    dismissed: reports.filter((item) => item.status === 'dismissed').length,
  };

  const visible = filter === 'all' ? reports : reports.filter((report) => report.status === filter);

  return (
    <AdminScreen title="檢舉審核" subtitle={`${counts.pending} 件待處理`}>
      <FilterChips<Filter>
        options={[
          { key: 'pending', label: '待處理', count: counts.pending },
          { key: 'resolved', label: '已處理', count: counts.resolved },
          { key: 'dismissed', label: '已駁回', count: counts.dismissed },
          { key: 'all', label: '全部', count: counts.all },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {visible.length === 0 ? (
        <View className="bg-surface border-border/60 rounded-3xl border p-6">
          <Txt className="text-muted text-center text-[13px]">這個分類目前沒有檢舉案件。</Txt>
        </View>
      ) : (
        visible.map((report) => <ReportCard key={report.id} report={report} />)
      )}
    </AdminScreen>
  );
}

function ReportCard({ report }: { report: AdminReport }) {
  const resolveReport = useAdminStore((state) => state.resolveReport);
  const dismissReport = useAdminStore((state) => state.dismissReport);
  const target = getProfileById(report.targetId);
  const reporter = getProfileById(report.reporterId);

  return (
    <View className="bg-surface border-border/60 gap-3 rounded-3xl border p-4">
      <View className="flex-row items-center gap-3">
        <UserAvatar uri={target?.photos[0]} name={target?.name} size={44} />
        <View className="flex-1 gap-0.5">
          <Txt weight="semibold" className="text-foreground text-[14px]">
            {target?.name ?? report.targetId} · {report.reason}
          </Txt>
          <Txt className="text-muted text-[11px]">
            {REPORT_KIND_LABEL[report.kind]} · 檢舉人 {reporter?.name ?? report.reporterId} ·{' '}
            {relativeTime(report.createdAt)}
          </Txt>
        </View>
        <View className="items-end gap-1">
          <StatusPill
            label={REPORT_STATUS_LABEL[report.status]}
            tone={REPORT_STATUS_TONE[report.status]}
          />
          <StatusPill
            label={SEVERITY_LABEL[report.severity]}
            tone={SEVERITY_TONE[report.severity]}
          />
        </View>
      </View>

      <View className="bg-background rounded-2xl p-3">
        <Txt className="text-foreground text-[13px] leading-5">{report.detail}</Txt>
      </View>

      {report.status === 'pending' ? (
        <View className="flex-row flex-wrap gap-2">
          <ActionButton
            label="警告後結案"
            tone="warning"
            onPress={() => resolveReport(report.id, '已發出警告', 'active')}
          />
          <ActionButton
            label="禁言"
            tone="warning"
            onPress={() => resolveReport(report.id, '禁言處理', 'muted')}
          />
          <ActionButton
            label="停權 7 天"
            tone="danger"
            onPress={() => resolveReport(report.id, '暫時停權 7 天', 'suspended')}
          />
          <ActionButton
            label="永久封鎖"
            tone="danger"
            onPress={() => resolveReport(report.id, '永久封鎖', 'banned')}
          />
          <ActionButton label="駁回" onPress={() => dismissReport(report.id)} />
          <ActionButton
            label="查看帳號"
            tone="info"
            onPress={() =>
              router.push({ pathname: '/admin/user/[id]', params: { id: report.targetId } })
            }
          />
        </View>
      ) : (
        <Txt className="text-muted text-[11px]">
          處理結果：{report.resolution ?? '—'}
          {report.handledBy ? ` · 處理人 ${report.handledBy}` : ''}
        </Txt>
      )}
    </View>
  );
}
