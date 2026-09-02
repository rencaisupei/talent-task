import { useState } from 'react';
import { Camera, Check, ChevronLeft, Minus, Plus, X } from 'lucide-react-native';
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
import { INTEREST_OPTIONS, LOOKING_FOR_OPTIONS } from '@/lib/data/seed';
import { goBackOrReplace } from '@/lib/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { NEON } from '@/lib/theme';
import type { Gender, LookingFor } from '@/lib/types';
import { cn } from '@/lib/utils';

const PHOTO_POOL = [
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/men/45.jpg',
  'https://randomuser.me/api/portraits/men/51.jpg',
  'https://randomuser.me/api/portraits/men/18.jpg',
  'https://randomuser.me/api/portraits/men/64.jpg',
  'https://randomuser.me/api/portraits/men/72.jpg',
];

const PHOTO_SLOTS = ['slot-1', 'slot-2', 'slot-3', 'slot-4', 'slot-5', 'slot-6'];

const GENDERS: { value: Gender; label: string; hint: string }[] = [
  { value: 'female', label: '女性', hint: 'she / her' },
  { value: 'male', label: '男性', hint: 'he / him' },
  { value: 'nonbinary', label: '非二元', hint: 'they / them' },
];

const STEP_TITLES = [
  '你的名字',
  '年齡與身高',
  '你的性別',
  '你在找什麼',
  '選幾個興趣',
  '放上照片',
  '寫一段自我介紹',
];

