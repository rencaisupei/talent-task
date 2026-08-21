import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearDeliveredPush } from '@/lib/push';
import { useBidStore } from '@/lib/stores/bids';
import { useBlockStore } from '@/lib/stores/blocks';
import { useChatStore } from '@/lib/stores/chat';
import { useGigStore } from '@/lib/stores/gigs';
import { useNotificationStore } from '@/lib/stores/notifications';
import { useReviewStore } from '@/lib/stores/reviews';
import { useSavedStore } from '@/lib/stores/saved';

/**
 * 上雲前留在裝置上的持久化鍵，已不再使用。
 * 對話、通知、收藏與評價的擁有者現在都是帳號，本機不再保存這些內容。
 */
const LEGACY_STORAGE_KEYS = [
  'instantgig-chat',
  'instantgig-notifications',
  'instantgig-saved',
  'instantgig-reviews',
];

/**
 * 清空這台裝置上的個人資料快取：主動登出時，以及換成另一個真實帳號時。
 *
 * 任務、提案、對話、評價、收藏與通知中心都在雲端，擁有者是帳號而不是裝置，
 * 因此這裡**不刪除任何內容**，只是清掉快取並以新身分重讀一次
 * （RLS 的可見範圍會跟著身分換）。同一支手機換人使用時看不到前一位的資料，
 * 而本人重新登入時通知、收藏與評價都會回來。
 *
 * 擁有者（ownerId）由 components/CloudSync 依登入狀態設定，這裡不動它。
 */
export function resetLocalUserData(): void {
  useChatStore.getState().reset();
  useSavedStore.getState().reset();
  useNotificationStore.getState().reset();
  useBlockStore.getState().reset();

  // 系統通知匣裡已經送出的橫幅與紅點要撤掉，否則點開仍看得到前一位的訊息內容。
  void clearDeliveredPush();

  void useGigStore.getState().refreshGigs();
  void useBidStore.getState().refreshBids();
  void useChatStore.getState().refreshConversations();
  void useReviewStore.getState().refreshReviews();
  void useSavedStore.getState().refreshSaved();
  void useNotificationStore.getState().refreshNotifications();
}

/**
 * 刪掉上雲前留在裝置上的紀錄。
 * 那些資料沒有帳號可對應（或已被雲端取代），保留只會與雲端資料混淆。
 */
export async function purgeLegacyDeviceData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(LEGACY_STORAGE_KEYS);
  } catch {
    // 清不掉不影響功能，下次啟動會再試。
  }
}
