import { useEffect } from 'react';
import { usePathname } from 'expo-router';

import { isAdminPath } from '@/lib/adminHost';
import { purgeLegacyChatStorage } from '@/lib/localData';
import { startChatLiveSync, startContentLiveSync } from '@/lib/remote/live';
import { useBidStore } from '@/lib/stores/bids';
import { useChatStore } from '@/lib/stores/chat';
import { useGigStore } from '@/lib/stores/gigs';
import { useSessionStore } from '@/lib/stores/session';

/** 手動觸發一次雲端同步（下拉重整、送出後回到列表都用這個）。 */
export function refreshCloudContent(): void {
  void useGigStore.getState().refreshGigs();
  void useBidStore.getState().refreshBids();
}

/**
 * 任務、提案與對話的雲端同步入口。
 *
 * 任務牆、提案與對話都是 bilt-cloud 的資料，這裡負責：
 * 1. 登入狀態確定後讀取一次（RLS 的可見範圍取決於身分，太早讀會抓錯範圍）。
 * 2. 訂閱變更，讓別人的新任務、新提案與新訊息自動出現。
 * 3. 以輪詢與回到前景時的重新讀取作為保證機制。
 */
export function CloudSync() {
  const authStatus = useSessionStore((state) => state.authStatus);
  const authUserId = useSessionStore((state) => state.authUserId);
  // 管理平台（網頁 /admin）用 admin-content 讀完整資料，不需要一般使用者的同步。
  // 只在兩側之間切換時才會重建訂閱，管理平台內部換頁不受影響。
  const onAdminRoute = isAdminPath(usePathname());

  useEffect(() => {
    if (onAdminRoute) return undefined;
    // 'unknown' 代表還在確認裝置上的登入狀態。
    if (authStatus === 'unknown') return undefined;

    return startContentLiveSync({ onRefresh: refreshCloudContent });
  }, [authStatus, authUserId, onAdminRoute]);

  useEffect(() => {
    if (onAdminRoute) return undefined;

    // 對話一定屬於某個帳號，訪客沒有對話可讀。
    if (authStatus !== 'signedIn' || authUserId.length === 0) {
      useChatStore.getState().reset();
      return undefined;
    }

    // 對話已上雲，裝置上的舊聊天紀錄不再使用。
    void purgeLegacyChatStorage();

    return startChatLiveSync({
      userId: authUserId,
      onInboxRefresh: () => void useChatStore.getState().refreshConversations(),
      onThreadRefresh: (conversationId) =>
        void useChatStore.getState().refreshMessages(conversationId),
    });
  }, [authStatus, authUserId, onAdminRoute]);

  return null;
}
