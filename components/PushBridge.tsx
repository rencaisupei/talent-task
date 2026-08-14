import { router } from 'expo-router';
import { useEffect } from 'react';

import {
  addPushTapListener,
  configurePushHandler,
  isPushSupported,
  requestPushPermission,
  syncPushPermission,
} from '@/lib/push';
import { usePushPrefsStore } from '@/lib/stores/pushPrefs';

/**
 * 推播橋接：啟動時同步權限，並把點擊推播導向對應的對話、任務或通知中心。
 * 不渲染任何 UI。
 */
export function PushBridge() {
  const hydrated = usePushPrefsStore((state) => state.hydrated);
  const enabled = usePushPrefsStore((state) => state.enabled);
  const permission = usePushPrefsStore((state) => state.permission);

  useEffect(() => {
    if (!isPushSupported || !hydrated) return;
    configurePushHandler();
    if (enabled && permission === 'unknown') {
      void requestPushPermission();
      return;
    }
    void syncPushPermission();
  }, [hydrated, enabled, permission]);

  useEffect(() => {
    if (!isPushSupported) return undefined;
    return addPushTapListener((payload) => {
      if (payload.conversationId) {
        router.push({ pathname: '/chat/[id]', params: { id: payload.conversationId } });
        return;
      }
      if (payload.gigId) {
        router.push({ pathname: '/gig/[id]', params: { id: payload.gigId } });
        return;
      }
      if (payload.talentId) {
        router.push({ pathname: '/talent/[id]', params: { id: payload.talentId } });
        return;
      }
      router.push('/notifications');
    });
  }, []);

  return null;
}
