import { Heart, MessageCircle, Sparkles, User, Gamepad2 } from 'lucide-react-native';
import { Redirect, Tabs } from 'expo-router';
import { useThemeColor } from 'heroui-native';
import { View } from 'react-native';

import { Txt } from '@/components/ui/Txt';
import { useTotalUnread } from '@/lib/stores/chat';
import { useAuthHydrated, useAuthStore } from '@/lib/stores/auth';

export default function TabLayout() {
  const [background, border, accent, muted] = useThemeColor([
    'background',
    'border',
    'accent',
    'muted',
  ]);
  const hydrated = useAuthHydrated();
  const isAuthed = useAuthStore((state) => state.isAuthed);
  const unread = useTotalUnread();

  if (!hydrated) {
    return <View className="bg-background flex-1" />;
  }

  if (!isAuthed) {
    return <Redirect href="/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: background },
        tabBarStyle: {
          backgroundColor: background,
          borderTopColor: border,
          elevation: 0,
          shadowColor: 'transparent',
          shadowOpacity: 0,
          shadowRadius: 0,
          height: 62,
          paddingTop: 6,
        },
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: muted,
        tabBarLabel: () => null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '遊戲城',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon label="遊戲城" color={color} focused={focused}>
              <Gamepad2 color={color} size={23} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="moments"
        options={{
          title: '動態',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon label="動態" color={color} focused={focused}>
              <Sparkles color={color} size={23} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: '配對',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon label="配對" color={color} focused={focused}>
              <Heart color={color} size={23} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '訊息',
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: accent, fontSize: 10 },
          tabBarIcon: ({ color, focused }) => (
            <TabIcon label="訊息" color={color} focused={focused}>
              <MessageCircle color={color} size={23} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: '我的',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon label="我的" color={color} focused={focused}>
              <User color={color} size={23} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  children,
  label,
  color,
  focused,
}: {
  children: React.ReactNode;
  label: string;
  color: string;
  focused: boolean;
}) {
  return (
    <View className="w-16 items-center gap-1">
      {children}
      <Txt weight={focused ? 'semibold' : 'regular'} style={{ color, fontSize: 10 }}>
        {label}
      </Txt>
    </View>
  );
}
