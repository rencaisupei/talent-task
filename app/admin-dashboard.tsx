import { Redirect } from 'expo-router';

/** 舊路徑導向管理員專屬平台（需先通過管理員登入）。 */
export default function AdminDashboardRedirect() {
  return <Redirect href="/admin/dashboard" />;
}
