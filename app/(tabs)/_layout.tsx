import { Redirect, Tabs } from 'expo-router';
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

  // 等三件事確定才渲染分頁：本機資料 hydrate、登入狀態（unknown 期間不能判斷身分，
  // 否則已有帳號的人在新裝置上會先被導去身分選擇頁）、已登入者的後端 profile。
  if (!hydrated || authStatus === 'unknown' || (authStatus === 'signedIn' && !profileLoaded)) {
    return <View className="bg-background flex-1" />;
  }

  // 還沒選身分（未註冊、未登入或剛建立帳號）一律先到身分選擇頁；
  // 選過之後就直接進任務牆，身分可在「帳戶」分頁切換。
  if (role === null) {
    return <Redirect href="/onboarding/role" />;
  }

  if (role === 'talent' && skills.length === 0) {
    return <Redirect href="/onboarding/skills" />;
  }

  return (
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
  );
}
