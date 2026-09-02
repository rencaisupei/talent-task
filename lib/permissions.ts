import { AudioModule } from 'expo-audio';
import { Camera } from 'expo-camera';
import { Linking, Platform } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TrackingTransparency from 'expo-tracking-transparency';

export type PermissionKey =
  | 'camera'
  | 'photos'
  | 'microphone'
  | 'location'
  | 'notifications'
  | 'contacts'
  | 'tracking';

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export interface PermissionInfo {
  key: PermissionKey;
  label: string;
  purpose: string;
  state: PermissionState;
}

interface PermissionMeta {
  key: PermissionKey;
  label: string;
  purpose: string;
  /** 這些權限在網頁版沒有對應能力。 */
  nativeOnly: boolean;
}

export const PERMISSION_META: PermissionMeta[] = [
  {
    key: 'camera',
    label: '相機',
    purpose: '拍照上傳、真人認證與視訊通話',
    nativeOnly: false,
  },
  {
    key: 'photos',
    label: '照片與相簿',
    purpose: '挑選個人照片、在聊天與動態分享照片',
    nativeOnly: false,
  },
  {
    key: 'microphone',
    label: '麥克風',
    purpose: '語音訊息與語音／視訊通話',
    nativeOnly: false,
  },
  {
    key: 'location',
    label: '位置',
    purpose: '附近的人、距離顯示與同城配對',
    nativeOnly: false,
  },
  {
    key: 'notifications',
    label: '通知',
    purpose: '新配對、訊息、來電與活動提醒',
    nativeOnly: false,
  },
  {
    key: 'contacts',
    label: '通訊錄',
    purpose: '隱藏認識的人、邀請朋友一起玩',
    nativeOnly: true,
  },
  {
    key: 'tracking',
    label: '追蹤透明度（ATT）',
    purpose: 'iOS 個人化推薦與廣告成效衡量',
    nativeOnly: true,
  },
];

const isWeb = Platform.OS === 'web';

function toState(status: string | undefined): PermissionState {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

async function readState(key: PermissionKey): Promise<PermissionState> {
  const meta = PERMISSION_META.find((item) => item.key === key);
  if (meta?.nativeOnly && isWeb) return 'unsupported';

  try {
    switch (key) {
      case 'camera': {
        const result = await Camera.getCameraPermissionsAsync();
        return toState(result.status);
      }
      case 'photos': {
        const result = await ImagePicker.getMediaLibraryPermissionsAsync();
        return toState(result.status);
      }
      case 'microphone': {
        const result = await AudioModule.getRecordingPermissionsAsync();
        return toState(result.status);
      }
      case 'location': {
        const result = await Location.getForegroundPermissionsAsync();
        return toState(result.status);
      }
      case 'notifications': {
        const result = await Notifications.getPermissionsAsync();
        return toState(result.status);
      }
      case 'contacts': {
        const result = await Contacts.getPermissionsAsync();
        return toState(result.status);
      }
      case 'tracking': {
        if (Platform.OS !== 'ios') return 'unsupported';
        const result = await TrackingTransparency.getTrackingPermissionsAsync();
        return toState(result.status);
      }
      default:
        return 'unsupported';
    }
  } catch {
    return 'unsupported';
  }
}

async function askFor(key: PermissionKey): Promise<PermissionState> {
  const meta = PERMISSION_META.find((item) => item.key === key);
  if (meta?.nativeOnly && isWeb) return 'unsupported';

  try {
    switch (key) {
      case 'camera': {
        const result = await Camera.requestCameraPermissionsAsync();
        return toState(result.status);
      }
      case 'photos': {
        const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return toState(result.status);
      }
      case 'microphone': {
        const result = await AudioModule.requestRecordingPermissionsAsync();
        return toState(result.status);
      }
      case 'location': {
        const result = await Location.requestForegroundPermissionsAsync();
        return toState(result.status);
      }
      case 'notifications': {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: '一般通知',
            importance: Notifications.AndroidImportance.DEFAULT,
            lightColor: '#FF4F9A',
            vibrationPattern: [0, 250, 250, 250],
          });
        }
        const result = await Notifications.requestPermissionsAsync();
        return toState(result.status);
      }
      case 'contacts': {
        const result = await Contacts.requestPermissionsAsync();
        return toState(result.status);
      }
      case 'tracking': {
        if (Platform.OS !== 'ios') return 'unsupported';
        const result = await TrackingTransparency.requestTrackingPermissionsAsync();
        return toState(result.status);
      }
      default:
        return 'unsupported';
    }
  } catch {
    return 'unsupported';
  }
}

type StateMap = Record<PermissionKey, PermissionState>;

const INITIAL: StateMap = {
  camera: 'undetermined',
  photos: 'undetermined',
  microphone: 'undetermined',
  location: 'undetermined',
  notifications: 'undetermined',
  contacts: 'undetermined',
  tracking: 'undetermined',
};

/** 讀取／請求 App 所需的裝置權限，供設定頁的權限面板使用。 */
export function useDevicePermissions() {
  const [states, setStates] = useState<StateMap>(INITIAL);
  const [pending, setPending] = useState<PermissionKey | null>(null);

  const refresh = useCallback(async () => {
    const entries = await Promise.all(
      PERMISSION_META.map(async (meta) => [meta.key, await readState(meta.key)] as const),
    );
    setStates((prev) => {
      const next = { ...prev };
      for (const [key, state] of entries) next[key] = state;
      return next;
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const request = useCallback(async (key: PermissionKey) => {
    setPending(key);
    const state = await askFor(key);
    setStates((prev) => ({ ...prev, [key]: state }));
    setPending(null);
    return state;
  }, []);

  const items: PermissionInfo[] = PERMISSION_META.map((meta) => ({
    key: meta.key,
    label: meta.label,
    purpose: meta.purpose,
    state: states[meta.key],
  }));

  return { items, request, refresh, pending };
}

/** 開啟系統設定頁，讓使用者手動改掉已拒絕的權限。 */
export async function openSystemSettings() {
  if (isWeb) return;
  await Linking.openSettings();
}
