import { Crown } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Photo } from '@/components/ui/Photo';
import { Txt } from '@/components/ui/Txt';
import { getProfileById } from '@/lib/data/profiles';
import { useAuthStore } from '@/lib/stores/auth';
import { GAME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry } from '@/lib/types';

const MEDAL = ['#FFC53D', '#D6DCE6', '#D08A56'] as const;

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  onPress?: () => void;
  last?: boolean;
}

export function LeaderboardRow({ entry, rank, onPress, last = false }: LeaderboardRowProps) {
  const me = useAuthStore((state) => state.me);
  const isMe = entry.userId === 'me';
  const profile = isMe ? me : getProfileById(entry.userId);
  const medal = rank <= 3 ? MEDAL[rank - 1] : null;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`第 ${rank} 名 ${profile?.name ?? '玩家'}，${entry.score} 分`}
      onPress={onPress}
      disabled={!onPress}
      className={cn(
        'flex-row items-center gap-3 px-4 py-3',
        !last && 'border-game-line border-b',
        isMe && 'bg-game-pink/10',
        onPress && 'active:opacity-70',
      )}
    >
      <View className="w-6 items-center">
        {medal ? (
          <Crown color={medal} size={17} />
        ) : (
          <Txt weight="semibold" style={{ color: GAME.muted, fontSize: 13 }}>
            {rank}
          </Txt>
        )}
      </View>

      <View className="border-game-line overflow-hidden rounded-2xl border">
        <Photo uri={profile?.photos[0] ?? ''} width={36} height={36} radius={12} />
      </View>

      <View className="flex-1">
        <Txt weight="semibold" numberOfLines={1} style={{ color: GAME.text, fontSize: 14 }}>
          {isMe ? `${profile?.name ?? '我'}（你）` : (profile?.name ?? '玩家')}
        </Txt>
        <Txt numberOfLines={1} style={{ color: GAME.muted, fontSize: 11 }}>
          {entry.title} · {entry.wins} 勝
        </Txt>
      </View>

      <Txt weight="bold" style={{ color: rank <= 3 ? GAME.gold : GAME.text, fontSize: 15 }}>
        {entry.score}
      </Txt>
    </Pressable>
  );
}
