import { useState } from 'react';
import { Bell, ChevronRight, Flame, Layers, MapPin, Trophy } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { CopyrightFooter } from '@/components/ui/CopyrightFooter';
import { GameScreen } from '@/components/game/GameScreen';
import { LeaderboardRow } from '@/components/game/LeaderboardRow';
import { MonopolyBanner } from '@/components/game/MonopolyBanner';
import { QuickStartButton } from '@/components/game/QuickStartButton';
import { ResourceBar } from '@/components/game/ResourceBar';
import { RoomCard } from '@/components/game/RoomCard';
import { StaminaSheet } from '@/components/game/StaminaSheet';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { GAME_ROOMS, STAMINA_COST, buildRanking } from '@/lib/data/games';
import { getProfileById } from '@/lib/data/profiles';
import { useAdminStore } from '@/lib/stores/admin';
import { useGameStore } from '@/lib/stores/game';
import { useUnreadNotificationCount } from '@/lib/stores/notifications';
import { GAME, GRADIENT } from '@/lib/theme';
import type { ReactNode } from 'react';

/** 遊戲城：JiMatch 的主畫面，所有互動遊戲的入口。 */
export default function GameHubScreen() {
  const stamina = useGameStore((state) => state.stamina);
  const score = useGameStore((state) => state.score);
  const wins = useGameStore((state) => state.wins);
  const played = useGameStore((state) => state.played);
  const streak = useGameStore((state) => state.streak);
  const affinity = useGameStore((state) => state.affinity);
  const boardPartnerId = useGameStore((state) => state.boardPartnerId);
  const unread = useUnreadNotificationCount();
  const maintenance = useAdminStore((state) => state.flags.maintenance);
  const maintenanceNotice = useAdminStore((state) => state.flags.maintenanceNotice);
  const gameQuick = useAdminStore((state) => state.flags.gameQuick);
  const gameMonopoly = useAdminStore((state) => state.flags.gameMonopoly);
  const gameParty = useAdminStore((state) => state.flags.gameParty);
  const closedRoomIds = useAdminStore((state) => state.closedRoomIds);
  const pinnedRoomIds = useAdminStore((state) => state.pinnedRoomIds);

  const [staminaSheet, setStaminaSheet] = useState(false);

  const partner = getProfileById(boardPartnerId ?? undefined);
  const ranking = buildRanking(score, wins);
  const openRooms = GAME_ROOMS.filter((room) => !closedRoomIds.includes(room.id)).sort(
    (a, b) => Number(pinnedRoomIds.includes(b.id)) - Number(pinnedRoomIds.includes(a.id)),
  );
  const myRank = ranking.findIndex((entry) => entry.userId === 'me') + 1;

  const enter = (cost: number, go: () => void) => {
    if (stamina < cost) {
      setStaminaSheet(true);
      return;
    }
    go();
  };

  return (
    <GameScreen>
      <ResourceBar
        onOpenProfile={() => router.push('/(tabs)/me')}
        onTopUp={() => router.push('/coins')}
      />

      <ScrollView contentContainerClassName="gap-6 pb-8" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-end justify-between px-4">
          <View>
            <Txt weight="bold" style={{ color: GAME.text, fontSize: 26, letterSpacing: 0.5 }}>
              遊戲城
            </Txt>
            <Txt style={{ color: GAME.muted, fontSize: 12, marginTop: 2 }}>
              一起玩一局，比硬聊快十倍
            </Txt>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="查看排行榜"
            onPress={() => router.push('/game/leaderboard')}
            className="border-game-line bg-game-card flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 active:opacity-70"
          >
            <Trophy color={GAME.gold} size={14} />
            <Txt weight="semibold" style={{ color: GAME.text, fontSize: 12 }}>
              第 {myRank} 名
            </Txt>
          </Pressable>
        </View>

        {maintenance ? (
          <View
            className="mx-4 rounded-2xl border px-3.5 py-3"
            style={{ borderColor: GAME.gold, backgroundColor: 'rgba(255,197,61,0.12)' }}
          >
            <Txt weight="semibold" style={{ color: GAME.gold, fontSize: 12 }}>
              系統維護中
            </Txt>
            <Txt style={{ color: GAME.text, fontSize: 11, lineHeight: 16, marginTop: 2 }}>
              {maintenanceNotice}
            </Txt>
          </View>
        ) : null}

        <View className="items-center gap-3">
          <QuickStartButton
            enoughStamina={stamina >= STAMINA_COST.quick}
            onPress={() => {
              if (!gameQuick) return;
              enter(STAMINA_COST.quick, () => router.push('/game/quick'));
            }}
          />
          {gameQuick ? (
            <View className="flex-row items-center gap-2">
              <Flame color={GAME.orange} size={13} />
              <Txt style={{ color: GAME.muted, fontSize: 12 }}>
                已玩 {played} 局 · {wins} 勝 · 連勝 {streak}
              </Txt>
            </View>
          ) : (
            <Txt style={{ color: GAME.gold, fontSize: 12 }}>極速開局暫停開放，稍後再回來看看</Txt>
          )}
        </View>

        <View className="flex-row gap-2 px-4">
          <Shortcut
            icon={<Layers color={GAME.pink} size={17} />}
            label="經典滑卡"
            onPress={() => router.push('/discover')}
          />
          <Shortcut
            icon={<MapPin color={GAME.cyan} size={17} />}
            label="附近的人"
            onPress={() => router.push('/nearby')}
          />
          <Shortcut
            icon={<Bell color={GAME.gold} size={17} />}
            label="通知"
            badge={unread}
            onPress={() => router.push('/notifications')}
          />
        </View>

        {gameMonopoly ? (
          <View className="px-4">
            <MonopolyBanner
              partnerName={partner?.name}
              affinity={partner ? (affinity[partner.id] ?? 0) : 0}
              onPress={() => enter(STAMINA_COST.board, () => router.push('/game/monopoly'))}
            />
          </View>
        ) : null}

        {gameParty ? (
          <View className="gap-3">
            <View className="flex-row items-end justify-between px-4">
              <View>
                <Txt weight="semibold" style={{ color: GAME.text, fontSize: 16 }}>
                  多人派對房
                </Txt>
                <Txt style={{ color: GAME.muted, fontSize: 11, marginTop: 2 }}>
                  差一個人就開局，進去就有人陪你玩
                </Txt>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-3 px-4"
            >
              {openRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={() =>
                    enter(STAMINA_COST.room, () => router.push(`/game/room/${room.id}`))
                  }
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View className="gap-3 px-4">
          <View className="flex-row items-end justify-between">
            <View>
              <Txt weight="semibold" style={{ color: GAME.text, fontSize: 16 }}>
                本週排行榜
              </Txt>
              <Txt style={{ color: GAME.muted, fontSize: 11, marginTop: 2 }}>
                贏遊戲累積心動積分，週日晚上結算
              </Txt>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="查看完整排行榜"
              onPress={() => router.push('/game/leaderboard')}
              className="flex-row items-center gap-1 active:opacity-70"
            >
              <Txt style={{ color: GAME.pink, fontSize: 12 }}>完整榜單</Txt>
              <ChevronRight color={GAME.pink} size={14} />
            </Pressable>
          </View>

          <View className="border-game-line bg-game-card overflow-hidden rounded-3xl border">
            {ranking.slice(0, 5).map((entry, index) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                rank={index + 1}
                onPress={
                  entry.userId === 'me'
                    ? () => router.push('/(tabs)/me')
                    : () => router.push(`/profile/${entry.userId}`)
                }
              />
            ))}
            {myRank > 5 ? (
              <LeaderboardRow
                entry={ranking[myRank - 1]}
                rank={myRank}
                last
                onPress={() => router.push('/(tabs)/me')}
              />
            ) : null}
          </View>
        </View>

        <CopyrightFooter variant="game" className="pb-0" />
      </ScrollView>

      <StaminaSheet visible={staminaSheet} onClose={() => setStaminaSheet(false)} />
    </GameScreen>
  );
}

function Shortcut({
  icon,
  label,
  onPress,
  badge = 0,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="border-game-line bg-game-card flex-1 items-center gap-1.5 rounded-2xl border py-3 active:opacity-75"
    >
      <View>
        {icon}
        {badge > 0 ? (
          <LinearGradient
            colors={GRADIENT.gameNeon}
            className="absolute -top-1.5 -right-2.5 h-4 min-w-4 items-center justify-center rounded-full px-1"
          >
            <Txt weight="bold" style={{ color: '#ffffff', fontSize: 9 }}>
              {badge}
            </Txt>
          </LinearGradient>
        ) : null}
      </View>
      <Txt style={{ color: GAME.text, fontSize: 12 }}>{label}</Txt>
    </Pressable>
  );
}