export default function OnboardingScreen() {
  const [muted] = useThemeColor(['muted']);
  const me = useAuthStore((state) => state.me);
  const finishOnboarding = useAuthStore((state) => state.finishOnboarding);
  const padBottom = useKeyboardSafePad(4);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(me.name === '你' ? '' : me.name);
  const [job, setJob] = useState(me.job);
  const [age, setAge] = useState(me.age);
  const [heightCm, setHeightCm] = useState(me.heightCm);
  const [gender, setGender] = useState<Gender>(me.gender);
  const [lookingFor, setLookingFor] = useState<LookingFor>(me.lookingFor);
  const [interests, setInterests] = useState<string[]>(me.interests);
  const [photos, setPhotos] = useState<string[]>(me.photos);
  const [bio, setBio] = useState(me.bio);

  const canContinue = (() => {
    switch (step) {
      case 0:
        return name.trim().length > 0;
      case 4:
        return interests.length >= 3;
      case 5:
        return photos.length >= 1;
      case 6:
        return bio.trim().length >= 10;
      default:
        return true;
    }
  })();

  const next = () => {
    if (step < STEP_TITLES.length - 1) {
      setStep(step + 1);
      return;
    }
    finishOnboarding({
      name: name.trim(),
      job: job.trim(),
      age,
      heightCm,
      gender,
      lookingFor,
      interests,
      photos,
      bio: bio.trim(),
    });
    router.replace('/(tabs)');
  };

  const toggleInterest = (interest: string) =>
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : current.length >= 8
          ? current
          : [...current, interest],
    );

  const addPhoto = () => {
    const candidate = PHOTO_POOL.find((uri) => !photos.includes(uri));
    if (candidate) setPhotos([...photos, candidate]);
  };

  return (
    <Screen>
      <ScreenHeader
        title={STEP_TITLES[step]}
        subtitle={`第 ${step + 1} / ${STEP_TITLES.length} 步`}
        left={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="上一步"
            hitSlop={8}
            onPress={() => (step > 0 ? setStep(step - 1) : goBackOrReplace('/kyc'))}
            className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
          >
            <ChevronLeft color={NEON.coral} size={22} />
          </Pressable>
        }
      />

      <View className="px-6 pb-4">
        <View className="bg-surface h-1.5 overflow-hidden rounded-full">
          <View
            className="bg-accent h-full rounded-full"
            style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="px-6 pb-8 grow">
          {step === 0 ? (
            <View className="gap-4">
              <Field label="顯示名稱">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="別人會看到的名字"
                  placeholderTextColor={muted}
                  className="text-foreground text-[16px]"
                />
              </Field>
              <Field label="職業">
                <TextInput
                  value={job}
                  onChangeText={setJob}
                  placeholder="例如：產品設計師"
                  placeholderTextColor={muted}
                  className="text-foreground text-[16px]"
                />
              </Field>
              <Txt className="text-muted px-1 text-[12px] leading-5">
                名字之後可以改，但一天只能改一次。
              </Txt>
            </View>
          ) : null}

          {step === 1 ? (
            <View className="gap-4">
              <Stepper label="年齡" value={age} suffix="歲" min={18} max={70} onChange={setAge} />
              <Stepper
                label="身高"
                value={heightCm}
                suffix="cm"
                min={140}
                max={210}
                onChange={setHeightCm}
              />
              <Txt className="text-muted px-1 text-[12px] leading-5">
                年齡會顯示在你的檔案上，身高可以在隱私設定裡隱藏。
              </Txt>
            </View>
          ) : null}

          {step === 2 ? (
            <View className="gap-3">
              {GENDERS.map((option) => (
                <SelectRow
                  key={option.value}
                  label={option.label}
                  hint={option.hint}
                  selected={gender === option.value}
                  onPress={() => setGender(option.value)}
                />
              ))}
            </View>
          ) : null}

          {step === 3 ? (
            <View className="gap-3">
              {LOOKING_FOR_OPTIONS.map((option) => (
                <SelectRow
                  key={option}
                  label={option}
                  selected={lookingFor === option}
                  onPress={() => setLookingFor(option)}
                />
              ))}
            </View>
          ) : null}

          {step === 4 ? (
            <View className="gap-4">
              <Txt className="text-muted text-[12px]">
                已選 {interests.length} / 8，至少選三個讓推薦更準。
              </Txt>
              <View className="flex-row flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = interests.includes(interest);
                  return (
                    <Pressable
                      key={interest}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={interest}
                      onPress={() => toggleInterest(interest)}
                      className={cn(
                        'rounded-full border px-3.5 py-2 active:opacity-70',
                        selected ? 'border-accent bg-accent/15' : 'border-border/70 bg-surface',
                      )}
                    >
                      <Txt
                        className={cn('text-[13px]', selected ? 'text-accent' : 'text-foreground')}
                      >
                        {interest}
                      </Txt>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {step === 5 ? (
            <View className="gap-4">
              <View className="flex-row flex-wrap gap-3">
                {PHOTO_SLOTS.map((slot, index) => {
                  const uri = photos[index];
                  return (
                    <View key={slot} className="w-[30%]">
                      {uri ? (
                        <View className="overflow-hidden rounded-2xl">
                          <Photo uri={uri} width="100%" height={132} radius={16} />
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="移除照片"
                            onPress={() => setPhotos(photos.filter((item) => item !== uri))}
                            className="absolute top-1.5 right-1.5 h-7 w-7 items-center justify-center rounded-full bg-black/60 active:opacity-70"
                          >
                            <X color="#ffffff" size={14} />
                          </Pressable>
                          {index === 0 ? (
                            <View className="bg-accent absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5">
                              <Txt className="text-[10px] text-white">主照片</Txt>
                            </View>
                          ) : null}
                        </View>
                      ) : (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="新增照片"
                          onPress={addPhoto}
                          className="border-border/70 bg-surface h-[132px] items-center justify-center gap-1.5 rounded-2xl border border-dashed active:opacity-70"
                        >
                          <Camera color={muted} size={20} />
                          <Txt className="text-muted text-[11px]">新增</Txt>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
              <Txt className="text-muted px-1 text-[12px] leading-5">
                示範模式會從樣本照片挑選。正式版會改用相機或相簿，並在上傳時做人臉比對。
              </Txt>
            </View>
          ) : null}

          {step === 6 ? (
            <View className="gap-4">
              <View className="bg-surface border-border/60 rounded-2xl border px-4 py-3">
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="說說你平常在做什麼、想找什麼樣的人…"
                  placeholderTextColor={muted}
                  multiline
                  className="text-foreground min-h-32 text-[15px] leading-6"
                  textAlignVertical="top"
                />
              </View>
              <Txt className="text-muted px-1 text-[12px]">
                {bio.trim().length} / 500 字，至少 10 字。
              </Txt>
            </View>
          ) : null}
        </ScrollView>

        <View className={cn('px-6', padBottom)}>
          <GlowButton
            label={step === STEP_TITLES.length - 1 ? '完成，開始配對' : '繼續'}
            size="lg"
            disabled={!canContinue}
            onPress={next}
            icon={step === STEP_TITLES.length - 1 ? <Check color="#ffffff" size={18} /> : undefined}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Txt weight="medium" className="text-muted px-1 text-[12px]">
        {label}
      </Txt>
      <View className="bg-surface border-border/60 rounded-2xl border px-4 py-3.5">{children}</View>
    </View>
  );
}

function SelectRow({
  label,
  hint,
  selected,
  onPress,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        'flex-row items-center justify-between rounded-2xl border px-4 py-4 active:opacity-80',
        selected ? 'border-accent bg-accent/12' : 'border-border/60 bg-surface',
      )}
    >
      <View>
        <Txt weight="medium" className="text-foreground text-[15px]">
          {label}
        </Txt>
        {hint ? <Txt className="text-muted mt-0.5 text-[11px]">{hint}</Txt> : null}
      </View>
      <View
        className={cn(
          'h-6 w-6 items-center justify-center rounded-full border-2',
          selected ? 'border-accent bg-accent' : 'border-border',
        )}
      >
        {selected ? <Check color="#ffffff" size={14} /> : null}
      </View>
    </Pressable>
  );
}

function Stepper({
  label,
  value,
  suffix,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <View className="bg-surface border-border/60 flex-row items-center justify-between rounded-2xl border px-4 py-3">
      <Txt weight="medium" className="text-foreground text-[15px]">
        {label}
      </Txt>
      <View className="flex-row items-center gap-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`減少${label}`}
          onPress={() => onChange(Math.max(min, value - 1))}
          className="bg-glass border-border/60 h-9 w-9 items-center justify-center rounded-full border active:opacity-70"
        >
          <Minus color={NEON.coral} size={16} />
        </Pressable>
        <Txt weight="semibold" className="text-foreground w-20 text-center text-[17px]">
          {value} {suffix}
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`增加${label}`}
          onPress={() => onChange(Math.min(max, value + 1))}
          className="bg-glass border-border/60 h-9 w-9 items-center justify-center rounded-full border active:opacity-70"
        >
          <Plus color={NEON.coral} size={16} />
        </Pressable>
      </View>
    </View>
  );
}
