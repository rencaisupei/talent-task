import { Button, Input, Label, Switch, TextField } from 'heroui-native';
import {
  CircleCheck,
  Copy,
  KeyRound,
  Lock,
  RotateCcw,
  ScrollText,
  Trash2,
  TriangleAlert,
  UserPlus,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { SectionHeading } from '@/components/SectionHeading';
import { SegmentedTabs, type SegmentOption } from '@/components/SegmentedTabs';
import { StaticTag } from '@/components/TagChip';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import {
  ADMIN_LOGIN_OUTCOME_LABEL,
  adminCreateAccount,
  adminDeleteAccount,
  adminFetchLoginEvents,
  adminListAccounts,
  adminResetAccountPassword,
  adminUpdateAccount,
  type AdminLoginEvent,
} from '@/lib/adminApi';
import { ADMIN_ROLE_SUMMARY } from '@/lib/adminPermissions';
import { COLORS } from '@/lib/colors';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { useAdminAuthStore } from '@/lib/stores/adminAuth';
import { ADMIN_ROLE_LABEL, type AdminRole, type ManagedAdminAccount } from '@/lib/types';

const ROLE_OPTIONS: SegmentOption<AdminRole>[] = [
  { id: 'owner', label: ADMIN_ROLE_LABEL.owner },
  { id: 'moderator', label: ADMIN_ROLE_LABEL.moderator },
  { id: 'analyst', label: ADMIN_ROLE_LABEL.analyst },
];

interface PendingAction {
  kind: 'reset' | 'delete';
  account: ManagedAdminAccount;
}

export default function AdminAccountsScreen() {
  const token = useAdminAuthStore((state) => state.token);
  const currentAdmin = useAdminAuthStore((state) => state.currentAdmin);
  const refreshSession = useAdminAuthStore((state) => state.refreshSession);
  const changePassword = useAdminAuthStore((state) => state.changePassword);
  const logAction = useAuditLogger();

  const [accounts, setAccounts] = useState<ManagedAdminAccount[]>([]);
  const [events, setEvents] = useState<AdminLoginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [issuedCode, setIssuedCode] = useState<{ email: string; code: string } | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('moderator');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmNextPassword, setConfirmNextPassword] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const load = useCallback(async () => {
    if (token === null) return;

    setLoading(true);
    const [accountResult, eventResult] = await Promise.all([
      adminListAccounts(token),
      adminFetchLoginEvents(token, 20),
    ]);
    setLoading(false);

    if (accountResult.kind === 'ok') {
      setAccounts(accountResult.accounts);
      setError(null);
    } else if (accountResult.kind === 'expired') {
      void refreshSession();
    } else if (accountResult.kind === 'forbidden') {
      setError('你的角色沒有管理員帳號管理權限。');
    } else {
      setError(accountResult.message);
    }

    if (eventResult.kind === 'ok') setEvents(eventResult.events);
  }, [refreshSession, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (token === null) return;

    setCreating(true);
    setError(null);
    setNotice(null);
    const result = await adminCreateAccount(token, {
      email: newEmail,
      name: newName,
      role: newRole,
      password: newPassword.length > 0 ? newPassword : undefined,
    });
    setCreating(false);

    if (result.kind !== 'ok') {
      if (result.kind === 'expired') void refreshSession();
      setError(
        result.kind === 'failed'
          ? result.message
          : result.kind === 'forbidden'
            ? '你的角色沒有管理員帳號管理權限。'
            : '登入狀態已過期，請重新登入。',
      );
      return;
    }

    logAction({
      kind: 'account',
      summary: `新增管理員 ${result.account.name}（${ADMIN_ROLE_LABEL[result.account.role]}）`,
      targetId: result.account.id,
      targetLabel: result.account.email,
    });

    setNewEmail('');
    setNewName('');
    setNewPassword('');
    if (result.setupCode !== null) {
      setIssuedCode({ email: result.account.email, code: result.setupCode });
      setNotice('已建立帳號，請把下方一次性啟用碼交給對方（僅顯示這一次）。');
    } else {
      setNotice(`已建立帳號 ${result.account.email}，可直接以你設定的密碼登入。`);
    }
    await load();
  };

  const applyUpdate = async (
    account: ManagedAdminAccount,
    payload: { role?: AdminRole; isActive?: boolean },
    summary: string,
  ) => {
    if (token === null) return;

    setError(null);
    setNotice(null);
    const result = await adminUpdateAccount(token, { id: account.id, ...payload });

    if (result.kind !== 'ok') {
      if (result.kind === 'expired') void refreshSession();
      setError(
        result.kind === 'failed'
          ? result.message
          : result.kind === 'forbidden'
            ? '你的角色沒有管理員帳號管理權限。'
            : '登入狀態已過期，請重新登入。',
      );
      return;
    }

    logAction({
      kind: 'account',
      summary,
      targetId: account.id,
      targetLabel: account.email,
    });
    setNotice(summary);
    await load();
  };

  const confirmPending = async () => {
    const action = pending;
    setPending(null);
    if (action === null || token === null) return;

    if (action.kind === 'reset') {
      const result = await adminResetAccountPassword(token, action.account.id);
      if (result.kind !== 'ok') {
        if (result.kind === 'expired') void refreshSession();
        setError(result.kind === 'failed' ? result.message : '無法重設密碼。');
        return;
      }

      logAction({
        kind: 'account',
        summary: `重設 ${action.account.name} 的密碼並撤銷其工作階段`,
        targetId: action.account.id,
        targetLabel: action.account.email,
      });
      setIssuedCode({ email: action.account.email, code: result.setupCode ?? '' });
      setNotice('密碼已清除，請把新的一次性啟用碼交給對方（僅顯示這一次）。');
      await load();
      return;
    }

    const result = await adminDeleteAccount(token, action.account.id);
    if (result.kind !== 'ok') {
      if (result.kind === 'expired') void refreshSession();
      setError(result.kind === 'failed' ? result.message : '無法刪除帳號。');
      return;
    }

    logAction({
      kind: 'account',
      summary: `刪除管理員帳號 ${action.account.name}`,
      targetId: action.account.id,
      targetLabel: action.account.email,
    });
    setNotice(`已刪除 ${action.account.email}。`);
    await load();
  };

  const handleChangeOwnPassword = async () => {
    if (nextPassword !== confirmNextPassword) {
      setError('兩次輸入的新密碼不一致。');
      return;
    }

    setChangingPassword(true);
    setError(null);
    setNotice(null);
    const outcome = await changePassword(currentPassword, nextPassword);
    setChangingPassword(false);

    if (outcome.kind === 'ok') {
      setCurrentPassword('');
      setNextPassword('');
      setConfirmNextPassword('');
      setNotice('密碼已更新，其他裝置上的工作階段都已登出。');
      await load();
      return;
    }

    setError(
      outcome.kind === 'rejected' || outcome.kind === 'unavailable'
        ? outcome.message
        : '無法變更密碼，請重新登入後再試。',
    );
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AdminHeader title="管理員帳號管理" caption={`${accounts.length} 個帳號・角色決定可用模組`} />

      <ScrollView
        contentContainerClassName="px-5 py-5 pb-12 gap-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {error === null ? null : (
          <View className="border-coral/25 bg-coral-soft flex-row items-start gap-2 rounded-xl border px-3 py-2.5">
            <TriangleAlert size={15} color={COLORS.coral} strokeWidth={2.2} />
            <Text className="text-coral flex-1 text-[12px] leading-4 font-semibold">{error}</Text>
          </View>
        )}

        {notice === null ? null : (
          <View className="border-brand/25 bg-brand-soft flex-row items-start gap-2 rounded-xl border px-3 py-2.5">
            <CircleCheck size={15} color={COLORS.brandStrong} strokeWidth={2.2} />
            <Text className="text-ink flex-1 text-[12px] leading-4 font-semibold">{notice}</Text>
          </View>
        )}

        {issuedCode === null ? null : (
          <View className="border-hairline gap-2 rounded-xl border bg-white p-4">
            <View className="flex-row items-center gap-2">
              <KeyRound size={15} color={COLORS.brandStrong} strokeWidth={2.2} />
              <Text className="text-ink text-[14px] font-semibold">一次性啟用碼</Text>
            </View>
            <Text className="text-muted text-[12px]">{issuedCode.email}</Text>
            <Text className="text-ink bg-canvas rounded-xl px-3 py-2.5 text-[18px] font-bold tracking-widest">
              {issuedCode.code}
            </Text>
            <Text className="text-muted text-[11px] leading-4">
              對方在登入頁以此碼取代密碼，即可設定自己的新密碼；設定完成或 14 天後失效。
              請用另一個管道（電話、面對面）轉達，不要與帳號寫在同一封信裡。
            </Text>
            <Pressable
              onPress={() => setIssuedCode(null)}
              accessibilityRole="button"
              className="flex-row items-center gap-1.5 self-start"
            >
              <Copy size={13} color={COLORS.muted} strokeWidth={2.2} />
              <Text className="text-muted text-[12px] font-semibold">已抄下，隱藏此區</Text>
            </Pressable>
          </View>
        )}

        <View className="gap-3">
          <SectionHeading
            title="管理員清單"
            caption={loading ? '讀取中…' : '角色變更或停用會立即撤銷該帳號的登入狀態'}
          />
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              isSelf={account.id === currentAdmin?.id}
              onChangeRole={(role) =>
                void applyUpdate(
                  account,
                  { role },
                  `將 ${account.name} 的角色改為${ADMIN_ROLE_LABEL[role]}`,
                )
              }
              onToggleActive={(isActive) =>
                void applyUpdate(
                  account,
                  { isActive },
                  `${isActive ? '啟用' : '停用'}管理員帳號 ${account.name}`,
                )
              }
              onReset={() => setPending({ kind: 'reset', account })}
              onDelete={() => setPending({ kind: 'delete', account })}
            />
          ))}
        </View>

        <View className="border-hairline gap-4 rounded-xl border bg-white p-4">
          <View className="flex-row items-center gap-2">
            <UserPlus size={16} color={COLORS.brandStrong} strokeWidth={2.2} />
            <Text className="text-ink text-[15px] font-semibold">新增管理員</Text>
          </View>

          <TextField>
            <Label>登入信箱</Label>
            <Input
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="name@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </TextField>

          <TextField>
            <Label>顯示名稱</Label>
            <Input
              value={newName}
              onChangeText={setNewName}
              placeholder="例如：審核專員 林昀"
              autoCorrect={false}
            />
          </TextField>

          <View className="gap-2">
            <Text className="text-ink text-[13px] font-semibold">角色</Text>
            <SegmentedTabs options={ROLE_OPTIONS} value={newRole} onChange={setNewRole} />
            <Text className="text-muted text-[11px] leading-4">{ADMIN_ROLE_SUMMARY[newRole]}</Text>
          </View>

          <TextField>
            <Label>初始密碼（留空則發啟用碼）</Label>
            <Input
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="至少 10 個字元，含英文與數字"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showSecrets}
            />
          </TextField>

          <Text className="text-muted text-[11px] leading-4">
            建議留空：系統會產生一次性啟用碼，對方首次登入時自行設定密碼，你不會知道對方的密碼。
          </Text>

          <Button
            size="md"
            isDisabled={creating || newEmail.trim().length === 0 || newName.trim().length === 0}
            onPress={() => void handleCreate()}
          >
            <Button.Label>{creating ? '建立中…' : '建立管理員帳號'}</Button.Label>
          </Button>
        </View>

        {currentAdmin?.isProtected === true ? (
          <View className="border-brand/25 bg-brand-soft gap-2 rounded-xl border p-4">
            <View className="flex-row items-center gap-2">
              <Lock size={16} color={COLORS.brandStrong} strokeWidth={2.2} />
              <Text className="text-ink text-[15px] font-semibold">你的密碼由機密管理</Text>
            </View>
            <Text className="text-ink-soft text-[12px] leading-5">
              你登入的是固定總管理員帳號，密碼存放在後端加密機密
              ROOT_ADMIN_PASSWORD，平台上無法變更，也不會被其他管理員重設。要更換密碼請更新該機密，更新後立即以新密碼登入即可。
            </Text>
          </View>
        ) : (
          <View className="border-hairline gap-4 rounded-xl border bg-white p-4">
            <View className="flex-row items-center gap-2">
              <KeyRound size={16} color={COLORS.ink} strokeWidth={2.2} />
              <Text className="text-ink text-[15px] font-semibold">變更我的密碼</Text>
            </View>

            <TextField>
              <Label>目前的密碼</Label>
              <Input
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="輸入現在使用的密碼"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showSecrets}
              />
            </TextField>

            <TextField>
              <Label>新密碼</Label>
              <Input
                value={nextPassword}
                onChangeText={setNextPassword}
                placeholder="至少 10 個字元，含英文與數字"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showSecrets}
              />
            </TextField>

            <TextField>
              <Label>再次輸入新密碼</Label>
              <Input
                value={confirmNextPassword}
                onChangeText={setConfirmNextPassword}
                placeholder="確認新密碼"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showSecrets}
              />
            </TextField>

            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="text-ink text-[13px] font-semibold">顯示密碼欄位</Text>
                <Text className="text-muted mt-0.5 text-[12px]">避免輸入錯誤</Text>
              </View>
              <Switch isSelected={showSecrets} onSelectedChange={setShowSecrets} />
            </View>

            <Button
              size="md"
              variant="tertiary"
              isDisabled={
                changingPassword || currentPassword.length === 0 || nextPassword.length === 0
              }
              onPress={() => void handleChangeOwnPassword()}
            >
              <Button.Label>{changingPassword ? '更新中…' : '更新密碼'}</Button.Label>
            </Button>
          </View>
        )}

        <View className="gap-3">
          <SectionHeading title="登入紀錄" caption="伺服器端記錄，含失敗與鎖定事件" />
          <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
            {events.length === 0 ? (
              <Text className="text-muted text-[12px]">尚無登入紀錄。</Text>
            ) : (
              events.map((event) => (
                <View key={event.id} className="flex-row items-start gap-3">
                  <View className="bg-canvas h-8 w-8 items-center justify-center rounded-xl">
                    <ScrollText size={14} color={COLORS.muted} strokeWidth={2.2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink text-[13px] font-semibold">
                      {ADMIN_LOGIN_OUTCOME_LABEL[event.outcome] ?? event.outcome}
                    </Text>
                    <Text className="text-muted mt-0.5 text-[11px]">
                      {event.email}・{formatRelativeTime(event.at)}
                    </Text>
                  </View>
                  {event.outcome === 'success' ? null : <StaticTag label="需注意" tone="coral" />}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <ConfirmSheet
        visible={pending !== null}
        title={pending?.kind === 'delete' ? '刪除這個管理員帳號？' : '重設這個帳號的密碼？'}
        message={
          pending?.kind === 'delete'
            ? `${pending.account.email} 將被移除，該帳號所有工作階段立即失效。此動作無法復原。`
            : `${pending?.account.email ?? ''} 的密碼會被清除並產生一次性啟用碼，該帳號目前的登入狀態立即失效。`
        }
        actions={[
          {
            id: 'confirm',
            label: pending?.kind === 'delete' ? '確認刪除' : '確認重設',
            tone: 'danger',
          },
        ]}
        onSelect={() => void confirmPending()}
        onCancel={() => setPending(null)}
      />
    </KeyboardAvoidingView>
  );
}

interface AccountCardProps {
  account: ManagedAdminAccount;
  isSelf: boolean;
  onChangeRole: (role: AdminRole) => void;
  onToggleActive: (isActive: boolean) => void;
  onReset: () => void;
  onDelete: () => void;
}

function AccountCard({
  account,
  isSelf,
  onChangeRole,
  onToggleActive,
  onReset,
  onDelete,
}: AccountCardProps) {
  const isLocked = account.lockedUntil !== null && account.lockedUntil > Date.now();

  return (
    <View className="border-hairline gap-3 rounded-xl border bg-white p-4">
      <View className="flex-row items-start gap-3">
        <View className="bg-canvas h-10 w-10 items-center justify-center rounded-xl">
          <Text className="text-ink text-[15px] font-bold">{account.name.slice(0, 1)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-ink text-[15px] font-semibold">
            {account.name}
            {isSelf ? '（你）' : ''}
          </Text>
          <Text className="text-muted mt-0.5 text-[12px]">{account.email}</Text>
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            <StaticTag label={ADMIN_ROLE_LABEL[account.role]} tone="brand" />
            {account.isProtected ? <StaticTag label="固定・不可變更" tone="brand" /> : null}
            {account.isActive ? null : <StaticTag label="已停用" tone="coral" />}
            {account.isProtected || account.hasPassword ? null : (
              <StaticTag label="待設定密碼" tone="coral" />
            )}
            {isLocked ? <StaticTag label="鎖定中" tone="coral" /> : null}
          </View>
          <Text className="text-muted mt-2 text-[11px] leading-4">
            建立於 {formatDate(account.createdAt)}・
            {account.lastLoginAt === null
              ? '尚未登入'
              : `最近登入 ${formatRelativeTime(account.lastLoginAt)}`}
          </Text>
        </View>
      </View>

      {account.isProtected ? (
        <View className="border-brand/25 bg-brand-soft flex-row items-start gap-2 rounded-xl border px-3 py-2.5">
          <Lock size={14} color={COLORS.brandStrong} strokeWidth={2.2} />
          <Text className="text-ink-soft flex-1 text-[12px] leading-4">
            固定總管理員：帳號與密碼由伺服器端加密機密管理。這裡不能改角色、不能停用、不能刪除，也不能重設密碼——要換密碼請更新後端機密
            ROOT_ADMIN_PASSWORD。
          </Text>
        </View>
      ) : (
        <>
          <SegmentedTabs options={ROLE_OPTIONS} value={account.role} onChange={onChangeRole} />

          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-ink text-[13px] font-semibold">帳號啟用</Text>
              <Text className="text-muted mt-0.5 text-[11px]">
                {isSelf ? '無法停用自己的帳號' : '停用後立即無法登入'}
              </Text>
            </View>
            <Switch
              isSelected={account.isActive}
              isDisabled={isSelf}
              onSelectedChange={onToggleActive}
            />
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={onReset}
              accessibilityRole="button"
              accessibilityLabel={`重設 ${account.name} 的密碼`}
              className="border-hairline flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5"
            >
              <RotateCcw size={14} color={COLORS.ink} strokeWidth={2.2} />
              <Text className="text-ink text-[12px] font-semibold">重設密碼</Text>
            </Pressable>
            {isSelf ? null : (
              <Pressable
                onPress={onDelete}
                accessibilityRole="button"
                accessibilityLabel={`刪除 ${account.name} 的帳號`}
                className="border-coral/25 bg-coral-soft flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5"
              >
                <Trash2 size={14} color={COLORS.coral} strokeWidth={2.2} />
                <Text className="text-coral text-[12px] font-semibold">刪除帳號</Text>
              </Pressable>
            )}
          </View>
        </>
      )}
    </View>
  );
}
