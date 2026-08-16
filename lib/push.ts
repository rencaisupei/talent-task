import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { type PushPermission, usePushPrefsStore } from '@/lib/stores/pushPrefs';
import type { NotificationKind, PushChannel } from '@/lib/types';

/** 通知分類對應的推播開關。 */
const CHANNEL_BY_KIND: Record<NotificationKind, PushChannel> = {
  chat: 'chat',
  bid: 'bid',
  match: 'match',
  review: 'review',
  verification: 'moderation',
  moderation: 'moderation',
  system: 'system',
};

export interface PushRoutePayload {
  gigId?: string;
  conversationId?: string;
  talentId?: string;
}

export const isPushSupported = Platform.OS === 'ios' || Platform.OS === 'android';

let handlerConfigured = false;

/** 設定前景顯示行為：App 開著時仍會顯示橫幅與紅點。 */
export function configurePushHandler(): void {
  if (!isPushSupported || handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: '即時發通知',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 220, 120, 220],
    lightColor: '#00A896',
  });
}

/** 讀取目前的系統推播權限狀態。 */
export async function syncPushPermission(): Promise<PushPermission> {
  const { setPermission } = usePushPrefsStore.getState();
  if (!isPushSupported) {
    setPermission('unsupported');
    return 'unsupported';
  }
  try {
    const settings = await Notifications.getPermissionsAsync();
    const permission: PushPermission = settings.granted ? 'granted' : 'denied';
    setPermission(permission);
    return permission;
  } catch {
    setPermission('unsupported');
    return 'unsupported';
  }
}

/** 向系統請求推播權限，回傳最終狀態。 */
export async function requestPushPermission(): Promise<PushPermission> {
  const { setPermission } = usePushPrefsStore.getState();
  if (!isPushSupported) {
    setPermission('unsupported');
    return 'unsupported';
  }
  try {
    configurePushHandler();
    await ensureAndroidChannel();
    const existing = await Notifications.getPermissionsAsync();
    const settings = existing.granted ? existing : await Notifications.requestPermissionsAsync();
    const permission: PushPermission = settings.granted ? 'granted' : 'denied';
    setPermission(permission);
    return permission;
  } catch {
    setPermission('unsupported');
    return 'unsupported';
  }
}

export interface DeliverPushInput {
  kind: NotificationKind;
  title: string;
  body: string;
  route?: PushRoutePayload;
}

/**
 * 依使用者的推播偏好送出裝置通知。
 * 站內通知中心一律留存紀錄，這裡只負責裝置端的橫幅與音效。
 */
export function deliverPush({ kind, title, body, route }: DeliverPushInput): void {
  if (!isPushSupported) return;

  const prefs = usePushPrefsStore.getState();
  if (!prefs.enabled) return;
  if (prefs.permission === 'denied' || prefs.permission === 'unsupported') return;
  if (!prefs.channels[CHANNEL_BY_KIND[kind]]) return;

  configurePushHandler();

  void Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: prefs.showPreview ? body : '開啟 App 查看內容',
      data: { kind, ...route },
      sound: true,
    },
    trigger: null,
  }).catch(() => {
    // 權限被中途撤銷或裝置不支援時忽略，站內通知已保留紀錄。
  });
}

/** 立即送出一則測試推播，供設定頁確認裝置是否收得到。 */
export async function sendTestPush(): Promise<boolean> {
  if (!isPushSupported) return false;
  const permission = await requestPushPermission();
  if (permission !== 'granted') return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '推播測試成功',
      body: '之後的新訊息、提案動態與審核結果都會這樣通知你。',
      data: { kind: 'system' },
      sound: true,
    },
    trigger: null,
  });
  return true;
}

export function pushDeviceLabel(): string {
  if (!isPushSupported) return '此平台不支援裝置推播（請於 iOS／Android App 使用）';
  return Device.modelName ?? '本裝置';
}

export interface PushTapPayload extends PushRoutePayload {
  kind?: string;
}

/** 監聽使用者點擊推播的動作，回傳取消訂閱函式。 */
export function addPushTapListener(handler: (payload: PushTapPayload) => void): () => void {
  if (!isPushSupported) return () => undefined;
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as PushTapPayload | undefined;
    handler(data ?? {});
  });
  return () => subscription.remove();
}
