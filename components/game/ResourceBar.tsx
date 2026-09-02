import { Coins, Plus, Zap } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Photo } from '@/components/ui/Photo';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { useAuthStore } from '@/lib/stores/auth';
import { formatEta, useGameStore, usePlayerTitle, useStaminaTimer } from '@/lib/stores/game';
import { STAMINA_MAX } from '@/lib/data/games';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { GAME, GRADIENT } from '@/lib/theme';

interface ResourceBarProps {
  onOpenProfile: () => void;
  onTopUp: () => void;
}

/** 遊戲城頂部資產列：大頭貼與名字、心動代幣、體力、金色儲值按鈕。 */
export function ResourceBar({ onOpenProfile, onTopUp }: ResourceBarProps) {
  const me = useAuthStore((state) => state.me);
  const coins = useSubscriptionStore((state) => state.coins);
  const stamina = useGameStore((state) => state.stamina);
  const title = usePlayerTitle();
  const eta = useStaminaTimer();

  return (
    <View className="pt-safe-offset-2 flex-row items-center gap-2 px-4 pb-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="查看我的檔案"
        onPress={onOpenProfile}
        className="flex-row items-center gap-2 active:opacity-70"
      >
        <View className="border-game-line overflow-hidden rounded-2xl border">
          <Photo uri={me.photos[0] ?? ''} width={42} height={42} radius={14} />
        </View>
        <View style={{ maxWidth: 88 }}>
          <Txt weight="semibold" numberOfLines={1} style={{ color: GAME.text, fontSize: 14 }}>
            {me.name}
          </Txt>
          <Txt numberOfLines={1} style={{ color: GAME.muted, fontSize: 10 }}>
            {title}
          </Txt>
        </View>
      </Pressable>

      <View className="flex-1" />

      <Capsule
        icon={<Coins color={GAME.pink} size={13} />}
        value={String(coins)}
        caption="代幣"
        accessibilityLabel={`心動代幣 ${coins}`}
      />
      <Capsule
        icon={<Zap color={GAME.cyan} size={13} />}
        value={`${stamina}/${STAMINA_MAX}`}
        caption={eta === null ? '體力' : formatEta(eta)}
        accessibilityLabel={`體力 ${stamina} / ${STAMINA_MAX}`}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="儲值心動代幣"
        onPress={onTopUp}
        className="overflow-hidden rounded-full active:opacity-80"
      >
        <LinearGradient
          colors={GRADIENT.gameGold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-9 flex-row items-center gap-1 px-2.5"
        >
          <Plus color="#20160A" size={14} />
          <Txt weight="bold" style={{ color: '#20160A', fontSize: 12 }}>
            儲值
          </Txt>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function Capsule({
  icon,
  value,
  caption,
  accessibilityLabel,
}: {
  icon: ReactNode;
  value: string;
  caption: string;
  accessibilityLabel: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      className="border-game-line bg-game-card items-center rounded-2xl border px-2.5 py-1"
    >
      <View className="flex-row items-center gap-1">
        {icon}
        <Txt weight="bold" style={{ color: GAME.text, fontSize: 13 }}>
          {value}
        </Txt>
      </View>
      <Txt numberOfLines={1} style={{ color: GAME.muted, fontSize: 9 }}>
        {caption}
      </Txt>
    </View>
  );
}
