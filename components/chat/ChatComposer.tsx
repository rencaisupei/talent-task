import { useEffect, useState } from 'react';
import { ImagePlus, Mic, Send, Sparkles, Square } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';
import { useThemeColor } from 'heroui-native';

import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { useKeyboardSafePad } from '@/hooks/useKeyboardInset';
import { GRADIENT, NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface ChatComposerProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onPickImage: () => void;
  onSendVoice: (durationSec: number) => void;
  onOpenGifts: () => void;
  onOpenIcebreakers: () => void;
}

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  onPickImage,
  onSendVoice,
  onOpenGifts,
  onOpenIcebreakers,
}: ChatComposerProps) {
  const [muted] = useThemeColor(['muted']);
  const padBottom = useKeyboardSafePad(3);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!recording) return undefined;
    const timer = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  const stopRecording = () => {
    setRecording(false);
    onSendVoice(Math.max(1, seconds));
    setSeconds(0);
  };

  if (recording) {
    return (
      <View className={cn('border-border/60 bg-background border-t px-4 pt-3', padBottom)}>
        <View className="border-accent/50 bg-accent/10 flex-row items-center gap-3 rounded-full border px-4 py-3">
          <View className="bg-accent h-2.5 w-2.5 rounded-full" />
          <Txt className="text-foreground flex-1 text-sm">錄音中 {seconds} 秒</Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="取消錄音"
            onPress={() => {
              setRecording(false);
              setSeconds(0);
            }}
            className="px-2 active:opacity-70"
          >
            <Txt className="text-muted text-sm">取消</Txt>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="傳送語音"
            onPress={stopRecording}
            className="bg-accent h-9 w-9 items-center justify-center rounded-full active:opacity-80"
          >
            <Square color="#ffffff" size={14} fill="#ffffff" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className={cn('border-border/60 bg-background border-t px-3 pt-3', padBottom)}>
      <View className="flex-row items-end gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="破冰話題"
          onPress={onOpenIcebreakers}
          className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
        >
          <Sparkles color={NEON.amber} size={18} />
        </Pressable>

        <View className="bg-surface border-border/60 min-h-10 flex-1 flex-row items-center gap-2 rounded-3xl border px-3 py-1.5">
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="說點什麼…"
            placeholderTextColor={muted}
            multiline
            className="text-foreground max-h-24 flex-1 text-[15px]"
            onSubmitEditing={onSend}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="傳送照片"
            onPress={onPickImage}
            hitSlop={6}
            className="active:opacity-70"
          >
            <ImagePlus color={muted} size={20} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="送禮物"
            onPress={onOpenGifts}
            hitSlop={6}
            className="active:opacity-70"
          >
            <Sparkles color={NEON.rose} size={20} />
          </Pressable>
        </View>

        {value.trim().length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="傳送訊息"
            onPress={onSend}
            className="overflow-hidden rounded-full active:opacity-80"
          >
            <LinearGradient
              colors={GRADIENT.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-10 w-10 items-center justify-center"
            >
              <Send color="#ffffff" size={18} />
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="錄語音訊息"
            onPress={() => setRecording(true)}
            className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
          >
            <Mic color={NEON.coral} size={18} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
