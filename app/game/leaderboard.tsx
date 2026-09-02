import { useState } from 'react';
import { Flame, ScrollText, Swords, Trophy } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { GameHeader } from '@/components/game/GameHeader';
import { GameScreen } from '@/components/game/GameScreen';
import { LeaderboardRow } from '@/components/game/LeaderboardRow';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { buildRanking } from '@/lib/data/games';
import { useGameStore, usePlayerTitle } from '@/lib/stores/game';
import { useMatchesStore } from '@/lib/stores/matches';
import { GAME, GRADIENT } from '@/lib/theme';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry } from '@/lib/types';

type Board = 'score' | 'wins' | 'friends';

const TABS: { key: Board; label: string }[] = [
  { key: 'score', label: '本週人氣' },
  { key: 'wins', label: '勝場榜' },
  { key: 'friends', label: '好友榜' },
];

/** 完整排行榜。遊戲城首頁只顯示前五名，這裡是全榜。 */
export default function LeaderboardScreen() {
  const score = useGameStore((state) => state.score);
  const wins = useGameStore((state) => state.wins);
  const played = useGameStore((state) => state.played);
  const streak = useGameStore((state) => state.streak);
  const matchedIds = useMatchesStore((state) => state.matchedIds);
  const title = usePlayerTitle();

  const [board, setBoard] = useState<Board>('score');

  const base = buildRanking(score, wins);
  const list: LeaderboardEntry[] =
    board === 'wins'
      ? [...base].sort((a, b) => b.wins - a.wins)
      : board === 'friends'
        ? base.filter((entry) => entry.userId === 'me' || matchedIds.includes(entry.userId))
        : base;

  const myRank = list.findIndex((entry) => entry.userId === 'me') + 1;

  return (
    <GameScreen>
      <GameHeader title="排行榜" subtitle="每週日晚上 24:00 結算並發放獎勵" />

      <ScrollView contentContainerClassName="gap-5 px-4 pb-10" showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={GRADIENT.game}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="gap-3 rounded-3xl p-4"
        >
          <View className="flex-row items-center gap-2">
            <Trophy color="#ffffff" size={18} />
            <Txt weight="bold" style={{ color: '#ffffff', fontSize: 16 }}>
              我的名次：第 {myRank || '—'} 名
            </Txt>
          </View>
          <Txt style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
            稱號 {title} · 目前連勝 {streak} 場
          </Txt>
          <View className="flex-row gap-2">
            <Stat icon={<Flame color="#ffffff" size={14} />} label="心動積分" value={score} />
            <Stat icon={<Swords color="#ffffff" size={14} />} label="勝場" value={wins} />
            <Stat icon={<ScrollText color="#ffffff" size={14} />} label="總場次" value={played} />
          </View>
        </LinearGradient>

        <View className="border-game-line bg-game-card flex-row gap-1 rounded-full border p-1">
          {TABS.map((tab) => {
            const active = board === tab.key;
            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={tab.label}
                onPress={() => setBoard(tab.key)}
                className={cn(
                  'flex-1 items-center rounded-full py-2 active:opacity-75',
                  active && 'bg-game-pink/20',
                )}
              >
                <Txt
                  weight={active ? 'semibold' : 'regular'}
                  style={{ color: active ? GAME.pink : GAME.muted, fontSize: 13 }}
                >
                  {tab.label}
                </Txt>
              </Pressable>
            );
          })}
        </View>

        <View className="border-game-line bg-game-card overflow-hidden rounded-3xl border">
          {list.length === 0 ? (
            <View className="items-center gap-2 px-6 py-10">
              <Txt weight="semibold" style={{ color: GAME.text, fontSize: 15 }}>
                好友榜還沒有人
              </Txt>
              <Txt style={{ color: GAME.muted, fontSize: 12, textAlign: 'center' }}>
                在遊戲城配對成功後，對方就會出現在這裡。
              </Txt>
            </View>
          ) : (
            list.map((entry, index) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                rank={index + 1}
                last={index === list.length - 1}
                onPress={
                  entry.userId === 'me'
                    ? () => router.push('/(tabs)/me')
                    : () => router.push(`/profile/${entry.userId}`)
                }
              />
            ))
          )}
        </View>

        <View className="border-game-line bg-game-card gap-2 rounded-3xl border p-4">
          <Txt weight="semibold" style={{ color: GAME.text, fontSize: 14 }}>
            積分怎麼算
          </Txt>
          <Txt style={{ color: GAME.muted, fontSize: 12, lineHeight: 19 }}>
            極速開局每題同步 +14、大富翁走完一局 +40、解鎖真愛 +120、派對房贏一局最多 +95。每週前 10
            名可額外領取心動代幣。
          </Txt>
        </View>
      </ScrollView>
    </GameScreen>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <View className="flex-1 gap-1 rounded-2xl bg-black/20 px-3 py-2">
      <View className="flex-row items-center gap-1">
        {icon}
        <Txt weight="bold" style={{ color: '#ffffff', fontSize: 15 }}>
          {value}
        </Txt>
      </View>
      <Txt style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>{label}</Txt>
    </View>
  );
}
