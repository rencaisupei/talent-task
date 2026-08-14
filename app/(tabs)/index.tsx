import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Plus, ShieldCheck, SlidersHorizontal, Sparkles, Zap } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BrandWordmark } from '@/components/BrandLogo';
import { ChatQuotaPill } from '@/components/ChatQuotaPill';
import { GigCard } from '@/components/GigCard';
import { RegionPicker } from '@/components/RegionPicker';
import { EmptyState, SectionHeading } from '@/components/SectionHeading';
import { COLORS } from '@/lib/colors';
import { REGION_ANY, REGION_OPTIONS } from '@/lib/regions';
import { useGigStore } from '@/lib/stores/gigs';
import { useSessionStore } from '@/lib/stores/session';
import type { Gig } from '@/lib/types';
import { cn } from '@/lib/utils';

type TalentFilter = 'mine' | 'urgent' | 'all';

const FILTER_LABELS: { id: TalentFilter; label: string }[] = [
  { id: 'mine', label: '我的標籤' },
  { id: 'urgent', label: '急件優先' },
  { id: 'all', label: '全部任務' },
];

export default function HomeScreen() {
  const role = useSessionStore((state) => state.role);
  return role === 'client' ? <ClientHome /> : <TalentHome />;
}

function sortGigs(gigs: Gig[]): Gig[] {
  return [...gigs].sort((a, b) => {
    if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
    return b.createdAt - a.createdAt;
  });
}

function TalentHome() {
  const gigs = useGigStore((state) => state.gigs);
  const skills = useSessionStore((state) => state.skills);
  const verification = useSessionStore((state) => state.verification);
  const [filter, setFilter] = useState<TalentFilter>('mine');
  const [region, setRegion] = useState(REGION_ANY);

  const data = useMemo(() => {
    const scoped = gigs.filter((gig) => {
      if (gig.status === 'closed') return false;
      if (region !== REGION_ANY && gig.location.region !== region) return false;
      if (filter === 'mine' && !skills.includes(gig.tag)) return false;
      if (filter === 'urgent' && !gig.isUrgent) return false;
      return true;
    });
    return sortGigs(scoped);
  }, [filter, gigs, region, skills]);

  return (
    <View className="bg-background flex-1">
      <FlashList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="pt-safe-offset-4 gap-4 pb-4">
            <BrandWordmark subtitle="即時任務牆" size={48} />

            <ChatQuotaPill onPress={() => router.push('/subscription')} />

            {verification === 'pending' ? (
              <View className="border-hairline bg-canvas flex-row items-center gap-2 rounded-xl border px-4 py-3">
                <ShieldCheck size={16} color={COLORS.muted} strokeWidth={2.1} />
                <Text className="text-ink-soft flex-1 text-[13px]">
                  技能認證審核中，通過後會顯示認證徽章。
                </Text>
              </View>
            ) : null}

            <View className="flex-row gap-2">
              {FILTER_LABELS.map((item) => {
                const isActive = filter === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setFilter(item.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    className={cn(
                      'rounded-xl border px-3.5 py-2',
                      isActive ? 'border-brand bg-brand' : 'border-hairline bg-canvas',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-[13px] font-semibold',
                        isActive ? 'text-white' : 'text-ink-soft',
                      )}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="flex-row items-center gap-2">
              <SlidersHorizontal size={15} color={COLORS.muted} strokeWidth={2} />
              <Text className="text-muted text-[12px]">依地區篩選</Text>
            </View>

            <RegionPicker value={region} onChange={setRegion} options={REGION_OPTIONS} />

            <SectionHeading
              title={`${data.length} 筆任務`}
              caption={filter === 'mine' ? '僅顯示符合你認證標籤的任務' : undefined}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View className="pb-3">
            <GigCard
              gig={item}
              onPress={() => router.push({ pathname: '/gig/[id]', params: { id: item.id } })}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="目前沒有符合條件的任務"
            caption="調整篩選條件或擴大服務地區，就能看到更多急件。"
            icon={<Zap size={22} color={COLORS.coral} strokeWidth={2.1} />}
          />
        }
      />
    </View>
  );
}

function ClientHome() {
  const gigs = useGigStore((state) => state.gigs);
  const userId = useSessionStore((state) => state.userId);

  const myGigs = useMemo(
    () => sortGigs(gigs.filter((gig) => gig.clientId === userId)),
    [gigs, userId],
  );

  return (
    <View className="bg-background flex-1">
      <FlashList
        data={myGigs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 112 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="pt-safe-offset-4 gap-4 pb-4">
            <BrandWordmark subtitle="我的需求任務" size={48} />

            <Pressable
              onPress={() => router.push('/publish')}
              accessibilityRole="button"
              className="border-brand/25 bg-brand-soft rounded-xl border p-4"
            >
              <View className="flex-row items-center gap-3">
                <View className="bg-brand h-11 w-11 items-center justify-center rounded-xl">
                  <Sparkles size={20} color={COLORS.white} strokeWidth={2.1} />
                </View>
                <View className="flex-1">
                  <Text className="text-ink text-[16px] font-bold tracking-tight">
                    30 秒極速發布
                  </Text>
                  <Text className="text-ink-soft mt-0.5 text-[12px]">
                    選標籤、補描述，立即廣播給全台認證人才
                  </Text>
                </View>
              </View>
            </Pressable>

            <SectionHeading
              title="我的任務"
              caption={myGigs.length > 0 ? `共 ${myGigs.length} 筆` : undefined}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View className="pb-3">
            <GigCard
              gig={item}
              onPress={() => router.push({ pathname: '/gig/[id]', params: { id: item.id } })}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="還沒有發布任務"
            caption="從 30 大類別中選一個標籤，30 秒完成發布。"
            icon={<Sparkles size={22} color={COLORS.brand} strokeWidth={2.1} />}
          />
        }
      />

      <Pressable
        onPress={() => router.push('/publish')}
        accessibilityRole="button"
        accessibilityLabel="發布任務"
        className="bg-brand absolute right-5 bottom-6 h-14 w-14 items-center justify-center rounded-full"
        style={{
          shadowColor: '#000000',
          shadowOpacity: 0.12,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        <Plus size={26} color={COLORS.white} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
