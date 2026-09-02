import { useState } from 'react';
import {
  Flag,
  MapPin,
  MessageSquareText,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react-native';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Switch } from 'heroui-native';

import { OutlineButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { SAFETY_TIPS } from '@/lib/data/seed';
import { GRADIENT, NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';

export default function SafetyScreen() {
  const [shareItinerary, setShareItinerary] = useState(true);
  const [checkIn, setCheckIn] = useState(false);

  return (
    <Screen>
      <ScreenHeader back fallback="/(tabs)/me" title="安全中心" subtitle="約會前後都用得上" />

      <ScrollView contentContainerClassName="gap-6 px-4 pb-8">
        <LinearGradient
          colors={GRADIENT.like}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="gap-3 rounded-3xl p-5"
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <ShieldCheck color="#ffffff" size={24} />
          </View>
          <Txt weight="bold" className="text-lg text-white">
            你的安全由你決定節奏
          </Txt>
          <Txt className="text-[12px] leading-5 text-white/90">
            不需要為了禮貌勉強自己。任何時候都可以停止對話、取消見面或直接封鎖。
          </Txt>
        </LinearGradient>

        <Section title="約會安全建議">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            {SAFETY_TIPS.map((tip, index) => (
              <View
                key={tip.title}
                className={cn(
                  'gap-1 px-4 py-3.5',
                  index === SAFETY_TIPS.length - 1 ? '' : 'border-border/40 border-b',
                )}
              >
                <Txt weight="medium" className="text-foreground text-[14px]">
                  {tip.title}
                </Txt>
                <Txt className="text-muted text-[12px] leading-5">{tip.body}</Txt>
              </View>
            ))}
          </View>
        </Section>

        <Section title="見面工具">
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            <View className="border-border/40 flex-row items-center gap-3 border-b px-4 py-3.5">
              <MapPin color={NEON.cyan} size={18} />
              <View className="flex-1">
                <Txt className="text-foreground text-[14px]">分享行程給朋友</Txt>
                <Txt className="text-muted mt-0.5 text-[11px]">
                  出門前自動把時間與地點傳給指定聯絡人
                </Txt>
              </View>
              <Switch isSelected={shareItinerary} onSelectedChange={setShareItinerary} />
            </View>
            <View className="flex-row items-center gap-3 px-4 py-3.5">
              <Users color={NEON.violet} size={18} />
              <View className="flex-1">
                <Txt className="text-foreground text-[14px]">見面後安全回報</Txt>
                <Txt className="text-muted mt-0.5 text-[11px]">兩小時後提醒你回報是否一切順利</Txt>
              </View>
              <Switch isSelected={checkIn} onSelectedChange={setCheckIn} />
            </View>
          </View>
        </Section>

        <Section title="遇到問題">
          <View className="gap-3">
            <OutlineButton
              label="檢舉某個使用者"
              icon={<Flag color={NEON.coral} size={16} />}
              onPress={() => router.push('/(tabs)/messages')}
            />
            <OutlineButton
              label="查看封鎖名單"
              icon={<ShieldAlert color={NEON.amber} size={16} />}
              onPress={() => router.push('/settings/blocked')}
            />
            <OutlineButton
              label="聯絡客服"
              icon={<MessageSquareText color={NEON.cyan} size={16} />}
              onPress={() => router.push('/contact')}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="撥打緊急電話 110"
              onPress={() => void Linking.openURL('tel:110')}
              className="border-danger/50 bg-danger/10 flex-row items-center justify-center gap-2 rounded-full border py-3.5 active:opacity-70"
            >
              <PhoneCall color="#EF4B57" size={16} />
              <Txt weight="medium" className="text-danger text-[14px]">
                緊急狀況撥打 110
              </Txt>
            </Pressable>
          </View>
        </Section>

        <View className="bg-surface border-border/60 gap-2 rounded-3xl border p-4">
          <Txt weight="medium" className="text-foreground text-[13px]">
            我們怎麼處理檢舉
          </Txt>
          <Txt className="text-muted text-[11px] leading-5">
            所有檢舉都會由審核團隊在 24
            小時內處理。檢舉人身分不會被透露，涉及人身安全的案件會優先處理並保留紀錄。
          </Txt>
        </View>
      </ScrollView>
    </Screen>
  );
}
