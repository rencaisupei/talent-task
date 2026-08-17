import { useBidStore } from '@/lib/stores/bids';
import { useChatStore } from '@/lib/stores/chat';
import { useGigStore } from '@/lib/stores/gigs';
import { useNotificationStore } from '@/lib/stores/notifications';
import { useReviewStore } from '@/lib/stores/reviews';
import { useSavedStore } from '@/lib/stores/saved';

/**
 * 換帳號（含第一次登入真實帳號）時清空本機使用者資料。
 *
 * 示範種子資料是假資料，不會上傳到後端，也不該混進真實帳號的任務與對話裡，
 * 因此登入後一律從空白開始，之後改由後端資料表提供內容。
 */
export function resetLocalUserData(): void {
  useGigStore.setState({ gigs: [] });
  useBidStore.setState({ bids: [] });
  useChatStore.setState({ conversations: [], messages: {} });
  useReviewStore.setState({ reviews: [] });
  useSavedStore.setState({ savedGigIds: [] });
  useNotificationStore.setState({ items: [] });
}
