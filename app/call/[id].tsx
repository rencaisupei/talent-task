import { router, useLocalSearchParams } from 'expo-router';
import { Button } from 'heroui-native';
import { Mic, MicOff, PhoneOff, ShieldCheck, Volume2, VolumeX } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { EmptyState } from '@/components/SectionHeading';
import { StaticTag } from '@/components/TagChip';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { COLORS } from '@/lib/colors';
import { goBackOrReplace } from '@/lib/navigation';
import { formatCallDuration, useCallStore } from '@/lib/stores/calls';
import { useChatStore } from '@/lib/stores/chat';
import { useSessionStore } from '@/lib/stores/session';
import { cn } from '@/lib/utils';

type CallPhase = 'connecting' | 'active' | 'ended';

/** 對方接聽的等待時間（毫秒）。 */
const ANSWER_DELAY = 3000;

export default function VoiceCallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversations = useChatStore((state) => state.conversations);
  const startCall = useCallStore((state) => state.startCall);
  const markConnected = useCallStore((state) => state.markConnected);
  const endCall = useCallStore((state) => state.endCall);

  const role = useSessionStore((state) => state.role);
  const userId = useSessionStore((state) => state.userId);
  const displayName = useSessionStore((state) => state.displayName);

  const [phase, setPhase] = useState<CallPhase>('connecting');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const callIdRef = useRef<string | null>(null);

  const conversation = conversations.find((item) => item.id === id);
  const isTalent = role === 'talent';
  const counterpartName = conversation
    ? isTalent
      ? conversation.clientName
      : conversation.talentName
    : '';
  const counterpartId = conversation
    ? isTalent
      ? conversation.clientId
      : conversation.talentId
    : '';

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: phase === 'connecting' ? pulse.value : 1 }],
  }));

  // 建立通話紀錄並模擬對方接聽。
  useEffect(() => {
    if (!conversation || callIdRef.current !== null) return;
    const record = startCall({
      conversation,
      callerId: userId,
      callerName: displayName,
      calleeId: counterpartId,
      calleeName: counterpartName,
    });
    callIdRef.current = record.id;

    const timer = setTimeout(() => {
      markConnected(record.id);
      setPhase('active');
    }, ANSWER_DELAY);

    return () => clearTimeout(timer);
  }, [
    conversation,
    counterpartId,
    counterpartName,
    displayName,
    markConnected,
    startCall,
    userId,
  ]);

  // 通話計時。
  useEffect(() => {
    if (phase !== 'active') return undefined;
    const interval = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const hangUp = useCallback(() => {
    const callId = callIdRef.current;
    if (callId === null) {
      goBackOrReplace('/(tabs)/chats');
      return;
    }
    const finished = endCall(callId, phase === 'active' ? 'completed' : 'cancelled');
    setSummary(
      phase === 'active'
        ? `通話時長 ${formatCallDuration(finished?.durationSeconds ?? seconds)}`
        : '尚未接通，已取消撥號',
    );
    setPhase('ended');
  }, [endCall, phase, seconds]);

  if (!conversation) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-6">
        <EmptyState title="找不到這組對話" caption="請回到對話列表後重新撥打。" />
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)/chats')}
          className="mt-4"
          accessibilityRole="button"
        >
          <Text className="text-brand-strong text-[14px] font-semibold">返回對話列表</Text>
        </Pressable>
      </View>
    );
  }

  const statusText =
    phase === 'connecting'
      ? '撥號中，等待對方接聽…'
      : phase === 'active'
        ? formatCallDuration(seconds)
        : (summary ?? '通話已結束');

  return (
    <View className="bg-ink pt-safe-offset-10 pb-safe-offset-8 flex-1 items-center justify-between px-6">
      <View className="items-center gap-3">
        <StaticTag label={conversation.tag} tone="brand" />
        <Text numberOfLines={1} className="text-[13px] text-white/70">
          {conversation.gigTitle}
        </Text>
      </View>

      <View className="items-center gap-5">
        <AnimatedView
          style={pulseStyle}
          className={cn(
            'h-28 w-28 items-center justify-center rounded-full',
            phase === 'ended' ? 'bg-white/15' : 'bg-brand',
          )}
        >
          <Text className="text-[40px] font-bold text-white">
            {counterpartName.slice(0, 1) || '？'}
          </Text>
        </AnimatedView>

        <View className="items-center gap-1.5">
          <Text className="text-[24px] font-bold tracking-tight text-white">{counterpartName}</Text>
          <Text className="text-[15px] text-white/70">{statusText}</Text>
          {phase === 'active' ? (
            <View className="mt-1 flex-row items-center gap-1.5">
              <View className="bg-brand h-2 w-2 rounded-full" />
              <Text className="text-[12px] text-white/60">平台加密語音通話中</Text>
            </View>
          ) : null}
        </View>
      </View>

      {phase === 'ended' ? (
        <View className="w-full gap-3">
          <Button
            size="lg"
            onPress={() => router.replace({ pathname: '/chat/[id]', params: { id: conversation.id } })}
          >
            <Button.Label>回到對話</Button.Label>
          </Button>
          <Button size="lg" variant="tertiary" onPress={() => goBackOrReplace('/(tabs)/chats')}>
            <Button.Label>返回對話列表</Button.Label>
          </Button>
        </View>
      ) : (
        <View className="w-full gap-6">
          <View className="flex-row items-center justify-center gap-4">
            <CallToggle
              label={muted ? '已靜音' : '靜音'}
              isActive={muted}
              icon={
                muted ? (
                  <MicOff size={22} color={COLORS.ink} strokeWidth={2.1} />
                ) : (
                  <Mic size={22} color={COLORS.white} strokeWidth={2.1} />
                )
              }
              onPress={() => setMuted((current) => !current)}
            />
            <CallToggle
              label={speaker ? '擴音開啟' : '擴音'}
              isActive={speaker}
              icon={
                speaker ? (
                  <Volume2 size={22} color={COLORS.ink} strokeWidth={2.1} />
                ) : (
                  <VolumeX size={22} color={COLORS.white} strokeWidth={2.1} />
                )
              }
              onPress={() => setSpeaker((current) => !current)}
            />
          </View>

          <View className="items-center gap-4">
            <Pressable
              onPress={hangUp}
              accessibilityRole="button"
              accessibilityLabel="結束通話"
              className="bg-coral h-16 w-16 items-center justify-center rounded-full"
            >
              <PhoneOff size={26} color={COLORS.white} strokeWidth={2.2} />
            </Pressable>
            <View className="flex-row items-center gap-1.5">
              <ShieldCheck size={13} color={COLORS.brand} strokeWidth={2.1} />
              <Text className="text-[11px] text-white/60">
                通話透過平台建立，雙方不會看到彼此的私人號碼
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

interface CallToggleProps {
  label: string;
  isActive: boolean;
  icon: React.ReactNode;
  onPress: () => void;
}

function CallToggle({ label, isActive, icon, onPress }: CallToggleProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      className="items-center gap-2"
    >
      <View
        className={cn(
          'h-14 w-14 items-center justify-center rounded-full',
          isActive ? 'bg-white' : 'bg-white/15',
        )}
      >
        {icon}
      </View>
      <Text className={cn('text-[12px]', isActive ? 'text-white' : 'text-white/60')}>{label}</Text>
    </Pressable>
  );
}
