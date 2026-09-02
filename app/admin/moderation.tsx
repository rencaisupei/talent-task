import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { AdminScreen } from '@/components/admin/AdminScreen';
import {
  ActionButton,
  AdminGroup,
  DataRow,
  FilterChips,
  StatusPill,
  ToggleRow,
} from '@/components/admin/AdminUI';
import { Photo } from '@/components/ui/Photo';
import { Section } from '@/components/ui/Section';
import { Txt } from '@/components/ui/Txt';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { REVIEW_KIND_LABEL, REVIEW_STATUS_LABEL, REVIEW_STATUS_TONE } from '@/lib/data/admin';
import { getProfileById } from '@/lib/data/profiles';
import { relativeTime } from '@/lib/format';
import { useAdminStore } from '@/lib/stores/admin';
import type { AdminReviewItem, AdminReviewStatus } from '@/lib/types';

type Filter = 'all' | AdminReviewStatus;

export default function AdminModerationScreen() {
  const reviews = useAdminStore((state) => state.reviews);
  const flags = useAdminStore((state) => state.flags);
  const setFlag = useAdminStore((state) => state.setFlag);
  const [filter, setFilter] = useState<Filter>('pending');

  const counts = {
    all: reviews.length,
    pending: reviews.filter((item) => item.status === 'pending').length,
    approved: reviews.filter((item) => item.status === 'approved').length,
    removed: reviews.filter((item) => item.status === 'removed').length,
  };

  const visible = filter === 'all' ? reviews : reviews.filter((item) => item.status === filter);

  return (
    <AdminScreen title="內容審核" subtitle={`${counts.pending} 件待審`}>
      <AdminGroup>
        <ToggleRow
          label="自動審核"
          hint={`命中敏感詞的內容自動排入待審（目前 ${flags.bannedWords.length} 組關鍵字）`}
          value={flags.autoModeration}
          onChange={(value) => setFlag('autoModeration', value)}
        />
        <DataRow
          title="敏感詞管理"
          subtitle={flags.bannedWords.join('、') || '尚未設定'}
          onPress={() => router.push('/admin/settings')}
          last
        />
      </AdminGroup>

      <FilterChips<Filter>
        options={[
          { key: 'pending', label: '待審核', count: counts.pending },
          { key: 'approved', label: '已通過', count: counts.approved },
          { key: 'removed', label: '已下架', count: counts.removed },
          { key: 'all', label: '全部', count: counts.all },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <Section title="審核佇列">
        {visible.length === 0 ? (
          <View className="bg-surface border-border/60 rounded-3xl border p-6">
            <Txt className="text-muted text-center text-[13px]">這個分類目前沒有待審內容。</Txt>
          </View>
        ) : (
          <View className="gap-3">
            {visible.map((item) => (
              <ReviewCard key={item.id} item={item} />
            ))}
          </View>
        )}
      </Section>
    </AdminScreen>
  );
}

function ReviewCard({ item }: { item: AdminReviewItem }) {
  const decideReview = useAdminStore((state) => state.decideReview);
  const author = getProfileById(item.userId);

  return (
    <View className="bg-surface border-border/60 gap-3 rounded-3xl border p-4">
      <View className="flex-row items-center gap-3">
        <UserAvatar uri={author?.photos[0]} name={author?.name} size={40} />
        <View className="flex-1 gap-0.5">
          <Txt weight="semibold" className="text-foreground text-[14px]">
            {author?.name ?? item.userId} · {REVIEW_KIND_LABEL[item.kind]}
          </Txt>
          <Txt className="text-muted text-[11px]">{relativeTime(item.createdAt)}</Txt>
        </View>
        <StatusPill
          label={REVIEW_STATUS_LABEL[item.status]}
          tone={REVIEW_STATUS_TONE[item.status]}
        />
      </View>

      {item.imageUri ? (
        <View className="overflow-hidden rounded-2xl">
          <Photo uri={item.imageUri} width="100%" height={180} radius={16} />
        </View>
      ) : null}

      <View className="bg-background rounded-2xl p-3">
        <Txt className="text-foreground text-[13px] leading-5">{item.content}</Txt>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {item.flags.map((flag) => (
          <StatusPill key={flag} label={flag} tone="warning" />
        ))}
      </View>

      {item.status === 'pending' ? (
        <View className="flex-row flex-wrap gap-2">
          <ActionButton
            label="通過"
            tone="success"
            onPress={() => decideReview(item.id, 'approved')}
          />
          <ActionButton
            label="下架內容"
            tone="danger"
            onPress={() => decideReview(item.id, 'removed')}
          />
          <ActionButton
            label="查看帳號"
            tone="info"
            onPress={() =>
              router.push({ pathname: '/admin/user/[id]', params: { id: item.userId } })
            }
          />
        </View>
      ) : null}
    </View>
  );
}
