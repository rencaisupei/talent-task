import { UserX } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { EmptyState } from '@/components/ui/EmptyState';
import { GlowButton } from '@/components/ui/GlowButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Txt } from '@/components/ui/Txt';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { getProfiles } from '@/lib/data/profiles';
import { useAuthStore } from '@/lib/stores/auth';
import { NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';

export default function BlockedSettingsScreen() {
  const blockedIds = useAuthStore((state) => state.blockedIds);
  const toggleBlocked = useAuthStore((state) => state.toggleBlocked);
  const blocked = getProfiles(blockedIds);

  return (
    <Screen>
      <ScreenHeader
        back
        fallback="/settings"
        title="封鎖名單"
        subtitle={`${blocked.length} 人被你封鎖`}
      />

      <ScrollView contentContainerClassName="gap-4 px-4 pb-10">
        {blocked.length === 0 ? (
          <EmptyState
            icon={<UserX color={NEON.coral} size={22} />}
            title="目前沒有封鎖任何人"
            description="在對方的檔案頁或聊天室裡可以封鎖與檢舉。被封鎖的人不會知道，也不會再出現在你的探索頁。"
            action={<GlowButton label="回到滑卡" onPress={() => router.push('/discover')} />}
          />
        ) : (
          <View className="bg-surface border-border/60 overflow-hidden rounded-3xl border">
            {blocked.map((profile, index) => (
              <View
                key={profile.id}
                className={cn(
                  'flex-row items-center gap-3 px-4 py-3.5',
                  index === blocked.length - 1 ? '' : 'border-border/40 border-b',
                )}
              >
                <UserAvatar uri={profile.photos[0]} name={profile.name} size={44} />
                <View className="flex-1">
                  <Txt weight="medium" className="text-foreground text-[14px]">
                    {profile.name}，{profile.age}
                  </Txt>
                  <Txt className="text-muted mt-0.5 text-[11px]">
                    {profile.job} · {profile.district}
                  </Txt>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`解除封鎖 ${profile.name}`}
                  onPress={() => toggleBlocked(profile.id)}
                  className="bg-glass border-border/60 rounded-full border px-3.5 py-2 active:opacity-70"
                >
                  <Txt className="text-foreground text-[12px]">解除</Txt>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View className="bg-surface border-border/60 gap-2 rounded-3xl border p-4">
          <Txt weight="medium" className="text-foreground text-[13px]">
            封鎖會發生什麼事
          </Txt>
          <Txt className="text-muted text-[11px] leading-5">
            你們不會再互相出現在探索、動態與搜尋裡，既有的對話也會被隱藏。解除封鎖後不會自動恢復配對。
          </Txt>
        </View>
      </ScrollView>
    </Screen>
  );
}
