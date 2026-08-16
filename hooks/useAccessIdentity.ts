import { useEffect, useState } from 'react';

import { type AccessIdentity, fetchAccessIdentity, IS_ADMIN_HOST } from '@/lib/adminHost';

/**
 * 管理網域若掛在 Cloudflare Access 之後，回傳邊緣已驗證的身分；
 * 沒有 Access 保護（或在原生 App）時回傳 null。
 */
export function useAccessIdentity(): AccessIdentity | null {
  const [identity, setIdentity] = useState<AccessIdentity | null>(null);

  useEffect(() => {
    if (!IS_ADMIN_HOST) return undefined;

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
