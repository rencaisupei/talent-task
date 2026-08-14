import { Tabs } from 'heroui-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AnalyticsPanel } from '@/components/admin/AnalyticsPanel';
import { SecurityAudit } from '@/components/admin/SecurityAudit';
import { VerificationQueue } from '@/components/admin/VerificationQueue';

type AdminTab = 'verification' | 'security' | 'analytics';

const ADMIN_TABS: AdminTab[] = ['verification', 'security', 'analytics'];

function isAdminTab(value: string): value is AdminTab {
  return (ADMIN_TABS as string[]).includes(value);
}

export default function AdminModerationScreen() {
  const [activeTab, setActiveTab] = useState<AdminTab>('verification');

  return (
    <View className="bg-background flex-1">
      <AdminHeader title="審核與安全中心" caption="驗證佇列、封禁引擎與即時分析" />

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
