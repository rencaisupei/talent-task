import { Redirect, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClipboardList, Home, MessageCircle, User } from 'lucide-react-native';
import { View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { useSessionStore } from '@/lib/stores/session';

export default function TabLayout() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const authStatus = useSessionStore((state) => state.authStatus);
  const profileLoaded = useSessionStore((state) => state.profileLoaded);
  const role = useSessionStore((state) => state.role);
  const skills = useSessionStore((state) => state.skills);

  // 等後端 profile 載入完才判斷要不要進 onboarding，
  // 否則在新裝置上會先閃一次身分選擇頁，才被伺服器上的身分覆寫。
  if (!hydrated || authStatus !== 'signedIn' || !profileLoaded) {
    return <View className="bg-background flex-1" />;
  }

  if (!role) {
    return <Redirect href="/onboarding/role" />;
  }

  if (role === 'talent' && skills.length === 0) {
    return <Redirect href="/onboarding/skills" />;
  }

  return (
    <>
      {/* eslint-disable-next-line react/style-prop-object -- expo-status-bar's `style` prop is a string enum, not a RN style object */}
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: COLORS.white },
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopColor: COLORS.hairline,
            borderTopWidth: 1,
            shadowColor: '#000000',
            shadowOpacity: 0.03,
            shadowRadius: 6,
            elevation: 4,
          },
          tabBarActiveTintColor: COLORS.brand,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: role === 'client' ? '發布中心' : '任務牆',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: role === 'client' ? '任務管理' : '我的接案',
            tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="chats"
          options={{
            title: '對話',
            tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '帳戶',
            tabBarIcon: ({ color, size }) => <User color={color} size={size ?? 24} />,
          }}
        />
      </Tabs>
    </>
  );
}
