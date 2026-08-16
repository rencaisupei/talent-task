import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { ADMIN_ENTRY_PATH, IS_ADMIN_HOST, isAdminPath } from '@/lib/adminHost';

const ADMIN_HOST_TITLE = '即時發管理平台';

/**
 * 管理專屬網域（例如 admin.instantgig.tw）只提供 /admin 路由：
 * 根路徑或任何一般使用者路徑都會被導回管理入口，一般網域行為不受影響。
 */
export function AdminHostGate() {
  const pathname = usePathname();

  useEffect(() => {
    if (!IS_ADMIN_HOST) return;

    if (typeof document !== 'undefined' && document.title !== ADMIN_HOST_TITLE) {
      document.title = ADMIN_HOST_TITLE;
    }

    if (!isAdminPath(pathname)) {
      router.replace(ADMIN_ENTRY_PATH);
    }
  }, [pathname]);

  return null;
}
