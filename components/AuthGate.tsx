import type { Session } from '@biltme/backend';
import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { IS_ADMIN_WEB, isAdminPath } from '@/lib/adminHost';
import { getStoredSession, subscribeToAuthChanges } from '@/lib/auth';
import { IS_BILT_CONFIGURED } from '@/lib/bilt';
import { resetLocalUserData } from '@/lib/localData';
import { useNavigationReady } from '@/lib/navigation';
import { loadProfileIntoSession, resetProfileSyncState, startProfileSync } from '@/lib/profiles';
import { useSessionStore } from '@/lib/stores/session';

const APP_PATH = '/(tabs)';

/** 已載入 profile 的 uid，避免 getSession 與 onAuthStateChange 重複抓取。 */
let profileLoadedFor: string | null = null;

function handleSession(session: Session | null): void {
  const store = useSessionStore.getState();

  if (!session) {
    profileLoadedFor = null;
    resetProfileSyncState();
    store.applySignedOut();
    return;
  }

  const authUserId = session.user.id;
  if (store.applySignedIn({ authUserId, email: session.user.email ?? null }) === 'switched') {
    resetProfileSyncState();
    resetLocalUserData();
  }

  if (profileLoadedFor !== authUserId) {
    profileLoadedFor = authUserId;
    void loadProfileIntoSession(authUserId);
  }
}

/**
 * 登入狀態同步：把 bilt auth 的 session 寫進 session store，並在登入後載入後端 profile。
 *
 * 登入是選用的——未登入也能直接瀏覽任務牆與接案內容，因此這裡不會把使用者導向登入頁；
 * 只有已經在登入頁而狀態變成已登入時，才導回主畫面。
 * 管理平台有自己的 admin-auth 登入，因此 /admin 底下的路徑完全不受這裡影響；
 * 正式網頁版整站都是管理平台（IS_ADMIN_WEB），此時不建立任何一般使用者的登入監聽。
 */
export function AuthGate() {
  const pathname = usePathname();
  const navigationReady = useNavigationReady();
  const authStatus = useSessionStore((state) => state.authStatus);
  const onAuthRoute = pathname.startsWith('/auth');
  // 開發時瀏覽器可同時看到兩側介面，管理路徑不受一般使用者登入狀態影響。
  const disabled = IS_ADMIN_WEB || isAdminPath(pathname);

  useEffect(() => {
    if (IS_ADMIN_WEB) return undefined;

    if (!IS_BILT_CONFIGURED) {
      useSessionStore.getState().applySignedOut();
      return undefined;
    }

    void getStoredSession().then(handleSession);
    const stopAuthListener = subscribeToAuthChanges(handleSession);
    const stopProfileSync = startProfileSync();

    return () => {
      stopAuthListener();
      stopProfileSync();
    };
  }, []);

  useEffect(() => {
    // 根導覽器掛載完成前不能導向，否則 expo-router 會直接丟錯。
    if (disabled || !navigationReady) return;

    if (authStatus === 'signedIn' && onAuthRoute) {
      router.replace(APP_PATH);
    }
  }, [authStatus, onAuthRoute, navigationReady, disabled]);

  return null;
}
