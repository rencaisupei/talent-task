import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Button, Description, Label, Switch, TextArea, TextField } from 'heroui-native';
import { CircleCheck, Crosshair, MapPin, X, Zap } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { CategoryAccordion } from '@/components/CategoryAccordion';
import { RegionPicker } from '@/components/RegionPicker';
import { SectionHeading } from '@/components/SectionHeading';
import { COLORS } from '@/lib/colors';
import { goBackOrReplace } from '@/lib/navigation';
import { CATEGORY_COUNT } from '@/lib/omniTags';
import { REGION_ANY, TAIWAN_REGIONS } from '@/lib/regions';
import { useGigStore } from '@/lib/stores/gigs';
import { useSessionStore } from '@/lib/stores/session';
import { BUDGET_LEVELS, type BudgetLevelId, type GigLocation } from '@/lib/types';
import { cn } from '@/lib/utils';

function detailTemplate(tag: string, region: string) {
  const place = region === REGION_ANY ? '現場' : region;
  return `${place}需要「${tag}」的專業協助，希望能盡快到場評估。現場狀況：`;
}

function normalizeRegion(input: string | null | undefined): string | null {
  if (!input) return null;
  const normalized = input.replace('台', '臺');
  return TAIWAN_REGIONS.find((region) => normalized.includes(region)) ?? null;
}

