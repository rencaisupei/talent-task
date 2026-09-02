import { Coins, X, Zap } from 'lucide-react-native';
import { Modal, Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { STAMINA_MAX, STAMINA_REFILL_COINS } from '@/lib/data/games';
import { formatEta, useGameStore, useStaminaTimer } from '@/lib/stores/game';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { GAME, GRADIENT } from '@/lib/theme';

interface StaminaSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** 體力不足時的補充面板：用心動代幣補 1 點，或等自然回復。 */
export function StaminaSheet({ visible, onClose }: StaminaSheetProps) {
  const stamina = useGameStore((state) => state.stamina);
  const grantStamina = useGameStore((state) => state.grantStamina);
  const coins = useSubscriptionStore((state) => state.coins);
  const spendCoins = useSubscriptionStore((state) => state.spendCoins);
  const eta = useStaminaTimer();

  const affordable = coins >= STAMINA_REFILL_COINS;

  const refill = () => {
    if (!spendCoins(STAMINA_REFILL_COINS)) return;
    grantStamina(1);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="關閉"
        onPress={onClose}
        className="flex-1 justify-end bg-black/75"
      >
        <Pressable
          accessibilityRole="none"
          onPress={() => undefined}
          className="bg-game-card border-game-line pb-safe-offset-6 gap-5 rounded-t-[32px] border-t px-6 pt-6"
        >
          <View className="flex-row items-start justify-between">
            <LinearGradient
              colors={GRADIENT.game}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-12 w-12 items-center justify-center rounded-2xl"
            >
              <Zap color="#ffffff" size={24} />
            </LinearGradient>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="關閉"
              hitSlop={8}
              onPress={onClose}
              className="border-game-line bg-game-raised h-9 w-9 items-center justify-center rounded-full border active:opacity-70"
            >
              <X color={GAME.text} size={16} />
            </Pressable>
          </View>

          <View className="gap-2">
            <Txt weight="bold" style={{ color: GAME.text, fontSize: 20 }}>
              體力不夠開局
            </Txt>
            <Txt style={{ color: GAME.muted, fontSize: 13, lineHeight: 20 }}>
              目前體力 {stamina}/{STAMINA_MAX}
              {eta === null ? '' : `，下一點約 ${formatEta(eta)} 後回復`}
              。也可以用心動代幣立刻補滿一點。
            </Txt>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`用 ${STAMINA_REFILL_COINS} 心動代幣補 1 點體力`}
            onPress={refill}
            disabled={!affordable}
            className="overflow-hidden rounded-full active:opacity-85"
            style={{ opacity: affordable ? 1 : 0.45 }}
          >
            <LinearGradient
              colors={GRADIENT.gameGold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="flex-row items-center justify-center gap-2 px-6 py-4"
            >
              <Coins color="#20160A" size={17} />
              <Txt weight="bold" style={{ color: '#20160A', fontSize: 15 }}>
                用 {STAMINA_REFILL_COINS} 代幣補 1 點體力
              </Txt>
            </LinearGradient>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="前往加值"
            onPress={() => {
              onClose();
              router.push('/coins');
            }}
            className="items-center py-1 active:opacity-70"
          >
            <Txt style={{ color: GAME.pink, fontSize: 13 }}>
              {affordable ? '想要更多代幣？前往加值' : `代幣不足（目前 ${coins}）· 前往加值`}
            </Txt>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
