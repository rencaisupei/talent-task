import type { Session } from '@biltme/backend';
import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { isAdminPath } from '@/lib/adminHost';
import { getStoredSession, isPasswordRecoveryInProgress, subscribeToAuthChanges } from '@/lib/auth';
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
    // 清掉裝置上的身分欄位（顯示名稱、身分、地區、技能）。
    // 評價、收藏與通知的刪除在 lib/auth.ts 的 signOut()：
    // 這裡分不出「使用者按登出」與「權杖續期失敗」，不能拿來做刪除的依據。
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
 * 管理平台有自己的 admin-auth 登入，因此 /admin 底下的路徑完全不受這裡影響
 * （網頁版同時服務一般使用者網站與 /admin 管理平台）。
 */
export function AuthGate() {
  const pathname = usePathname();
  const navigationReady = useNavigationReady();
  const authStatus = useSessionStore((state) => state.authStatus);
  const onAuthRoute = pathname.startsWith('/auth');
  // 管理路徑不受一般使用者登入狀態影響，否則管理員會被導到一般使用者登入頁。
  const disabled = isAdminPath(pathname);

  useEffect(() => {
    if (!IS_BILT_CONFIGURED) {
      useSessionStore.getState().applySignedOut();
      return undefined;
    }

    // 失敗也要落到 signedOut：分頁版面在登入狀態確定前是空白畫面
    // （身分未選時要導向 /onboarding/role），停在 unknown 會讓 App 永遠空白。
    void getStoredSession()
      .then(handleSession)
      .catch(() => handleSession(null));
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
      // 重設密碼驗證成功時已經有 session，但使用者還在登入頁輸入新密碼，
      // 這時導走會讓密碼永遠停在舊值（驗證碼也已用掉）。
      if (isPasswordRecoveryInProgress()) return;
      router.replace(APP_PATH);
    }
  }, [authStatus, onAuthRoute, navigationReady, disabled]);

  return null;
}
