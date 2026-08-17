import { useEffect } from 'react';
import { AppState } from 'react-native';

import { ensureDailyMaintenance } from '@/lib/maintenance';
import { useMaintenanceStore } from '@/lib/stores/maintenance';

/** App 開著跨日時的補跑間隔。 */
const ROLLOVER_CHECK_MS = 30 * 60 * 1000;

/**
 * 每日一次的裝置端系統維護觸發器。
 * 開 App、從背景回到前景、以及 App 長時間開著跨日時各檢查一次；
 * 同一天只會真的執行一次（判斷在 ensureDailyMaintenance）。
 */
export function MaintenanceRunner() {
  const hydrated = useMaintenanceStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return undefined;

    void ensureDailyMaintenance('launch');

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void ensureDailyMaintenance('foreground');
    });

    const timer = setInterval(() => {
      void ensureDailyMaintenance('schedule');
    }, ROLLOVER_CHECK_MS);

    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [hydrated]);

  return null;
}
