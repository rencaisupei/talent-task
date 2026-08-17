import type { Session } from '@biltme/backend';
import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { IS_ADMIN_WEB, isAdminPath } from '@/lib/adminHost';
import { getStoredSession, subscribeToAuthChanges } from '@/lib/auth';
import { IS_BILT_CONFIGURED } from '@/lib/bilt';
import { resetLocalUserData } from '@/lib/localData';
import { useNavigationReady } from '@/lib/navigation';
import { loadProfileIntoSession, resetProfileSyncState, startProfileSync } from '@/lib/profiles';
import { useSessionStore } from '@/lib/stores/session';

const SIGN_IN_PATH = '/auth/sign-in';
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

  const userId = session.user.id;
  if (store.applySignedIn({ userId, email: session.user.email ?? null }) === 'switched') {
    resetProfileSyncState();
    resetLocalUserData();
  }

  if (profileLoadedFor !== userId) {
    profileLoadedFor = userId;
    void loadProfileIntoSession(userId);
  }
}

/**
 * 一般使用者必須登入才能使用 App：未登入時導向 Email 驗證碼登入頁。
 *
 * 管理平台有自己的 admin-auth 登入，因此這道閘門不管 /admin 底下的路徑；
 * 正式網頁版整站都是管理平台（IS_ADMIN_WEB），此時閘門完全不生效。
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
    if (disabled || !navigationReady || authStatus === 'unknown') return;

    if (authStatus === 'signedOut' && !onAuthRoute) {
      router.replace(SIGN_IN_PATH);
      return;
    }
    if (authStatus === 'signedIn' && onAuthRoute) {
      router.replace(APP_PATH);
    }
  }, [authStatus, onAuthRoute, navigationReady, disabled]);

  if (disabled) return null;

  // 確認登入狀態與導向登入頁的空檔蓋一層底色，避免一般畫面閃現。
  const covering = authStatus === 'unknown' || (authStatus === 'signedOut' && !onAuthRoute);
  if (!covering) return null;

  return <View className="bg-background absolute inset-0 z-50" />;
}
