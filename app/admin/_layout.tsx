import { Redirect, Stack, useSegments } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { IS_ADMIN_PLATFORM_AVAILABLE } from '@/lib/adminHost';
import {
  ADMIN_PERMISSION_LABEL,
  ADMIN_ROLE_SUMMARY,
  type AdminPermission,
} from '@/lib/adminPermissions';
import { COLORS } from '@/lib/colors';
import { useAdminAuthStore } from '@/lib/stores/adminAuth';
import { ADMIN_ROLE_LABEL, type AdminRole } from '@/lib/types';

const NOINDEX_META_ID = 'admin-robots-noindex';
const ADMIN_WEB_TITLE = '人才速配管理平台';
const NOINDEX_CONTENT = 'noindex, nofollow';

/**
 * 每個管理路由需要的權限。角色沒有該權限時，直接開網址也只會看到「權限不足」，
 * 主控台同時不會列出對應模組。破壞性動作在畫面內另有第二層判斷。
 */
const ROUTE_PERMISSION: Record<string, AdminPermission> = {
  review: 'review:manage',
  dashboard: 'review:manage',
  users: 'users:view',
  'user/[id]': 'users:view',
  gigs: 'gigs:manage',
  revenue: 'revenue:view',
  announcements: 'announcements:send',
  audit: 'audit:view',
  maintenance: 'audit:view',
  support: 'review:manage',
  accounts: 'admins:manage',
};

/**
 * 網頁是單頁匯出（web.output = 'single'），index.html 的標題與 robots 標記是給
 * 一般使用者網站用的，因此進入 /admin 時在執行階段改寫，離開時還原：
 *
 * - 分頁標題換成管理平台名稱。
 * - robots 改成 noindex（覆寫既有的 meta，沒有就插入一個）。
 *
 * 伺服器端另有兩層：`public/robots.txt` 的 `Disallow: /admin` 與
 * `public/_headers` 對 /admin* 回應加的 `X-Robots-Tag`。
 */
function useAdminWebDocument(): void {
  useEffect(() => {
    if (!IS_ADMIN_PLATFORM_AVAILABLE || typeof document === 'undefined') return undefined;

    const previousTitle = document.title;
    document.title = ADMIN_WEB_TITLE;

    const existing = document.querySelector('meta[name="robots"]');
    if (existing instanceof HTMLMetaElement) {
      const previousContent = existing.content;
      existing.content = NOINDEX_CONTENT;
      return () => {
        document.title = previousTitle;
        existing.content = previousContent;
      };
    }

    const meta = document.createElement('meta');
    meta.id = NOINDEX_META_ID;
    meta.name = 'robots';
    meta.content = NOINDEX_CONTENT;
    document.head.appendChild(meta);

    return () => {
      document.title = previousTitle;
      meta.remove();
    };
  }, []);
}

/** 管理員專屬平台的權限閘門：僅網頁版可進入，登入狀態與角色權限都在這裡判斷。 */
export default function AdminLayout() {
  useAdminWebDocument();

  const status = useAdminAuthStore((state) => state.status);
  const hydrated = useAdminAuthStore((state) => state.hydrated);
  const refreshSession = useAdminAuthStore((state) => state.refreshSession);
  const role = useAdminAuthStore((state) => state.currentAdmin?.role ?? null);
  const permissions = useAdminAuthStore((state) => state.permissions);

  // 持久化的 token 讀回來後，向後端確認它是否仍有效（帳號被停用或改密碼就會失效）。
  useEffect(() => {
    if (hydrated) void refreshSession();
  }, [hydrated, refreshSession]);

  const segments: string[] = useSegments();
  const adminIndex = segments.indexOf('admin');
  const routeKey = adminIndex === -1 ? '' : segments.slice(adminIndex + 1).join('/');
  const isLoginRoute = routeKey === 'login';

  if (!IS_ADMIN_PLATFORM_AVAILABLE) return <Redirect href="/(tabs)" />;
  if (status === 'checking') return <View className="bg-background flex-1" />;
  if (status === 'signed-out' && !isLoginRoute) return <Redirect href="/admin/login" />;
  if (status === 'signed-in' && isLoginRoute) return <Redirect href="/admin" />;

  const requiredPermission = ROUTE_PERMISSION[routeKey];
  if (
    status === 'signed-in' &&
    requiredPermission !== undefined &&
    !permissions.includes(requiredPermission)
  ) {
    return <NoPermissionScreen permission={requiredPermission} role={role} />;
  }

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
      <Stack.Screen name="maintenance" />
      <Stack.Screen name="support" />
      <Stack.Screen name="accounts" />
    </Stack>
  );
}

interface NoPermissionScreenProps {
  permission: AdminPermission;
  role: AdminRole | null;
}

function NoPermissionScreen({ permission, role }: NoPermissionScreenProps) {
  return (
    <View className="bg-background flex-1">
      <AdminHeader title="權限不足" caption="此模組未開放給你的管理員角色" />
      <View className="gap-4 px-5 py-6">
        <View className="border-coral/25 bg-coral-soft flex-row items-start gap-3 rounded-xl border p-4">
          <ShieldAlert size={18} color={COLORS.coral} strokeWidth={2.2} />
          <View className="flex-1 gap-1">
            <Text className="text-ink text-[14px] font-semibold">
              需要「{ADMIN_PERMISSION_LABEL[permission]}」權限
            </Text>
            <Text className="text-ink-soft text-[12px] leading-5">
              {role === null
                ? '請以具備該權限的管理員帳號登入。'
                : `你目前的角色是${ADMIN_ROLE_LABEL[role]}，可使用範圍：${ADMIN_ROLE_SUMMARY[role]}。`}
            </Text>
          </View>
        </View>
        <Text className="text-muted text-[12px] leading-5">
          需要調整權限請聯絡總管理員，於「管理員帳號管理」變更角色；變更後該帳號會被強制重新登入。
        </Text>
      </View>
    </View>
  );
}
