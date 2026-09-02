import type { ReactNode } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Switch, useThemeColor } from 'heroui-native';

import { Txt } from '@/components/ui/Txt';
import { cn } from '@/lib/utils';

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const PILL_TONE: Record<Tone, string> = {
  neutral: 'bg-glass border-border/60',
  primary: 'bg-accent-soft border-accent/40',
  success: 'bg-success/15 border-success/40',
  warning: 'bg-warning/15 border-warning/40',
  danger: 'bg-danger/15 border-danger/40',
  info: 'bg-neon-cyan/15 border-neon-cyan/40',
};

const PILL_TEXT: Record<Tone, string> = {
  neutral: 'text-muted',
  primary: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-neon-cyan',
};

export function StatusPill({
  label,
  tone = 'neutral',
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <View className={cn('rounded-full border px-2.5 py-1', PILL_TONE[tone], className)}>
      <Txt weight="medium" className={cn('text-[10px]', PILL_TEXT[tone])}>
        {label}
      </Txt>
    </View>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  onPress,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  onPress?: () => void;
  className?: string;
}) {
  const body = (
    <View className="bg-surface border-border/60 flex-1 gap-1 rounded-2xl border p-3">
      <View className="flex-row items-center gap-2">
        {icon}
        <Txt className="text-muted flex-1 text-[11px]" numberOfLines={1}>
          {label}
        </Txt>
      </View>
      <Txt weight="bold" className="text-foreground text-[19px]">
        {value}
      </Txt>
      {hint ? (
        <Txt className="text-muted text-[10px]" numberOfLines={1}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );

  if (!onPress) return <View className={cn('flex-1', className)}>{body}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={cn('flex-1 active:opacity-80', className)}
    >
      {body}
    </Pressable>
  );
}

export function AdminGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View
      className={cn('bg-surface border-border/60 overflow-hidden rounded-3xl border', className)}
    >
      {children}
    </View>
  );
}

export function DataRow({
  title,
  subtitle,
  left,
  right,
  onPress,
  last = false,
}: {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const content = (
    <View
      className={cn(
        'flex-row items-center gap-3 px-4 py-3',
        last ? '' : 'border-border/40 border-b',
      )}
    >
      {left}
      <View className="flex-1 gap-0.5">
        <Txt weight="medium" className="text-foreground text-[14px]" numberOfLines={1}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt className="text-muted text-[11px] leading-4" numberOfLines={2}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
      {onPress ? <ChevronRight color="#8C8397" size={16} /> : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      className="active:opacity-70"
    >
      {content}
    </Pressable>
  );
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { key: T; label: string; count?: number }[];
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
            accessibilityRole="button"
            accessibilityLabel={option.label}
            onPress={() => onChange(option.key)}
            className={cn(
              'rounded-full border px-3 py-1.5 active:opacity-70',
              active ? 'bg-accent border-accent' : 'bg-glass border-border/60',
            )}
          >
            <Txt
              weight={active ? 'semibold' : 'regular'}
              className={cn('text-[12px]', active ? 'text-accent-foreground' : 'text-muted')}
            >
              {option.label}
              {option.count === undefined ? '' : ` ${option.count}`}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onChange,
  last = false,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-3 px-4 py-3.5',
        last ? '' : 'border-border/40 border-b',
      )}
    >
      <View className="flex-1">
        <Txt className="text-foreground text-[14px]">{label}</Txt>
        {hint ? <Txt className="text-muted mt-0.5 text-[11px] leading-4">{hint}</Txt> : null}
      </View>
      <Switch isSelected={value} onSelectedChange={onChange} />
    </View>
  );
}

const ACTION_TONE: Record<Tone, string> = {
  neutral: 'bg-glass border-border/60',
  primary: 'bg-accent border-accent',
  success: 'bg-success/20 border-success/50',
  warning: 'bg-warning/20 border-warning/50',
  danger: 'bg-danger/20 border-danger/50',
  info: 'bg-neon-cyan/20 border-neon-cyan/50',
};

const ACTION_TEXT: Record<Tone, string> = {
  neutral: 'text-foreground',
  primary: 'text-accent-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-neon-cyan',
};

export function ActionButton({
  label,
  onPress,
  tone = 'neutral',
  disabled = false,
  icon,
  className,
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  icon?: ReactNode;
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
        ACTION_TONE[tone],
        disabled && 'opacity-40',
        className,
      )}
    >
      {icon}
      <Txt weight="medium" className={cn('text-[12px]', ACTION_TEXT[tone])}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function AdminField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <Txt className="text-muted text-[11px]">{label}</Txt>
      <View className="bg-surface-secondary border-border/60 rounded-2xl border px-3.5 py-2.5">
        {children}
      </View>
      {hint ? <Txt className="text-muted text-[10px]">{hint}</Txt> : null}
    </View>
  );
}

export function AdminInput({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  secureTextEntry = false,
  onSubmitEditing,
}: {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
  secureTextEntry?: boolean;
  onSubmitEditing?: () => void;
}) {
  const [muted] = useThemeColor(['muted']);

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={muted}
      multiline={multiline}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      onSubmitEditing={onSubmitEditing}
      className={cn('text-foreground text-[14px]', multiline && 'min-h-20')}
      style={multiline ? { textAlignVertical: 'top' } : undefined}
    />
  );
}

/** 極簡柱狀圖，用來顯示近幾日的趨勢。 */
export function MiniBars({
  data,
  className,
}: {
  data: { label: string; value: number }[];
  className?: string;
}) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <View className={cn('flex-row items-end gap-2', className)}>
      {data.map((item) => (
        <View key={item.label} className="flex-1 items-center gap-1.5">
          <View className="bg-background h-24 w-full justify-end overflow-hidden rounded-lg">
            <View
              className="bg-accent w-full rounded-lg"
              style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }}
            />
          </View>
          <Txt className="text-muted text-[9px]">{item.label}</Txt>
        </View>
      ))}
    </View>
  );
}
