import { Lock } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { ADMIN_PERMISSION_LABEL, type AdminPermission } from '@/lib/adminPermissions';
import { COLORS } from '@/lib/colors';

interface ReadOnlyNoticeProps {
  permission: AdminPermission;
  /** 補充說明這個區塊被鎖住的是什麼動作。 */
  action: string;
}

/** 角色缺少權限時，取代按鈕顯示的唯讀提示。 */
export function ReadOnlyNotice({ permission, action }: ReadOnlyNoticeProps) {
  return (
    <View className="border-hairline bg-canvas flex-row items-start gap-2 rounded-xl border px-3 py-2.5">
      <Lock size={14} color={COLORS.muted} strokeWidth={2.2} />
      <Text className="text-ink-soft flex-1 text-[12px] leading-4">
        {action}需要「{ADMIN_PERMISSION_LABEL[permission]}」權限，你的角色為唯讀。
      </Text>
    </View>
  );
}
