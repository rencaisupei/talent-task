import { Heart, MapPin, MessageCircle, MoreHorizontal } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Photo } from '@/components/ui/Photo';
import { Txt } from '@/components/ui/Txt';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { getProfileById } from '@/lib/data/profiles';
import { relativeTime } from '@/lib/format';
import { useAuthStore } from '@/lib/stores/auth';
import { NEON } from '@/lib/theme';
import type { Moment } from '@/lib/types';

interface MomentCardProps {
  moment: Moment;
  onOpen: () => void;
  onToggleLike: () => void;
  onOpenAuthor: () => void;
  onMore?: () => void;
}

export function MomentCard({
  moment,
  onOpen,
  onToggleLike,
  onOpenAuthor,
  onMore,
}: MomentCardProps) {
  const me = useAuthStore((state) => state.me);
  const author = moment.userId === 'me' ? me : getProfileById(moment.userId);

  return (
    <View className="bg-surface border-border/60 gap-3 rounded-3xl border p-4">
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`查看 ${author?.name ?? ''} 的檔案`}
          onPress={onOpenAuthor}
          className="active:opacity-70"
        >
          <UserAvatar
            uri={author?.photos[0]}
            name={author?.name}
            size={42}
            online={author?.online}
            verified={author?.verified}
          />
        </Pressable>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Txt weight="semibold" className="text-foreground text-sm">
              {author?.name ?? '使用者'}
            </Txt>
            {author && moment.userId !== 'me' ? (
              <Txt className="text-muted text-[11px]">{author.age}</Txt>
            ) : null}
          </View>
          <View className="mt-0.5 flex-row items-center gap-2">
            <Txt className="text-muted text-[11px]">{relativeTime(moment.createdAt)}</Txt>
            {moment.place ? (
              <View className="flex-row items-center gap-1">
                <MapPin color="#8C8397" size={10} />
                <Txt className="text-muted text-[11px]">{moment.place}</Txt>
              </View>
            ) : null}
          </View>
        </View>
        {onMore ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="更多選項"
            hitSlop={8}
            onPress={onMore}
            className="active:opacity-70"
          >
            <MoreHorizontal color="#8C8397" size={20} />
          </Pressable>
        ) : null}
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="查看動態" onPress={onOpen}>
        <Txt className="text-foreground text-[14px] leading-6">{moment.text}</Txt>
      </Pressable>

      {moment.images.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="查看照片"
          onPress={onOpen}
          className="flex-row gap-2 active:opacity-90"
        >
          {moment.images.slice(0, 3).map((image, index) => (
            <View key={image} className="flex-1 overflow-hidden rounded-2xl">
              <Photo
                uri={image}
                width="100%"
                height={moment.images.length === 1 ? 220 : 120}
                radius={16}
              />
              {index === 2 && moment.images.length > 3 ? (
                <View className="absolute inset-0 items-center justify-center bg-black/45">
                  <Txt weight="semibold" className="text-white">
                    +{moment.images.length - 3}
                  </Txt>
                </View>
              ) : null}
            </View>
          ))}
        </Pressable>
      ) : null}

      {moment.tags.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {moment.tags.map((tag) => (
            <View key={tag} className="bg-glass border-border/60 rounded-full border px-2.5 py-1">
              <Txt className="text-neon-cyan text-[11px]">#{tag}</Txt>
            </View>
          ))}
        </View>
      ) : null}

      <View className="border-border/40 flex-row items-center gap-5 border-t pt-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={moment.likedByMe ? '取消喜歡' : '喜歡這則動態'}
          onPress={onToggleLike}
          className="flex-row items-center gap-1.5 active:opacity-70"
        >
          <Heart
            color={moment.likedByMe ? NEON.coral : '#8C8397'}
            fill={moment.likedByMe ? NEON.coral : 'transparent'}
            size={18}
          />
          <Txt className="text-muted text-[12px]">{moment.likes}</Txt>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="查看留言"
          onPress={onOpen}
          className="flex-row items-center gap-1.5 active:opacity-70"
        >
          <MessageCircle color="#8C8397" size={18} />
          <Txt className="text-muted text-[12px]">{moment.comments.length}</Txt>
        </Pressable>
      </View>
    </View>
  );
}
