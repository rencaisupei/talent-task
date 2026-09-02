import { useEffect, useRef, useState } from 'react';
import {
  CloudRain,
  Coins,
  Dices,
  Flame,
  Gift,
  Heart,
  MapPin,
  MessageSquare,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Dice } from '@/components/game/Dice';
import { GameHeader } from '@/components/game/GameHeader';
import { GameScreen } from '@/components/game/GameScreen';
import { Photo } from '@/components/ui/Photo';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import {
  AFFINITY_UNLOCK,
  BOARD_ROLLS,
  BOARD_TILES,
  CHANCE_EVENTS,
  STAMINA_COST,
  TRAP_EVENTS,
} from '@/lib/data/games';
import { getProfileById } from '@/lib/data/profiles';
import { liveDareCards, liveTruthCards } from '@/lib/stores/ai';
import { useChatStore } from '@/lib/stores/chat';
import { useDiscoverQueue } from '@/lib/stores/discover';
import { useGameStore } from '@/lib/stores/game';
import { useMatchesStore } from '@/lib/stores/matches';
import { useNotificationsStore } from '@/lib/stores/notifications';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { GAME, GRADIENT } from '@/lib/theme';
import type { BoardTile, BoardTileKind } from '@/lib/types';

interface TileEvent {
  tile: BoardTile;
  title: string;
  body: string;
  hearts: number;
  coins: number;
  stamina: number;
  /** 有選項的格子（真心話 / 大冒險）。 */
  accept?: { label: string; hearts: number; coins: number };
  decline?: { label: string; hearts: number };
}

const TILE_COLOR: Record<BoardTileKind, string> = {
  start: GAME.gold,
  truth: GAME.cyan,
  dare: GAME.orange,
  coins: GAME.gold,
  stamina: GAME.mint,
  heart: GAME.pink,
  trap: '#7A6F84',
  chance: GAME.violet,
  date: GAME.pink,
};

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function tileCoords(index: number) {
  if (index <= 6) return { row: 0, col: index };
  if (index <= 12) return { row: index - 6, col: 6 };
  if (index <= 18) return { row: 6, col: 18 - index };
  return { row: 24 - index, col: 0 };
}

function tileIcon(kind: BoardTileKind, size = 13) {
  switch (kind) {
    case 'start':
      return <MapPin color={TILE_COLOR.start} size={size} />;
    case 'truth':
      return <MessageSquare color={TILE_COLOR.truth} size={size} />;
    case 'dare':
      return <Flame color={TILE_COLOR.dare} size={size} />;
    case 'coins':
      return <Coins color={TILE_COLOR.coins} size={size} />;
    case 'stamina':
      return <Zap color={TILE_COLOR.stamina} size={size} />;
    case 'heart':
      return <Heart color={TILE_COLOR.heart} size={size} />;
    case 'trap':
      return <CloudRain color={TILE_COLOR.trap} size={size} />;
    case 'chance':
      return <Sparkles color={TILE_COLOR.chance} size={size} />;
    case 'date':
      return <Gift color={TILE_COLOR.date} size={size} />;
    default:
      return null;
  }
}

function buildEvent(tile: BoardTile, passedStart: boolean): TileEvent {
  const base = { tile, hearts: 0, coins: passedStart ? 10 : 0, stamina: 0 };
  switch (tile.kind) {
    case 'truth':
      return {
        ...base,
        title: '真心話',
        body: pick(liveTruthCards()),
        accept: { label: '我老實回答', hearts: 8, coins: 0 },
        decline: { label: '這題跳過', hearts: -3 },
      };
    case 'dare':
      return {
        ...base,
        title: '大冒險',
        body: pick(liveDareCards()),
        accept: { label: '我做了', hearts: 12, coins: 10 },
        decline: { label: '認輸', hearts: -5 },
      };
    case 'coins':
      return {
        ...base,
        title: '代幣格',
        body: '你在路邊撿到一袋心動代幣。',
        coins: base.coins + 25,
      };
    case 'stamina':
      return { ...base, title: '補給站', body: '喝一杯咖啡，體力回復 1 點。', stamina: 1 };
    case 'heart':
      return { ...base, title: '心動格', body: '你們的話題剛好對上，氣氛升溫。', hearts: 9 };
    case 'trap': {
      return { ...base, title: '尷尬格', body: pick(TRAP_EVENTS), hearts: -7 };
    }
    case 'chance': {
      const event = pick(CHANCE_EVENTS);
      return {
        ...base,
        title: '機會格',
        body: event.label,
        hearts: event.hearts,
        coins: base.coins + event.coins,
      };
    }
    case 'date':
      return {
        ...base,
        title: '約會格',
        body: '你們一起走了一段夜路，什麼都沒說也不尷尬。',
        hearts: 22,
        coins: base.coins + 15,
      };
    case 'start':
      return {
        ...base,
        title: '回到起點',
        body: '重新出發，領取過路獎勵。',
        coins: base.coins + 15,
      };
    default:
      return { ...base, title: tile.label, body: '繼續往前走。' };
  }
}

