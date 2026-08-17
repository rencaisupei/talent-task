export type AppUpdateStatus = 'current' | 'available' | 'unavailable';

export interface AppUpdateCheck {
  status: AppUpdateStatus;
  detail: string;
}

/**
 * 網頁版的版本檢查：問 service worker 有沒有新的快取版本
 * （`npm run build:pwa` 產生的 sw.js；開發伺服器沒有註冊 service worker）。
 */
export async function checkForAppUpdate(): Promise<AppUpdateCheck> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return { status: 'unavailable', detail: '此瀏覽器不支援離線更新檢查。' };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return { status: 'unavailable', detail: '未安裝離線版本，重新載入頁面即為最新內容。' };
    }

    await registration.update();
    if (registration.waiting !== null) {
      return { status: 'available', detail: '新版本已下載完成，重新載入即可套用。' };
    }

    return { status: 'current', detail: '已是最新版本。' };
  } catch {
    return { status: 'unavailable', detail: '無法檢查版本，下次維護會再檢查。' };
  }
}

/** 套用已下載的新版本（重新載入頁面）。 */
export async function applyAppUpdate(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    } catch {
      // 略過：即使 service worker 沒回應，重新載入仍會取得新資源。
    }
  }

  window.location.reload();
  return true;
}
