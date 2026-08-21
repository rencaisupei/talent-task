import { Button, Spinner } from 'heroui-native';
import { ArrowLeft, ShieldOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ConfirmSheet } from '@/components/ConfirmSheet';
import { EmptyState } from '@/components/SectionHeading';
import { COLORS } from '@/lib/colors';
import { formatRelativeTime } from '@/lib/format';
import { goBackOrReplace } from '@/lib/navigation';
import { useBlockStore } from '@/lib/stores/blocks';

/** 封鎖名單：檢視誰被我封鎖，以及解除封鎖。封鎖動作本身在對話頁。 */
export default function BlockedUsersScreen() {
  const blocked = useBlockStore((state) => state.blocked);
  const loadState = useBlockStore((state) => state.loadState);
  const errorMessage = useBlockStore((state) => state.errorMessage);
  const refreshBlocks = useBlockStore((state) => state.refreshBlocks);
  const unblockUser = useBlockStore((state) => state.unblockUser);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refreshBlocks();
  }, [refreshBlocks]);

  const pending = blocked.find((item) => item.id === pendingId) ?? null;

  const handleConfirm = async () => {
    if (pendingId === null) return;
    setBusy(true);
    await unblockUser(pendingId);
    setBusy(false);
    setPendingId(null);
  };

  return (
    <View className="bg-background flex-1">
      <View className="border-hairline pt-safe-offset-3 flex-row items-center gap-3 border-b bg-white px-5 pb-4">
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)/profile')}
          accessibilityRole="button"
          accessibilityLabel="返回"
          className="bg-canvas h-9 w-9 items-center justify-center rounded-xl"
        >
          <ArrowLeft size={18} color={COLORS.ink} strokeWidth={2.2} />
        </Pressable>
        <Text className="text-ink flex-1 text-[17px] font-semibold">封鎖名單</Text>
      </View>

      <ScrollView
        contentContainerClassName="px-5 py-5 gap-4 pb-16"
        showsVerticalScrollIndicator={false}
      >
        <View className="border-hairline bg-canvas rounded-xl border px-4 py-3">
          <Text className="text-ink-soft text-[12px] leading-5">
            被封鎖的人無法再傳送訊息或開啟新對話，他們的任務與提案也不會出現在你的清單裡。要封鎖某個人，請在與他的對話頁右上角選擇「封鎖對方」。
          </Text>
        </View>

        {loadState === 'loading' && blocked.length === 0 ? (
          <View className="items-center gap-3 py-16">
            <Spinner size="md" />
            <Text className="text-muted text-[13px]">正在讀取封鎖名單…</Text>
          </View>
        ) : blocked.length === 0 ? (
          <EmptyState
            title={loadState === 'error' ? '暫時讀不到封鎖名單' : '你還沒有封鎖任何人'}
            caption={
              loadState === 'error'
                ? (errorMessage ?? '請確認網路後重新進入這個畫面。')
                : '遇到騷擾或可疑要求時，可以直接在對話頁封鎖對方並提出檢舉。'
            }
            icon={<ShieldOff size={22} color={COLORS.muted} strokeWidth={2.1} />}
          />
        ) : (
          blocked.map((item) => (
            <View key={item.id} className="border-hairline rounded-xl border bg-white p-4">
              <View className="flex-row items-center gap-3">
                <View className="bg-canvas h-11 w-11 items-center justify-center rounded-xl">
                  <Text className="text-ink text-[16px] font-bold">{item.name.slice(0, 1)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-ink text-[15px] font-semibold">{item.name}</Text>
                  <Text className="text-muted mt-0.5 text-[12px]">
                    {formatRelativeTime(item.at)}封鎖
                    {item.reason === null ? '' : `・${item.reason}`}
                  </Text>
                </View>
              </View>
              <Button
                size="md"
                variant="tertiary"
                className="mt-3"
                onPress={() => setPendingId(item.id)}
              >
                <Button.Label>解除封鎖</Button.Label>
              </Button>
            </View>
          ))
        )}
      </ScrollView>

      <ConfirmSheet
        visible={pending !== null}
        title="解除封鎖？"
        message={`解除後 ${pending?.name ?? '對方'} 可以再次與你聯絡，他的任務與提案也會重新出現在清單中。`}
        actions={[{ id: 'confirm', label: busy ? '處理中' : '確認解除', tone: 'primary' }]}
        onSelect={() => void handleConfirm()}
        onCancel={() => setPendingId(null)}
      />
    </View>
  );
}
