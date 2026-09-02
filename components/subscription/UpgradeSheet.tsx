import { Crown, Sparkles, X } from 'lucide-react-native';
import { Modal, Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { GlowButton } from '@/components/ui/GlowButton';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { GRADIENT, NEON } from '@/lib/theme';

interface UpgradeSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel?: string;
}

export function UpgradeSheet({
  visible,
  onClose,
  title,
  description,
  bullets,
  ctaLabel = '查看方案',
}: UpgradeSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="關閉"
        onPress={onClose}
        className="flex-1 justify-end bg-black/70"
      >
        <Pressable
          accessibilityRole="none"
          onPress={() => undefined}
          className="bg-surface border-border/60 pb-safe-offset-6 gap-5 rounded-t-[32px] border-t px-6 pt-6"
        >
          <View className="flex-row items-start justify-between">
            <LinearGradient
              colors={GRADIENT.vip}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-12 w-12 items-center justify-center rounded-2xl"
            >
              <Crown color="#ffffff" size={24} />
            </LinearGradient>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="關閉"
              hitSlop={8}
              onPress={onClose}
              className="bg-glass border-border/60 h-9 w-9 items-center justify-center rounded-full border active:opacity-70"
            >
              <X color="#ffffff" size={16} />
            </Pressable>
          </View>

          <View className="gap-2">
            <Txt weight="bold" className="text-foreground text-xl">
              {title}
            </Txt>
            <Txt className="text-muted text-[13px] leading-5">{description}</Txt>
          </View>

          <View className="gap-2.5">
            {bullets.map((bullet) => (
              <View key={bullet} className="flex-row items-center gap-2.5">
                <Sparkles color={NEON.amber} size={15} />
                <Txt className="text-foreground flex-1 text-[13px]">{bullet}</Txt>
              </View>
            ))}
          </View>

          <GlowButton
            label={ctaLabel}
            size="lg"
            colors={GRADIENT.vip}
            onPress={() => {
              onClose();
              router.push('/subscribe');
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="稍後再說"
            onPress={onClose}
            className="items-center py-1 active:opacity-70"
          >
            <Txt className="text-muted text-[13px]">稍後再說</Txt>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
