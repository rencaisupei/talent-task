import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AppUpdateStatus } from '@/lib/appUpdate';

/** 觸發來源：開 App、回到前景、App 開著跨日、使用者手動。 */
export type MaintenanceTrigger = 'launch' | 'foreground' | 'schedule' | 'manual';

export type MaintenanceTaskStatus = 'done' | 'skipped' | 'failed';

export interface DeviceMaintenanceTask {
  key: string;
  label: string;
  status: MaintenanceTaskStatus;
  /** 這項維護處理掉的筆數（沒有數量概念的任務為 0）。 */
  affected: number;
  message: string;
}

export interface DeviceMaintenanceRun {
  id: string;
  at: number;
  /** 台北時區日期（YYYY-MM-DD），每日去重就靠這個欄位。 */
  dayKey: string;
  trigger: MaintenanceTrigger;
  durationMs: number;
  tasks: DeviceMaintenanceTask[];
  updateStatus: AppUpdateStatus;
}

const HISTORY_LIMIT = 20;

export const MAINTENANCE_TRIGGER_LABEL: Record<MaintenanceTrigger, string> = {
  launch: '開啟 App',
  foreground: '回到前景',
  schedule: '跨日自動',
  manual: '手動執行',
};

interface MaintenanceState {
  hydrated: boolean;
  running: boolean;
  /** 最近一次完成維護的台北日期；同一天不會重複執行。 */
  lastDayKey: string | null;
  runs: DeviceMaintenanceRun[];
  updateStatus: AppUpdateStatus | 'unknown';

  markHydrated: () => void;
  setRunning: (running: boolean) => void;
  recordRun: (run: DeviceMaintenanceRun) => void;
  setUpdateStatus: (status: AppUpdateStatus) => void;
}

type PersistedMaintenance = Pick<MaintenanceState, 'lastDayKey' | 'runs' | 'updateStatus'>;

export const useMaintenanceStore = create<MaintenanceState>()(
  persist<MaintenanceState, [], [], PersistedMaintenance>(
    (set) => ({
      hydrated: false,
      running: false,
      lastDayKey: null,
      runs: [],
      updateStatus: 'unknown',

      markHydrated: () => set({ hydrated: true }),

      setRunning: (running) => set({ running }),

      recordRun: (run) =>
        set((state) => ({
          runs: [run, ...state.runs].slice(0, HISTORY_LIMIT),
          lastDayKey: run.dayKey,
        })),

      setUpdateStatus: (status) => set({ updateStatus: status }),
    }),
    {
      name: 'instantgig-maintenance',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastDayKey: state.lastDayKey,
        runs: state.runs,
        updateStatus: state.updateStatus,
      }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

/** 最近一次維護紀錄。 */
export function lastMaintenanceRun(runs: DeviceMaintenanceRun[]): DeviceMaintenanceRun | null {
  return runs[0] ?? null;
}
