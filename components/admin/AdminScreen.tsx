import type { ReactNode } from 'react';
import type { Href } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Redirect } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';

import { CopyrightFooter } from '@/components/ui/CopyrightFooter';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Txt } from '@/components/ui/Txt';
import { useAdminStore } from '@/lib/stores/admin';
import { NEON } from '@/lib/theme';

interface AdminScreenProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  back?: boolean;
  fallback?: Href;
  children: ReactNode;
}

/** 管理員平台的畫面外框：登入守衛、標題列、內容捲動區與版權頁尾。 */
export function AdminScreen({
  title,
  subtitle,
  right,
  back = true,
  fallback = '/admin',
  children,
}: AdminScreenProps) {
  const authed = useAdminStore((state) => state.authed);

  if (!authed) return <Redirect href="/admin/login" />;

  return (
    <Screen glow={false}>
      <View className="border-border/60 bg-surface/40 border-b">
        <ScreenHeader
          back={back}
          fallback={fallback}
          title={title}
          subtitle={subtitle}
          right={right}
          left={
            back ? undefined : (
              <View className="bg-accent-soft h-10 w-10 items-center justify-center rounded-full">
                <ShieldCheck color={NEON.coral} size={18} />
              </View>
            )
          }
        />
      </View>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="gap-5 px-4 pt-4 pb-4"
          keyboardShouldPersistTaps="handled"
        >
          {children}
          <CopyrightFooter showVersion />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** 管理員模式提示條，放在畫面頂端提醒目前處於後台。 */
export function AdminNotice({ text }: { text: string }) {
  return (
    <View className="border-warning/40 bg-warning/10 rounded-2xl border px-3 py-2">
      <Txt className="text-warning text-[11px] leading-4">{text}</Txt>
    </View>
  );
}