export default function PublishScreen() {
  const userId = useSessionStore((state) => state.userId);
  const displayName = useSessionStore((state) => state.displayName);
  const sessionRegion = useSessionStore((state) => state.region);
  const publishGig = useGigStore((state) => state.publishGig);

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [detailTouched, setDetailTouched] = useState(false);
  const [region, setRegion] = useState(sessionRegion === REGION_ANY ? '臺北市' : sessionRegion);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevelId>('B2');
  const [isUrgent, setIsUrgent] = useState(true);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const handleSelectTag = (nextTag: string, nextCategoryId: string) => {
    if (tag === nextTag) {
      setTag(null);
      setCategoryId(null);
      return;
    }
    setTag(nextTag);
    setCategoryId(nextCategoryId);
    if (!detailTouched) setDetail(detailTemplate(nextTag, region));
  };

  const useDeviceLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('無法取得定位', '請改用下方的地區下拉選單選擇任務地點。');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      try {
        const places = await Location.reverseGeocodeAsync(position.coords);
        const detected = normalizeRegion(places[0]?.region ?? places[0]?.city);
        if (detected) setRegion(detected);
      } catch {
        // 反向地理編碼在部分平台不支援，保留下拉選單結果即可。
      }
    } catch {
      Alert.alert('定位失敗', '請改用下方的地區下拉選單選擇任務地點。');
    } finally {
      setLocating(false);
    }
  };

  const canPublish = tag !== null && categoryId !== null && detail.trim().length >= 5;

  const handlePublish = () => {
    if (!tag || !categoryId) return;
    const location: GigLocation = {
      region,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      source: coords ? 'gps' : 'manual',
    };
    const gig = publishGig({
      categoryId,
      tag,
      detail: detail.trim(),
      location,
      budgetLevel,
      isUrgent,
      clientId: userId,
      clientName: displayName,
    });
    setPublishedId(gig.id);
  };

  if (publishedId) {
    return (
      <View className="bg-background flex-1 items-center justify-center gap-4 px-8">
        <View className="bg-brand-soft h-16 w-16 items-center justify-center rounded-full">
          <CircleCheck size={30} color={COLORS.brand} strokeWidth={2.2} />
        </View>
        <Text className="text-ink text-[22px] font-bold tracking-tight">任務已廣播</Text>
        <Text className="text-muted text-center text-[14px] leading-6">
          符合「{tag}」標籤的認證人才已收到推播，通常在數分鐘內就會有人開啟對話。
        </Text>
        <View className="mt-2 w-full gap-3">
          <Button
            size="lg"
            onPress={() => router.replace({ pathname: '/gig/[id]', params: { id: publishedId } })}
          >
            <Button.Label>查看任務詳情</Button.Label>
          </Button>
          <Button size="lg" variant="tertiary" onPress={() => goBackOrReplace('/(tabs)')}>
            <Button.Label>返回我的任務</Button.Label>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="bg-background flex-1"
    >
      <View className="border-hairline flex-row items-center gap-3 border-b bg-white px-5 pt-5 pb-4">
        <View className="flex-1">
          <Text className="text-ink text-[19px] font-bold tracking-tight">30 秒極速發布</Text>
          <Text className="text-muted mt-0.5 text-[12px]">選標籤 → 補描述 → 立即廣播</Text>
        </View>
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="關閉"
          className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
        >
          <X size={17} color={COLORS.ink} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="px-5 py-5 gap-5 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="border-hairline bg-canvas rounded-xl border px-4 py-3">
          <Text className="text-ink-soft text-[13px] leading-5">
            {tag ? (
              <>
                已選擇標籤：<Text className="text-brand-strong font-semibold">{tag}</Text>
              </>
            ) : (
              `請先從下方 ${CATEGORY_COUNT} 大類別中點選一個子標籤。`
            )}
          </Text>
        </View>

        <SectionHeading title="任務類別與標籤" caption="點擊類別展開子標籤，選取後以純青色高亮。" />

        <CategoryAccordion
          selectedTags={tag ? [tag] : []}
          onToggleTag={handleSelectTag}
          defaultValue="CAT_01"
        />

        <SectionHeading title="任務描述" caption="選取標籤後已自動帶入描述，可直接補充細節。" />

        <TextField>
          <Label>文字詳情</Label>
          <TextArea
            value={detail}
            onChangeText={(text) => {
              setDetail(text);
              setDetailTouched(true);
            }}
            placeholder="說明需求、期望到場時間與現場狀況"
            numberOfLines={5}
            className="min-h-28"
          />
          <Description>至少 5 個字，描述越清楚媒合越快。</Description>
        </TextField>

        <SectionHeading title="任務地點" caption="可使用裝置定位，或直接選擇全台地區。" />

        <View className="gap-3">
          <Pressable
            onPress={useDeviceLocation}
            accessibilityRole="button"
            className="border-brand/25 bg-brand-soft flex-row items-center justify-between rounded-xl border px-4 py-3.5"
          >
            <View className="flex-row items-center gap-2">
              <Crosshair size={18} color={COLORS.brandStrong} strokeWidth={2.1} />
              <Text className="text-brand-strong text-[14px] font-semibold">
                {locating ? '定位中…' : '使用目前位置定位'}
              </Text>
            </View>
            {coords ? (
              <Text className="text-brand-strong text-[12px]">
                {coords.latitude.toFixed(3)}, {coords.longitude.toFixed(3)}
              </Text>
            ) : (
              <Text className="text-muted text-[12px]">未定位</Text>
            )}
          </Pressable>

          <RegionPicker
            label="地區（下拉選單）"
            value={region}
            onChange={setRegion}
            options={[...TAIWAN_REGIONS]}
          />

          <View className="flex-row items-center gap-1.5">
            <MapPin size={14} color={COLORS.muted} strokeWidth={2} />
            <Text className="text-muted text-[12px]">
              地點來源：{coords ? '裝置定位' : '手動選擇'}・{region}
            </Text>
          </View>
        </View>

        <SectionHeading title="預算等級" />

        <View className="flex-row flex-wrap justify-between gap-y-2">
          {BUDGET_LEVELS.map((level) => {
            const isActive = budgetLevel === level.id;
            return (
              <Pressable
                key={level.id}
                onPress={() => setBudgetLevel(level.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                className={cn(
                  'w-[48.5%] rounded-xl border px-3 py-3',
                  isActive ? 'border-brand bg-brand' : 'border-hairline bg-canvas',
                )}
              >
                <Text
                  className={cn('text-[13px] font-semibold', isActive ? 'text-white' : 'text-ink')}
                >
                  {level.label}
                </Text>
                <Text
                  className={cn('mt-0.5 text-[11px]', isActive ? 'text-white/80' : 'text-muted')}
                >
                  {level.hint}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="border-hairline flex-row items-center justify-between rounded-xl border bg-white px-4 py-3.5">
          <View className="flex-1 flex-row items-center gap-2">
            <Zap size={18} color={COLORS.coral} strokeWidth={2.1} />
            <View className="flex-1">
              <Text className="text-ink text-[14px] font-semibold">標記為急件</Text>
              <Text className="text-muted mt-0.5 text-[12px]">優先出現在人才任務牆頂端</Text>
            </View>
          </View>
          <Switch isSelected={isUrgent} onSelectedChange={setIsUrgent} />
        </View>
      </ScrollView>

      <View className="border-hairline pb-safe-or-5 border-t bg-white px-5 pt-4">
        <Button size="lg" isDisabled={!canPublish} onPress={handlePublish}>
          <Button.Label>
            {canPublish ? (isUrgent ? '立即發布急件任務' : '立即發布任務') : '請完成標籤與描述'}
          </Button.Label>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
