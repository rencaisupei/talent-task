import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { ADMIN_ENTRY_PATH, IS_ADMIN_WEB, isAdminPath } from '@/lib/adminHost';
import { useNavigationReady } from '@/lib/navigation';

const ADMIN_WEB_TITLE = '即時發管理平台';

/**
 * 網頁版只提供管理員專屬平台：根路徑或任何一般使用者路徑都會被導到 /admin。
 * 一般使用者介面只在手機 App 上執行，因此這道閘門在原生完全不生效。
 *
 * 導向期間覆蓋一層底色，避免一般使用者畫面在改寫路由前閃現。
 */
export function WebAdminGate() {
  const pathname = usePathname();
  const navigationReady = useNavigationReady();
  const shouldRedirect = IS_ADMIN_WEB && !isAdminPath(pathname);

  useEffect(() => {
    if (!IS_ADMIN_WEB) return;
    if (typeof document !== 'undefined' && document.title !== ADMIN_WEB_TITLE) {
      document.title = ADMIN_WEB_TITLE;
    }
  }, []);

  useEffect(() => {
    // 根導覽器掛載完成前不能導向，否則 expo-router 會直接丟錯。
    if (!shouldRedirect || !navigationReady) return;
    router.replace(ADMIN_ENTRY_PATH);
  }, [shouldRedirect, navigationReady]);

  if (!shouldRedirect) return null;

  return <View className="bg-background absolute inset-0 z-50" />;
}
