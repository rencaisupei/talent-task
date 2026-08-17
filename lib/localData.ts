import AsyncStorage from '@react-native-async-storage/async-storage';

import { useBidStore } from '@/lib/stores/bids';
import { useChatStore } from '@/lib/stores/chat';
import { useGigStore } from '@/lib/stores/gigs';
import { useNotificationStore } from '@/lib/stores/notifications';
import { useReviewStore } from '@/lib/stores/reviews';
import { useSavedStore } from '@/lib/stores/saved';

/** 對話上雲前的本機持久化鍵，已不再使用。 */
const LEGACY_CHAT_STORAGE_KEY = 'instantgig-chat';

/**
 * 換成另一個真實帳號時清空這台裝置上的本機資料。
 *
 * 任務、提案與對話都已經在雲端，擁有者是帳號而不是裝置，
 * 因此這裡只清掉仍存在裝置上的評價、收藏與通知，以及雲端資料的本機快取，
 * 並讓雲端資料以新身分重新讀取一次（RLS 可見範圍會跟著換）。
 */
export function resetLocalUserData(): void {
  useChatStore.getState().reset();
  useReviewStore.setState({ reviews: [] });
  useSavedStore.setState({ savedGigIds: [] });
  useNotificationStore.setState({ items: [] });

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
