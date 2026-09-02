import {
  BadgeCheck,
  Bell,
  ChevronRight,
  Coins,
  Crown,
  Eye,
  Gift,
  LogOut,
  Phone,
  Pencil,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  UserX,
} from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { CopyrightFooter } from '@/components/ui/CopyrightFooter';
import { GlowButton, OutlineButton } from '@/components/ui/GlowButton';
import { Photo } from '@/components/ui/Photo';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { useAuthStore } from '@/lib/stores/auth';
import { useCallsStore } from '@/lib/stores/calls';
import { useMatchesStore } from '@/lib/stores/matches';
import { useMomentsStore } from '@/lib/stores/moments';
import { TIER_LABEL, useEntitlements, useSubscriptionStore } from '@/lib/stores/subscription';
import { GRADIENT, NEON } from '@/lib/theme';
import type { Tier } from '@/lib/types';

export default function MeScreen() {
  const me = useAuthStore((state) => state.me);
  const logout = useAuthStore((state) => state.logout);
  const identityVerified = useAuthStore((state) => state.identityVerified);
  const tier = useSubscriptionStore((state) => state.tier);
  const coins = useSubscriptionStore((state) => state.coins);
  const renewsAt = useSubscriptionStore((state) => state.renewsAt);
  const entitlements = useEntitlements();
  const likedYouIds = useMatchesStore((state) => state.likedYouIds);
  const visitorIds = useMatchesStore((state) => state.visitorIds);
  const matchedIds = useMatchesStore((state) => state.matchedIds);
  const callHistory = useCallsStore((state) => state.history);
  const moments = useMomentsStore((state) => state.moments);

  const myMoments = moments.filter((moment) => moment.userId === 'me').length;
  const completion = profileCompletion({
    photos: me.photos.length,
    bio: me.bio.length,
    interests: me.interests.length,
    verified: identityVerified,
  });

  return (
    <Screen>
      <ScreenHeader
        title="我的"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="設定"
            hitSlop={8}
            onPress={() => router.push('/settings')}
            className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
          >
            <Settings color={NEON.coral} size={18} />
          </Pressable>
        }
      />

      <ScrollView contentContainerClassName="gap-6 px-4 pb-10">
        <View className="bg-surface border-border/60 gap-4 rounded-3xl border p-4">
          <View className="flex-row items-center gap-4">
            <View className="overflow-hidden rounded-3xl">
              <Photo uri={me.photos[0] ?? ''} width={84} height={100} radius={20} />
            </View>
            <View className="flex-1 gap-1">
              <View className="flex-row items-center gap-2">
                <Txt weight="bold" className="text-foreground text-lg" numberOfLines={1}>
                  {me.name}，{me.age}
                </Txt>
                {identityVerified ? <BadgeCheck color={NEON.cyan} size={18} /> : null}
              </View>
              <Txt className="text-muted text-[12px]" numberOfLines={1}>
                {me.job} · {me.district}
              </Txt>
              <View className="mt-1 gap-1">
                <View className="flex-row items-center justify-between">
                  <Txt className="text-muted text-[11px]">檔案完成度</Txt>
                  <Txt weight="semibold" className="text-accent text-[11px]">
                    {completion}%
                  </Txt>
                </View>
                <View className="bg-background h-1.5 overflow-hidden rounded-full">
                  <LinearGradient
                    colors={GRADIENT.brand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-full rounded-full"
                    style={{ width: `${completion}%` }}
                  />
                </View>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <GlowButton
              label="編輯檔案"
              className="flex-1"
              icon={<Pencil color="#ffffff" size={15} />}
              onPress={() => router.push('/edit-profile')}
            />
            <OutlineButton
              label="預覽"
              className="flex-1"
              icon={<Eye color="#ffffff" size={15} />}
              onPress={() => router.push('/profile/me')}
            />
          </View>
        </View>

        <MembershipCard tier={tier} renewsAt={renewsAt} videoCalls={entitlements.videoCalls} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="心動代幣加值"
          onPress={() => router.push('/coins')}
          className="bg-surface border-border/60 flex-row items-center gap-3 rounded-3xl border p-4 active:opacity-80"
        >
          <LinearGradient
            colors={GRADIENT.coin}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-11 w-11 items-center justify-center rounded-2xl"
          >
            <Coins color="#ffffff" size={20} />
          </LinearGradient>
          <View className="flex-1">
            <Txt weight="semibold" className="text-foreground text-[15px]">
              {coins} 心動代幣
            </Txt>
            <Txt className="text-muted text-[11px]">可用來送禮、補體力與單買超級喜歡</Txt>
          </View>
          <Txt weight="medium" className="text-accent text-[13px]">
            加值
          </Txt>
        </Pressable>

        <View className="flex-row gap-2">
          <Stat label="喜歡我" value={likedYouIds.length} />
          <Stat label="訪客" value={visitorIds.length} />
          <Stat label="配對" value={matchedIds.length} />
          <Stat label="通話" value={callHistory.length} />
        </View>

        <Section title="常用功能">
          <View className="flex-row flex-wrap gap-3">
            <QuickAction
              label="我的動態"
              hint={`${myMoments} 則`}
              icon={<Sparkles color={NEON.amber} size={20} />}
              onPress={() => router.push('/(tabs)/moments')}
            />
            <QuickAction
              label="通話紀錄"
              hint={`${callHistory.length} 筆`}
              icon={<Phone color={NEON.cyan} size={20} />}
              onPress={() => router.push('/call/history')}
            />
            <QuickAction
              label="禮物商店"
              hint="送禮加分"
              icon={<Gift color={NEON.rose} size={20} />}
              onPress={() => router.push('/gifts')}
            />
            <QuickAction
              label="真人認證"
              hint={identityVerified ? '已認證' : '未完成'}
              icon={<Shield color={NEON.lime} size={20} />}
              onPress={() => router.push('/verify-identity')}
            />
          </View>
        </Section>

        <Section title="帳號與安全">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            <Row
              icon={<Eye color={NEON.violet} size={18} />}
              label="隱私設定"
              hint="隱身模式、距離顯示"
              onPress={() => router.push('/settings/privacy')}
            />
            <Row
              icon={<Bell color={NEON.amber} size={18} />}
              label="通知設定"
              hint="配對、訊息、通話提醒"
              onPress={() => router.push('/settings/notifications')}
            />
            <Row
              icon={<UserX color="#8C8397" size={18} />}
              label="封鎖名單"
              onPress={() => router.push('/settings/blocked')}
            />
            <Row
              icon={<ShieldAlert color={NEON.coral} size={18} />}
              label="安全中心"
              hint="約會安全建議與檢舉"
              onPress={() => router.push('/safety')}
            />
            <Row
              icon={<Settings color="#8C8397" size={18} />}
              label="帳號設定"
              onPress={() => router.push('/settings/account')}
              last
            />
          </View>
        </Section>

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

        <CopyrightFooter showVersion className="pb-0" />
      </ScrollView>
    </Screen>
  );
}

