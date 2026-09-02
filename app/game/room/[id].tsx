import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Coins,
  Eye,
  Flame,
  MessageSquare,
  Moon,
  PartyPopper,
  Skull,
  Vote,
} from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { GameHeader } from '@/components/game/GameHeader';
import { GameScreen } from '@/components/game/GameScreen';
import { Photo } from '@/components/ui/Photo';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { STAMINA_COST, TRUTH_DARE_BOT_LINES, WEREWOLF_DAY_LINES, roomById } from '@/lib/data/games';
import { getProfileById } from '@/lib/data/profiles';
import { liveDareCards, liveTruthCards } from '@/lib/stores/ai';
import { useAuthStore } from '@/lib/stores/auth';
import { useChatStore } from '@/lib/stores/chat';
import { useGameStore } from '@/lib/stores/game';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { GAME, GRADIENT } from '@/lib/theme';
import type { GameRoom, WerewolfPlayer, WerewolfRole } from '@/lib/types';

const ME = 'me';

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

const ROLE_LABEL: Record<WerewolfRole, string> = {
  wolf: '狼人',
  seer: '預言家',
  villager: '平民',
};

/** 派對房：真心話大冒險 / 天黑請閉眼，對手由本機模擬。 */
export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const room = roomById(id);
  const spendStamina = useGameStore((state) => state.spendStamina);
  const [blocked, setBlocked] = useState(false);
  const spentRef = useRef(false);

  useEffect(() => {
    if (spentRef.current) return;
    spentRef.current = true;
    if (!spendStamina(STAMINA_COST.room)) setBlocked(true);
  }, [spendStamina]);

  if (!room) {
    return (
      <GameScreen>
        <GameHeader title="房間不存在" />
        <View className="flex-1 items-center justify-center px-8">
          <Txt style={{ color: GAME.muted, fontSize: 13, textAlign: 'center' }}>
            這個房間已經解散了，回遊戲城看看其他場次。
          </Txt>
        </View>
      </GameScreen>
    );
  }

  if (blocked) {
    return (
      <GameScreen>
        <GameHeader title={room.title} />
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Txt weight="semibold" style={{ color: GAME.text, fontSize: 18 }}>
            體力不足，無法入座
          </Txt>
          <Txt style={{ color: GAME.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            每次入座需要 {STAMINA_COST.room} 點體力。回遊戲城可以用心動代幣補一點。
          </Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="回到遊戲城"
            onPress={() => router.replace('/(tabs)')}
            className="border-game-line bg-game-card rounded-full border px-6 py-3 active:opacity-70"
          >
            <Txt style={{ color: GAME.text, fontSize: 14 }}>回到遊戲城</Txt>
          </Pressable>
        </View>
      </GameScreen>
    );
  }

  return room.game === 'truth-dare' ? <TruthDareGame room={room} /> : <WerewolfGame room={room} />;
}

/* ============================================================ 真心話大冒險 */

const TOTAL_TURNS = 8;

function TruthDareGame({ room }: { room: GameRoom }) {
  const me = useAuthStore((state) => state.me);
  const addCoins = useSubscriptionStore((state) => state.addCoins);
  const recordGame = useGameStore((state) => state.recordGame);
  const addAffinity = useGameStore((state) => state.addAffinity);
  const ensureConversation = useChatStore((state) => state.ensureConversation);

  const seats = useMemo(() => [ME, ...room.playerIds.slice(0, 4)], [room.playerIds]);

  const [turn, setTurn] = useState(0);
  const [mode, setMode] = useState<'truth' | 'dare' | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const { entries: log, append: appendLog } = useGameLog(
    `${nameOf(room.hostId, me.name)} 開好房間，等你入座`,
  );
  const [completed, setCompleted] = useState(0);
  const [done, setDone] = useState(false);
  const [reward, setReward] = useState({ coins: 0, score: 0 });

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const current = seats[turn % seats.length] ?? ME;
  const isMine = current === ME;

  const finish = useCallback(
    (finalCompleted: number) => {
      const win = finalCompleted >= 3;
      const score = 20 + finalCompleted * 18;
      const coins = Math.round((room.rewardCoins / TOTAL_TURNS) * finalCompleted);
      recordGame({ win, score });
      addCoins(coins);
      addAffinity(room.hostId, finalCompleted * 4);
      setReward({ coins, score });
      setDone(true);
    },
    [addAffinity, addCoins, recordGame, room.hostId, room.rewardCoins],
  );

  const advance = useCallback(
    (entry: string, completedDelta = 0) => {
      appendLog(entry);
      const nextCompleted = completed + completedDelta;
      if (completedDelta > 0) setCompleted(nextCompleted);
      setMode(null);
      setCard(null);
      if (turn + 1 >= TOTAL_TURNS) {
        finish(nextCompleted);
        return;
      }
      setTurn((value) => value + 1);
    },
    [appendLog, completed, finish, turn],
  );

  // 機器人回合：自動抽卡、留一句話，然後換人。
  useEffect(() => {
    if (isMine || done) return undefined;
    const botName = nameOf(current, me.name);
    timer.current = setTimeout(() => {
      const isTruth = Math.random() < 0.5;
      const text = isTruth ? pick(liveTruthCards()) : pick(liveDareCards());
      advance(
        `${botName} 選了${isTruth ? '真心話' : '大冒險'}：${text}｜「${pick(TRUTH_DARE_BOT_LINES)}」`,
      );
    }, 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [advance, current, done, isMine, me.name]);

  if (done) {
    return (
      <ResultView
        title={completed >= 3 ? '這局很敢！' : '下一局再放開一點'}
        body={`你完成了 ${completed} 個挑戰，房主 ${nameOf(room.hostId, me.name)} 對你的印象加了不少。`}
        reward={reward}
        room={room}
        onAgain={() => router.replace(`/game/room/${room.id}`)}
        onChat={() => router.replace(`/chat/${ensureConversation(room.hostId)}`)}
      />
    );
  }

  return (
    <GameScreen>
      <GameHeader
        title={room.title}
        subtitle={`${room.tag} · 第 ${turn + 1} / ${TOTAL_TURNS} 輪`}
      />

      <SeatRow seats={seats} currentId={current} myName={me.name} myPhoto={me.photos[0]} />

      <ScrollView
        contentContainerClassName="gap-2 px-4 pb-4"
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {log.map((entry) => (
          <Animated.View
            key={entry.id}
            entering={FadeIn.duration(240)}
            className="border-game-line bg-game-card rounded-2xl border px-3 py-2.5"
          >
            <Txt style={{ color: GAME.muted, fontSize: 12, lineHeight: 19 }}>{entry.text}</Txt>
          </Animated.View>
        ))}
      </ScrollView>

      <View className="bg-game-card border-game-line pb-safe-offset-5 gap-3 rounded-t-[32px] border-t px-5 pt-5">
        {!isMine ? (
          <View className="flex-row items-center gap-2">
            <Moon color={GAME.violet} size={16} />
            <Txt style={{ color: GAME.muted, fontSize: 13 }}>
              {nameOf(current, me.name)} 正在抽卡…
            </Txt>
          </View>
        ) : card ? (
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              {mode === 'truth' ? (
                <MessageSquare color={GAME.cyan} size={16} />
              ) : (
                <Flame color={GAME.orange} size={16} />
              )}
              <Txt weight="semibold" style={{ color: GAME.text, fontSize: 15 }}>
                {mode === 'truth' ? '真心話' : '大冒險'}
              </Txt>
            </View>
            <Txt style={{ color: GAME.text, fontSize: 17, lineHeight: 26 }}>{card}</Txt>
            <View className="gap-2">
              <GradientButton
                label={`我完成了（+${mode === 'truth' ? 10 : 15} 積分）`}
                onPress={() =>
                  advance(`你完成了${mode === 'truth' ? '真心話' : '大冒險'}：${card}`, 1)
                }
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="跳過這題"
                onPress={() => advance(`你跳過了這題：${card}`)}
                className="border-game-line items-center rounded-full border py-3 active:opacity-75"
              >
                <Txt style={{ color: GAME.muted, fontSize: 13 }}>跳過（不加分）</Txt>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="gap-3">
            <Txt weight="semibold" style={{ color: GAME.text, fontSize: 16 }}>
              換你了，選一個
            </Txt>
            <View className="flex-row gap-3">
              <ChoiceCard
                icon={<MessageSquare color={GAME.cyan} size={20} />}
                label="真心話"
                hint="老實回答一題"
                onPress={() => {
                  setMode('truth');
                  setCard(pick(liveTruthCards()));
                }}
              />
              <ChoiceCard
                icon={<Flame color={GAME.orange} size={20} />}
                label="大冒險"
                hint="做一件有點瘋的事"
                onPress={() => {
                  setMode('dare');
                  setCard(pick(liveDareCards()));
                }}
              />
            </View>
          </View>
        )}
      </View>
    </GameScreen>
  );
}

/* ============================================================ 天黑請閉眼 */

type WolfPhase = 'intro' | 'night' | 'reveal' | 'day' | 'vote' | 'end';

function WerewolfGame({ room }: { room: GameRoom }) {
  const me = useAuthStore((state) => state.me);
  const addCoins = useSubscriptionStore((state) => state.addCoins);
  const recordGame = useGameStore((state) => state.recordGame);
  const addAffinity = useGameStore((state) => state.addAffinity);
  const ensureConversation = useChatStore((state) => state.ensureConversation);

  const [players, setPlayers] = useState<WerewolfPlayer[]>(() => {
    const seats = [ME, ...room.playerIds.slice(0, 4)];
    const fillers: WerewolfRole[] = Array.from(
      { length: Math.max(0, seats.length - 2) },
      () => 'villager',
    );
    const roles = shuffle<WerewolfRole>(['wolf', 'seer', ...fillers]);
    return seats.map((userId, index) => ({
      userId,
      role: roles[index] ?? 'villager',
      alive: true,
    }));
  });

  const [phase, setPhase] = useState<WolfPhase>('intro');
  const [round, setRound] = useState(1);
  const { entries: log, append: appendLog } = useGameLog('房主洗好身分牌，遊戲即將開始');
  const [seerResult, setSeerResult] = useState<string | null>(null);
  const [victimId, setVictimId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<'good' | 'wolf' | null>(null);
  const [reward, setReward] = useState({ coins: 0, score: 0 });

  const myRole = players.find((player) => player.userId === ME)?.role ?? 'villager';
  const amAlive = players.find((player) => player.userId === ME)?.alive ?? false;
  const alive = players.filter((player) => player.alive);

  const settle = useCallback(
    (next: WerewolfPlayer[]): boolean => {
      const aliveWolves = next.filter((p) => p.alive && p.role === 'wolf').length;
      const aliveOthers = next.filter((p) => p.alive && p.role !== 'wolf').length;
      const iAmWolf = myRole === 'wolf';

      if (aliveWolves === 0 || aliveWolves >= aliveOthers) {
        const wolfWin = aliveWolves > 0;
        const iWin = iAmWolf ? wolfWin : !wolfWin;
        const score = iWin ? 95 : 30;
        const coins = iWin ? Math.round(room.rewardCoins / 2) : 10;
        recordGame({ win: iWin, score });
        addCoins(coins);
        if (iWin) addAffinity(room.hostId, 12);
        setReward({ coins, score });
        setOutcome(wolfWin ? 'wolf' : 'good');
        setPhase('end');
        return true;
      }
      return false;
    },
    [addAffinity, addCoins, myRole, recordGame, room.hostId, room.rewardCoins],
  );

  /** 夜晚結算：狼人出刀。 */
  const resolveNight = (chosenId?: string) => {
    const wolf = players.find((player) => player.role === 'wolf' && player.alive);
    const targets = players.filter(
      (player) => player.alive && player.role !== 'wolf' && player.userId !== wolf?.userId,
    );
    const target = chosenId
      ? players.find((player) => player.userId === chosenId)
      : (pick(targets) as WerewolfPlayer | undefined);

    if (!target) {
      setPhase('day');
      return;
    }

    const next = players.map((player) =>
      player.userId === target.userId ? { ...player, alive: false } : player,
    );
    setPlayers(next);
    setVictimId(target.userId);
    appendLog(`第 ${round} 夜：${nameOf(target.userId, me.name)} 在夜裡被淘汰`);
    if (settle(next)) return;
    setPhase('reveal');
  };

  const check = (targetId: string) => {
    const target = players.find((player) => player.userId === targetId);
    if (!target) return;
    const label = target.role === 'wolf' ? '狼人' : '好人';
    setSeerResult(`${nameOf(targetId, me.name)} 是${label}`);
    appendLog(`你查驗了 ${nameOf(targetId, me.name)}：${label}`);
    resolveNight();
  };

  const vote = (targetId: string) => {
    const tally = new Map<string, number>();
    tally.set(targetId, 1);

    players
      .filter((player) => player.alive && player.userId !== ME)
      .forEach((player) => {
        const options = players.filter(
          (other) =>
            other.alive &&
            other.userId !== player.userId &&
            (player.role !== 'wolf' || other.role !== 'wolf'),
        );
        const choice = pick(options);
        if (!choice) return;
        tally.set(choice.userId, (tally.get(choice.userId) ?? 0) + 1);
      });

    let outId = targetId;
    let best = tally.get(targetId) ?? 0;
    tally.forEach((count, userId) => {
      if (count > best) {
        best = count;
        outId = userId;
      }
    });

    const out = players.find((player) => player.userId === outId);
    const next = players.map((player) =>
      player.userId === outId ? { ...player, alive: false } : player,
    );
    setPlayers(next);
    appendLog(
      `白天投票：${nameOf(outId, me.name)} 被票出，身分是${ROLE_LABEL[out?.role ?? 'villager']}`,
    );
    if (settle(next)) return;
    setRound((value) => value + 1);
    setVictimId(null);
    setPhase('night');
  };

  if (phase === 'end') {
    const iAmWolf = myRole === 'wolf';
    const iWin = iAmWolf ? outcome === 'wolf' : outcome === 'good';
    return (
      <ResultView
        title={iWin ? '這局你贏了' : '這局輸了'}
        body={`你的身分是${ROLE_LABEL[myRole]}，${outcome === 'wolf' ? '狼人陣營' : '好人陣營'}獲勝。`}
        reward={reward}
        room={room}
        onAgain={() => router.replace(`/game/room/${room.id}`)}
        onChat={() => router.replace(`/chat/${ensureConversation(room.hostId)}`)}
      />
    );
  }

  return (
    <GameScreen>
      <GameHeader
        title={room.title}
        subtitle={`${room.tag} · 第 ${round} 天 · 你是${ROLE_LABEL[myRole]}`}
      />

      <View className="flex-row flex-wrap justify-center gap-3 px-4 pb-2">
        {players.map((player) => (
          <View key={player.userId} className="items-center gap-1" style={{ width: 62 }}>
            <View
              className="overflow-hidden rounded-2xl border-2"
              style={{
                borderColor: player.alive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
                opacity: player.alive ? 1 : 0.4,
              }}
            >
              <Photo
                uri={
                  player.userId === ME
                    ? (me.photos[0] ?? '')
                    : (getProfileById(player.userId)?.photos[0] ?? '')
                }
                width={54}
                height={54}
                radius={14}
              />
            </View>
            <Txt numberOfLines={1} style={{ color: GAME.text, fontSize: 11 }}>
              {player.userId === ME ? '你' : nameOf(player.userId, me.name)}
            </Txt>
            {!player.alive ? (
              <View className="flex-row items-center gap-0.5">
                <Skull color={GAME.muted} size={10} />
                <Txt style={{ color: GAME.muted, fontSize: 9 }}>{ROLE_LABEL[player.role]}</Txt>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-2 px-4 pb-4"
        showsVerticalScrollIndicator={false}
      >
        {log.map((entry) => (
          <Animated.View
            key={entry.id}
            entering={FadeIn.duration(240)}
            className="border-game-line bg-game-card rounded-2xl border px-3 py-2.5"
          >
            <Txt style={{ color: GAME.muted, fontSize: 12, lineHeight: 19 }}>{entry.text}</Txt>
          </Animated.View>
        ))}
        {seerResult ? (
          <View className="border-game-line bg-game-raised rounded-2xl border px-3 py-2.5">
            <Txt weight="semibold" style={{ color: GAME.cyan, fontSize: 12 }}>
              查驗結果：{seerResult}
            </Txt>
          </View>
        ) : null}
      </ScrollView>

      <Animated.View
        entering={FadeInDown.duration(260)}
        className="bg-game-card border-game-line pb-safe-offset-5 gap-3 rounded-t-[32px] border-t px-5 pt-5"
      >
        {phase === 'intro' ? (
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Moon color={GAME.violet} size={17} />
              <Txt weight="semibold" style={{ color: GAME.text, fontSize: 16 }}>
                你的身分是{ROLE_LABEL[myRole]}
              </Txt>
            </View>
            <Txt style={{ color: GAME.muted, fontSize: 12, lineHeight: 19 }}>
              {myRole === 'wolf'
                ? '每晚可以淘汰一位玩家，白天要裝好人不被票出。'
                : myRole === 'seer'
                  ? '每晚可以查驗一位玩家的身分，白天帶著資訊帶動投票。'
                  : '沒有技能，靠發言與投票把狼人抓出來。'}
            </Txt>
            <GradientButton label="天黑請閉眼" onPress={() => setPhase('night')} />
          </View>
        ) : null}

        {phase === 'night' ? (
          myRole === 'wolf' && amAlive ? (
            <TargetPicker
              title="選擇今晚要淘汰的人"
              icon={<Skull color={GAME.pink} size={17} />}
              players={alive.filter((player) => player.userId !== ME)}
              myName={me.name}
              onPick={(targetId) => resolveNight(targetId)}
            />
          ) : myRole === 'seer' && amAlive ? (
            <TargetPicker
              title="選擇今晚要查驗的人"
              icon={<Eye color={GAME.cyan} size={17} />}
              players={alive.filter((player) => player.userId !== ME)}
              myName={me.name}
              onPick={check}
            />
          ) : (
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <Moon color={GAME.violet} size={17} />
                <Txt weight="semibold" style={{ color: GAME.text, fontSize: 16 }}>
                  天黑請閉眼
                </Txt>
              </View>
              <Txt style={{ color: GAME.muted, fontSize: 12 }}>
                狼人正在行動，等天亮再看看發生什麼事。
              </Txt>
              <GradientButton label="等待天亮" onPress={() => resolveNight()} />
            </View>
          )
        ) : null}

        {phase === 'reveal' ? (
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Skull color={GAME.pink} size={17} />
              <Txt weight="semibold" style={{ color: GAME.text, fontSize: 16 }}>
                天亮了
              </Txt>
            </View>
            <Txt style={{ color: GAME.text, fontSize: 14, lineHeight: 21 }}>
              {victimId ? `${nameOf(victimId, me.name)} 昨晚被淘汰。` : '昨晚是平安夜。'}
            </Txt>
            <GradientButton
              label="開始討論"
              onPress={() => {
                const speakers = players.filter((player) => player.alive && player.userId !== ME);
                appendLog(
                  ...speakers
                    .slice(0, 3)
                    .map(
                      (player) =>
                        `${nameOf(player.userId, me.name)}：「${pick(WEREWOLF_DAY_LINES)}」`,
                    ),
                );
                setPhase('day');
              }}
            />
          </View>
        ) : null}

        {phase === 'day' ? (
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Vote color={GAME.gold} size={17} />
              <Txt weight="semibold" style={{ color: GAME.text, fontSize: 16 }}>
                討論結束，準備投票
              </Txt>
            </View>
            <Txt style={{ color: GAME.muted, fontSize: 12 }}>
              {amAlive ? '投出你認為最可疑的人。' : '你已被淘汰，只能旁觀這一輪。'}
            </Txt>
            <GradientButton
              label={amAlive ? '進入投票' : '看投票結果'}
              onPress={() => {
                if (!amAlive) {
                  const fallback = alive.find((player) => player.userId !== ME);
                  if (fallback) vote(fallback.userId);
                  return;
                }
                setPhase('vote');
              }}
            />
          </View>
        ) : null}

        {phase === 'vote' ? (
          <TargetPicker
            title="投出你要票的人"
            icon={<Vote color={GAME.gold} size={17} />}
            players={alive.filter((player) => player.userId !== ME)}
            myName={me.name}
            onPick={vote}
          />
        ) : null}
      </Animated.View>
    </GameScreen>
  );
}

/* ================================================================ 共用 */

interface LogEntry {
  id: number;
  text: string;
}

/** 對局紀錄：自帶穩定 id，避免用陣列索引當 key。 */
function useGameLog(initial: string) {
  const seq = useRef(0);
  const [entries, setEntries] = useState<LogEntry[]>([{ id: 0, text: initial }]);

  const append = useCallback((...texts: string[]) => {
    setEntries((current) => [
      ...current,
      ...texts.map((text) => {
        seq.current += 1;
        return { id: seq.current, text };
      }),
    ]);
  }, []);

  return { entries, append };
}

function nameOf(userId: string, myName: string) {
  if (userId === ME) return myName;
  return getProfileById(userId)?.name ?? '玩家';
}

function SeatRow({
  seats,
  currentId,
  myName,
  myPhoto,
}: {
  seats: string[];
  currentId: string;
  myName: string;
  myPhoto?: string;
}) {
  return (
    <View className="flex-row justify-center gap-3 px-4 pb-3">
      {seats.map((seat) => {
        const active = seat === currentId;
        const uri = seat === ME ? (myPhoto ?? '') : (getProfileById(seat)?.photos[0] ?? '');
        return (
          <View key={seat} className="items-center gap-1" style={{ width: 58 }}>
            <View
              className="overflow-hidden rounded-2xl border-2"
              style={{ borderColor: active ? GAME.orange : 'rgba(255,255,255,0.12)' }}
            >
              <Photo uri={uri} width={50} height={50} radius={13} />
            </View>
            <Txt numberOfLines={1} style={{ color: active ? GAME.text : GAME.muted, fontSize: 10 }}>
              {seat === ME ? '你' : nameOf(seat, myName)}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

function ChoiceCard({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="border-game-line bg-game-raised flex-1 items-center gap-1.5 rounded-3xl border py-4 active:opacity-80"
    >
      {icon}
      <Txt weight="semibold" style={{ color: GAME.text, fontSize: 15 }}>
        {label}
      </Txt>
      <Txt style={{ color: GAME.muted, fontSize: 10 }}>{hint}</Txt>
    </Pressable>
  );
}

function TargetPicker({
  title,
  icon,
  players,
  myName,
  onPick,
}: {
  title: string;
  icon: React.ReactNode;
  players: WerewolfPlayer[];
  myName: string;
  onPick: (userId: string) => void;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        {icon}
        <Txt weight="semibold" style={{ color: GAME.text, fontSize: 16 }}>
          {title}
        </Txt>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {players.map((player) => (
          <Pressable
            key={player.userId}
            accessibilityRole="button"
            accessibilityLabel={nameOf(player.userId, myName)}
            onPress={() => onPick(player.userId)}
            className="border-game-line bg-game-raised flex-row items-center gap-2 rounded-full border px-3 py-2 active:opacity-75"
          >
            <View className="overflow-hidden rounded-full">
              <Photo
                uri={getProfileById(player.userId)?.photos[0] ?? ''}
                width={24}
                height={24}
                radius={12}
              />
            </View>
            <Txt style={{ color: GAME.text, fontSize: 13 }}>{nameOf(player.userId, myName)}</Txt>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function GradientButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="overflow-hidden rounded-full active:opacity-85"
    >
      <LinearGradient
        colors={GRADIENT.game}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="items-center justify-center py-4"
      >
        <Txt weight="bold" style={{ color: '#ffffff', fontSize: 15 }}>
          {label}
        </Txt>
      </LinearGradient>
    </Pressable>
  );
}

function ResultView({
  title,
  body,
  reward,
  room,
  onAgain,
  onChat,
}: {
  title: string;
  body: string;
  reward: { coins: number; score: number };
  room: GameRoom;
  onAgain: () => void;
  onChat: () => void;
}) {
  return (
    <GameScreen>
      <GameHeader title="房間結算" subtitle={room.tag} />
      <View className="flex-1 items-center justify-center gap-6 px-8">
        <LinearGradient
          colors={GRADIENT.game}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-20 w-20 items-center justify-center rounded-3xl"
        >
          <PartyPopper color="#ffffff" size={34} />
        </LinearGradient>

        <View className="items-center gap-2">
          <Txt weight="bold" style={{ color: GAME.text, fontSize: 23 }}>
            {title}
          </Txt>
          <Txt style={{ color: GAME.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            {body}
          </Txt>
        </View>

        <View className="w-full gap-2">
          <View className="border-game-line bg-game-card flex-row justify-between rounded-2xl border px-4 py-3">
            <Txt style={{ color: GAME.muted, fontSize: 13 }}>心動積分</Txt>
            <Txt weight="bold" style={{ color: GAME.text, fontSize: 15 }}>
              +{reward.score}
            </Txt>
          </View>
          <View className="border-game-line bg-game-card flex-row items-center justify-between rounded-2xl border px-4 py-3">
            <Txt style={{ color: GAME.muted, fontSize: 13 }}>心動代幣</Txt>
            <View className="flex-row items-center gap-1">
              <Coins color={GAME.gold} size={14} />
              <Txt weight="bold" style={{ color: GAME.gold, fontSize: 15 }}>
                +{reward.coins}
              </Txt>
            </View>
          </View>
        </View>

        <View className="w-full gap-3">
          <GradientButton label="再玩一局（1 體力）" onPress={onAgain} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="跟房主聊聊"
            onPress={onChat}
            className="border-game-line bg-game-card items-center rounded-full border py-3.5 active:opacity-75"
          >
            <Txt weight="medium" style={{ color: GAME.text, fontSize: 14 }}>
              跟房主聊聊
            </Txt>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="回到遊戲城"
            onPress={() => router.replace('/(tabs)')}
            className="items-center py-1 active:opacity-70"
          >
            <Txt style={{ color: GAME.muted, fontSize: 13 }}>回到遊戲城</Txt>
          </Pressable>
        </View>
      </View>
    </GameScreen>
  );
}
