import { useState } from 'react';
import { Camera, MapPin, X } from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useThemeColor } from 'heroui-native';

import { GlowButton } from '@/components/ui/GlowButton';
import { Photo } from '@/components/ui/Photo';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Txt } from '@/components/ui/Txt';
import { useKeyboardSafePad } from '@/hooks/useKeyboardInset';
import { INTEREST_OPTIONS } from '@/lib/data/seed';
import { useMomentsStore } from '@/lib/stores/moments';
import { cn } from '@/lib/utils';

export default function NewMomentScreen() {
  const [muted] = useThemeColor(['muted']);
  const createMoment = useMomentsStore((state) => state.createMoment);
  const padBottom = useKeyboardSafePad(4);
  const [text, setText] = useState('');
  const [place, setPlace] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const addImage = () =>
    setImages((current) =>
      current.length >= 4
        ? current
        : [...current, `https://picsum.photos/seed/moment-${Date.now()}-${current.length}/900/900`],
    );

  const toggleTag = (tag: string) =>
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : current.length >= 3
          ? current
          : [...current, tag],
    );

  const publish = () => {
    createMoment({ text: text.trim(), images, place: place.trim() || undefined, tags });
    router.replace('/(tabs)/moments');
  };

  return (
    <Screen>
      <ScreenHeader
        back
        fallback="/(tabs)/moments"
        title="發佈動態"
        subtitle="配對常常從一則動態開始"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="gap-5 px-4 pb-8">
          <View className="bg-surface border-border/60 rounded-3xl border px-4 py-3">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="今天發生了什麼？"
              placeholderTextColor={muted}
              multiline
              autoFocus
              textAlignVertical="top"
              className="text-foreground min-h-28 text-[15px] leading-6"
            />
            <Txt className="text-muted mt-2 text-right text-[11px]">{text.length} / 300</Txt>
          </View>

          <View className="gap-2">
            <Txt weight="medium" className="text-muted px-1 text-[12px]">
              照片（最多 4 張）
            </Txt>
            <View className="flex-row flex-wrap gap-3">
              {images.map((image) => (
                <View key={image} className="w-[22%] overflow-hidden rounded-2xl">
                  <Photo uri={image} width="100%" height={78} radius={14} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="移除照片"
                    onPress={() => setImages(images.filter((item) => item !== image))}
                    className="absolute top-1 right-1 h-6 w-6 items-center justify-center rounded-full bg-black/60 active:opacity-70"
                  >
                    <X color="#ffffff" size={12} />
                  </Pressable>
                </View>
              ))}
              {images.length < 4 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="新增照片"
                  onPress={addImage}
                  className="border-border/70 bg-surface h-[78px] w-[22%] items-center justify-center rounded-2xl border border-dashed active:opacity-70"
                >
                  <Camera color={muted} size={18} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <View className="gap-2">
            <Txt weight="medium" className="text-muted px-1 text-[12px]">
              地點
            </Txt>
            <View className="bg-surface border-border/60 flex-row items-center gap-2 rounded-2xl border px-4 py-3.5">
              <MapPin color={muted} size={16} />
              <TextInput
                value={place}
                onChangeText={setPlace}
                placeholder="例如：大安區"
                placeholderTextColor={muted}
                className="text-foreground flex-1 text-[15px]"
              />
            </View>
          </View>

          <View className="gap-2">
            <Txt weight="medium" className="text-muted px-1 text-[12px]">
              標籤（最多 3 個，選了更容易被同好看到）
            </Txt>
            <View className="flex-row flex-wrap gap-2">
              {INTEREST_OPTIONS.slice(0, 18).map((tag) => {
                const selected = tags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={tag}
                    onPress={() => toggleTag(tag)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 active:opacity-70',
                      selected ? 'border-accent bg-accent/15' : 'border-border/70 bg-surface',
                    )}
                  >
                    <Txt
                      className={cn('text-[12px]', selected ? 'text-accent' : 'text-foreground')}
                    >
                      #{tag}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View className={cn('px-4', padBottom)}>
          <GlowButton
            label="發佈"
            size="lg"
            disabled={text.trim().length === 0}
            onPress={publish}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
