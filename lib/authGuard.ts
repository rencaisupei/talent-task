import { router } from 'expo-router';

import { useSessionStore } from '@/lib/stores/session';

const SIGN_IN_PATH = '/auth/sign-in';

/**
 * 需要身分的動作（發布任務、投遞提案、開啟對話）在執行前先確認登入。
 * 未登入就導向登入頁並回傳 false，呼叫端直接中止即可。
 */
export function requireSignIn(): boolean {
  if (useSessionStore.getState().authStatus === 'signedIn') return true;
  router.push(SIGN_IN_PATH);
  return false;
}

export function goToSignIn(): void {
  router.push(SIGN_IN_PATH);
}
