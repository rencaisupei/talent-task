import { Button, Switch } from 'heroui-native';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { RegionPicker } from '@/components/RegionPicker';
import { SectionHeading } from '@/components/SectionHeading';
import { COLORS } from '@/lib/colors';
import {
  activeFilterCount,
  DEFAULT_GIG_FILTERS,
  GIG_SORT_OPTIONS,
  type GigFilters,
} from '@/lib/gigFilters';
import { OMNI_INDUSTRY_TAGS, CATEGORY_COUNT } from '@/lib/omniTags';
import { BUDGET_LEVELS, type BudgetLevelId } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GigFilterSheetProps {
  visible: boolean;
  filters: GigFilters;
  onClose: () => void;
  onApply: (filters: GigFilters) => void;
  /** 人才模式才顯示「僅符合我的標籤」。 */
  showSkillFilter?: boolean;
  skillCount?: number;
}

/** 任務牆多重篩選底部表單。 */
export function GigFilterSheet({
  visible,
  filters,
  onClose,
  onApply,
  showSkillFilter = false,
  skillCount = 0,
}: GigFilterSheetProps) {
  const [draft, setDraft] = useState<GigFilters>(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const toggleBudget = (id: BudgetLevelId) =>
    setDraft((current) => ({
      ...current,
      budgetLevels: current.budgetLevels.includes(id)
        ? current.budgetLevels.filter((item) => item !== id)
        : [...current.budgetLevels, id],
    }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/25">
        <Pressable className="flex-1" onPress={onClose} accessibilityRole="button" />

        <View className="max-h-[86%] rounded-t-3xl bg-white">
          <View className="border-hairline flex-row items-center justify-between border-b px-5 py-4">
            <Text className="text-ink text-[17px] font-semibold">篩選與排序</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="關閉"
              className="bg-canvas h-8 w-8 items-center justify-center rounded-full"
            >
              <X size={16} color={COLORS.ink} strokeWidth={2.2} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerClassName="px-5 py-5 gap-5"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-3">
              <SectionHeading title="排序方式" />
              <View className="flex-row flex-wrap gap-2">
                {GIG_SORT_OPTIONS.map((option) => {
                  const isActive = draft.sort === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => setDraft((current) => ({ ...current, sort: option.id }))}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      className={cn(
                        'rounded-xl border px-3.5 py-2.5',
                        isActive ? 'border-brand bg-brand' : 'border-hairline bg-canvas',
                      )}
                    >
                      <Text
                        className={cn(
                          'text-[13px] font-semibold',
                          isActive ? 'text-white' : 'text-ink-soft',
                        )}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-3">
              <SectionHeading title="服務地區" caption="預設為全台不限" />
              <RegionPicker
                value={draft.region}
                onChange={(region) => setDraft((current) => ({ ...current, region }))}
              />
            </View>

            <View className="gap-3">
              <SectionHeading title="預算等級" caption="可多選" />
              <View className="flex-row flex-wrap gap-2">
                {BUDGET_LEVELS.map((level) => {
                  const isActive = draft.budgetLevels.includes(level.id);
                  return (
                    <Pressable
                      key={level.id}
                      onPress={() => toggleBudget(level.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      className={cn(
                        'rounded-xl border px-3.5 py-2.5',
                        isActive ? 'border-brand bg-brand' : 'border-hairline bg-canvas',
                      )}
                    >
                      <Text
                        className={cn(
                          'text-[13px] font-semibold',
                          isActive ? 'text-white' : 'text-ink-soft',
                        )}
                      >
                        {level.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-3">
              <SectionHeading title="產業類別" caption={`${CATEGORY_COUNT} 大旗艦類別，單選`} />
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => setDraft((current) => ({ ...current, categoryId: null }))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: draft.categoryId === null }}
                  className={cn(
                    'rounded-xl border px-3 py-2',
                    draft.categoryId === null
                      ? 'border-brand bg-brand'
                      : 'border-hairline bg-canvas',
                  )}
                >
                  <Text
                    className={cn(
                      'text-[13px] font-semibold',
                      draft.categoryId === null ? 'text-white' : 'text-ink-soft',
                    )}
                  >
                    全部類別
                  </Text>
                </Pressable>

                {OMNI_INDUSTRY_TAGS.map((category) => {
                  const isActive = draft.categoryId === category.id;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() =>
                        setDraft((current) => ({ ...current, categoryId: category.id }))
                      }
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      className={cn(
                        'rounded-xl border px-3 py-2',
                        isActive ? 'border-brand bg-brand' : 'border-hairline bg-canvas',
                      )}
                    >
                      <Text
                        className={cn(
                          'text-[13px]',
                          isActive ? 'font-semibold text-white' : 'text-ink-soft',
                        )}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="border-hairline gap-4 rounded-xl border p-4">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-ink text-[14px] font-semibold">只看急件</Text>
                  <Text className="text-muted mt-0.5 text-[12px]">優先處理需要立即到場的任務</Text>
                </View>
                <Switch
                  isSelected={draft.urgentOnly}
                  onSelectedChange={(value) =>
                    setDraft((current) => ({ ...current, urgentOnly: value }))
                  }
                />
              </View>

              {showSkillFilter ? (
                <View className="border-hairline flex-row items-center justify-between gap-3 border-t pt-4">
                  <View className="flex-1">
                    <Text className="text-ink text-[14px] font-semibold">只看我的技能標籤</Text>
                    <Text className="text-muted mt-0.5 text-[12px]">
                      目前已認證 {skillCount} 個標籤
                    </Text>
                  </View>
                  <Switch
                    isSelected={draft.skillOnly}
                    onSelectedChange={(value) =>
                      setDraft((current) => ({ ...current, skillOnly: value }))
                    }
                  />
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View className="border-hairline pb-safe-or-4 flex-row gap-3 border-t px-5 pt-4">
            <Button
              variant="tertiary"
              size="lg"
              className="flex-1"
              onPress={() => setDraft({ ...DEFAULT_GIG_FILTERS, keyword: draft.keyword })}
            >
              <Button.Label>清除條件</Button.Label>
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            >
              <Button.Label>套用（{activeFilterCount(draft)}）</Button.Label>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
