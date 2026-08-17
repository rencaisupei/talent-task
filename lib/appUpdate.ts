import * as Updates from 'expo-updates';

export type AppUpdateStatus = 'current' | 'available' | 'unavailable';

export interface AppUpdateCheck {
  status: AppUpdateStatus;
  detail: string;
}

/**
 * 每日維護的版本檢查（原生）。
 * 開發模式與 Expo Go 沒有更新通道（Updates.isEnabled 為 false），一律回報略過，
 * 不會拋出「not supported in development builds」。
 */
export async function checkForAppUpdate(): Promise<AppUpdateCheck> {
  if (__DEV__ || !Updates.isEnabled) {
    return { status: 'unavailable', detail: '開發模式沒有更新通道，略過版本檢查。' };
  }

  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) {
      return { status: 'current', detail: '已是最新版本。' };
    }

    await Updates.fetchUpdateAsync();
    return { status: 'available', detail: '新版本已下載完成，重新啟動即可套用。' };
  } catch {
    return { status: 'unavailable', detail: '無法連線更新伺服器，下次維護會再檢查。' };
  }
}

/** 套用已下載的新版本（重新啟動 App）。 */
export async function applyAppUpdate(): Promise<boolean> {
  if (__DEV__ || !Updates.isEnabled) return false;

  try {
    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
}
