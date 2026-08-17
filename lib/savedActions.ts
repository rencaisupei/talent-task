import { Alert } from 'react-native';

import { goToSignIn } from '@/lib/authGuard';
import { useSavedStore } from '@/lib/stores/saved';

/**
 * 收藏按鈕的統一處理。
 *
 * 收藏存在帳號裡（saved_gigs 資料表），所以訪客按下時要先導向登入；
 * 寫入失敗時畫面已經退回原狀，這裡只負責說明原因。
 */
export function toggleSavedGig(gigId: string): void {
  void useSavedStore
    .getState()
    .toggleSaved(gigId)
    .then((result) => {
      if (result === 'signedOut') {
        goToSignIn();
        return;
      }
      if (result === 'error') {
        Alert.alert(
          '收藏未更新',
          useSavedStore.getState().errorMessage ?? '請確認網路後再試一次，收藏會同步到你的帳號。',
        );
      }
    });
}
