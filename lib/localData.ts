import { useBidStore } from '@/lib/stores/bids';
import { useChatStore } from '@/lib/stores/chat';
import { useGigStore } from '@/lib/stores/gigs';
import { useNotificationStore } from '@/lib/stores/notifications';
import { useReviewStore } from '@/lib/stores/reviews';
import { useSavedStore } from '@/lib/stores/saved';

/**
 * 換成另一個真實帳號時清空本機使用者資料。
 *
 * 示範種子資料是假資料，不會上傳到後端，也不該混進另一個人的任務與對話裡。
 * 未登入（訪客）與登入同一個帳號都不會觸發，因此裝置上的內容會保留。
 */
export function resetLocalUserData(): void {
  useGigStore.setState({ gigs: [] });
  useBidStore.setState({ bids: [] });
  useChatStore.setState({ conversations: [], messages: {} });
  useReviewStore.setState({ reviews: [] });
  useSavedStore.setState({ savedGigIds: [] });
  useNotificationStore.setState({ items: [] });
}
