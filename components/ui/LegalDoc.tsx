import type { Href } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { CopyrightFooter } from '@/components/ui/CopyrightFooter';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Txt } from '@/components/ui/Txt';
import type { LegalDocument } from '@/lib/data/legal';

/** 條款／政策的統一排版：標題、更新日期、分節內容與聯絡資訊。 */
export function LegalDoc({ doc, fallback }: { doc: LegalDocument; fallback: Href }) {
  return (
    <Screen>
      <ScreenHeader back fallback={fallback} title={doc.title} subtitle={doc.subtitle} />

      <ScrollView contentContainerClassName="gap-6 px-5 pb-10">
        <View className="bg-surface border-border/60 gap-1.5 rounded-3xl border p-4">
          <Txt className="text-muted text-[11px]">版本 {doc.version}</Txt>
          <Txt className="text-muted text-[11px]">更新日期：{doc.updatedAt}</Txt>
          <Txt className="text-muted text-[11px]">生效日期：{doc.effectiveAt}</Txt>
        </View>

        <View className="gap-3">
          {doc.intro.map((paragraph) => (
            <Txt key={paragraph} className="text-foreground text-[13px] leading-6">
              {paragraph}
            </Txt>
          ))}
        </View>

        {doc.sections.map((section) => (
          <View key={section.heading} className="gap-2.5">
            <Txt weight="semibold" className="text-foreground text-[15px]">
              {section.heading}
            </Txt>
            {section.paragraphs?.map((paragraph) => (
              <Txt key={paragraph} className="text-muted text-[13px] leading-6">
                {paragraph}
              </Txt>
            ))}
            {section.bullets ? (
              <View className="gap-2">
                {section.bullets.map((bullet) => (
                  <View key={bullet} className="flex-row gap-2.5">
                    <View className="bg-accent mt-2 h-1.5 w-1.5 rounded-full" />
                    <Txt className="text-muted flex-1 text-[13px] leading-6">{bullet}</Txt>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        <View className="bg-surface border-border/60 gap-1.5 rounded-3xl border p-4">
          <Txt weight="semibold" className="text-foreground text-[14px]">
            聯絡我們
          </Txt>
          {doc.contact.map((line) => (
            <Txt key={line} className="text-muted text-[12px] leading-5">
              {line}
            </Txt>
          ))}
        </View>

        <CopyrightFooter className="pt-0 pb-0" />
      </ScrollView>
    </Screen>
  );
}
