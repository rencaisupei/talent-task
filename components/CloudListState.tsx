import { Button, Spinner } from 'heroui-native';
import { CloudOff } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { EmptyState } from '@/components/SectionHeading';
import { COLORS } from '@/lib/colors';
import type { CloudLoadState } from '@/lib/stores/gigs';

interface CloudListStateProps {
  loadState: CloudLoadState;
  errorMessage: string | null;
  onRetry: () => void;
  loadingLabel?: string;
  emptyTitle: string;
  emptyCaption: string;
  emptyIcon?: ReactNode;
}

/**
 * 雲端清單的空白區塊：讀取中、讀取失敗與真的沒有資料是三件不同的事，
 * 不能都顯示「沒有任務」，否則使用者會以為平台是空的。
 */
export function CloudListState({
  loadState,
  errorMessage,
  onRetry,
  loadingLabel = '正在讀取雲端資料…',
  emptyTitle,
  emptyCaption,
  emptyIcon,
}: CloudListStateProps) {
  if (loadState === 'loading' || loadState === 'idle') {
    return (
      <View className="items-center gap-3 py-16">
        <Spinner size="md" />
        <Text className="text-muted text-[13px]">{loadingLabel}</Text>
      </View>
    );
  }

  if (loadState === 'error') {
    return (
      <View className="items-center gap-3 py-10">
        <EmptyState
          title="無法讀取雲端資料"
          caption={errorMessage ?? '請確認網路連線後再試一次。'}
          icon={<CloudOff size={22} color={COLORS.coral} strokeWidth={2.1} />}
        />
        <Button size="md" variant="tertiary" onPress={onRetry}>
          <Button.Label>重新載入</Button.Label>
        </Button>
      </View>
    );
  }

  return <EmptyState title={emptyTitle} caption={emptyCaption} icon={emptyIcon} />;
}
