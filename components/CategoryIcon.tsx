import {
  Blocks,
  Bot,
  Car,
  Cctv,
  ChefHat,
  ClipboardList,
  Code,
  Database,
  Drill,
  Dumbbell,
  Factory,
  Fan,
  GraduationCap,
  Hammer,
  HeartHandshake,
  Languages,
  Laptop,
  Megaphone,
  Mic,
  Moon,
  Music,
  Palette,
  PartyPopper,
  PawPrint,
  Plane,
  Printer,
  Scale,
  Scissors,
  ShoppingBag,
  Sparkles,
  Sprout,
  Stethoscope,
  Truck,
  Users,
  Video,
  Wrench,
} from 'lucide-react-native';
import type { ComponentType } from 'react';

import { COLORS } from '@/lib/colors';

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const CATEGORY_ICONS: Record<string, IconComponent> = {
  CAT_01: Wrench,
  CAT_02: Hammer,
  CAT_03: Cctv,
  CAT_04: Fan,
  CAT_05: Code,
  CAT_06: Database,
  CAT_07: Bot,
  CAT_08: Blocks,
  CAT_09: Palette,
  CAT_10: Video,
  CAT_11: Megaphone,
  CAT_12: Plane,
  CAT_13: Languages,
  CAT_14: ClipboardList,
  CAT_15: Scale,
  CAT_16: Users,
  CAT_17: Sparkles,
  CAT_18: Drill,
  CAT_19: HeartHandshake,
  CAT_20: PawPrint,
  CAT_21: Truck,
  CAT_22: ShoppingBag,
  CAT_23: Dumbbell,
  CAT_24: GraduationCap,
  CAT_25: Scissors,
  CAT_26: PartyPopper,
  CAT_27: Moon,
  CAT_28: Music,
  CAT_29: ChefHat,
  CAT_30: Mic,
  CAT_31: Laptop,
  CAT_32: Printer,
  CAT_33: Car,
  CAT_34: Stethoscope,
  CAT_35: Sprout,
  CAT_36: Factory,
};

interface CategoryIconProps {
  categoryId: string;
  size?: number;
  color?: string;
}

export function CategoryIcon({ categoryId, size = 18, color = COLORS.brand }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[categoryId] ?? Sparkles;
  return <Icon size={size} color={color} strokeWidth={1.9} />;
}
