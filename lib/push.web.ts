import { type PushPermission, usePushPrefsStore } from '@/lib/stores/pushPrefs';
import type { NotificationKind } from '@/lib/types';

/**
 * 網頁版的推播實作：瀏覽器不支援 App 裝置推播，
 * 這裡僅維持相同介面，站內通知中心仍完整運作。
 */

export interface PushRoutePayload {
  gigId?: string;
  conversationId?: string;
  talentId?: string;
}

export interface PushTapPayload extends PushRoutePayload {
  kind?: string;
}

export interface DeliverPushInput {
  kind: NotificationKind;
  title: string;
  body: string;
  route?: PushRoutePayload;
}

export const isPushSupported = false;

export function configurePushHandler(): void {
  // 網頁版沒有原生通知處理器。
}

export async function syncPushPermission(): Promise<PushPermission> {
  usePushPrefsStore.getState().setPermission('unsupported');
  return 'unsupported';
}

export async function requestPushPermission(): Promise<PushPermission> {
  usePushPrefsStore.getState().setPermission('unsupported');
  return 'unsupported';
}

export function deliverPush(_input: DeliverPushInput): void {
  // 網頁版不送裝置推播，通知中心已保留紀錄。
}

export async function sendTestPush(): Promise<boolean> {
  return false;
}

export async function clearDeliveredPush(): Promise<void> {
  // 網頁版沒有系統通知匣可清。
}

export function pushDeviceLabel(): string {
  return '此平台不支援裝置推播（請於 iOS／Android App 使用）';
}

export function addPushTapListener(_handler: (payload: PushTapPayload) => void): () => void {
  return () => undefined;
}
