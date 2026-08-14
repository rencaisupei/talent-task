import { Tabs } from 'heroui-native';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AnalyticsPanel } from '@/components/admin/AnalyticsPanel';
import { SecurityAudit } from '@/components/admin/SecurityAudit';
import { VerificationQueue } from '@/components/admin/VerificationQueue';
import { COLORS } from '@/lib/colors';
import { goBackOrReplace } from '@/lib/navigation';

type AdminTab = 'verification' | 'security' | 'analytics';

const ADMIN_TABS: AdminTab[] = ['verification', 'security', 'analytics'];

function isAdminTab(value: string): value is AdminTab {
  return (ADMIN_TABS as string[]).includes(value);
}

export default function AdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState<AdminTab>('verification');

  return (
    <View className="bg-background flex-1">
      <View className="border-hairline pt-safe-offset-3 border-b bg-white px-5 pb-3">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => goBackOrReplace('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="返回"
            className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
          >
            <ArrowLeft size={18} color={COLORS.ink} strokeWidth={2.2} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-ink text-[18px] font-bold tracking-tight">平台管理儀表板</Text>
            <Text className="text-muted mt-0.5 text-[12px]">審核、安全與營運監控</Text>
          </View>
        </View>
      </View>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (isAdminTab(value)) setActiveTab(value);
        }}
        variant="primary"
        className="flex-1"
      >
        <View className="border-hairline border-b bg-white px-5 py-3">
          <Tabs.List>
            <Tabs.ScrollView>
              <Tabs.Indicator />
              <Tabs.Trigger value="verification">
                <Tabs.Label>驗證佇列</Tabs.Label>
              </Tabs.Trigger>
              <Tabs.Trigger value="security">
                <Tabs.Label>安全審核</Tabs.Label>
              </Tabs.Trigger>
              <Tabs.Trigger value="analytics">
                <Tabs.Label>即時分析</Tabs.Label>
              </Tabs.Trigger>
            </Tabs.ScrollView>
          </Tabs.List>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 py-5 pb-12"
          showsVerticalScrollIndicator={false}
        >
          <Tabs.Content value="verification">
            <VerificationQueue />
          </Tabs.Content>
          <Tabs.Content value="security">
            <SecurityAudit />
          </Tabs.Content>
          <Tabs.Content value="analytics">
            <AnalyticsPanel />
          </Tabs.Content>
        </ScrollView>
      </Tabs>
    </View>
  );
}
