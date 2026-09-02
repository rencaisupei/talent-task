import { Heart, Phone, Shield, Sparkles } from 'lucide-react-native';
import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { CopyrightFooter } from '@/components/ui/CopyrightFooter';
import { GlowButton } from '@/components/ui/GlowButton';
import { Txt } from '@/components/ui/Txt';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { NEON } from '@/lib/theme';

export default function WelcomeScreen() {
  return (
    <View className="bg-background flex-1">
      <Image
        source={require('@/assets/images/welcome-hero.png')}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(15,10,22,0.25)', 'rgba(15,10,22,0.82)', 'rgba(15,10,22,0.98)']}
        className="absolute inset-0"
      />

      <View className="pt-safe-offset-10 pb-safe-offset-6 flex-1 justify-between px-6">
        <View className="items-center gap-3">
          <View className="border-accent/40 bg-accent/15 h-16 w-16 items-center justify-center rounded-3xl border">
            <Heart color={NEON.coral} size={30} fill={NEON.coral} />
          </View>
          <Txt weight="bold" className="text-foreground text-3xl tracking-tight">
            JiMatch
          </Txt>
          <Txt className="text-muted text-center text-[13px]">邊玩邊聊，玩出心動</Txt>
        </View>

        <View className="gap-4">
          <Feature
            icon={<Sparkles color={NEON.amber} size={18} />}
            title="遊戲城開局配對"
            body="極速開局、大富翁棋盤、多人派對房，一起玩比硬聊更快熟"
          />
          <Feature
            icon={<Phone color={NEON.cyan} size={18} />}
            title="語音與視訊通話"
            body="配對後直接開麥，先確認感覺再決定要不要見面"
          />
          <Feature
            icon={<Shield color={NEON.lime} size={18} />}
            title="實名認證把關"
            body="信箱驗證加上證件實名認證（KYC），把假帳號留在門外"
          />
        </View>

        <View className="gap-3">
          <GlowButton
            label="用電子郵件註冊"
            size="lg"
            onPress={() => router.push('/login')}
            icon={<Heart color="#ffffff" size={18} fill="#ffffff" />}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="我已經有帳號"
            onPress={() => router.push('/login')}
            className="items-center py-3 active:opacity-70"
          >
            <Txt weight="medium" className="text-foreground text-sm">
              我已經有帳號，直接登入
            </Txt>
          </Pressable>
          <View className="flex-row flex-wrap items-center justify-center gap-x-1">
            <Txt className="text-muted text-[11px]">繼續代表你同意</Txt>
            <LegalLink label="服務條款" onPress={() => router.push('/legal/terms')} />
            <Txt className="text-muted text-[11px]">與</Txt>
            <LegalLink label="隱私權政策" onPress={() => router.push('/legal/privacy')} />
            <Txt className="text-muted text-[11px]">。滿 18 歲並完成實名認證才能使用。</Txt>
          </View>
          <CopyrightFooter className="pt-2 pb-0" />
        </View>
      </View>
    </View>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-2xl border">
        {icon}
      </View>
      <View className="flex-1">
        <Txt weight="semibold" className="text-foreground text-sm">
          {title}
        </Txt>
        <Txt className="text-muted mt-0.5 text-[12px] leading-5">{body}</Txt>
      </View>
    </View>
  );
}

function LegalLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      className="active:opacity-70"
    >
      <Txt weight="medium" className="text-accent text-[11px] underline">
        {label}
      </Txt>
    </Pressable>
  );
}
