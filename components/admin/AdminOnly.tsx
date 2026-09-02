import type { ReactNode } from 'react';
import { Lock } from 'lucide-react-native';
import { router } from 'expo-router';

import { EmptyState } from '@/components/ui/EmptyState';
import { GlowButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAdminStore } from '@/lib/stores/admin';
import { NEON } from '@/lib/theme';

/**
 * 只有登入管理員平台的使用者才能看到內容，其餘人看到需要登入的說明。
 * 用在營運工具類畫面（例如 AI 自動化設定）。
 */
export function AdminOnly({ title, children }: { title: string; children: ReactNode }) {
  const authed = useAdminStore((state) => state.authed);

  if (authed) return <>{children}</>;

  return (
    <Screen>
      <ScreenHeader back fallback="/settings" title={title} />
      <EmptyState
        icon={<Lock color={NEON.coral} size={26} />}
        title="僅限管理員使用"
        description="這是營運工具，需要先用管理員密碼登入才能查看與調整。"
        action={<GlowButton label="管理員登入" onPress={() => router.push('/admin/login')} />}
      />
    </Screen>
  );
}
