import { useCallback, useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, RotateCcw, Swords, Zap } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

import { Dice } from '@/components/game/Dice';
import { GameHeader } from '@/components/game/GameHeader';
import { GameScreen } from '@/components/game/GameScreen';
import { Photo } from '@/components/ui/Photo';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { QUICK_MATCH_LINES, STAMINA_COST } from '@/lib/data/games';
import { SEED_PROFILES } from '@/lib/data/seed';
import { liveQuickQuestions } from '@/lib/stores/ai';
import { useAuthStore } from '@/lib/stores/auth';
import { useChatStore } from '@/lib/stores/chat';
import { useDiscoverQueue } from '@/lib/stores/discover';
import { useGameStore } from '@/lib/stores/game';
import { useMatchesStore } from '@/lib/stores/matches';
import { useNotificationsStore } from '@/lib/stores/notifications';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { GAME, GRADIENT } from '@/lib/theme';
import type { Profile, QuickQuestion } from '@/lib/types';

type Phase = 'blocked' | 'matching' | 'playing' | 'result';

const ROUNDS = 5;
const WIN_AGREEMENTS = 3;

function pickQuestions(): QuickQuestion[] {
  const pool = liveQuickQuestions();
  const picked: QuickQuestion[] = [];
  while (picked.length < ROUNDS && pool.length > 0) {
    const [item] = pool.splice(Math.floor(Math.random() * pool.length), 1);
    if (item) picked.push(item);
  }
  return picked;
}

