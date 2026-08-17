import { Redirect, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClipboardList, Home, MessageCircle, User } from 'lucide-react-native';
import { View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { useTotalUnread } from '@/lib/stores/chat';
import { useSessionStore } from '@/lib/stores/session';

export default function TabLayout() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const authStatus = useSessionStore((state) => state.authStatus);
  const profileLoaded = useSessionStore((state) => state.profileLoaded);
  const role = useSessionStore((state) => state.role);
  const skills = useSessionStore((state) => state.skills);
  const unreadMessages = useTotalUnread();

  // 訪客可以直接進任務牆瀏覽，只等本機資料 hydrate 完成；
  // 已登入者多等後端 profile 載入，否則新裝置上會先閃一次錯的身分視角。
  if (!hydrated || (authStatus === 'signedIn' && !profileLoaded)) {
    return <View className="bg-background flex-1" />;
  }

  // 還沒選身分（訪客或剛註冊）一律先看任務牆，身分可在「帳戶」分頁切換。
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
            // 未讀訊息會在沒開 App 時抵達，因此分頁上顯示未讀數。
            tabBarBadge:
              unreadMessages > 0 ? (unreadMessages > 99 ? '99+' : unreadMessages) : undefined,
            tabBarBadgeStyle: { backgroundColor: COLORS.coral, fontSize: 10 },
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
