import { useEffect, useState } from 'react';

import {
  type AccessIdentity,
  fetchAccessIdentity,
  IS_ADMIN_PLATFORM_AVAILABLE,
} from '@/lib/adminHost';

/**
 * 管理平台若掛在 Cloudflare Access 之後（建議只保護 /admin 路徑），
 * 回傳邊緣已驗證的身分；沒有 Access 保護（或在原生 App）時回傳 null。
 */
export function useAccessIdentity(): AccessIdentity | null {
  const [identity, setIdentity] = useState<AccessIdentity | null>(null);

  useEffect(() => {
    if (!IS_ADMIN_PLATFORM_AVAILABLE) return undefined;

    let active = true;
    void fetchAccessIdentity().then((result) => {
      if (active) setIdentity(result);
    });

    return () => {
      active = false;
    };
  }, []);

  return identity;
}