/** 極速開局：花 1 點體力，跟隨機對手比拚 5 題心動快問。 */
export default function QuickMatchScreen() {
  const queue = useDiscoverQueue();
  const me = useAuthStore((state) => state.me);
  const spendStamina = useGameStore((state) => state.spendStamina);
  const addAffinity = useGameStore((state) => state.addAffinity);
  const recordGame = useGameStore((state) => state.recordGame);
  const addCoins = useSubscriptionStore((state) => state.addCoins);
  const addMatch = useMatchesStore((state) => state.addMatch);
  const ensureConversation = useChatStore((state) => state.ensureConversation);
  const pushNotification = useNotificationsStore((state) => state.push);

  const [opponent] = useState<Profile | undefined>(
    () => queue[Math.floor(Math.random() * Math.max(1, queue.length))] ?? SEED_PROFILES[0],
  );
  const [questions] = useState(pickQuestions);
  const [phase, setPhase] = useState<Phase>('matching');
  const [lineIndex, setLineIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [myPick, setMyPick] = useState<number | null>(null);
  const [botPick, setBotPick] = useState<number | null>(null);
  const [agreements, setAgreements] = useState(0);
  const [reward, setReward] = useState({ coins: 0, score: 0 });

  const spentRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (spentRef.current) return;
    spentRef.current = true;
    if (!spendStamina(STAMINA_COST.quick)) setPhase('blocked');
  }, [spendStamina]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (phase !== 'matching') return undefined;
    const interval = setInterval(() => {
      setLineIndex((current) => {
        if (current >= QUICK_MATCH_LINES.length - 1) {
          setPhase('playing');
          return current;
        }
        return current + 1;
      });
    }, 750);
    return () => clearInterval(interval);
  }, [phase]);

  const finish = useCallback(
    (finalAgreements: number) => {
      const win = finalAgreements >= WIN_AGREEMENTS;
      const score = 30 + finalAgreements * 14;
      const coins = win ? 25 : 8;
      recordGame({ win, score });
      addCoins(coins);
      setReward({ coins, score });

      if (win && opponent) {
        addAffinity(opponent.id, 30);
        addMatch(opponent.id);
        pushNotification({
          kind: 'match',
          userId: opponent.id,
          title: `極速開局：你和 ${opponent.name} 對上了`,
          body: '快問快答契合度夠高，去聊聊吧',
        });
      }
      setPhase('result');
    },
    [addAffinity, addCoins, addMatch, opponent, pushNotification, recordGame],
  );

  const answer = (choice: number) => {
    if (myPick !== null) return;
    const bot = Math.random() < 0.56 ? choice : 1 - choice;
    const same = bot === choice;
    const next = agreements + (same ? 1 : 0);

    setMyPick(choice);
    setBotPick(bot);
    setAgreements(next);

    timerRef.current = setTimeout(() => {
      if (round + 1 >= questions.length) {
        finish(next);
        return;
      }
      setRound((value) => value + 1);
      setMyPick(null);
      setBotPick(null);
    }, 950);
  };

  const percent = Math.min(99, 42 + agreements * 12);
  const win = agreements >= WIN_AGREEMENTS;

  if (phase === 'blocked') {
    return (
      <GameScreen>
        <GameHeader title="極速開局" />
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Zap color={GAME.muted} size={34} />
          <Txt weight="semibold" style={{ color: GAME.text, fontSize: 18 }}>
            體力不足，無法開局
          </Txt>
          <Txt style={{ color: GAME.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            體力會隨時間回復，也可以在遊戲城用心動代幣立刻補一點。
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

  if (phase === 'matching') {
    return (
      <GameScreen>
        <GameHeader title="極速開局" subtitle={`已消耗 ${STAMINA_COST.quick} 點體力`} />
        <View className="flex-1 items-center justify-center gap-8 px-8">
          <Animated.View entering={ZoomIn.duration(400)}>
            <Dice value={(lineIndex % 6) + 1} rolling size={96} />
          </Animated.View>
          <View className="items-center gap-2">
            <Txt weight="bold" style={{ color: GAME.text, fontSize: 20 }}>
              正在尋找對手
            </Txt>
            <Animated.View key={lineIndex} entering={FadeIn.duration(260)}>
              <Txt style={{ color: GAME.muted, fontSize: 13 }}>{QUICK_MATCH_LINES[lineIndex]}</Txt>
            </Animated.View>
          </View>
          <View className="bg-game-card h-1.5 w-52 overflow-hidden rounded-full">
            <View
              className="bg-game-pink h-full rounded-full"
              style={{ width: `${((lineIndex + 1) / QUICK_MATCH_LINES.length) * 100}%` }}
            />
          </View>
        </View>
      </GameScreen>
    );
  }

  if (phase === 'playing') {
    const question = questions[round];
    return (
      <GameScreen>
        <GameHeader
          title="心動快問"
          subtitle={`第 ${round + 1} / ${questions.length} 題 · 同步 ${agreements} 次`}
        />

        <View className="flex-row items-center justify-center gap-6 px-4 pt-2">
          <Player name="你" uri={me.photos[0]} highlight={myPick !== null} />
          <Txt weight="bold" style={{ color: GAME.gold, fontSize: 15 }}>
            VS
          </Txt>
          <Player
            name={opponent?.name ?? '對手'}
            uri={opponent?.photos[0]}
            highlight={botPick !== null}
          />
        </View>

        <View className="flex-1 justify-center gap-5 px-6">
          <Animated.View key={question?.id} entering={FadeInUp.duration(320)}>
            <Txt
              weight="bold"
              style={{ color: GAME.text, fontSize: 24, textAlign: 'center', lineHeight: 34 }}
            >
              {question?.question}
            </Txt>
          </Animated.View>

          <View className="gap-3">
            {question?.options.map((option, index) => {
              const mine = myPick === index;
              const theirs = botPick === index;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={option}
                  onPress={() => answer(index)}
                  disabled={myPick !== null}
                  className="border-game-line bg-game-card flex-row items-center gap-3 rounded-3xl border px-4 py-4 active:opacity-80"
                  style={{
                    borderColor: mine ? GAME.pink : theirs ? GAME.violet : undefined,
                    backgroundColor: mine
                      ? 'rgba(255,79,154,0.14)'
                      : theirs
                        ? 'rgba(168,85,247,0.12)'
                        : undefined,
                  }}
                >
                  <Txt weight="semibold" style={{ color: GAME.text, fontSize: 15, flex: 1 }}>
                    {option}
                  </Txt>
                  {mine ? (
                    <Txt weight="semibold" style={{ color: GAME.pink, fontSize: 11 }}>
                      你選這個
                    </Txt>
                  ) : null}
                  {theirs ? (
                    <Txt weight="semibold" style={{ color: GAME.violet, fontSize: 11 }}>
                      {opponent?.name ?? '對手'}
                    </Txt>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View className="bg-game-card h-1.5 overflow-hidden rounded-full">
            <View
              className="bg-game-orange h-full rounded-full"
              style={{ width: `${((round + 1) / questions.length) * 100}%` }}
            />
          </View>
        </View>
      </GameScreen>
    );
  }

  return (
    <GameScreen>
      <GameHeader title="開局結果" />
      <View className="flex-1 items-center justify-center gap-6 px-8">
        <Animated.View entering={ZoomIn.duration(420)} className="items-center gap-3">
          <View className="flex-row items-center">
            <View className="border-game-line -mr-4 overflow-hidden rounded-full border-2">
              <Photo uri={opponent?.photos[0] ?? ''} width={104} height={104} radius={52} />
            </View>
            <LinearGradient
              colors={win ? GRADIENT.game : GRADIENT.gameBoard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-14 w-14 items-center justify-center rounded-full"
            >
              {win ? (
                <Heart color="#ffffff" size={24} fill="#ffffff" />
              ) : (
                <Swords color={GAME.muted} size={22} />
              )}
            </LinearGradient>
          </View>
          <Txt weight="bold" style={{ color: GAME.text, fontSize: 26 }}>
            {win ? '對上了！' : '差了一點'}
          </Txt>
          <Txt style={{ color: GAME.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            {win
              ? `你和 ${opponent?.name} 同步 ${agreements} 題，契合度 ${percent}%。已經幫你們開好配對。`
              : `你和 ${opponent?.name} 只同步 ${agreements} 題，契合度 ${percent}%。再開一局換個對手試試。`}
          </Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(360)} className="w-full gap-2">
          <View className="border-game-line bg-game-card flex-row items-center justify-between rounded-2xl border px-4 py-3">
            <Txt style={{ color: GAME.muted, fontSize: 13 }}>心動積分</Txt>
            <Txt weight="bold" style={{ color: GAME.text, fontSize: 15 }}>
              +{reward.score}
            </Txt>
          </View>
          <View className="border-game-line bg-game-card flex-row items-center justify-between rounded-2xl border px-4 py-3">
            <Txt style={{ color: GAME.muted, fontSize: 13 }}>心動代幣</Txt>
            <Txt weight="bold" style={{ color: GAME.gold, fontSize: 15 }}>
              +{reward.coins}
            </Txt>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(360)} className="w-full gap-3">
          {win && opponent ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="開始聊天"
              onPress={() => {
                const conversationId = ensureConversation(opponent.id);
                router.replace(`/chat/${conversationId}`);
              }}
              className="overflow-hidden rounded-full active:opacity-85"
            >
              <LinearGradient
                colors={GRADIENT.game}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-14 flex-row items-center justify-center gap-2"
              >
                <MessageCircle color="#ffffff" size={18} />
                <Txt weight="bold" style={{ color: '#ffffff', fontSize: 15 }}>
                  開始聊天
                </Txt>
              </LinearGradient>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="再開一局"
            onPress={() => router.replace('/game/quick')}
            className="border-game-line bg-game-card flex-row items-center justify-center gap-2 rounded-full border py-3.5 active:opacity-75"
          >
            <RotateCcw color={GAME.text} size={16} />
            <Txt weight="medium" style={{ color: GAME.text, fontSize: 14 }}>
              再開一局（1 體力）
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
        </Animated.View>
      </View>
    </GameScreen>
  );
}

function Player({ name, uri, highlight }: { name: string; uri?: string; highlight: boolean }) {
  return (
    <View className="items-center gap-1.5">
      <View
        className="overflow-hidden rounded-2xl border-2"
        style={{ borderColor: highlight ? GAME.pink : 'rgba(255,255,255,0.12)' }}
      >
        {uri ? (
          <Photo uri={uri} width={54} height={54} radius={14} />
        ) : (
          <View
            className="bg-game-raised items-center justify-center"
            style={{ width: 54, height: 54 }}
          >
            <Txt weight="bold" style={{ color: GAME.text, fontSize: 18 }}>
              你
            </Txt>
          </View>
        )}
      </View>
      <Txt numberOfLines={1} style={{ color: GAME.muted, fontSize: 11, maxWidth: 72 }}>
        {name}
      </Txt>
    </View>
  );
}
