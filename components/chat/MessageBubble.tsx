import { Check, CheckCheck, Mic, PhoneCall, PhoneMissed, Play, Video } from 'lucide-react-native';
import { View } from 'react-native';

import { GiftGlyph } from '@/components/ui/GiftGlyph';
import { Photo } from '@/components/ui/Photo';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { GIFTS } from '@/lib/data/seed';
import { formatClock, formatDuration } from '@/lib/format';
import { GRADIENT, NEON } from '@/lib/theme';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  showReadReceipt: boolean;
}

const WAVEFORM = [
  { id: 'w1', height: 6 },
  { id: 'w2', height: 12 },
  { id: 'w3', height: 9 },
  { id: 'w4', height: 16 },
  { id: 'w5', height: 11 },
  { id: 'w6', height: 7 },
  { id: 'w7', height: 14 },
  { id: 'w8', height: 10 },
  { id: 'w9', height: 5 },
  { id: 'w10', height: 13 },
];

export function MessageBubble({ message, showReadReceipt }: MessageBubbleProps) {
  const mine = message.senderId === 'me';

  if (message.kind === 'system') {
    return (
      <View className="items-center py-3">
        <View className="bg-glass border-border/60 rounded-full border px-3 py-1.5">
          <Txt className="text-muted text-[11px]">{message.text}</Txt>
        </View>
      </View>
    );
  }

  if (message.kind === 'call') {
    const missed = message.callMissed;
    return (
      <View className={cn('py-1.5', mine ? 'items-end' : 'items-start')}>
        <View className="bg-surface border-border/60 flex-row items-center gap-2 rounded-2xl border px-3 py-2.5">
          {missed ? (
            <PhoneMissed color={NEON.coral} size={16} />
          ) : message.callKind === 'video' ? (
            <Video color={NEON.cyan} size={16} />
          ) : (
            <PhoneCall color="#2FD68A" size={16} />
          )}
          <Txt className="text-foreground text-[13px]">
            {message.callKind === 'video' ? '視訊通話' : '語音通話'}
            {missed ? ' · 未接' : ` · ${formatDuration(message.callDurationSec ?? 0)}`}
          </Txt>
          <Txt className="text-muted text-[10px]">{formatClock(message.createdAt)}</Txt>
        </View>
      </View>
    );
  }

  return (
    <View className={cn('py-1', mine ? 'items-end' : 'items-start')}>
      <View className="max-w-[78%]">
        {message.kind === 'text' ? (
          mine ? (
            <LinearGradient
              colors={GRADIENT.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-3xl rounded-br-lg px-4 py-2.5"
            >
              <Txt className="text-[15px] leading-5 text-white">{message.text}</Txt>
            </LinearGradient>
          ) : (
            <View className="bg-surface border-border/60 rounded-3xl rounded-bl-lg border px-4 py-2.5">
              <Txt className="text-foreground text-[15px] leading-5">{message.text}</Txt>
            </View>
          )
        ) : null}

        {message.kind === 'image' && message.imageUri ? (
          <View className="border-border/60 overflow-hidden rounded-3xl border">
            <Photo uri={message.imageUri} width={220} height={220} />
          </View>
        ) : null}

        {message.kind === 'voice' ? (
          <View
            className={cn(
              'flex-row items-center gap-3 rounded-3xl px-4 py-3',
              mine ? 'bg-accent' : 'bg-surface border-border/60 border',
            )}
          >
            <Play
              color={mine ? '#ffffff' : NEON.coral}
              size={16}
              fill={mine ? '#ffffff' : NEON.coral}
            />
            <View className="flex-row items-end gap-0.5">
              {WAVEFORM.map((bar) => (
                <View
                  key={bar.id}
                  className={cn('w-0.5 rounded-full', mine ? 'bg-white/80' : 'bg-muted')}
                  style={{ height: bar.height }}
                />
              ))}
            </View>
            <Mic color={mine ? '#ffffff' : NEON.coral} size={14} />
            <Txt className={cn('text-[11px]', mine ? 'text-white' : 'text-muted')}>
              {message.durationSec ?? 0} 秒
            </Txt>
          </View>
        ) : null}

        {message.kind === 'gift' ? <GiftBubble giftId={message.giftId} mine={mine} /> : null}

        <View
          className={cn('mt-1 flex-row items-center gap-1', mine ? 'justify-end' : 'justify-start')}
        >
          <Txt className="text-muted text-[10px]">{formatClock(message.createdAt)}</Txt>
          {mine && showReadReceipt ? (
            message.read ? (
              <CheckCheck color={NEON.cyan} size={12} />
            ) : (
              <Check color="#8C8397" size={12} />
            )
          ) : null}
        </View>
      </View>
    </View>
  );
}

function GiftBubble({ giftId, mine }: { giftId?: string; mine: boolean }) {
  const gift = GIFTS.find((item) => item.id === giftId) ?? GIFTS[0];
  if (!gift) return null;

  return (
    <View
      className={cn(
        'items-center gap-2 rounded-3xl border px-6 py-4',
        mine ? 'border-accent/50 bg-accent/15' : 'border-border/60 bg-surface',
      )}
    >
      <GiftGlyph icon={gift.icon} size={34} />
      <Txt weight="semibold" className="text-foreground text-[13px]">
        {mine ? `你送出了${gift.name}` : `送你一個${gift.name}`}
      </Txt>
      <Txt className="text-muted text-[11px]">{gift.coins} 心動代幣</Txt>
    </View>
  );
}
