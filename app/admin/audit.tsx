import { View } from 'react-native';

import { AdminScreen } from '@/components/admin/AdminScreen';
import { ActionButton, AdminGroup, DataRow } from '@/components/admin/AdminUI';
import { Txt } from '@/components/ui/Txt';
import { formatClock, formatDate } from '@/lib/format';
import { useAdminStore } from '@/lib/stores/admin';

export default function AdminAuditScreen() {
  const audit = useAdminStore((state) => state.audit);
  const clearAudit = useAdminStore((state) => state.clearAudit);

  return (
    <AdminScreen title="稽核紀錄" subtitle={`最近 ${audit.length} 筆操作`}>
      <View className="border-border/60 bg-surface/60 rounded-2xl border px-3 py-2.5">
        <Txt className="text-muted text-[11px] leading-4">
          所有後台動作都會留存操作人、對象與時間，最多保留 200 筆。這份紀錄存在本機，
          接上後端後改寫入伺服器即可。
        </Txt>
      </View>

      <AdminGroup>
        {audit.length === 0 ? (
          <DataRow title="尚無操作紀錄" subtitle="在後台執行任何動作後就會出現" last />
        ) : (
          audit.map((entry, index) => (
            <DataRow
              key={entry.id}
              title={entry.action}
              subtitle={`${entry.actor}${entry.target ? ` · ${entry.target}` : ''} · ${formatDate(entry.createdAt)} ${formatClock(entry.createdAt)}`}
              last={index === audit.length - 1}
            />
          ))
        )}
      </AdminGroup>

      {audit.length > 0 ? (
        <ActionButton label="清除稽核紀錄" tone="danger" onPress={clearAudit} />
      ) : null}
    </AdminScreen>
  );
}
