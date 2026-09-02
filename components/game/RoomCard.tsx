import { Coins, Moon, Users } from 'lucide-react-native';
import { Platform, Pressable, View } from 'react-native';

import { Photo } from '@/components/ui/Photo';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { getProfileById } from '@/lib/data/profiles';
import { roomSlotsLeft } from '@/lib/data/games';
import { GAME, GRADIENT } from '@/lib/theme';
import type { GameRoom } from '@/lib/types';

interface RoomCardProps {
  room: GameRoom;
  onJoin: () => void;
}

/** 底部多人派對區的房間卡：主題標籤、人數組成、霓虹「立即加入」。 */
export function RoomCard({ room, onJoin }: RoomCardProps) {
  const needed = roomSlotsLeft(room);
  const isWerewolf = room.game === 'werewolf';

  return (
    <View className="border-game-line bg-game-card w-64 gap-3 rounded-3xl border p-4">
      <View className="flex-row items-center justify-between">
        <View
          className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
          style={{
            backgroundColor: isWerewolf ? 'rgba(168,85,247,0.18)' : 'rgba(255,138,61,0.18)',
          }}
        >
          {isWerewolf ? (
            <Moon color={GAME.violet} size={12} />
          ) : (
            <Users color={GAME.orange} size={12} />
          )}
          <Txt
            weight="semibold"
            style={{ color: isWerewolf ? GAME.violet : GAME.orange, fontSize: 11 }}
          >
            {room.tag}
          </Txt>
        </View>
        {room.hot ? (
          <View className="bg-game-pink/20 rounded-full px-2 py-0.5">
            <Txt weight="semibold" style={{ color: GAME.pink, fontSize: 10 }}>
              熱門
            </Txt>
          </View>
        ) : null}
      </View>

      <Txt weight="semibold" numberOfLines={1} style={{ color: GAME.text, fontSize: 15 }}>
        {room.title}
      </Txt>

      <View className="flex-row items-center gap-2">
        <View className="flex-row">
          {room.playerIds.slice(0, 4).map((id, index) => {
            const profile = getProfileById(id);
            return (
              <View
                key={id}
                className="border-game-card overflow-hidden rounded-full border-2"
                style={{ marginLeft: index === 0 ? 0 : -10 }}
              >
                <Photo uri={profile?.photos[0] ?? ''} width={26} height={26} radius={13} />
              </View>
            );
          })}
        </View>
        <Txt style={{ color: GAME.muted, fontSize: 11 }} numberOfLines={1}>
          {room.males}男{room.females}女 · 差 {needed} 人開局
        </Txt>
      </View>

      <View className="flex-row items-center gap-1">
        <Coins color={GAME.gold} size={12} />
        <Txt style={{ color: GAME.muted, fontSize: 11 }}>獎池 {room.rewardCoins} 心動代幣</Txt>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`立即加入 ${room.title}`}
        onPress={onJoin}
        className="overflow-hidden rounded-full active:opacity-85"
        style={
          Platform.OS === 'web'
            ? undefined
            : {
                shadowColor: isWerewolf ? GAME.violet : GAME.pink,
                shadowOpacity: 0.6,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 0 },
                elevation: 8,
              }
        }
      >
        <LinearGradient
          colors={isWerewolf ? GRADIENT.gameNeon : GRADIENT.game}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="h-10 items-center justify-center"
        >
          <Txt weight="bold" style={{ color: '#ffffff', fontSize: 14 }}>
            立即加入
          </Txt>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
