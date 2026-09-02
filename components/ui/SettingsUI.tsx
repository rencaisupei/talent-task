import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Switch } from 'heroui-native';

import { Txt } from '@/components/ui/Txt';
import { cn } from '@/lib/utils';

/** 圖示底色：用品牌霓虹色加上固定透明度，避免每個畫面自己算。 */
function tintBackground(color: string) {
  return `${color}24`;
}

export function IconBadge({ children, tint }: { children: ReactNode; tint: string }) {
  return (
    <View
      className="h-9 w-9 items-center justify-center rounded-2xl"
      style={{ backgroundColor: tintBackground(tint) }}
    >
      {children}
    </View>
  );
}

export function SettingsGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View
      className={cn('bg-surface border-border/60 overflow-hidden rounded-3xl border', className)}
    >
      {children}
    </View>
  );
}

interface SettingsRowProps {
  icon?: ReactNode;
  tint?: string;
  label: string;
  hint?: string;
  value?: string;
  badge?: number;
  onPress: () => void;
  last?: boolean;
}

/** 設定列表的標準列：圖示 + 標題／說明 + 右側狀態。 */
export function SettingsRow({
  icon,
  tint,
  label,
  hint,
  value,
  badge,
  onPress,
  last = false,
}: SettingsRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-3 px-4 py-3 active:opacity-70',
        last ? '' : 'border-border/40 border-b',
      )}
    >
      {icon && tint ? <IconBadge tint={tint}>{icon}</IconBadge> : null}
      <View className="flex-1 gap-0.5">
        <Txt className="text-foreground text-[14px]" numberOfLines={1}>
          {label}
        </Txt>
        {hint ? (
          <Txt className="text-muted text-[11px] leading-4" numberOfLines={2}>
            {hint}
          </Txt>
        ) : null}
      </View>
      {badge && badge > 0 ? (
        <View className="bg-danger min-w-5 items-center rounded-full px-1.5 py-0.5">
          <Txt weight="semibold" className="text-[10px] text-white">
            {badge > 99 ? '99+' : badge}
          </Txt>
        </View>
      ) : null}
      {value ? (
        <Txt className="text-muted max-w-[38%] text-right text-[12px]" numberOfLines={1}>
          {value}
        </Txt>
      ) : null}
      <ChevronRight color="#8C8397" size={16} />
    </Pressable>
  );
}

export function SettingsToggle({
  icon,
  tint,
  label,
  hint,
  value,
  onChange,
  last = false,
}: {
  icon?: ReactNode;
  tint?: string;
  label: string;
  hint?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-3 px-4 py-3',
        last ? '' : 'border-border/40 border-b',
      )}
    >
      {icon && tint ? <IconBadge tint={tint}>{icon}</IconBadge> : null}
      <View className="flex-1 gap-0.5">
        <Txt className="text-foreground text-[14px]">{label}</Txt>
        {hint ? <Txt className="text-muted text-[11px] leading-4">{hint}</Txt> : null}
      </View>
      <Switch isSelected={value} onSelectedChange={onChange} />
    </View>
  );
}

/** 單選晶片組，用在頻率、嚴格度這種少量選項。 */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <View className={cn('flex-row flex-wrap gap-2', className)}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.key)}
            className={cn(
              'rounded-full border px-3.5 py-2 active:opacity-70',
              active ? 'bg-accent border-accent' : 'bg-glass border-border/60',
            )}
          >
            <Txt
              weight={active ? 'semibold' : 'regular'}
              className={cn('text-[12px]', active ? 'text-accent-foreground' : 'text-muted')}
            >
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

type ChipTone = 'neutral' | 'primary' | 'danger' | 'success';

const CHIP_TONE: Record<ChipTone, string> = {
  neutral: 'bg-glass border-border/60',
  primary: 'bg-accent-soft border-accent/50',
  danger: 'bg-danger/15 border-danger/45',
  success: 'bg-success/15 border-success/45',
};

const CHIP_TEXT: Record<ChipTone, string> = {
  neutral: 'text-foreground',
  primary: 'text-accent',
  danger: 'text-danger',
  success: 'text-success',
};

/** 卡片內的小型操作按鈕。 */
export function ChipButton({
  label,
  onPress,
  tone = 'neutral',
  icon,
  disabled = false,
  className,
}: {
  label: string;
  onPress: () => void;
  tone?: ChipTone;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'flex-row items-center justify-center gap-1.5 rounded-full border px-3.5 py-2 active:opacity-70',
        CHIP_TONE[tone],
        disabled && 'opacity-40',
        className,
      )}
    >
      {icon}
      <Txt weight="medium" className={cn('text-[12px]', CHIP_TEXT[tone])}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** 設定卡片裡的一組欄位標題 + 說明。 */
export function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-2">
      <Txt weight="medium" className="text-foreground text-[13px]">
        {label}
      </Txt>
      {hint ? <Txt className="text-muted text-[11px] leading-4">{hint}</Txt> : null}
      {children}
    </View>
  );
}

export function StatTrio({ items }: { items: { label: string; value: string; tint?: string }[] }) {
  return (
    <View className="flex-row gap-2">
      {items.map((item) => (
        <View
          key={item.label}
          className="bg-glass border-border/50 flex-1 gap-1 rounded-2xl border px-3 py-2.5"
        >
          <Txt className="text-muted text-[10px]" numberOfLines={1}>
            {item.label}
          </Txt>
          <Txt
            weight="bold"
            className="text-foreground text-[16px]"
            style={item.tint ? { color: item.tint } : undefined}
            numberOfLines={1}
          >
            {item.value}
          </Txt>
        </View>
      ))}
    </View>
  );
}
