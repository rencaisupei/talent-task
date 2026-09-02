import { useEffect, useRef } from 'react';
import { BlurView } from 'expo-blur';
import { MessageSquare, Phone, PhoneOff, Video } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Photo } from '@/components/ui/Photo';
import { Txt } from '@/components/ui/Txt';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { getProfileById } from '@/lib/data/profiles';
import { useCallsStore } from '@/lib/stores/calls';
import { useChatStore } from '@/lib/stores/chat';
import { GRADIENT, NEON } from '@/lib/theme';

export default function IncomingCallScreen() {
  const active = useCallsStore((state) => state.active);
  const acceptIncoming = useCallsStore((state) => state.acceptIncoming);
  const declineIncoming = useCallsStore((state) => state.declineIncoming);
  const dismiss = useCallsStore((state) => state.dismiss);
  const conversationForUser = useChatStore((state) => state.conversationForUser);
  const leaving = useRef(false);

  useEffect(() => {
    if (active || leaving.current) return;
    leaving.current = true;
    router.replace('/(tabs)/messages');
  }, [active]);

  useEffect(() => {
    if (active?.status !== 'ended' || leaving.current) return undefined;
    const timer = setTimeout(() => {
      leaving.current = true;
      dismiss();
      router.replace('/call/history');
    }, 900);
    return () => clearTimeout(timer);
  }, [active?.status, dismiss]);

  const profile = getProfileById(active?.userId);

  if (!active || !profile) {
    return <View className="bg-background flex-1" />;
  }

  const isVideo = active.kind === 'video';

  return (
    <View className="bg-background flex-1">
      <Photo uri={profile.photos[0] ?? ''} width="100%" height="100%" />
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient colors={GRADIENT.callBackdrop} className="absolute inset-0 opacity-85" />

      <View className="pt-safe-offset-12 pb-safe-offset-10 flex-1 justify-between px-6">
        <Animated.View entering={FadeInDown.duration(400)} className="items-center gap-4">
          <View className="rounded-full bg-black/40 px-3 py-1.5">
            <Txt className="text-[12px] text-white/85">
              {isVideo ? 'JiMatch 視訊來電' : 'JiMatch 語音來電'}
            </Txt>
          </View>
          <UserAvatar uri={profile.photos[0]} name={profile.name} size={148} ring />
          <View className="items-center gap-1">
            <Txt weight="bold" className="text-3xl text-white">
              {profile.name}
            </Txt>
            <Txt className="text-[13px] text-white/70">
              {profile.district} · 契合度 {profile.vibeScore}%
            </Txt>
          </View>
          {active.status === 'ended' ? (
            <Txt className="text-[13px] text-white/60">已拒接</Txt>
          ) : (
            <Txt className="text-[13px] text-white/60">響鈴中…</Txt>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)} className="gap-8">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="用訊息回覆"
            onPress={() => {
              const conversation = conversationForUser(profile.id);
              leaving.current = true;
              declineIncoming();
              dismiss();
              router.replace(conversation ? `/chat/${conversation.id}` : '/(tabs)/messages');
            }}
            className="flex-row items-center justify-center gap-2 self-center rounded-full border border-white/25 px-5 py-2.5 active:opacity-70"
          >
            <MessageSquare color="#ffffff" size={15} />
            <Txt className="text-[13px] text-white">用訊息回覆</Txt>
          </Pressable>

          <View className="flex-row items-center justify-around">
            <View className="items-center gap-2.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="拒接"
                onPress={declineIncoming}
                disabled={active.status === 'ended'}
                className="h-[74px] w-[74px] items-center justify-center rounded-full bg-[#EF4B57] active:opacity-80"
              >
                <PhoneOff color="#ffffff" size={28} />
              </Pressable>
              <Txt className="text-[12px] text-white/70">拒接</Txt>
            </View>

            <View className="items-center gap-2.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="接聽"
                onPress={() => {
                  leaving.current = true;
                  acceptIncoming();
                  router.replace('/call/active');
                }}
                disabled={active.status === 'ended'}
                className="overflow-hidden rounded-full active:opacity-85"
              >
                <LinearGradient
                  colors={GRADIENT.like}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="h-[74px] w-[74px] items-center justify-center"
                >
                  {isVideo ? (
                    <Video color="#ffffff" size={28} />
                  ) : (
                    <Phone color="#ffffff" size={28} />
                  )}
                </LinearGradient>
              </Pressable>
              <Txt className="text-[12px] text-white/70">接聽</Txt>
            </View>
          </View>

          <Txt className="text-center text-[11px] text-white/45">
            接聽後會進入通話畫面，通話結束會自動寫入通話紀錄與聊天室。
          </Txt>
          <View className="items-center">
            <View className="h-1 w-10 rounded-full" style={{ backgroundColor: NEON.coral }} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
