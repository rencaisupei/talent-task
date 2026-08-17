/** 雲端讀寫的統一回傳形狀：畫面只需要處理成功值或可顯示的訊息。 */
export type RemoteResult<T> = { status: 'ok'; data: T } | { status: 'error'; message: string };

export const REMOTE_UNCONFIGURED_MESSAGE = '尚未設定後端連線，任務與提案無法同步到雲端。';
export const REMOTE_OFFLINE_MESSAGE = '無法連線到雲端資料，請確認網路後重新整理。';
export const REMOTE_SIGN_IN_MESSAGE = '請先登入才能發布任務或投遞提案。';

export function remoteError<T>(message: string): RemoteResult<T> {
  return { status: 'error', message };
}

/** 由 id 產生穩定的整數種子，用於補上示範資料缺少的地圖座標偏移。 */
export function stableSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2_147_483_647;
  }
  return hash;
}
