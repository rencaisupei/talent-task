import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * 通知初始化：前景顯示行為與 Android 通知頻道。
 * 目前推播由後台模擬（寫入 App 內通知中心），接上推播服務後
 * 只要在這裡註冊裝置 token 即可。
 */
export function initNotifications() {
  if (Platform.OS === 'web') return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync('default', {
      name: '一般通知',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#FF4F9A',
      vibrationPattern: [0, 250, 250, 250],
    });
    void Notifications.setNotificationChannelAsync('messages', {
      name: '訊息與配對',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#FF4F9A',
      vibrationPattern: [0, 200, 150, 200],
    });
    void Notifications.setNotificationChannelAsync('calls', {
      name: '來電提醒',
      importance: Notifications.AndroidImportance.MAX,
      lightColor: '#38E1FF',
      vibrationPattern: [0, 400, 200, 400],
    });
  }
}