function MembershipCard({
  tier,
  renewsAt,
  videoCalls,
}: {
  tier: Tier;
  renewsAt: number | null;
  videoCalls: boolean;
}) {
  const colors = tier === 'vip' ? GRADIENT.vip : tier === 'plus' ? GRADIENT.plus : GRADIENT.brand;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="查看訂閱方案"
      onPress={() => router.push('/subscribe')}
      className="overflow-hidden rounded-3xl active:opacity-90"
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="gap-3 p-4"
      >
        <View className="flex-row items-center gap-2">
          <Crown color="#ffffff" size={20} />
          <Txt weight="bold" className="flex-1 text-base text-white">
            {TIER_LABEL[tier]}
          </Txt>
          <ChevronRight color="#ffffff" size={18} />
        </View>
        <Txt className="text-[12px] leading-5 text-white/90">
          {tier === 'free'
            ? '升級解鎖無限喜歡、看見喜歡你的人，以及視訊通話。'
            : `${videoCalls ? '視訊通話已開啟' : '再升一階可開啟視訊通話'} · ${
                renewsAt ? `${new Date(renewsAt).toLocaleDateString('zh-TW')} 續訂` : '訂閱中'
              }`}
        </Txt>
        <View className="flex-row gap-2">
          {['無限喜歡', '誰喜歡我', '進階篩選', '視訊通話'].map((item) => (
            <View key={item} className="rounded-full bg-white/20 px-2.5 py-1">
              <Txt className="text-[10px] text-white">{item}</Txt>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="bg-surface border-border/60 flex-1 items-center gap-1 rounded-2xl border py-3">
      <Txt weight="bold" className="text-foreground text-lg">
        {value}
      </Txt>
      <Txt className="text-muted text-[11px]">{label}</Txt>
    </View>
  );
}

function QuickAction({
  label,
  hint,
  icon,
  onPress,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="bg-surface border-border/60 w-[48%] gap-2 rounded-3xl border p-4 active:opacity-80"
    >
      <View className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-2xl border">
        {icon}
      </View>
      <Txt weight="semibold" className="text-foreground text-[14px]">
        {label}
      </Txt>
      <Txt className="text-muted text-[11px]">{hint}</Txt>
    </Pressable>
  );
}

function Row({
  icon,
  label,
  hint,
  onPress,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-3.5 active:opacity-70 ${last ? '' : 'border-border/40 border-b'}`}
    >
      <View className="w-6 items-center">{icon}</View>
      <View className="flex-1">
        <Txt className="text-foreground text-[14px]">{label}</Txt>
        {hint ? <Txt className="text-muted mt-0.5 text-[11px]">{hint}</Txt> : null}
      </View>
      <ChevronRight color="#8C8397" size={16} />
    </Pressable>
  );
}

function profileCompletion({
  photos,
  bio,
  interests,
  verified,
}: {
  photos: number;
  bio: number;
  interests: number;
  verified: boolean;
}) {
  let score = 20;
  score += Math.min(30, photos * 10);
  score += bio >= 40 ? 20 : bio > 0 ? 10 : 0;
  score += Math.min(20, interests * 5);
  score += verified ? 10 : 0;
  return Math.min(100, score);
}
