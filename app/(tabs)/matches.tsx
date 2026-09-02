import { useState } from 'react';
import { BlurView } from 'expo-blur';
import { Eye, Heart, Lock, MessageCircle, Star } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { UpgradeSheet } from '@/components/subscription/UpgradeSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlowButton } from '@/components/ui/GlowButton';
import { Photo } from '@/components/ui/Photo';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { getProfiles } from '@/lib/data/profiles';
import { activityLabel } from '@/lib/format';
import { useChatStore } from '@/lib/stores/chat';
import { useMatchesStore } from '@/lib/stores/matches';
import { useEntitlements } from '@/lib/stores/subscription';
import { GRADIENT, NEON } from '@/lib/theme';
import type { Profile } from '@/lib/types';

export default function MatchesScreen() {
  const likedYouIds = useMatchesStore((state) => state.likedYouIds);
  const superLikedYouIds = useMatchesStore((state) => state.superLikedYouIds);
  const visitorIds = useMatchesStore((state) => state.visitorIds);
  const matchedIds = useMatchesStore((state) => state.matchedIds);
  const addMatch = useMatchesStore((state) => state.addMatch);
  const ensureConversation = useChatStore((state) => state.ensureConversation);
  const entitlements = useEntitlements();
  const [paywall, setPaywall] = useState<'likes' | 'visitors' | null>(null);

  const likedYou = getProfiles(likedYouIds);
  const superLikedYou = getProfiles(superLikedYouIds);
  const matches = getProfiles(matchedIds);
  const visitors = getProfiles(visitorIds);

  const openChat = (profile: Profile) => {
    const conversationId = ensureConversation(profile.id);
    router.push(`/chat/${conversationId}`);
  };

  const acceptLike = (profile: Profile) => {
    addMatch(profile.id);
    router.push(`/match/${profile.id}`);
  };

  return (
    <Screen>
      <ScreenHeader
        title="配對"
        subtitle={`${matches.length} 組配對 · ${likedYou.length} 人喜歡你`}
      />

      <ScrollView contentContainerClassName="gap-7 px-4 pb-8">
        <Section
          title="喜歡你的人"
          subtitle={entitlements.seeWhoLikedYou ? '點一下就能直接配對' : '升級後可以看到是誰'}
          action={
            <View className="bg-accent/20 border-accent/40 rounded-full border px-2.5 py-1">
              <Txt weight="semibold" className="text-accent text-[11px]">
                {likedYou.length}
              </Txt>
            </View>
          }
        >
          {likedYou.length === 0 ? (
            <EmptyState
              icon={<Heart color={NEON.coral} size={22} />}
              title="還沒有人喜歡你"
              description="補齊照片與自我介紹，曝光通常會明顯提升。"
            />
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {likedYou.map((profile) => (
                <View key={profile.id} className="w-[48%]">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      entitlements.seeWhoLikedYou ? `和 ${profile.name} 配對` : '升級以查看'
                    }
                    onPress={() =>
                      entitlements.seeWhoLikedYou ? acceptLike(profile) : setPaywall('likes')
                    }
                    className="overflow-hidden rounded-3xl active:opacity-85"
                  >
                    <Photo uri={profile.photos[0] ?? ''} width="100%" height={198} radius={24} />
                    {!entitlements.seeWhoLikedYou ? (
                      <>
                        <BlurView intensity={38} tint="dark" style={StyleSheet.absoluteFill} />
                        <View className="absolute inset-0 items-center justify-center gap-2">
                          <Lock color="#ffffff" size={22} />
                          <Txt className="text-[11px] text-white">升級即可查看</Txt>
                        </View>
                      </>
                    ) : (
                      <>
                        <LinearGradient
                          colors={GRADIENT.cardShade}
                          className="absolute right-0 bottom-0 left-0 h-24"
                        />
                        <View className="absolute right-3 bottom-3 left-3">
                          <Txt weight="semibold" className="text-white" numberOfLines={1}>
                            {profile.name}，{profile.age}
                          </Txt>
                          <Txt className="text-[11px] text-white/80" numberOfLines={1}>
                            {activityLabel(profile.online, profile.lastActiveMinutes)}
                          </Txt>
                        </View>
                      </>
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {!entitlements.seeWhoLikedYou ? (
            <GlowButton
              label={`看看這 ${likedYou.length} 個人是誰`}
              colors={GRADIENT.vip}
              onPress={() => router.push('/subscribe')}
            />
          ) : null}
        </Section>

        {superLikedYou.length > 0 ? (
          <Section title="超級喜歡你" subtitle="這些人主動把你排到最前面">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-3"
            >
              {superLikedYou.map((profile) => (
                <Pressable
                  key={profile.id}
                  accessibilityRole="button"
                  accessibilityLabel={`查看 ${profile.name}`}
                  onPress={() => router.push(`/profile/${profile.id}`)}
                  className="w-36 overflow-hidden rounded-3xl active:opacity-85"
                >
                  <Photo uri={profile.photos[0] ?? ''} width="100%" height={180} radius={24} />
                  <LinearGradient
                    colors={GRADIENT.cardShade}
                    className="absolute right-0 bottom-0 left-0 h-20"
                  />
                  <View className="absolute top-3 left-3 flex-row items-center gap-1 rounded-full bg-black/50 px-2 py-1">
                    <Star color={NEON.cyan} size={11} fill={NEON.cyan} />
                    <Txt className="text-[10px] text-white">超級喜歡</Txt>
                  </View>
                  <View className="absolute right-3 bottom-3 left-3">
                    <Txt weight="semibold" className="text-white" numberOfLines={1}>
                      {profile.name}
                    </Txt>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Section>
        ) : null}

        <Section title="你的配對" subtitle="開場的第一句話最關鍵">
          {matches.length === 0 ? (
            <EmptyState
              icon={<Heart color={NEON.coral} size={22} />}
              title="還沒有配對"
              description="回到遊戲城開一局，或去滑卡多看幾張，配對通常來得比想像中快。"
              action={<GlowButton label="去遊戲城開局" onPress={() => router.push('/(tabs)')} />}
            />
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {matches.map((profile) => (
                <View key={profile.id} className="w-[48%] gap-2">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`查看 ${profile.name} 的檔案`}
                    onPress={() => router.push(`/profile/${profile.id}`)}
                    className="overflow-hidden rounded-3xl active:opacity-85"
                  >
                    <Photo uri={profile.photos[0] ?? ''} width="100%" height={190} radius={24} />
                    <LinearGradient
                      colors={GRADIENT.cardShade}
                      className="absolute right-0 bottom-0 left-0 h-20"
                    />
                    <View className="absolute right-3 bottom-3 left-3">
                      <Txt weight="semibold" className="text-white" numberOfLines={1}>
                        {profile.name}，{profile.age}
                      </Txt>
                    </View>
                    {profile.online ? (
                      <View className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-[#2FD68A]" />
                    ) : null}
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`和 ${profile.name} 聊天`}
                    onPress={() => openChat(profile)}
                    className="bg-glass border-border/60 flex-row items-center justify-center gap-1.5 rounded-full border py-2 active:opacity-70"
                  >
                    <MessageCircle color={NEON.coral} size={14} />
                    <Txt className="text-foreground text-[12px]">傳訊息</Txt>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </Section>

        <Section
          title="看過你的檔案"
          subtitle={entitlements.seeWhoLikedYou ? '最近 7 天的訪客' : 'Plus 會員可查看完整訪客名單'}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3"
          >
            {visitors.map((profile) => (
              <Pressable
                key={profile.id}
                accessibilityRole="button"
                accessibilityLabel={
                  entitlements.seeWhoLikedYou ? `查看 ${profile.name}` : '升級以查看訪客'
                }
                onPress={() =>
                  entitlements.seeWhoLikedYou
                    ? router.push(`/profile/${profile.id}`)
                    : setPaywall('visitors')
                }
                className="w-24 items-center gap-2 active:opacity-80"
              >
                <View className="overflow-hidden rounded-2xl">
                  <Photo uri={profile.photos[0] ?? ''} width={96} height={112} radius={16} />
                  {!entitlements.seeWhoLikedYou ? (
                    <>
                      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                      <View className="absolute inset-0 items-center justify-center">
                        <Eye color="#ffffff" size={18} />
                      </View>
                    </>
                  ) : null}
                </View>
                <Txt className="text-muted text-[11px]" numberOfLines={1}>
                  {entitlements.seeWhoLikedYou ? profile.name : '神秘訪客'}
                </Txt>
              </Pressable>
            ))}
          </ScrollView>
        </Section>
      </ScrollView>

      <UpgradeSheet
        visible={paywall === 'likes'}
        onClose={() => setPaywall(null)}
        title="有人已經喜歡你了"
        description="升級 Plus 就能看到完整名單，直接互相配對省下滑卡時間。"
        bullets={['看見所有喜歡你的人', '一鍵直接配對', '無限喜歡', '已讀回執']}
      />
      <UpgradeSheet
        visible={paywall === 'visitors'}
        onClose={() => setPaywall(null)}
        title="想知道誰在看你？"
        description="訪客名單是 Plus 會員功能，包含瀏覽時間與次數。"
        bullets={['完整訪客名單', '瀏覽次數統計', '隱身瀏覽（VIP）']}
      />
    </Screen>
  );
}
