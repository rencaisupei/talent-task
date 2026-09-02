import { useCallback, useRef, useState } from 'react';
import { Heart, MapPin, Send, Trash2 } from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useThemeColor } from 'heroui-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { GlowButton } from '@/components/ui/GlowButton';
import { Photo } from '@/components/ui/Photo';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Txt } from '@/components/ui/Txt';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useKeyboardSafePad, useScrollToEndOnKeyboard } from '@/hooks/useKeyboardInset';
import { getProfileById } from '@/lib/data/profiles';
import { relativeTime } from '@/lib/format';
import { useAuthStore } from '@/lib/stores/auth';
import { useMomentsStore } from '@/lib/stores/moments';
import { NEON } from '@/lib/theme';
import { cn } from '@/lib/utils';

export default function MomentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [muted] = useThemeColor(['muted']);
  const me = useAuthStore((state) => state.me);
  const padBottom = useKeyboardSafePad(3);
  const moments = useMomentsStore((state) => state.moments);
  const toggleLike = useMomentsStore((state) => state.toggleLike);
  const addComment = useMomentsStore((state) => state.addComment);
  const deleteMoment = useMomentsStore((state) => state.deleteMoment);
  const [comment, setComment] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  // 只有原本就停在留言尾端時才自動捲動，避免使用者正在看貼文內容時畫面跳走。
  const atBottomRef = useRef(true);

  const scrollToEnd = useCallback((animated: boolean) => {
    scrollRef.current?.scrollToEnd({ animated });
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromEnd = contentSize.height - layoutMeasurement.height - contentOffset.y;
    atBottomRef.current = distanceFromEnd <= 120;
  }, []);

  useScrollToEndOnKeyboard(
    useCallback(
      (animated: boolean) => {
        if (atBottomRef.current) scrollToEnd(animated);
      },
      [scrollToEnd],
    ),
  );

  const moment = moments.find((item) => item.id === id);

  if (!moment) {
    return (
      <Screen>
        <ScreenHeader back fallback="/(tabs)/moments" title="動態" />
        <EmptyState
          title="這則動態不見了"
          description="可能已被作者刪除。"
          action={<GlowButton label="回到動態" onPress={() => router.replace('/(tabs)/moments')} />}
        />
      </Screen>
    );
  }

  const author = moment.userId === 'me' ? me : getProfileById(moment.userId);
  const isMine = moment.userId === 'me';

  return (
    <Screen>
      <ScreenHeader
        back
        fallback="/(tabs)/moments"
        title="動態"
        right={
          isMine ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="刪除這則動態"
              hitSlop={8}
              onPress={() => {
                deleteMoment(moment.id);
                router.replace('/(tabs)/moments');
              }}
              className="bg-glass border-border/60 h-10 w-10 items-center justify-center rounded-full border active:opacity-70"
            >
              <Trash2 color="#EF4B57" size={17} />
            </Pressable>
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          contentContainerClassName="gap-5 px-4 pb-8"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`查看 ${author?.name ?? ''} 的檔案`}
              onPress={() => router.push(isMine ? '/profile/me' : `/profile/${moment.userId}`)}
              className="active:opacity-70"
            >
              <UserAvatar
                uri={author?.photos[0]}
                name={author?.name}
                size={46}
                online={author?.online}
                verified={author?.verified}
              />
            </Pressable>
            <View className="flex-1">
              <Txt weight="semibold" className="text-foreground text-[15px]">
                {author?.name ?? '使用者'}
              </Txt>
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
          </View>

          <Txt className="text-foreground text-[15px] leading-7">{moment.text}</Txt>

          {moment.images.length > 0 ? (
            <View className="gap-2">
              {moment.images.map((image) => (
                <View key={image} className="overflow-hidden rounded-3xl">
                  <Photo uri={image} width="100%" height={320} radius={24} />
                </View>
              ))}
            </View>
          ) : null}

          {moment.tags.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {moment.tags.map((tag) => (
                <View
                  key={tag}
                  className="bg-glass border-border/60 rounded-full border px-3 py-1.5"
                >
                  <Txt className="text-neon-cyan text-[12px]">#{tag}</Txt>
                </View>
              ))}
            </View>
          ) : null}

          <View className="border-border/50 flex-row items-center gap-5 border-y py-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={moment.likedByMe ? '取消喜歡' : '喜歡'}
              onPress={() => toggleLike(moment.id)}
              className="flex-row items-center gap-2 active:opacity-70"
            >
              <Heart
                color={moment.likedByMe ? NEON.coral : '#8C8397'}
                fill={moment.likedByMe ? NEON.coral : 'transparent'}
                size={20}
              />
              <Txt className="text-muted text-[13px]">{moment.likes}</Txt>
            </Pressable>
            <Txt className="text-muted text-[13px]">{moment.comments.length} 則留言</Txt>
          </View>

          <View className="gap-4">
            {moment.comments.length === 0 ? (
              <Txt className="text-muted py-4 text-center text-[13px]">
                還沒有留言，你可以第一個說話
              </Txt>
            ) : (
              moment.comments.map((item) => {
                const commenter = item.userId === 'me' ? me : getProfileById(item.userId);
                return (
                  <View key={item.id} className="flex-row gap-3">
                    <UserAvatar uri={commenter?.photos[0]} name={commenter?.name} size={34} />
                    <View className="flex-1 gap-1">
                      <View className="flex-row items-center gap-2">
                        <Txt weight="medium" className="text-foreground text-[13px]">
                          {commenter?.name ?? '使用者'}
                        </Txt>
                        <Txt className="text-muted text-[10px]">{relativeTime(item.createdAt)}</Txt>
                      </View>
                      <Txt className="text-foreground text-[14px] leading-5">{item.text}</Txt>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        <View
          className={cn(
            'border-border/60 bg-background flex-row items-center gap-2 border-t px-4 pt-3',
            padBottom,
          )}
        >
          <View className="bg-surface border-border/60 flex-1 rounded-full border px-4 py-2.5">
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="留個言…"
              placeholderTextColor={muted}
              className="text-foreground text-[14px]"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="送出留言"
            disabled={comment.trim().length === 0}
            onPress={() => {
              addComment(moment.id, comment);
              setComment('');
              setTimeout(() => scrollToEnd(true), 60);
            }}
            className="bg-accent h-10 w-10 items-center justify-center rounded-full active:opacity-80 disabled:opacity-40"
          >
            <Send color="#ffffff" size={17} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
