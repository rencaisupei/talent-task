import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { useNavigationReady } from '@/lib/navigation';
import {
  addPushTapListener,
  configurePushHandler,
  isPushSupported,
  type PushTapPayload,
  requestPushPermission,
  syncPushPermission,
  takeInitialPushTap,
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
  const navigationReady = useNavigationReady();
  // 冷啟動點推播進來時導覽器可能還沒掛好，先收著等就緒再導。
  const pendingTapRef = useRef<PushTapPayload | null>(null);

  useEffect(() => {
    if (!isPushSupported || !hydrated) return;
    configurePushHandler();
    if (enabled && permission === 'unknown') {
      void requestPushPermission();
      return;
    }
    void syncPushPermission();
  }, [hydrated, enabled, permission]);

  const openFromPush = useCallback((payload: PushTapPayload) => {
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
  }, []);

  useEffect(() => {
    if (!isPushSupported) return undefined;
    return addPushTapListener((payload) => {
      if (navigationReady) openFromPush(payload);
      else pendingTapRef.current = payload;
    });
  }, [navigationReady, openFromPush]);

  // 冷啟動（App 被系統關掉時點推播進來）：監聽器錯過的那一筆在這裡補上，
  // 只在第一次渲染取一次，避免正常開啟 App 時被舊通知帶走。
  useEffect(() => {
    if (!isPushSupported) return;
    const initial = takeInitialPushTap();
    if (initial) pendingTapRef.current = initial;
  }, []);

  useEffect(() => {
    if (!navigationReady) return;
    const pending = pendingTapRef.current;
    if (!pending) return;
    pendingTapRef.current = null;
    openFromPush(pending);
  }, [navigationReady, openFromPush]);

  return null;
}
