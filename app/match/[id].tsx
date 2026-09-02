import { useEffect } from 'react';
import { Gift, Heart, MessageCircle } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { GlowButton } from '@/components/ui/GlowButton';
import { Photo } from '@/components/ui/Photo';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { getProfileById } from '@/lib/data/profiles';
import { useAuthStore } from '@/lib/stores/auth';
import { useChatStore } from '@/lib/stores/chat';
import { useNotificationsStore } from '@/lib/stores/notifications';
import { GRADIENT, NEON } from '@/lib/theme';

export default function MatchSuccessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useAuthStore((state) => state.me);
  const ensureConversation = useChatStore((state) => state.ensureConversation);
  const pushNotification = useNotificationsStore((state) => state.push);
  const profile = getProfileById(id);

  useEffect(() => {
    if (!profile) return;
    pushNotification({
      kind: 'match',
      userId: profile.id,
      title: `你和 ${profile.name} 配對成功`,
      body: '傳個訊息破冰吧',
    });
  }, [profile, pushNotification]);

  if (!profile) {
    router.replace('/(tabs)');
    return null;
  }

  const openChat = () => {
    const conversationId = ensureConversation(profile.id);
    router.replace(`/chat/${conversationId}`);
  };

  return (
    <View className="bg-background flex-1">
      <LinearGradient colors={['#3A1030', '#1B1024', '#0F0A16']} className="absolute inset-0" />

      <View className="pt-safe-offset-10 pb-safe-offset-8 flex-1 items-center justify-between px-6">
        <Animated.View entering={FadeIn.duration(400)} className="items-center gap-2">
          <Txt weight="bold" className="text-4xl tracking-tight text-white">
            配對成功
          </Txt>
          <Txt className="text-[13px] text-white/70">你和 {profile.name} 互相喜歡了</Txt>
        </Animated.View>

        <View className="items-center gap-8">
          <View className="h-48 flex-row items-center">
            <Animated.View entering={ZoomIn.delay(120).duration(420)} className="-mr-6">
              <View className="overflow-hidden rounded-full border-4 border-white/25">
                <Photo uri={me.photos[0] ?? ''} width={132} height={132} radius={66} />
              </View>
            </Animated.View>
            <Animated.View entering={ZoomIn.delay(260).duration(420)} className="mt-10 -ml-6">
              <View className="overflow-hidden rounded-full border-4 border-white/25">
                <Photo uri={profile.photos[0] ?? ''} width={132} height={132} radius={66} />
              </View>
            </Animated.View>
            <Animated.View
              entering={ZoomIn.delay(420).duration(400)}
              className="absolute right-0 left-0 items-center"
              style={{ top: 60 }}
            >
              <LinearGradient
                colors={GRADIENT.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="h-14 w-14 items-center justify-center rounded-full"
              >
                <Heart color="#ffffff" size={26} fill="#ffffff" />
              </LinearGradient>
            </Animated.View>
          </View>

          <Animated.View
            entering={FadeInDown.delay(500).duration(400)}
            className="items-center gap-1"
          >
            <Txt weight="semibold" className="text-lg text-white">
              {profile.name}，{profile.age}
            </Txt>
            <Txt className="text-[12px] text-white/70">
              契合度 {profile.vibeScore}% · {profile.district}
            </Txt>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(620).duration(400)} className="w-full gap-3">
          <GlowButton
            label="傳送第一則訊息"
            size="lg"
            icon={<MessageCircle color="#ffffff" size={18} />}
            onPress={openChat}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="送個禮物"
            onPress={() => {
              const conversationId = ensureConversation(profile.id);
              router.replace(`/chat/${conversationId}`);
              router.push({ pathname: '/gifts', params: { conversationId } });
            }}
            className="flex-row items-center justify-center gap-2 rounded-full border border-white/25 py-3.5 active:opacity-70"
          >
            <Gift color={NEON.rose} size={17} />
            <Txt className="text-[14px] text-white">送個禮物打招呼</Txt>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="回到遊戲城"
            onPress={() => router.replace('/(tabs)')}
            className="items-center py-2 active:opacity-70"
          >
            <Txt className="text-[13px] text-white/60">回到遊戲城</Txt>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
