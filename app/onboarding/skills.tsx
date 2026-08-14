import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Button, Spinner } from 'heroui-native';
import { ArrowLeft, CircleCheck, CloudUpload, FileImage, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';

import { CategoryAccordion } from '@/components/CategoryAccordion';
import { RegionPicker } from '@/components/RegionPicker';
import { SectionHeading } from '@/components/SectionHeading';
import { COLORS } from '@/lib/colors';
import { goBackOrReplace } from '@/lib/navigation';
import { MAX_TALENT_TAGS, TOTAL_TAG_COUNT } from '@/lib/omniTags';
import { useAdminStore } from '@/lib/stores/admin';
import { useSessionStore } from '@/lib/stores/session';

export default function SkillCertificationScreen() {
  const skills = useSessionStore((state) => state.skills);
  const toggleSkill = useSessionStore((state) => state.toggleSkill);
  const region = useSessionStore((state) => state.region);
  const setRegion = useSessionStore((state) => state.setRegion);
  const displayName = useSessionStore((state) => state.displayName);
  const userId = useSessionStore((state) => state.userId);
  const chooseRole = useSessionStore((state) => state.chooseRole);
  const credentialUri = useSessionStore((state) => state.credentialUri);
  const setCredentialUri = useSessionStore((state) => state.setCredentialUri);
  const uploadState = useSessionStore((state) => state.credentialUploadState);
  const setUploadState = useSessionStore((state) => state.setCredentialUploadState);
  const setVerification = useSessionStore((state) => state.setVerification);
  const submitVerification = useAdminStore((state) => state.submitVerification);

  const [limitHint, setLimitHint] = useState(false);
  const uploadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (uploadTimer.current) clearTimeout(uploadTimer.current);
    };
  }, []);

  const handleToggle = useCallback(
    (tag: string) => {
      const result = toggleSkill(tag);
      setLimitHint(result === 'limit');
    },
    [toggleSkill],
  );

  /** 非阻塞式上傳：選檔後於背景送出，使用者可繼續選標籤或直接送審。 */
  const pickCredential = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('需要相簿權限', '請於系統設定開啟相簿權限後再上傳證照。');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    setCredentialUri(result.assets[0].uri);
    setUploadState('uploading');
    if (uploadTimer.current) clearTimeout(uploadTimer.current);
    uploadTimer.current = setTimeout(() => setUploadState('done'), 2200);
  };

  const removeCredential = () => {
    if (uploadTimer.current) clearTimeout(uploadTimer.current);
    setCredentialUri(null);
    setUploadState('idle');
  };

  const handleSubmit = () => {
    chooseRole('talent');
    setVerification('pending');
    submitVerification({
      id: `ver_${Date.now()}`,
      talentId: userId,
      talentName: displayName,
      region,
      tags: skills,
      credentialUri: credentialUri ?? undefined,
      submittedAt: Date.now(),
      status: 'pending',
      note: credentialUri ? '使用者自行上傳證照影像，待人工比對' : '尚未附上證照，需補件',
    });
    router.replace('/(tabs)');
  };

  return (
    <View className="bg-background flex-1">
      <View className="border-hairline pt-safe-offset-3 border-b bg-white px-5 pb-4">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => goBackOrReplace('/onboarding/role')}
            accessibilityRole="button"
            accessibilityLabel="返回"
            className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
          >
            <ArrowLeft size={18} color={COLORS.ink} strokeWidth={2.2} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-ink text-[17px] font-semibold">技能認證</Text>
            <Text className="text-muted text-[12px]">人才模式・共 {TOTAL_TAG_COUNT} 個標籤</Text>
          </View>
          <View className="bg-brand-soft rounded-xl px-3 py-1.5">
            <Text className="text-brand-strong text-[13px] font-bold">
              {skills.length} / {MAX_TALENT_TAGS}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerClassName="px-5 py-5 gap-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeading
          title="選擇你的專業標籤"
          caption={`從 30 大類別矩陣中最多選擇 ${MAX_TALENT_TAGS} 項，任務牆會依標籤即時推播。`}
        />

        {skills.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {skills.map((skill) => (
              <Pressable
                key={skill}
                onPress={() => handleToggle(skill)}
                accessibilityRole="button"
                accessibilityLabel={`移除 ${skill}`}
                className="bg-brand flex-row items-center gap-1.5 rounded-xl px-3 py-2"
              >
                <Text className="text-[13px] font-semibold text-white">{skill}</Text>
                <X size={13} color={COLORS.white} strokeWidth={2.6} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {limitHint ? (
          <View className="border-coral/25 bg-coral-soft rounded-xl border px-4 py-3">
            <Text className="text-coral text-[13px] font-medium">
              已達 {MAX_TALENT_TAGS} 項上限，請先移除一項標籤再新增。
            </Text>
          </View>
        ) : null}

        <RegionPicker label="主要服務地區" value={region} onChange={setRegion} />

        <View className="border-hairline rounded-xl border bg-white p-4">
          <SectionHeading title="證照 / 實績上傳" caption="背景上傳，不影響你繼續操作。" />

          {credentialUri ? (
            <View className="border-hairline bg-canvas mt-3 flex-row items-center gap-3 rounded-xl border p-3">
              <Image
                source={{ uri: credentialUri }}
                style={{ width: 56, height: 56, borderRadius: 10 }}
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text className="text-ink text-[14px] font-semibold">證照影像</Text>
                <View className="mt-1 flex-row items-center gap-1.5">
                  {uploadState === 'uploading' ? (
                    <>
                      <Spinner size="sm" />
                      <Text className="text-coral text-[12px]">背景上傳中，可繼續選擇標籤</Text>
                    </>
                  ) : (
                    <>
                      <CircleCheck size={14} color={COLORS.brand} strokeWidth={2.2} />
                      <Text className="text-brand-strong text-[12px]">已上傳，待人工比對</Text>
                    </>
                  )}
                </View>
              </View>
              <Pressable
                onPress={removeCredential}
                accessibilityRole="button"
                accessibilityLabel="移除證照"
                className="h-8 w-8 items-center justify-center rounded-lg bg-white"
              >
                <X size={15} color={COLORS.muted} strokeWidth={2.4} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={pickCredential}
              accessibilityRole="button"
              className="border-hairline bg-canvas mt-3 items-center gap-2 rounded-xl border border-dashed px-4 py-6"
            >
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-white">
                <CloudUpload size={20} color={COLORS.brandStrong} strokeWidth={2} />
              </View>
              <Text className="text-ink text-[14px] font-semibold">選擇證照或作品影像</Text>
              <Text className="text-muted text-[12px]">支援相簿影像，審核後不對外公開</Text>
            </Pressable>
          )}

          <View className="mt-3 flex-row items-center gap-1.5">
            <FileImage size={14} color={COLORS.muted} strokeWidth={2} />
            <Text className="text-muted text-[12px]">未附證照仍可送審，審核人員會要求補件</Text>
          </View>
        </View>

        <SectionHeading title="30 大類別技能矩陣" caption="點擊任一類別展開子標籤。" />

        <CategoryAccordion
          selectedTags={skills}
          onToggleTag={handleToggle}
          isTagDisabled={() => skills.length >= MAX_TALENT_TAGS}
        />
      </ScrollView>

      <View className="border-hairline pb-safe-or-5 border-t bg-white px-5 pt-4">
        <Button size="lg" isDisabled={skills.length === 0} onPress={handleSubmit}>
          <Button.Label>
            {skills.length === 0 ? '請至少選擇 1 項標籤' : '送出技能認證並進入任務牆'}
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}
