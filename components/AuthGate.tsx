import type { Session } from '@biltme/backend';
import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { IS_ADMIN_WEB } from '@/lib/adminHost';
import { getStoredSession, subscribeToAuthChanges } from '@/lib/auth';
import { IS_BILT_CONFIGURED } from '@/lib/bilt';
import { resetLocalUserData } from '@/lib/localData';
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
 * 網頁版只提供管理員平台（管理員有自己的 admin-auth 登入），因此這道閘門在網頁完全不生效。
 */
export function AuthGate() {
  const pathname = usePathname();
  const authStatus = useSessionStore((state) => state.authStatus);
  const onAuthRoute = pathname.startsWith('/auth');

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
    if (IS_ADMIN_WEB || authStatus === 'unknown') return;

    if (authStatus === 'signedOut' && !onAuthRoute) {
      router.replace(SIGN_IN_PATH);
      return;
    }
    if (authStatus === 'signedIn' && onAuthRoute) {
      router.replace(APP_PATH);
    }
  }, [authStatus, onAuthRoute]);

  if (IS_ADMIN_WEB) return null;

  // 確認登入狀態與導向登入頁的空檔蓋一層底色，避免一般畫面閃現。
  const covering = authStatus === 'unknown' || (authStatus === 'signedOut' && !onAuthRoute);
  if (!covering) return null;

  return <View className="bg-background absolute inset-0 z-50" />;
}
