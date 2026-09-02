import { useState } from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Trash2,
  Video,
} from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { UpgradeSheet } from '@/components/subscription/UpgradeSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlowButton, OutlineButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { getProfileById, getProfiles } from '@/lib/data/profiles';
import { formatDuration, relativeTime } from '@/lib/format';
import { CALL_RESULT_LABEL, useCallsStore } from '@/lib/stores/calls';
import { useChatStore } from '@/lib/stores/chat';
import { useMatchesStore } from '@/lib/stores/matches';
import { useEntitlements } from '@/lib/stores/subscription';
import { NEON } from '@/lib/theme';
import type { CallKind } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function CallHistoryScreen() {
  const history = useCallsStore((state) => state.history);
  const clearHistory = useCallsStore((state) => state.clearHistory);
  const startOutgoing = useCallsStore((state) => state.startOutgoing);
  const simulateIncoming = useCallsStore((state) => state.simulateIncoming);
  const ensureConversation = useChatStore((state) => state.ensureConversation);
  const matchedIds = useMatchesStore((state) => state.matchedIds);
  const entitlements = useEntitlements();

  const [tab, setTab] = useState<'all' | 'missed'>('all');
  const [paywall, setPaywall] = useState(false);

  const filtered =
    tab === 'missed' ? history.filter((item) => item.result !== 'completed') : history;
  const matches = getProfiles(matchedIds);
  const firstMatch = matches[0];

  const call = (userId: string, kind: CallKind) => {
    if (kind === 'video' && !entitlements.videoCalls) {
      setPaywall(true);
      return;
    }
    ensureConversation(userId);
    startOutgoing(userId, kind);
    router.push('/call/active');
  };

  const incoming = (kind: CallKind) => {
    if (!firstMatch) return;
    ensureConversation(firstMatch.id);
    simulateIncoming(firstMatch.id, kind);
    router.push('/call/incoming');
  };

  return (
    <Screen>
      <ScreenHeader
        back
        fallback="/(tabs)/messages"
        title="通話紀錄"
        subtitle={`${history.length} 筆紀錄`}
        right={
          history.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="清除通話紀錄"
              hitSlop={8}
              onPress={clearHistory}
              className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
            >
              <Trash2 color="#8C8397" size={17} />
            </Pressable>
          ) : undefined
        }
      />

      <View className="flex-row gap-2 px-4 pb-3">
        {(
          [
            { key: 'all', label: '全部' },
            { key: 'missed', label: '未接與拒接' },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === item.key }}
            accessibilityLabel={item.label}
            onPress={() => setTab(item.key)}
            className={cn(
              'rounded-full border px-4 py-2 active:opacity-70',
              tab === item.key ? 'border-accent bg-accent/15' : 'border-border/70 bg-surface',
            )}
          >
            <Txt className={cn('text-[13px]', tab === item.key ? 'text-accent' : 'text-muted')}>
              {item.label}
            </Txt>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerClassName="gap-6 px-4 pb-8">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Phone color={NEON.cyan} size={22} />}
            title={tab === 'missed' ? '沒有未接來電' : '還沒有通話紀錄'}
            description="配對之後可以直接語音或視訊，比打字更快確認感覺。"
            action={<GlowButton label="回到訊息" onPress={() => router.push('/(tabs)/messages')} />}
          />
        ) : (
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            {filtered.map((record, index) => {
              const profile = getProfileById(record.userId);
              if (!profile) return null;
              const missed = record.result !== 'completed';

              return (
                <View
                  key={record.id}
                  className={cn(
                    'flex-row items-center gap-3 px-4 py-3.5',
                    index === filtered.length - 1 ? '' : 'border-border/40 border-b',
                  )}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`查看 ${profile.name}`}
                    onPress={() => router.push(`/profile/${profile.id}`)}
                    className="active:opacity-70"
                  >
                    <UserAvatar
                      uri={profile.photos[0]}
                      name={profile.name}
                      size={44}
                      online={profile.online}
                    />
                  </Pressable>

                  <View className="flex-1 gap-1">
                    <Txt
                      weight="medium"
                      className={cn('text-[14px]', missed ? 'text-danger' : 'text-foreground')}
                      numberOfLines={1}
                    >
                      {profile.name}
                    </Txt>
                    <View className="flex-row items-center gap-1.5">
                      {record.result === 'missed' ? (
                        <PhoneMissed color="#EF4B57" size={12} />
                      ) : record.direction === 'incoming' ? (
                        <PhoneIncoming color="#8C8397" size={12} />
                      ) : (
                        <PhoneOutgoing color="#8C8397" size={12} />
                      )}
                      <Txt className="text-muted text-[11px]">
                        {record.kind === 'video' ? '視訊' : '語音'} ·{' '}
                        {CALL_RESULT_LABEL[record.result]}
                        {record.result === 'completed'
                          ? ` · ${formatDuration(record.durationSec)}`
                          : ''}
                      </Txt>
                    </View>
                    <Txt className="text-muted text-[10px]">{relativeTime(record.createdAt)}</Txt>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`語音回撥 ${profile.name}`}
                    hitSlop={6}
                    onPress={() => call(profile.id, 'voice')}
                    className="bg-glass border-border/60 h-9 w-9 items-center justify-center rounded-full border active:opacity-70"
                  >
                    <Phone color="#2FD68A" size={15} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`視訊回撥 ${profile.name}`}
                    hitSlop={6}
                    onPress={() => call(profile.id, 'video')}
                    className="bg-glass border-border/60 h-9 w-9 items-center justify-center rounded-full border active:opacity-70"
                  >
                    <Video color={NEON.cyan} size={15} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {firstMatch ? (
          <Section title="測試通話流程" subtitle={`以 ${firstMatch.name} 模擬一通來電`}>
            <View className="gap-3">
              <OutlineButton
                label="模擬語音來電"
                icon={<Phone color="#2FD68A" size={16} />}
                onPress={() => incoming('voice')}
              />
              <OutlineButton
                label="模擬視訊來電"
                icon={<Video color={NEON.cyan} size={16} />}
                onPress={() => incoming('video')}
              />
              <Txt className="text-muted px-1 text-[11px] leading-4">
                來電畫面包含接聽、拒接與訊息回覆。接通後會進入通話畫面，掛斷時自動寫入紀錄與聊天室。
              </Txt>
            </View>
          </Section>
        ) : null}
      </ScrollView>

      <UpgradeSheet
        visible={paywall}
        onClose={() => setPaywall(false)}
        title="視訊通話是 VIP 功能"
        description="升級後可以無限視訊，畫質也會優先配置。"
        bullets={['無限視訊通話', '通話畫質優先', '無限喜歡', '隱身瀏覽']}
      />
    </Screen>
  );
}
