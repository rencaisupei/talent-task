import { useEffect, useRef, useState } from 'react';
import { BlurView } from 'expo-blur';
import {
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  SwitchCamera,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { CallControl } from '@/components/call/CallControl';
import { Photo } from '@/components/ui/Photo';
import { Txt } from '@/components/ui/Txt';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { getProfileById } from '@/lib/data/profiles';
import { formatDuration } from '@/lib/format';
import { useAuthStore } from '@/lib/stores/auth';
import { CALL_STATUS_LABEL, useCallsStore } from '@/lib/stores/calls';
import { useChatStore } from '@/lib/stores/chat';
import { GRADIENT, NEON } from '@/lib/theme';

export default function ActiveCallScreen() {
  const me = useAuthStore((state) => state.me);
  const active = useCallsStore((state) => state.active);
  const hangUp = useCallsStore((state) => state.hangUp);
  const toggleMute = useCallsStore((state) => state.toggleMute);
  const toggleSpeaker = useCallsStore((state) => state.toggleSpeaker);
  const toggleCamera = useCallsStore((state) => state.toggleCamera);
  const flipCamera = useCallsStore((state) => state.flipCamera);
  const switchToVideo = useCallsStore((state) => state.switchToVideo);
  const dismiss = useCallsStore((state) => state.dismiss);
  const conversationForUser = useChatStore((state) => state.conversationForUser);

  const [elapsed, setElapsed] = useState(0);
  const leaving = useRef(false);

  const status = active?.status;
  const startedAt = active?.startedAt ?? null;

  useEffect(() => {
    if (status !== 'active' || !startedAt) return undefined;
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 500);
    return () => clearInterval(timer);
  }, [startedAt, status]);

  useEffect(() => {
    if (status !== 'ended' || leaving.current) return undefined;
    const timer = setTimeout(() => {
      leaving.current = true;
      dismiss();
      router.replace('/(tabs)/messages');
    }, 1500);
    return () => clearTimeout(timer);
  }, [dismiss, status]);

  useEffect(() => {
    if (active || leaving.current) return;
    leaving.current = true;
    router.replace('/(tabs)/messages');
  }, [active]);

  const profile = getProfileById(active?.userId);

  if (!active || !profile) {
    return <View className="bg-background flex-1" />;
  }

  const isVideo = active.kind === 'video';
  const showVideoFeed = isVideo && active.status === 'active' && active.cameraOn;

  const openChat = () => {
    const conversation = conversationForUser(profile.id);
    if (!conversation) return;
    router.push(`/chat/${conversation.id}`);
  };

  return (
    <View className="bg-background flex-1">
      {showVideoFeed ? (
        <Photo uri={profile.photos[0] ?? ''} width="100%" height="100%" />
      ) : (
        <>
          <Photo uri={profile.photos[0] ?? ''} width="100%" height="100%" />
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient colors={GRADIENT.callBackdrop} className="absolute inset-0 opacity-80" />
        </>
      )}

      <View className="pt-safe-offset-8 pb-safe-offset-8 flex-1 justify-between px-6">
        <View className="items-center gap-3">
          {!showVideoFeed ? (
            <UserAvatar uri={profile.photos[0]} name={profile.name} size={132} ring />
          ) : null}
          <Txt weight="bold" className="text-2xl text-white">
            {profile.name}
          </Txt>
          <View className="rounded-full bg-black/40 px-3 py-1.5">
            <Txt className="text-[13px] text-white/85">
              {active.status === 'active'
                ? `${isVideo ? '視訊' : '語音'}通話中 · ${formatDuration(elapsed)}`
                : active.status === 'ended'
                  ? '通話結束'
                  : CALL_STATUS_LABEL[active.status]}
            </Txt>
          </View>
          {active.muted ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-black/40 px-3 py-1">
              <MicOff color={NEON.coral} size={12} />
              <Txt className="text-[11px] text-white/80">你目前是靜音</Txt>
            </View>
          ) : null}
        </View>

        {isVideo ? (
          <View className="items-end">
            <View className="h-44 w-32 overflow-hidden rounded-3xl border border-white/25">
              {active.cameraOn ? (
                <Photo uri={me.photos[0] ?? ''} width="100%" height="100%" />
              ) : (
                <View className="flex-1 items-center justify-center bg-black/70">
                  <VideoOff color="#ffffff" size={22} />
                  <Txt className="mt-1 text-[10px] text-white/70">鏡頭已關</Txt>
                </View>
              )}
              <View className="absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-2 py-0.5">
                <Txt className="text-[9px] text-white/85">
                  {active.frontCamera ? '前鏡頭' : '後鏡頭'}
                </Txt>
              </View>
            </View>
          </View>
        ) : (
          <View className="items-center">
            <Txt className="text-center text-[12px] leading-5 text-white/55">
              示範模式下的通話狀態與計時都是真的，音訊串流待接上通話服務後即可運作。
            </Txt>
          </View>
        )}

        <View className="gap-6">
          <View className="flex-row justify-center gap-2">
            <CallControl
              label={active.muted ? '取消靜音' : '靜音'}
              active={active.muted}
              onPress={toggleMute}
              icon={
                active.muted ? (
                  <MicOff color={active.muted ? '#171021' : '#ffffff'} size={22} />
                ) : (
                  <Mic color="#ffffff" size={22} />
                )
              }
            />
            <CallControl
              label={active.speaker ? '關閉擴音' : '擴音'}
              active={active.speaker}
              onPress={toggleSpeaker}
              icon={
                active.speaker ? (
                  <Volume2 color="#171021" size={22} />
                ) : (
                  <VolumeX color="#ffffff" size={22} />
                )
              }
            />
            {isVideo ? (
              <>
                <CallControl
                  label={active.cameraOn ? '關閉鏡頭' : '開啟鏡頭'}
                  active={!active.cameraOn}
                  onPress={toggleCamera}
                  icon={
                    active.cameraOn ? (
                      <Video color="#ffffff" size={22} />
                    ) : (
                      <VideoOff color="#171021" size={22} />
                    )
                  }
                />
                <CallControl
                  label="翻轉鏡頭"
                  onPress={flipCamera}
                  disabled={!active.cameraOn}
                  icon={<SwitchCamera color="#ffffff" size={22} />}
                />
              </>
            ) : (
              <>
                <CallControl
                  label="轉為視訊"
                  onPress={switchToVideo}
                  icon={<Video color="#ffffff" size={22} />}
                />
                <CallControl
                  label="傳訊息"
                  onPress={openChat}
                  icon={<MessageSquare color="#ffffff" size={22} />}
                />
              </>
            )}
          </View>

          <View className="items-center">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="結束通話"
              onPress={hangUp}
              disabled={active.status === 'ended'}
              className="h-[72px] w-[72px] items-center justify-center rounded-full bg-[#EF4B57] active:opacity-80"
            >
              <PhoneOff color="#ffffff" size={28} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
