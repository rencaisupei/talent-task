import { useBidStore } from '@/lib/stores/bids';
import { useChatStore } from '@/lib/stores/chat';
import { useGigStore } from '@/lib/stores/gigs';
import { useNotificationStore } from '@/lib/stores/notifications';
import { useReviewStore } from '@/lib/stores/reviews';
import { useSavedStore } from '@/lib/stores/saved';

/**
 * 換成另一個真實帳號時清空這台裝置上的本機資料。
 *
 * 任務與提案已經在雲端（gigs / bids 資料表），擁有者是帳號而不是裝置，
 * 因此這裡只清掉仍存在裝置上的對話、評價、收藏與通知，
 * 並讓雲端資料以新身分重新讀取一次（RLS 可見範圍會跟著換）。
 */
export function resetLocalUserData(): void {
  useChatStore.setState({ conversations: [], messages: {} });
  useReviewStore.setState({ reviews: [] });
  useSavedStore.setState({ savedGigIds: [] });
  useNotificationStore.setState({ items: [] });

  void useGigStore.getState().refreshGigs();
  void useBidStore.getState().refreshBids();
}
