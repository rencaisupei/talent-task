import { Redirect, Stack, useSegments } from 'expo-router';
import { View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { useAdminAuthStore } from '@/lib/stores/adminAuth';

/** 管理員專屬平台的權限閘門：未登入只能停留在登入頁。 */
export default function AdminLayout() {
  const hydrated = useAdminAuthStore((state) => state.hydrated);
  const isSignedIn = useAdminAuthStore((state) => state.currentAdmin !== null);
  const segments = useSegments();
  const isLoginRoute = segments[segments.length - 1] === 'login';

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
      <Stack.Screen name="users" />
      <Stack.Screen name="user/[id]" />
      <Stack.Screen name="gigs" />
      <Stack.Screen name="revenue" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="audit" />
    </Stack>
  );
}
