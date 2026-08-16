import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

/** 舊路徑導向管理員專屬平台；管理平台僅網頁版提供，手機 App 直接回到主畫面。 */
export default function AdminDashboardRedirect() {
  if (Platform.OS !== 'web') return <Redirect href="/(tabs)" />;
  return <Redirect href="/admin/dashboard" />;
}