/** 大富翁：擲骰子踩格子，把心動值推到 100 就解鎖真愛。 */
export default function MonopolyScreen() {
  const { width } = useWindowDimensions();
  const queue = useDiscoverQueue();

  const stamina = useGameStore((state) => state.stamina);
  const spendStamina = useGameStore((state) => state.spendStamina);
  const startBoard = useGameStore((state) => state.startBoard);
  const moveBoard = useGameStore((state) => state.moveBoard);
  const endBoard = useGameStore((state) => state.endBoard);
  const addAffinity = useGameStore((state) => state.addAffinity);
  const markUnlocked = useGameStore((state) => state.markUnlocked);
  const grantStamina = useGameStore((state) => state.grantStamina);
  const recordGame = useGameStore((state) => state.recordGame);
  const boardPartnerId = useGameStore((state) => state.boardPartnerId);
  const boardPosition = useGameStore((state) => state.boardPosition);
  const rollsLeft = useGameStore((state) => state.boardRollsLeft);
  const affinityMap = useGameStore((state) => state.affinity);

  const addCoins = useSubscriptionStore((state) => state.addCoins);
  const addMatch = useMatchesStore((state) => state.addMatch);
  const ensureConversation = useChatStore((state) => state.ensureConversation);
  const pushNotification = useNotificationsStore((state) => state.push);

  const [pawn, setPawn] = useState(boardPosition);
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState(1);
  const [event, setEvent] = useState<TileEvent | null>(null);
  const [session, setSession] = useState({ coins: 0, hearts: 0 });
  const [settled, setSettled] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stepper = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      if (stepper.current) clearInterval(stepper.current);
    },
    [],
  );

  const partner = getProfileById(boardPartnerId ?? undefined);
  const affinity = partner ? (affinityMap[partner.id] ?? 0) : 0;
  const boardSize = Math.min(width - 32, 348);
  const cell = boardSize / 7;

  const unlock = () => {
    if (!partner) return;
    markUnlocked(partner.id);
    addMatch(partner.id);
    pushNotification({
      kind: 'match',
      userId: partner.id,
      title: `大富翁走到終點：${partner.name} 解鎖`,
      body: '心動值滿了，聊天室已經開好',
    });
    recordGame({ win: true, score: 120 });
    endBoard();
    router.replace(`/match/${partner.id}`);
  };

  const applyEvent = (hearts: number, coins: number, staminaGain: number) => {
    if (coins > 0) addCoins(coins);
    if (staminaGain > 0) grantStamina(staminaGain);
    setSession((current) => ({
      coins: current.coins + coins,
      hearts: current.hearts + hearts,
    }));

    let next = affinity;
    if (partner && hearts !== 0) next = addAffinity(partner.id, hearts);
    setEvent(null);

    if (next >= AFFINITY_UNLOCK) {
      unlock();
      return;
    }
    if (rollsLeft <= 0) setSettled(true);
  };

  const roll = () => {
    if (rolling || rollsLeft <= 0 || !partner) return;
    setRolling(true);
    const steps = 1 + Math.floor(Math.random() * 6);

    const spin = setTimeout(() => {
      setDice(steps);
      setRolling(false);

      let moved = 0;
      let cursor = pawn;
      let passedStart = false;
      stepper.current = setInterval(() => {
        cursor = (cursor + 1) % BOARD_TILES.length;
        if (cursor === 0) passedStart = true;
        moved += 1;
        setPawn(cursor);
        if (moved >= steps) {
          if (stepper.current) clearInterval(stepper.current);
          moveBoard(steps);
          const tile = BOARD_TILES[cursor];
          if (tile) setEvent(buildEvent(tile, passedStart));
        }
      }, 170);
    }, 720);

    timers.current.push(spin);
  };

  const startSession = (partnerId: string) => {
    if (!spendStamina(STAMINA_COST.board)) return;
    startBoard(partnerId);
    setPawn(0);
    setSession({ coins: 0, hearts: 0 });
    setSettled(false);
  };

  /* ------------------------------------------------------ 選擇對手 */
  if (!partner) {
    const candidates = queue.slice(0, 8);
    return (
      <GameScreen>
        <GameHeader title="大富翁" subtitle="選一個對象開局，全程消耗 1 點體力" />
        <ScrollView contentContainerClassName="gap-4 px-4 pb-10">
          <View className="border-game-line bg-game-card gap-2 rounded-3xl border p-4">
            <Txt weight="semibold" style={{ color: GAME.text, fontSize: 15 }}>
              規則很簡單
            </Txt>
            <Txt style={{ color: GAME.muted, fontSize: 12, lineHeight: 19 }}>
              一局有 {BOARD_ROLLS}{' '}
              次擲骰。踩到真心話與大冒險可以累積心動值，代幣格拿代幣，尷尬格會扣分。心動值到{' '}
              {AFFINITY_UNLOCK} 就解鎖真愛，直接開聊天室。
            </Txt>
          </View>

          {stamina < STAMINA_COST.board ? (
            <View className="border-game-line bg-game-card rounded-3xl border px-4 py-3">
              <Txt style={{ color: GAME.muted, fontSize: 12 }}>
                目前體力不足，等體力回復或到遊戲城用代幣補一點再開局。
              </Txt>
            </View>
          ) : null}

          <View className="gap-3">
            {candidates.map((profile) => (
              <Pressable
                key={profile.id}
                accessibilityRole="button"
                accessibilityLabel={`和 ${profile.name} 開一局大富翁`}
                onPress={() => startSession(profile.id)}
                disabled={stamina < STAMINA_COST.board}
                className="border-game-line bg-game-card flex-row items-center gap-3 rounded-3xl border p-3 active:opacity-80"
                style={{ opacity: stamina < STAMINA_COST.board ? 0.5 : 1 }}
              >
                <View className="border-game-line overflow-hidden rounded-2xl border">
                  <Photo uri={profile.photos[0] ?? ''} width={52} height={52} radius={16} />
                </View>
                <View className="flex-1">
                  <Txt weight="semibold" style={{ color: GAME.text, fontSize: 15 }}>
                    {profile.name}，{profile.age}
                  </Txt>
                  <Txt numberOfLines={1} style={{ color: GAME.muted, fontSize: 11 }}>
                    {profile.district} · 契合度 {profile.vibeScore}%
                  </Txt>
                </View>
                <View className="bg-game-pink/15 rounded-full px-3 py-1.5">
                  <Txt weight="semibold" style={{ color: GAME.pink, fontSize: 12 }}>
                    開局
                  </Txt>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </GameScreen>
    );
  }

  /* ------------------------------------------------------ 棋局結算 */
  if (settled) {
    return (
      <GameScreen>
        <GameHeader title="本局結算" />
        <View className="flex-1 items-center justify-center gap-6 px-8">
          <View className="border-game-line overflow-hidden rounded-3xl border">
            <Photo uri={partner.photos[0] ?? ''} width={120} height={120} radius={24} />
          </View>
          <View className="items-center gap-2">
            <Txt weight="bold" style={{ color: GAME.text, fontSize: 22 }}>
              骰子用完了
            </Txt>
            <Txt style={{ color: GAME.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              和 {partner.name} 的心動值累積到 {affinity}/{AFFINITY_UNLOCK}
              ，下一局可以接著往上推。
            </Txt>
          </View>

          <View className="w-full gap-2">
            <View className="border-game-line bg-game-card flex-row justify-between rounded-2xl border px-4 py-3">
              <Txt style={{ color: GAME.muted, fontSize: 13 }}>本局心動值</Txt>
              <Txt weight="bold" style={{ color: GAME.pink, fontSize: 15 }}>
                {session.hearts >= 0 ? '+' : ''}
                {session.hearts}
              </Txt>
            </View>
            <View className="border-game-line bg-game-card flex-row justify-between rounded-2xl border px-4 py-3">
              <Txt style={{ color: GAME.muted, fontSize: 13 }}>本局代幣</Txt>
              <Txt weight="bold" style={{ color: GAME.gold, fontSize: 15 }}>
                +{session.coins}
              </Txt>
            </View>
          </View>

          <View className="w-full gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="再開一局"
              onPress={() => {
                recordGame({ win: false, score: 40 });
                endBoard();
                startSession(partner.id);
              }}
              className="overflow-hidden rounded-full active:opacity-85"
            >
              <LinearGradient
                colors={GRADIENT.game}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-14 items-center justify-center"
              >
                <Txt weight="bold" style={{ color: '#ffffff', fontSize: 15 }}>
                  再開一局（1 體力）
                </Txt>
              </LinearGradient>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="換個對象"
              onPress={() => {
                recordGame({ win: false, score: 40 });
                endBoard();
                setSettled(false);
              }}
              className="border-game-line bg-game-card items-center rounded-full border py-3.5 active:opacity-75"
            >
              <Txt weight="medium" style={{ color: GAME.text, fontSize: 14 }}>
                換個對象
              </Txt>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`和 ${partner.name} 開聊天室`}
              onPress={() => router.replace(`/chat/${ensureConversation(partner.id)}`)}
              className="items-center py-1 active:opacity-70"
            >
              <Txt style={{ color: GAME.pink, fontSize: 13 }}>直接跟 {partner.name} 聊聊</Txt>
            </Pressable>
          </View>
        </View>
      </GameScreen>
    );
  }

  /* ------------------------------------------------------ 棋盤 */
  return (
    <GameScreen>
      <GameHeader
        title="大富翁"
        subtitle={`與 ${partner.name} · 剩 ${rollsLeft} 次骰`}
        right={
          <View className="border-game-line bg-game-card flex-row items-center gap-1 rounded-full border px-3 py-1.5">
            <Heart color={GAME.pink} size={12} />
            <Txt weight="semibold" style={{ color: GAME.text, fontSize: 12 }}>
              {affinity}/{AFFINITY_UNLOCK}
            </Txt>
          </View>
        }
      />

      <View className="flex-1 items-center justify-center gap-5 px-4">
        <View
          className="border-game-line overflow-hidden rounded-3xl border"
          style={{ width: boardSize, height: boardSize }}
        >
          <LinearGradient colors={GRADIENT.gameBoard} className="absolute inset-0" />

          {BOARD_TILES.map((tile) => {
            const { row, col } = tileCoords(tile.index);
            const active = pawn === tile.index;
            return (
              <View
                key={tile.index}
                className="absolute items-center justify-center p-0.5"
                style={{ top: row * cell, left: col * cell, width: cell, height: cell }}
              >
                <View
                  className="h-full w-full items-center justify-center gap-0.5 rounded-xl border"
                  style={{
                    borderColor: active ? GAME.pink : 'rgba(255,255,255,0.10)',
                    backgroundColor: active ? 'rgba(255,79,154,0.20)' : 'rgba(255,255,255,0.04)',
                  }}
                >
                  {tileIcon(tile.kind, Math.max(11, cell * 0.28))}
                  <Txt
                    numberOfLines={1}
                    style={{ color: active ? GAME.text : GAME.muted, fontSize: 8 }}
                  >
                    {tile.label}
                  </Txt>
                </View>
              </View>
            );
          })}

          {/* 棋盤中央：對手、心動值、骰子 */}
          <View
            className="absolute items-center justify-center gap-2"
            style={{ top: cell, left: cell, width: cell * 5, height: cell * 5 }}
          >
            <View className="border-game-line overflow-hidden rounded-2xl border">
              <Photo uri={partner.photos[0] ?? ''} width={62} height={62} radius={18} />
            </View>
            <Txt weight="semibold" style={{ color: GAME.text, fontSize: 13 }}>
              {partner.name}
            </Txt>
            <View className="bg-game-base/80 h-2 w-28 overflow-hidden rounded-full">
              <View
                className="bg-game-pink h-full rounded-full"
                style={{ width: `${(affinity / AFFINITY_UNLOCK) * 100}%` }}
              />
            </View>
            <Dice value={dice} rolling={rolling} size={Math.min(70, cell * 1.5)} />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="擲骰子"
          onPress={roll}
          disabled={rolling || rollsLeft <= 0}
          className="w-full overflow-hidden rounded-full active:opacity-85"
          style={{ opacity: rolling || rollsLeft <= 0 ? 0.5 : 1, maxWidth: boardSize }}
        >
          <LinearGradient
            colors={GRADIENT.game}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-14 flex-row items-center justify-center gap-2"
          >
            <Dices color="#ffffff" size={20} />
            <Txt weight="bold" style={{ color: '#ffffff', fontSize: 15 }}>
              {rolling ? '骰子滾動中…' : `擲骰子（剩 ${rollsLeft} 次）`}
            </Txt>
          </LinearGradient>
        </Pressable>
      </View>

      {event ? (
        <Animated.View
          entering={FadeInDown.duration(260)}
          className="absolute right-0 bottom-0 left-0"
        >
          <View className="bg-game-card border-game-line pb-safe-offset-6 gap-4 rounded-t-[32px] border-t px-6 pt-6">
            <View className="flex-row items-center gap-2">
              {tileIcon(event.tile.kind, 18)}
              <Txt weight="bold" style={{ color: GAME.text, fontSize: 19 }}>
                {event.title}
              </Txt>
            </View>
            <Animated.View entering={FadeIn.duration(240)}>
              <Txt style={{ color: GAME.text, fontSize: 15, lineHeight: 23 }}>{event.body}</Txt>
            </Animated.View>

            <View className="flex-row flex-wrap gap-2">
              {event.hearts !== 0 ? (
                <Chip
                  label={`心動 ${event.hearts > 0 ? '+' : ''}${event.hearts}`}
                  tint={GAME.pink}
                />
              ) : null}
              {event.coins > 0 ? <Chip label={`代幣 +${event.coins}`} tint={GAME.gold} /> : null}
              {event.stamina > 0 ? (
                <Chip label={`體力 +${event.stamina}`} tint={GAME.mint} />
              ) : null}
            </View>

            {event.accept && event.decline ? (
              <View className="gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={event.accept.label}
                  onPress={() =>
                    applyEvent(
                      event.hearts + (event.accept?.hearts ?? 0),
                      event.coins + (event.accept?.coins ?? 0),
                      event.stamina,
                    )
                  }
                  className="overflow-hidden rounded-full active:opacity-85"
                >
                  <LinearGradient
                    colors={GRADIENT.game}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="items-center justify-center py-3.5"
                  >
                    <Txt weight="bold" style={{ color: '#ffffff', fontSize: 15 }}>
                      {event.accept.label}（心動 +{event.accept.hearts}）
                    </Txt>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={event.decline.label}
                  onPress={() =>
                    applyEvent(
                      event.hearts + (event.decline?.hearts ?? 0),
                      event.coins,
                      event.stamina,
                    )
                  }
                  className="border-game-line items-center rounded-full border py-3.5 active:opacity-75"
                >
                  <Txt style={{ color: GAME.muted, fontSize: 14 }}>
                    {event.decline.label}（心動 {event.decline.hearts}）
                  </Txt>
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="收下"
                onPress={() => applyEvent(event.hearts, event.coins, event.stamina)}
                className="overflow-hidden rounded-full active:opacity-85"
              >
                <LinearGradient
                  colors={GRADIENT.game}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="items-center justify-center py-4"
                >
                  <Txt weight="bold" style={{ color: '#ffffff', fontSize: 15 }}>
                    收下，繼續走
                  </Txt>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </Animated.View>
      ) : null}
    </GameScreen>
  );
}

function Chip({ label, tint }: { label: string; tint: string }) {
  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${tint}22` }}>
      <Txt weight="semibold" style={{ color: tint, fontSize: 11 }}>
        {label}
      </Txt>
    </View>
  );
}
