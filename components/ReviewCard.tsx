import { Text, View } from 'react-native';

import { RatingStars } from '@/components/RatingStars';
import { StaticTag } from '@/components/TagChip';
import { formatRelativeTime } from '@/lib/format';
import type { Review } from '@/lib/types';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <View className="border-hairline rounded-xl border bg-white p-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-2">
          <View className="bg-canvas h-9 w-9 items-center justify-center rounded-xl">
            <Text className="text-ink-soft text-[14px] font-bold">
              {review.authorName.slice(0, 1)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-ink text-[14px] font-semibold">{review.authorName}</Text>
            <Text className="text-muted mt-0.5 text-[11px]">
              {formatRelativeTime(review.createdAt)}
            </Text>
          </View>
        </View>
        <RatingStars value={review.stars} size={13} showValue={false} />
      </View>

      {review.comment.length > 0 ? (
        <Text className="text-ink-soft mt-3 text-[13px] leading-5">{review.comment}</Text>
      ) : null}

      <View className="mt-3 flex-row flex-wrap items-center gap-2">
        <StaticTag label={review.tag} tone="brand" />
        <Text numberOfLines={1} className="text-muted flex-1 text-[11px]">
          {review.gigTitle}
        </Text>
      </View>
    </View>
  );
}
