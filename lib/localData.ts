import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearDeliveredPush } from '@/lib/push';
import { useBidStore } from '@/lib/stores/bids';
import { useChatStore } from '@/lib/stores/chat';
import { useGigStore } from '@/lib/stores/gigs';
import { useNotificationStore } from '@/lib/stores/notifications';
import { useReviewStore } from '@/lib/stores/reviews';
import { useSavedStore } from '@/lib/stores/saved';

/** 對話上雲前的本機持久化鍵，已不再使用。 */
const LEGACY_CHAT_STORAGE_KEY = 'instantgig-chat';

/**
 * 清空這台裝置上屬於個人的資料：主動登出時，以及換成另一個真實帳號時。
 *
 * 任務、提案與對話都在雲端，擁有者是帳號而不是裝置，因此那些只需要清掉本機快取
 * 並以新身分重讀一次（RLS 可見範圍會跟著換）。
 * 評價、收藏與通知中心只存在裝置上，這裡是真的刪除——同一支手機換人使用時
 * 不能讓下一位看到前一位的內容。
 */
export function resetLocalUserData(): void {
  useChatStore.getState().reset();
  useReviewStore.setState({ reviews: [] });
  useSavedStore.setState({ savedGigIds: [] });
  useNotificationStore.getState().clearAll();

  // 系統通知匣裡已經送出的橫幅與紅點也要撤掉，否則點開仍看得到前一位的訊息內容。
  void clearDeliveredPush();

  void useGigStore.getState().refreshGigs();
  void useBidStore.getState().refreshBids();
  void useChatStore.getState().refreshConversations();
}

/**
 * 刪掉對話上雲前留在裝置上的聊天紀錄。
 * 那些紀錄的對象沒有真實帳號可對應，保留只會與雲端對話混淆。
 */
export async function purgeLegacyChatStorage(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LEGACY_CHAT_STORAGE_KEY);
  } catch {
    // 清不掉不影響功能，下次啟動會再試。
  }
}
