import { Accordion } from 'heroui-native';
import { Text, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { TagChip } from '@/components/TagChip';
import { COLORS } from '@/lib/colors';
import { OMNI_INDUSTRY_TAGS, type OmniCategory } from '@/lib/omniTags';

interface CategoryAccordionProps {
  selectedTags: string[];
  onToggleTag: (tag: string, categoryId: string) => void;
  categories?: OmniCategory[];
  isTagDisabled?: (tag: string) => boolean;
  expandMode?: 'single' | 'multiple';
  defaultValue?: string;
}

/** 兩列書籤式級聯手風琴：點擊類別即展開子標籤清單。 */
export function CategoryAccordion({
  selectedTags,
  onToggleTag,
  categories = OMNI_INDUSTRY_TAGS,
  isTagDisabled,
  expandMode = 'single',
  defaultValue,
}: CategoryAccordionProps) {
  return (
    <Accordion selectionMode={expandMode} variant="surface" defaultValue={defaultValue}>
      {categories.map((category) => {
        const selectedCount = category.tags.filter((tag) => selectedTags.includes(tag)).length;

        return (
          <Accordion.Item key={category.id} value={category.id}>
            <Accordion.Trigger>
              <View className="flex-1 flex-row items-center gap-3">
                <View className="bg-brand-soft h-9 w-9 items-center justify-center rounded-xl">
                  <CategoryIcon categoryId={category.id} size={18} color={COLORS.brandStrong} />
                </View>
                <View className="flex-1">
                  <Text className="text-ink text-[15px] font-semibold">{category.name}</Text>
                  <Text className="text-muted mt-0.5 text-[12px]">
                    {category.summary}・{category.tags.length} 個標籤
                  </Text>
                </View>
                {selectedCount > 0 ? (
                  <View className="bg-brand rounded-lg px-2 py-0.5">
                    <Text className="text-[12px] font-semibold text-white">
                      已選 {selectedCount}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Accordion.Indicator />
            </Accordion.Trigger>

            <Accordion.Content>
              <View className="flex-row flex-wrap justify-between gap-y-2 pb-1">
                {category.tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <View key={tag} className="w-[48.5%]">
                      <TagChip
                        label={tag}
                        isSelected={isSelected}
                        disabled={!isSelected && (isTagDisabled?.(tag) ?? false)}
                        onPress={() => onToggleTag(tag, category.id)}
                      />
                    </View>
                  );
                })}
              </View>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
