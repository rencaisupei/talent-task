import { useState } from 'react';
import { View } from 'react-native';

import { AdminScreen } from '@/components/admin/AdminScreen';
import {
  ActionButton,
  AdminGroup,
  FilterChips,
  StatusPill,
  ToggleRow,
} from '@/components/admin/AdminUI';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { GAME_ROOMS, roomSlotsLeft } from '@/lib/data/games';
import { getProfileById, getProfiles } from '@/lib/data/profiles';
import { useAdminStore } from '@/lib/stores/admin';
import type { GameRoom, PartyGame } from '@/lib/types';

type Filter = 'all' | PartyGame | 'closed';

export default function AdminRoomsScreen() {
  const flags = useAdminStore((state) => state.flags);
  const setFlag = useAdminStore((state) => state.setFlag);
  const closedRoomIds = useAdminStore((state) => state.closedRoomIds);
  const [filter, setFilter] = useState<Filter>('all');

  const visible = GAME_ROOMS.filter((room) => {
    if (filter === 'all') return true;
    if (filter === 'closed') return closedRoomIds.includes(room.id);
    return room.game === filter;
  });

  return (
    <AdminScreen title="遊戲房管理" subtitle={`${GAME_ROOMS.length} 個房間`}>
      <Section title="遊戲開關">
        <AdminGroup>
          <ToggleRow
            label="極速開局"
            hint="心動快問 5 題的一對一配對遊戲"
            value={flags.gameQuick}
            onChange={(value) => setFlag('gameQuick', value)}
          />
          <ToggleRow
            label="大富翁"
            hint="24 格環形棋盤，心動值滿解鎖真愛"
            value={flags.gameMonopoly}
            onChange={(value) => setFlag('gameMonopoly', value)}
          />
          <ToggleRow
            label="多人派對房"
            hint="真心話大冒險與天黑請閉眼"
            value={flags.gameParty}
            onChange={(value) => setFlag('gameParty', value)}
            last
          />
        </AdminGroup>
      </Section>

      <FilterChips<Filter>
        options={[
          { key: 'all', label: '全部', count: GAME_ROOMS.length },
          {
            key: 'truth-dare',
            label: '真心話大冒險',
            count: GAME_ROOMS.filter((room) => room.game === 'truth-dare').length,
          },
          {
            key: 'werewolf',
            label: '天黑請閉眼',
            count: GAME_ROOMS.filter((room) => room.game === 'werewolf').length,
          },
          { key: 'closed', label: '已關閉', count: closedRoomIds.length },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {visible.length === 0 ? (
        <View className="bg-surface border-border/60 rounded-3xl border p-6">
          <Txt className="text-muted text-center text-[13px]">這個分類目前沒有房間。</Txt>
        </View>
      ) : (
        visible.map((room) => <RoomCard key={room.id} room={room} />)
      )}
    </AdminScreen>
  );
}

function RoomCard({ room }: { room: GameRoom }) {
  const closedRoomIds = useAdminStore((state) => state.closedRoomIds);
  const pinnedRoomIds = useAdminStore((state) => state.pinnedRoomIds);
  const roomRewards = useAdminStore((state) => state.roomRewards);
  const closeRoom = useAdminStore((state) => state.closeRoom);
  const reopenRoom = useAdminStore((state) => state.reopenRoom);
  const toggleRoomPin = useAdminStore((state) => state.toggleRoomPin);
  const setRoomReward = useAdminStore((state) => state.setRoomReward);

  const closed = closedRoomIds.includes(room.id);
  const pinned = pinnedRoomIds.includes(room.id);
  const reward = roomRewards[room.id] ?? room.rewardCoins;
  const host = getProfileById(room.hostId);
  const players = getProfiles(room.playerIds).slice(0, 4);

  return (
    <View className="bg-surface border-border/60 gap-3 rounded-3xl border p-4">
      <View className="flex-row items-start gap-3">
        <View className="flex-1 gap-1">
          <Txt weight="semibold" className="text-foreground text-[14px]">
            {room.title}
          </Txt>
          <Txt className="text-accent text-[11px]">{room.tag}</Txt>
          <Txt className="text-muted text-[11px]">
            房主 {host?.name ?? room.hostId} · {room.males}男{room.females}女 ·{' '}
            {roomSlotsLeft(room) > 0 ? `差 ${roomSlotsLeft(room)} 人開局` : '已滿'}
          </Txt>
        </View>
        <View className="items-end gap-1">
          <StatusPill label={closed ? '已關閉' : '開放中'} tone={closed ? 'danger' : 'success'} />
          {pinned ? <StatusPill label="置頂" tone="primary" /> : null}
          {room.hot ? <StatusPill label="熱門" tone="warning" /> : null}
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        {players.map((player) => (
          <UserAvatar key={player.id} uri={player.photos[0]} name={player.name} size={28} />
        ))}
        <Txt className="text-muted ml-1 text-[11px]">
          {room.playerIds.length}/{room.capacity} 人 · 獎池 {reward} 心動代幣
        </Txt>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <ActionButton
          label={closed ? '重新開放' : '關閉房間'}
          tone={closed ? 'success' : 'danger'}
          onPress={() => (closed ? reopenRoom(room.id) : closeRoom(room.id))}
        />
        <ActionButton
          label={pinned ? '取消置頂' : '置頂房間'}
          tone={pinned ? 'neutral' : 'primary'}
          onPress={() => toggleRoomPin(room.id)}
        />
        <ActionButton
          label="獎池 +50"
          tone="success"
          onPress={() => setRoomReward(room.id, reward + 50)}
        />
        <ActionButton
          label="獎池 -50"
          tone="warning"
          disabled={reward <= 50}
          onPress={() => setRoomReward(room.id, Math.max(0, reward - 50))}
        />
      </View>
    </View>
  );
}
