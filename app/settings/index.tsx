import {
  BadgeCheck,
  Bell,
  ChevronRight,
  CircleHelp,
  Coins,
  Crown,
  Eye,
  FileText,
  Globe,
  Info,
  Lock,
  LogOut,
  MessageSquareText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCog,
  UserX,
} from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';

import { CopyrightFooter } from '@/components/ui/CopyrightFooter';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { SettingsGroup, SettingsRow } from '@/components/ui/SettingsUI';
import { Txt } from '@/components/ui/Txt';
import { APP_VERSION } from '@/lib/company';
import { CADENCE_LABEL } from '@/lib/data/ai';
import { useAdminStore } from '@/lib/stores/admin';
import { useAiStore, usePendingDraftCount, usePendingFindingCount } from '@/lib/stores/ai';
import { KYC_STATUS_LABEL, useAuthStore } from '@/lib/stores/auth';
import { TIER_LABEL, useSubscriptionStore } from '@/lib/stores/subscription';
import { useOpenTicketCount } from '@/lib/stores/support';
import { NEON } from '@/lib/theme';

/** 連續點擊版本號這麼多次後才會顯示管理員入口。 */
const ADMIN_REVEAL_TAPS = 5;

export default function SettingsScreen() {
  const logout = useAuthStore((state) => state.logout);
  const email = useAuthStore((state) => state.email);
  const me = useAuthStore((state) => state.me);
  const kyc = useAuthStore((state) => state.kyc);
  const blockedIds = useAuthStore((state) => state.blockedIds);
  const tier = useSubscriptionStore((state) => state.tier);
  const coins = useSubscriptionStore((state) => state.coins);
  const adminAuthed = useAdminStore((state) => state.authed);
  const patrol = useAiStore((state) => state.patrol);
  const content = useAiStore((state) => state.content);
  const pendingFindings = usePendingFindingCount();
  const pendingDrafts = usePendingDraftCount();
  const openTickets = useOpenTicketCount();
  const [taps, setTaps] = useState(0);

  const adminRevealed = taps >= ADMIN_REVEAL_TAPS || adminAuthed;

  return (
    <Screen>
      <ScreenHeader back fallback="/(tabs)/me" title="設定" />

      <ScrollView contentContainerClassName="gap-6 px-4 pb-10">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="帳號設定"
          onPress={() => router.push('/settings/account')}
          className="bg-surface border-border/60 flex-row items-center gap-3 rounded-3xl border p-4 active:opacity-70"
        >
          <View className="flex-1 gap-1">
            <Txt weight="semibold" className="text-foreground text-[16px]" numberOfLines={1}>
              {me.name}
            </Txt>
            <Txt className="text-muted text-[12px]">{email || '尚未設定信箱'}</Txt>
            <View className="mt-1 flex-row gap-2">
              <View className="bg-accent-soft border-accent/40 rounded-full border px-2.5 py-1">
                <Txt weight="medium" className="text-accent text-[10px]">
                  {TIER_LABEL[tier]}
                </Txt>
              </View>
              <View className="bg-glass border-border/60 flex-row items-center gap-1 rounded-full border px-2.5 py-1">
                <Coins color={NEON.amber} size={11} />
                <Txt className="text-muted text-[10px]">{coins} 代幣</Txt>
              </View>
            </View>
          </View>
          <ChevronRight color="#8C8397" size={18} />
        </Pressable>

        <Section title="會員與加值">
          <SettingsGroup>
            <SettingsRow
              icon={<Crown color={NEON.amber} size={17} />}
              tint={NEON.amber}
              label="訂閱與方案"
              value={TIER_LABEL[tier]}
              onPress={() => router.push('/subscribe')}
            />
            <SettingsRow
              icon={<Coins color={NEON.rose} size={17} />}
              tint={NEON.rose}
              label="心動代幣與加值"
              value={`${coins}`}
              onPress={() => router.push('/coins')}
              last
            />
          </SettingsGroup>
        </Section>

        {adminAuthed ? (
          <Section title="AI 自動化" subtitle="營運工具，僅管理員可見">
            <SettingsGroup>
              <SettingsRow
                icon={<ShieldCheck color={NEON.coral} size={17} />}
                tint={NEON.coral}
                label="AI 自動巡邏審核"
                hint={
                  patrol.enabled
                    ? `每 ${patrol.intervalMinutes} 分鐘掃描動態、聊天與檔案`
                    : '目前停用，只能手動巡邏'
                }
                badge={pendingFindings}
                onPress={() => router.push('/settings/ai-patrol')}
              />
              <SettingsRow
                icon={<Sparkles color={NEON.violet} size={17} />}
                tint={NEON.violet}
                label="AI 出題與遊戲更新"
                hint={
                  content.enabled
                    ? `${CADENCE_LABEL[content.cadence]}自動出題，${content.autoPublish ? '產生後直接上線' : '需人工發佈'}`
                    : '目前停用，只能手動產生題目'
                }
                badge={pendingDrafts}
                onPress={() => router.push('/settings/ai-content')}
                last
              />
            </SettingsGroup>
          </Section>
        ) : null}

        <Section title="偏好">
          <SettingsGroup>
            <SettingsRow
              icon={<Eye color={NEON.violet} size={17} />}
              tint={NEON.violet}
              label="隱私與可見度"
              onPress={() => router.push('/settings/privacy')}
            />
            <SettingsRow
              icon={<Bell color={NEON.amber} size={17} />}
              tint={NEON.amber}
              label="通知"
              onPress={() => router.push('/settings/notifications')}
            />
            <SettingsRow
              icon={<Globe color={NEON.cyan} size={17} />}
              tint={NEON.cyan}
              label="語言"
              value="繁體中文"
              onPress={() => router.push('/settings/account')}
              last
            />
          </SettingsGroup>
        </Section>

        <Section title="安全">
          <SettingsGroup>
            <SettingsRow
              icon={<BadgeCheck color={NEON.lime} size={17} />}
              tint={NEON.lime}
              label="實名認證與真人標章"
              value={KYC_STATUS_LABEL[kyc.status]}
              onPress={() => router.push('/verify-identity')}
            />
            <SettingsRow
              icon={<UserX color={NEON.indigo} size={17} />}
              tint={NEON.indigo}
              label="封鎖名單"
              value={`${blockedIds.length} 人`}
              onPress={() => router.push('/settings/blocked')}
            />
            <SettingsRow
              icon={<ShieldAlert color={NEON.coral} size={17} />}
              tint={NEON.coral}
              label="安全中心"
              hint="檢舉處理、約會安全提醒"
              onPress={() => router.push('/safety')}
              last
            />
          </SettingsGroup>
        </Section>

        <Section title="帳號">
          <SettingsGroup>
            <SettingsRow
              icon={<UserCog color={NEON.cyan} size={17} />}
              tint={NEON.cyan}
              label="帳號設定"
              hint="信箱、密碼、暫停與刪除"
              onPress={() => router.push('/settings/account')}
            />
            <SettingsRow
              icon={<FileText color={NEON.violet} size={17} />}
              tint={NEON.violet}
              label="服務條款"
              onPress={() => router.push('/legal/terms')}
            />
            <SettingsRow
              icon={<Lock color={NEON.lime} size={17} />}
              tint={NEON.lime}
              label="隱私權政策"
              onPress={() => router.push('/legal/privacy')}
            />
            <SettingsRow
              icon={<Info color={NEON.amber} size={17} />}
              tint={NEON.amber}
              label="關於 JiMatch"
              value={`版本 ${APP_VERSION}`}
              onPress={() => router.push('/about')}
            />
            <SettingsRow
              icon={<CircleHelp color={NEON.pink} size={17} />}
              tint={NEON.pink}
              label="幫助中心"
              onPress={() => router.push('/safety')}
            />
            <SettingsRow
              icon={<MessageSquareText color={NEON.cyan} size={17} />}
              tint={NEON.cyan}
              label="聯絡我們"
              hint="客服表單，我們用電子郵件回覆"
              value={openTickets > 0 ? `${openTickets} 件處理中` : undefined}
              onPress={() => router.push('/contact')}
              last
            />
          </SettingsGroup>
        </Section>

        {adminRevealed ? (
          <Section title="營運工具" subtitle="僅供內部人員使用">
            <SettingsGroup>
              <SettingsRow
                icon={<ShieldCheck color={NEON.coral} size={17} />}
                tint={NEON.coral}
                label="管理員平台"
                value={adminAuthed ? '已登入' : '需要密碼'}
                onPress={() => router.push(adminAuthed ? '/admin' : '/admin/login')}
                last
              />
            </SettingsGroup>
          </Section>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="登出"
          onPress={() => {
            logout();
            router.replace('/welcome');
          }}
          className="border-border/60 flex-row items-center justify-center gap-2 rounded-3xl border py-3.5 active:opacity-70"
        >
          <LogOut color="#8C8397" size={16} />
          <Txt className="text-muted text-[14px]">登出</Txt>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="版本資訊"
          onPress={() => setTaps((value) => value + 1)}
          className="items-center py-1"
        >
          <Txt className="text-muted text-center text-[11px]">JiMatch {APP_VERSION}</Txt>
        </Pressable>

        <CopyrightFooter className="pt-0 pb-0" />
      </ScrollView>
    </Screen>
  );
}
