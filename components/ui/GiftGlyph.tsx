import { Cake, Coffee, Crown, Flower2, Gem, Music4, Sparkles, Star } from 'lucide-react-native';

import { NEON } from '@/lib/theme';
import type { GiftIcon } from '@/lib/types';

const ICONS = {
  rose: Flower2,
  coffee: Coffee,
  cake: Cake,
  diamond: Gem,
  music: Music4,
  star: Star,
  sparkle: Sparkles,
  crown: Crown,
} as const;

const COLORS: Record<GiftIcon, string> = {
  rose: NEON.pink,
  coffee: NEON.amber,
  cake: NEON.rose,
  diamond: NEON.cyan,
  music: NEON.cyan,
  star: NEON.amber,
  sparkle: NEON.violet,
  crown: NEON.amber,
};

export function GiftGlyph({ icon, size = 24 }: { icon: GiftIcon; size?: number }) {
  const Icon = ICONS[icon];
  return <Icon color={COLORS[icon]} size={size} />;
}
