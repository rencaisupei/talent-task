import { useEffect } from 'react';

import { startContentLiveSync } from '@/lib/remote/live';
import { useBidStore } from '@/lib/stores/bids';
import { useGigStore } from '@/lib/stores/gigs';
import { useSessionStore } from '@/lib/stores/session';

/** 手動觸發一次雲端同步（下拉重整、送出後回到列表都用這個）。 */
export function refreshCloudContent(): void {
  void useGigStore.getState().refreshGigs();
  void useBidStore.getState().refreshBids();
}

/**
 * 任務與提案的雲端同步入口。
 *
 * 任務牆與提案清單都是 bilt-cloud 的資料，這裡負責：
 * 1. 登入狀態確定後讀取一次（RLS 的可見範圍取決於身分，太早讀會抓錯範圍）。
 * 2. 訂閱資料變更，有 Realtime 服務時其他人的新任務與新提案會立刻出現。
 * 3. 以輪詢與回到前景時的重新讀取作為保證機制。
 */
export function CloudSync() {
  const authStatus = useSessionStore((state) => state.authStatus);
  const authUserId = useSessionStore((state) => state.authUserId);

  useEffect(() => {
    // 'unknown' 代表還在確認裝置上的登入狀態。
    if (authStatus === 'unknown') return undefined;

    return startContentLiveSync({ onRefresh: refreshCloudContent });
  }, [authStatus, authUserId]);

  return null;
}
