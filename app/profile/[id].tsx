import { useState } from 'react';
import {
  BadgeCheck,
  Briefcase,
  Flag,
  GraduationCap,
  Heart,
  Languages,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  Search,
  Sparkles,
  Star,
  UserX,
  Video,
} from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { PhotoCarousel } from '@/components/profile/PhotoCarousel';
import { ReportSheet } from '@/components/profile/ReportSheet';
import { UpgradeSheet } from '@/components/subscription/UpgradeSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlowButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { getProfileById } from '@/lib/data/profiles';
import { activityLabel, distanceLabel } from '@/lib/format';
import { useAuthStore } from '@/lib/stores/auth';
import { useCallsStore } from '@/lib/stores/calls';
import { useChatStore } from '@/lib/stores/chat';
import { useMatchesStore } from '@/lib/stores/matches';
import { useEntitlements } from '@/lib/stores/subscription';
import { GRADIENT, NEON } from '@/lib/theme';
import type { CallKind } from '@/lib/types';

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useAuthStore((state) => state.me);
  const toggleBlocked = useAuthStore((state) => state.toggleBlocked);
  const matchedIds = useMatchesStore((state) => state.matchedIds);
  const likedYouIds = useMatchesStore((state) => state.likedYouIds);
  const addMatch = useMatchesStore((state) => state.addMatch);
  const ensureConversation = useChatStore((state) => state.ensureConversation);
  const startOutgoing = useCallsStore((state) => state.startOutgoing);
  const entitlements = useEntitlements();

  const [liked, setLiked] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isMe = id === 'me';
  const profile = isMe ? me : getProfileById(id);

  if (!profile) {
    return (
      <Screen>
        <ScreenHeader back fallback="/(tabs)" title="找不到這個人" />
        <EmptyState
          icon={<Search color={NEON.coral} size={22} />}
          title="這個檔案已經不在了"
          description="對方可能停用了帳號或調整了隱私設定。"
          action={<GlowButton label="回到滑卡" onPress={() => router.replace('/discover')} />}
        />
      </Screen>
    );
  }

  const matched = matchedIds.includes(profile.id);

  const openChat = () => {
    const conversationId = ensureConversation(profile.id);
    router.push(`/chat/${conversationId}`);
  };

  const call = (kind: CallKind) => {
    if (kind === 'video' && !entitlements.videoCalls) {
      setPaywall(true);
      return;
    }
    ensureConversation(profile.id);
    startOutgoing(profile.id, kind);
    router.push('/call/active');
  };

  const like = () => {
    setLiked(true);
    if (likedYouIds.includes(profile.id)) {
      addMatch(profile.id);
      router.push(`/match/${profile.id}`);
      return;
    }
    setNotice('已送出喜歡，對方回應後會通知你');
  };

  return (
    <Screen glow={false}>
      <ScrollView contentContainerClassName="pb-8">
        <View>
          <PhotoCarousel photos={profile.photos} />
          <View className="absolute top-0 right-0 left-0">
            <ScreenHeader
              back
              fallback="/(tabs)"
              right={
                isMe ? undefined : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="檢舉或封鎖"
                    hitSlop={8}
                    onPress={() => setReporting(true)}
                    className="h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/40 active:opacity-70"
                  >
                    <Flag color="#ffffff" size={17} />
                  </Pressable>
                )
              }
            />
          </View>

          <View className="absolute right-4 bottom-4 left-4 gap-2">
            <View className="flex-row items-center gap-2">
              <Txt weight="bold" className="text-3xl text-white">
                {profile.name}
              </Txt>
              <Txt className="text-2xl text-white/85">{profile.age}</Txt>
              {profile.verified ? <BadgeCheck color={NEON.cyan} size={22} /> : null}
            </View>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <MapPin color="rgba(255,255,255,0.8)" size={12} />
                <Txt className="text-[12px] text-white/80">
                  {profile.city} · {distanceLabel(profile.distanceKm)}
                </Txt>
              </View>
              <Txt className="text-[12px] text-white/80">
                {activityLabel(profile.online, profile.lastActiveMinutes)}
              </Txt>
            </View>
          </View>
        </View>

        {isMe ? (
          <View className="px-4 pt-4">
            <View className="border-accent/40 bg-accent/10 flex-row items-center gap-2 rounded-2xl border px-4 py-3">
              <Sparkles color={NEON.coral} size={15} />
              <Txt className="text-foreground flex-1 text-[12px]">
                這是別人看到你的樣子。想調整就到編輯檔案。
              </Txt>
            </View>
          </View>
        ) : (
          <View className="flex-row gap-2.5 px-4 pt-4">
            <ActionTile
              label="訊息"
              icon={<MessageCircle color={NEON.coral} size={20} />}
              onPress={openChat}
            />
            <ActionTile
              label="語音"
              icon={<Phone color="#2FD68A" size={20} />}
              onPress={() => call('voice')}
            />
            <ActionTile
              label="視訊"
              icon={<Video color={NEON.cyan} size={20} />}
              onPress={() => call('video')}
              locked={!entitlements.videoCalls}
            />
            <ActionTile
              label={liked ? '已喜歡' : '喜歡'}
              icon={
                <Heart color={NEON.coral} fill={liked ? NEON.coral : 'transparent'} size={20} />
              }
              onPress={like}
            />
          </View>
        )}

        {notice ? (
          <View className="mx-4 mt-3 rounded-2xl border border-[#2FD68A]/40 bg-[#2FD68A]/10 px-4 py-3">
            <Txt className="text-foreground text-[12px]">{notice}</Txt>
          </View>
        ) : null}

        <View className="gap-6 px-4 pt-6">
          {!isMe ? (
            <LinearGradient
              colors={GRADIENT.plus}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="gap-2 rounded-3xl p-4"
            >
              <View className="flex-row items-center gap-2">
                <Star color="#ffffff" size={16} fill="#ffffff" />
                <Txt weight="bold" className="flex-1 text-base text-white">
                  契合度 {profile.vibeScore}%
                </Txt>
              </View>
              <Txt className="text-[12px] leading-5 text-white/90">
                你們有 {sharedInterests(profile.interests, me.interests).length} 個共同興趣
                {sharedInterests(profile.interests, me.interests).length > 0
                  ? `：${sharedInterests(profile.interests, me.interests).join('、')}`
                  : ''}
                。作息也相近，聊起來通常比較順。
              </Txt>
            </LinearGradient>
          ) : null}

          <Section title="關於">
            <View className="bg-surface border-border/60 rounded-3xl border p-4">
              <Txt className="text-foreground text-[14px] leading-6">{profile.bio}</Txt>
            </View>
          </Section>

          <Section title="基本資料">
            <View className="flex-row flex-wrap gap-2.5">
              <InfoTile
                icon={<Ruler color={NEON.cyan} size={15} />}
                label="身高"
                value={`${profile.heightCm} cm`}
              />
              <InfoTile
                icon={<Sparkles color={NEON.amber} size={15} />}
                label="星座"
                value={profile.zodiac}
              />
              <InfoTile
                icon={<Briefcase color={NEON.violet} size={15} />}
                label="職業"
                value={profile.job}
              />
              {profile.school ? (
                <InfoTile
                  icon={<GraduationCap color={NEON.lime} size={15} />}
                  label="學校"
                  value={profile.school}
                />
              ) : null}
              <InfoTile
                icon={<Languages color={NEON.rose} size={15} />}
                label="語言"
                value={profile.languages.join('、')}
              />
              <InfoTile
                icon={<Heart color={NEON.coral} size={15} />}
                label="想找"
                value={profile.lookingFor}
              />
            </View>
          </Section>

          <Section title="興趣">
            <View className="flex-row flex-wrap gap-2">
              {profile.interests.map((interest) => {
                const shared = me.interests.includes(interest);
                return (
                  <View
                    key={interest}
                    className={
                      shared
                        ? 'border-accent/60 bg-accent/15 rounded-full border px-3.5 py-2'
                        : 'border-border/70 bg-surface rounded-full border px-3.5 py-2'
                    }
                  >
                    <Txt
                      className={shared ? 'text-accent text-[13px]' : 'text-foreground text-[13px]'}
                    >
                      {interest}
                      {shared ? ' · 共同' : ''}
                    </Txt>
                  </View>
                );
              })}
            </View>
          </Section>

          <Section title="快問快答">
            <View className="gap-3">
              {profile.prompts.map((prompt) => (
                <View
                  key={prompt.question}
                  className="bg-surface border-border/60 gap-1.5 rounded-3xl border p-4"
                >
                  <Txt className="text-muted text-[12px]">{prompt.question}</Txt>
                  <Txt className="text-foreground text-[15px] leading-6">{prompt.answer}</Txt>
                </View>
              ))}
            </View>
          </Section>

          {!isMe ? (
            <View className="gap-3">
              <GlowButton
                label={matched ? '繼續聊天' : '傳送第一則訊息'}
                size="lg"
                icon={<MessageCircle color="#ffffff" size={17} />}
                onPress={openChat}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`封鎖 ${profile.name}`}
                onPress={() => {
                  toggleBlocked(profile.id);
                  setNotice(`已封鎖 ${profile.name}，你們不會再互相看到`);
                }}
                className="border-border/60 flex-row items-center justify-center gap-2 rounded-full border py-3.5 active:opacity-70"
              >
                <UserX color="#8C8397" size={16} />
                <Txt className="text-muted text-[13px]">封鎖這個人</Txt>
              </Pressable>
            </View>
          ) : (
            <GlowButton
              label="編輯我的檔案"
              size="lg"
              onPress={() => router.push('/edit-profile')}
            />
          )}
        </View>
      </ScrollView>

      <ReportSheet
        visible={reporting}
        name={profile.name}
        onClose={() => setReporting(false)}
        onSubmit={(reason, block) => {
          setReporting(false);
          if (block) toggleBlocked(profile.id);
          setNotice(`已送出檢舉（${reason}）${block ? '，並已封鎖對方' : ''}`);
        }}
      />

      <UpgradeSheet
        visible={paywall}
        onClose={() => setPaywall(false)}
        title="視訊通話是 VIP 功能"
        description="開麥前先看到彼此，能省下很多不必要的見面。"
        bullets={['無限視訊與語音通話', '通話畫質優先', '無限喜歡與超級喜歡', '隱身瀏覽']}
      />
    </Screen>
  );
}

function ActionTile({
  label,
  icon,
  onPress,
  locked = false,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  locked?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="bg-surface border-border/60 flex-1 items-center gap-1.5 rounded-2xl border py-3 active:opacity-75"
    >
      {icon}
      <Txt className="text-muted text-[11px]">{locked ? `${label} · VIP` : label}</Txt>
    </Pressable>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="bg-surface border-border/60 w-[48%] gap-1.5 rounded-2xl border p-3.5">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Txt className="text-muted text-[11px]">{label}</Txt>
      </View>
      <Txt className="text-foreground text-[14px]" numberOfLines={1}>
        {value}
      </Txt>
    </View>
  );
}

function sharedInterests(a: string[], b: string[]) {
  return a.filter((item) => b.includes(item));
}
