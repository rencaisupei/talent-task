import { Redirect, Stack, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { useAdminAuthStore } from '@/lib/stores/adminAuth';

/** 管理平台僅在網頁版提供，手機 App 不開放。 */
const IS_ADMIN_PLATFORM = Platform.OS === 'web';

const NOINDEX_META_ID = 'admin-robots-noindex';

/**
 * 管理平台不得被搜尋引擎收錄。靜態匯出是單頁（web.output = 'single'），
 * index.html 為全站共用，因此索引標記只能在進入 /admin 時於執行階段插入，
 * 離開時移除，避免影響公開頁面。搭配 public/robots.txt 與主機端 X-Robots-Tag。
 */
function useAdminNoIndexMeta(): void {
  useEffect(() => {
    if (!IS_ADMIN_PLATFORM || typeof document === 'undefined') return undefined;
    if (document.getElementById(NOINDEX_META_ID)) return undefined;

    const meta = document.createElement('meta');
    meta.id = NOINDEX_META_ID;
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    return () => {
      meta.remove();
    };
  }, []);
}

/** 管理員專屬平台的權限閘門：僅網頁版可進入，且未登入只能停留在登入頁。 */
export default function AdminLayout() {
  useAdminNoIndexMeta();
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
