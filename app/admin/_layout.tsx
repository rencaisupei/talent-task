import { Redirect, Stack, useSegments } from 'expo-router';
import { Platform, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { useAdminAuthStore } from '@/lib/stores/adminAuth';

/** 管理平台僅在網頁版提供，手機 App 不開放。 */
const IS_ADMIN_PLATFORM = Platform.OS === 'web';

/** 管理員專屬平台的權限閘門：僅網頁版可進入，且未登入只能停留在登入頁。 */
export default function AdminLayout() {
  const hydrated = useAdminAuthStore((state) => state.hydrated);
  const isSignedIn = useAdminAuthStore((state) => state.currentAdmin !== null);
  const segments = useSegments();
  const isLoginRoute = segments[segments.length - 1] === 'login';

  if (!IS_ADMIN_PLATFORM) return <Redirect href="/(tabs)" />;
  if (!hydrated) return <View className="bg-background flex-1" />;
  if (!isSignedIn && !isLoginRoute) return <Redirect href="/admin/login" />;
  if (isSignedIn && isLoginRoute) return <Redirect href="/admin" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.white },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="review" />
      <Stack.Screen name="users" />
      <Stack.Screen name="user/[id]" />
      <Stack.Screen name="gigs" />
      <Stack.Screen name="revenue" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="audit" />
    </Stack>
  );
}
