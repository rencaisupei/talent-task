import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Button, Spinner } from 'heroui-native';
import {
  ArrowLeft,
  BadgeCheck,
  CircleCheck,
  CloudUpload,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { AiReviewCard } from '@/components/AiReviewCard';
import { CategoryAccordion } from '@/components/CategoryAccordion';
import { RegionPicker } from '@/components/RegionPicker';
import { SectionHeading } from '@/components/SectionHeading';
import { runAiReview } from '@/lib/aiReview';
import { COLORS } from '@/lib/colors';
import { goBackOrReplace } from '@/lib/navigation';
import { CATEGORY_COUNT, MAX_TALENT_TAGS, TOTAL_TAG_COUNT } from '@/lib/omniTags';
import { useAdminStore } from '@/lib/stores/admin';
import { useSessionStore } from '@/lib/stores/session';
import type { AiReviewResult } from '@/lib/types';
import { cn } from '@/lib/utils';

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
  const setProfileReview = useSessionStore((state) => state.setProfileReview);
  const setCredentialVerified = useSessionStore((state) => state.setCredentialVerified);
  const submitVerification = useAdminStore((state) => state.submitVerification);

  const [limitHint, setLimitHint] = useState(false);
  const [permissionHint, setPermissionHint] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [outcome, setOutcome] = useState<AiReviewResult | null>(null);
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
      setPermissionHint(true);
      return;
    }
    setPermissionHint(false);

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
    setCredentialVerified(false);
  };

  const handleSubmit = async () => {
    if (skills.length === 0 || reviewing) return;
    setReviewing(true);

    const ai = await runAiReview({
      target: 'talent',
      name: displayName,
      region,
      tags: skills,
      detail: `我要接案，主要服務地區 ${region}，可承接的技能項目：${skills.join('、')}。${
        credentialUri ? '已附上證照或實績影像。' : '未附證照，以平台履歷與評價為主。'
      }`,
    });

    const passed = ai.decision === 'approved';
    chooseRole('talent');
    setProfileReview(ai);
    setVerification(passed ? 'approved' : 'pending');
    submitVerification({
      id: `ver_${Date.now()}`,
      talentId: userId,
      talentName: displayName,
      region,
      tags: skills,
      credentialUri: credentialUri ?? undefined,
      submittedAt: Date.now(),
      status: passed ? 'approved' : 'pending',
      note: passed
        ? credentialUri
          ? 'AI 即時認證通過；已附證照，待人工驗證加分徽章'
          : 'AI 即時認證通過；未附證照（非必要條件）'
        : `AI 認證未通過，需人工複審：${ai.reasons[0] ?? '內容需確認'}`,
      aiReview: ai,
      credentialVerified: false,
    });

    setReviewing(false);
    setOutcome(ai);
  };

  if (outcome) {
    const passed = outcome.decision === 'approved';
    return (
      <ScrollView
        className="bg-background flex-1"
        contentContainerClassName="px-6 pt-safe-offset-10 pb-12 gap-4 items-center"
        showsVerticalScrollIndicator={false}
      >
        <View
          className={cn(
            'h-16 w-16 items-center justify-center rounded-full',
            passed ? 'bg-brand-soft' : 'bg-coral-soft',
          )}
        >
          {passed ? (
            <BadgeCheck size={30} color={COLORS.brand} strokeWidth={2.2} />
          ) : (
            <ShieldCheck size={30} color={COLORS.coral} strokeWidth={2.2} />
          )}
        </View>
        <Text className="text-ink text-[22px] font-bold tracking-tight">
          {passed ? 'AI 已認證，可開始接案' : '資料已送交管理員複審'}
        </Text>
        <Text className="text-muted text-center text-[14px] leading-6">
          {passed
            ? '你的公開檔案已顯示「AI 已認證」徽章。上傳證照並通過人工驗證可再獲得信任度加分。'
            : '為防止詐騙，未通過即時認證的人才資料會由管理員複審，結果會在通知中心告知你。'}
        </Text>

        <AiReviewCard result={outcome} className="w-full" />

        <View className="mt-1 w-full gap-3">
          <Button size="lg" onPress={() => router.replace('/(tabs)')}>
            <Button.Label>進入任務牆</Button.Label>
          </Button>
          <Button size="lg" variant="tertiary" onPress={() => setOutcome(null)}>
            <Button.Label>回到技能設定</Button.Label>
          </Button>
        </View>
      </ScrollView>
    );
  }

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
        <View className="border-brand/25 bg-brand-soft flex-row items-start gap-2 rounded-xl border px-4 py-3">
          <Sparkles size={16} color={COLORS.brandStrong} strokeWidth={2.1} />
          <Text className="text-ink-soft flex-1 text-[12px] leading-5">
            送出後會立即進行 AI
            認證：通過就能馬上接案，未通過則轉由管理員複審。證照為選填加分項，不影響能否接案。
          </Text>
        </View>

        <SectionHeading
          title="選擇你的專業標籤"
          caption={`從 ${CATEGORY_COUNT} 大類別矩陣中最多選擇 ${MAX_TALENT_TAGS} 項，任務牆會依標籤即時推播。`}
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
          <SectionHeading
            title="證照 / 實績（選填）"
            caption="可有可無；上傳並通過人工驗證可獲得信任度加分徽章。"
          />

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
                      <Text className="text-brand-strong text-[12px]">
                        已上傳，待人工驗證加分徽章
                      </Text>
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
              onPress={() => void pickCredential()}
              accessibilityRole="button"
              className="border-hairline bg-canvas mt-3 items-center gap-2 rounded-xl border border-dashed px-4 py-6"
            >
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-white">
                <CloudUpload size={20} color={COLORS.brandStrong} strokeWidth={2} />
              </View>
              <Text className="text-ink text-[14px] font-semibold">選擇證照或作品影像（選填）</Text>
              <Text className="text-muted text-[12px]">支援相簿影像，驗證後不對外公開</Text>
            </Pressable>
          )}

          {permissionHint ? (
            <View className="border-coral/25 bg-coral-soft mt-3 rounded-xl border px-4 py-3">
              <Text className="text-coral text-[12px] leading-5">
                未取得相簿權限，請於系統設定開啟後再上傳；沒有證照也可以直接送出認證。
              </Text>
            </View>
          ) : null}

          <View className="mt-3 flex-row items-center gap-1.5">
            <BadgeCheck size={14} color={COLORS.brand} strokeWidth={2} />
            <Text className="text-muted flex-1 text-[12px]">
              沒有證照也能接案，AI 認證通過即可投遞提案。
            </Text>
          </View>
        </View>

        <SectionHeading
          title={`${CATEGORY_COUNT} 大類別技能矩陣`}
          caption="點擊任一類別展開子標籤。"
        />

        <CategoryAccordion
          selectedTags={skills}
          onToggleTag={handleToggle}
          isTagDisabled={() => skills.length >= MAX_TALENT_TAGS}
        />
      </ScrollView>

      <View className="border-hairline pb-safe-or-5 border-t bg-white px-5 pt-4">
        {reviewing ? (
          <View className="mb-3 flex-row items-center justify-center gap-2">
            <Spinner size="sm" />
            <Text className="text-brand-strong text-[13px] font-semibold">
              AI 即時認證中，正在檢查資料真實性…
            </Text>
          </View>
        ) : null}
        <Button
          size="lg"
          isDisabled={skills.length === 0 || reviewing}
          onPress={() => void handleSubmit()}
        >
          <Button.Label>
            {reviewing
              ? '認證中…'
              : skills.length === 0
                ? '請至少選擇 1 項標籤'
                : '送出 AI 認證並進入任務牆'}
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}
