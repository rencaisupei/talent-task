import { useState } from 'react';
import { Camera, Star, X } from 'lucide-react-native';
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
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { useKeyboardSafePad } from '@/hooks/useKeyboardInset';
import { INTEREST_OPTIONS, LOOKING_FOR_OPTIONS, ZODIAC_OPTIONS } from '@/lib/data/seed';
import { useAuthStore } from '@/lib/stores/auth';
import type { LookingFor, ProfilePrompt } from '@/lib/types';
import { cn } from '@/lib/utils';

const LANGUAGE_OPTIONS = ['中文', '台語', '英文', '日文', '韓文', '法文', '西班牙文'];

function toggleValue(list: string[], value: string, max: number) {
  if (list.includes(value)) return list.filter((item) => item !== value);
  if (list.length >= max) return list;
  return [...list, value];
}

export default function EditProfileScreen() {
  const [muted] = useThemeColor(['muted']);
  const me = useAuthStore((state) => state.me);
  const updateMe = useAuthStore((state) => state.updateMe);
  const padBottom = useKeyboardSafePad(4);

  const [name, setName] = useState(me.name);
  const [job, setJob] = useState(me.job);
  const [school, setSchool] = useState(me.school ?? '');
  const [district, setDistrict] = useState(me.district);
  const [bio, setBio] = useState(me.bio);
  const [heightCm, setHeightCm] = useState(String(me.heightCm));
  const [zodiac, setZodiac] = useState(me.zodiac);
  const [lookingFor, setLookingFor] = useState<LookingFor>(me.lookingFor);
  const [interests, setInterests] = useState<string[]>(me.interests);
  const [languages, setLanguages] = useState<string[]>(me.languages);
  const [photos, setPhotos] = useState<string[]>(me.photos);
  const [prompts, setPrompts] = useState<ProfilePrompt[]>(me.prompts);

  const save = () => {
    updateMe({
      name: name.trim() || me.name,
      job: job.trim(),
      school: school.trim() || undefined,
      district: district.trim(),
      bio: bio.trim(),
      heightCm: Number(heightCm) || me.heightCm,
      zodiac,
      lookingFor,
      interests,
      languages,
      photos,
      prompts,
    });
    router.back();
  };

  return (
    <Screen>
      <ScreenHeader back fallback="/(tabs)/me" title="編輯檔案" subtitle="改完記得儲存" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="gap-7 px-4 pb-8">
          <Section title="照片" subtitle="第一張是主照片，長按其他張可以設為主照片">
            <View className="flex-row flex-wrap gap-3">
              {photos.map((uri, index) => (
                <View key={uri} className="w-[30%]">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={index === 0 ? '主照片' : '設為主照片'}
                    onPress={() => {
                      if (index === 0) return;
                      const next = [...photos];
                      const [picked] = next.splice(index, 1);
                      if (picked) setPhotos([picked, ...next]);
                    }}
                    className="overflow-hidden rounded-2xl active:opacity-80"
                  >
                    <Photo uri={uri} width="100%" height={132} radius={16} />
                    {index === 0 ? (
                      <View className="bg-accent absolute bottom-1.5 left-1.5 flex-row items-center gap-1 rounded-full px-2 py-0.5">
                        <Star color="#ffffff" size={9} fill="#ffffff" />
                        <Txt className="text-[9px] text-white">主照片</Txt>
                      </View>
                    ) : null}
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="移除照片"
                    onPress={() => setPhotos(photos.filter((item) => item !== uri))}
                    className="absolute top-1.5 right-1.5 h-7 w-7 items-center justify-center rounded-full bg-black/60 active:opacity-70"
                  >
                    <X color="#ffffff" size={13} />
                  </Pressable>
                </View>
              ))}
              {photos.length < 6 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="新增照片"
                  onPress={() =>
                    setPhotos([...photos, `https://picsum.photos/seed/me-${Date.now()}/700/900`])
                  }
                  className="border-border/70 bg-surface h-[132px] w-[30%] items-center justify-center gap-1.5 rounded-2xl border border-dashed active:opacity-70"
                >
                  <Camera color={muted} size={20} />
                  <Txt className="text-muted text-[11px]">新增</Txt>
                </Pressable>
              ) : null}
            </View>
          </Section>

          <Section title="基本資料">
            <View className="gap-3">
              <Field label="顯示名稱">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor={muted}
                  className="text-foreground text-[15px]"
                />
              </Field>
              <Field label="職業">
                <TextInput
                  value={job}
                  onChangeText={setJob}
                  placeholderTextColor={muted}
                  className="text-foreground text-[15px]"
                />
              </Field>
              <Field label="學校（選填）">
                <TextInput
                  value={school}
                  onChangeText={setSchool}
                  placeholder="沒有可以留空"
                  placeholderTextColor={muted}
                  className="text-foreground text-[15px]"
                />
              </Field>
              <Field label="居住區域">
                <TextInput
                  value={district}
                  onChangeText={setDistrict}
                  placeholderTextColor={muted}
                  className="text-foreground text-[15px]"
                />
              </Field>
              <Field label="身高（cm）">
                <TextInput
                  value={heightCm}
                  onChangeText={setHeightCm}
                  keyboardType="number-pad"
                  placeholderTextColor={muted}
                  className="text-foreground text-[15px]"
                />
              </Field>
            </View>
          </Section>

          <Section title="自我介紹">
            <View className="bg-surface border-border/60 rounded-3xl border px-4 py-3">
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                textAlignVertical="top"
                placeholder="說說你平常在做什麼"
                placeholderTextColor={muted}
                className="text-foreground min-h-28 text-[15px] leading-6"
              />
              <Txt className="text-muted mt-2 text-right text-[11px]">{bio.length} / 500</Txt>
            </View>
          </Section>

          <Section title="關係目標">
            <View className="flex-row flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={lookingFor === option}
                  onPress={() => setLookingFor(option)}
                />
              ))}
            </View>
          </Section>

          <Section title="星座">
            <View className="flex-row flex-wrap gap-2">
              {ZODIAC_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={zodiac === option}
                  onPress={() => setZodiac(option)}
                />
              ))}
            </View>
          </Section>

          <Section title={`興趣 · ${interests.length} / 8`}>
            <View className="flex-row flex-wrap gap-2">
              {INTEREST_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={interests.includes(option)}
                  onPress={() => setInterests(toggleValue(interests, option, 8))}
                />
              ))}
            </View>
          </Section>

          <Section title={`語言 · ${languages.length} / 4`}>
            <View className="flex-row flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={languages.includes(option)}
                  onPress={() => setLanguages(toggleValue(languages, option, 4))}
                />
              ))}
            </View>
          </Section>

          <Section title="快問快答" subtitle="這幾題最容易被拿來當開場話題">
            <View className="gap-3">
              {prompts.map((prompt, index) => (
                <View
                  key={prompt.question}
                  className="bg-surface border-border/60 gap-2 rounded-3xl border p-4"
                >
                  <Txt className="text-muted text-[12px]">{prompt.question}</Txt>
                  <TextInput
                    value={prompt.answer}
                    onChangeText={(value) =>
                      setPrompts(
                        prompts.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, answer: value } : item,
                        ),
                      )
                    }
                    multiline
                    placeholder="寫下你的答案"
                    placeholderTextColor={muted}
                    className="text-foreground text-[15px] leading-6"
                  />
                </View>
              ))}
            </View>
          </Section>
        </ScrollView>

        <View className={cn('px-4', padBottom)}>
          <GlowButton label="儲存變更" size="lg" onPress={save} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="bg-surface border-border/60 gap-1 rounded-2xl border px-4 py-3">
      <Txt className="text-muted text-[11px]">{label}</Txt>
      {children}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        'rounded-full border px-3.5 py-2 active:opacity-70',
        selected ? 'border-accent bg-accent/15' : 'border-border/70 bg-surface',
      )}
    >
      <Txt className={cn('text-[13px]', selected ? 'text-accent' : 'text-foreground')}>{label}</Txt>
    </Pressable>
  );
}
