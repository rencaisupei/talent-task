import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_ME } from '@/lib/data/seed';
import type { Profile } from '@/lib/types';
import { isValidEmail, maskIdNumber, normalizeEmail, passwordIssue } from '@/lib/validation';

/** 實名認證（KYC）狀態。 */
export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';

/** 可用來實名認證的證件類型。 */
export type KycDocType = 'idCard' | 'residentId' | 'passport';

/** 需要上傳的影像欄位。 */
export type KycDocSlot = 'front' | 'back' | 'selfie';

export interface KycRecord {
  status: KycStatus;
  /** 與證件相同的真實姓名。 */
  legalName: string;
  /** 只保留遮罩後的證件號碼，完整號碼在正式版由後端加密保存。 */
  maskedIdNumber: string;
  docType: KycDocType;
  birthDate: string;
  uploadedSlots: KycDocSlot[];
  submittedAt: number | null;
  reviewedAt: number | null;
  rejectReason: string | null;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export interface KycInput {
  legalName: string;
  idNumber: string;
  docType: KycDocType;
  birthDate: string;
  uploadedSlots: KycDocSlot[];
}

/** 註冊流程的下一站。 */
export type AuthRoute = '/verify' | '/kyc' | '/onboarding' | '/(tabs)';

/** 信箱驗證碼長度。 */
export const EMAIL_CODE_LENGTH = 6;

export const KYC_DOC_LABEL: Record<KycDocType, string> = {
  idCard: '國民身分證',
  residentId: '居留證',
  passport: '護照',
};

export const KYC_STATUS_LABEL: Record<KycStatus, string> = {
  none: '尚未認證',
  pending: '審核中',
  verified: '已通過',
  rejected: '未通過',
};

export const KYC_SLOT_LABEL: Record<KycDocSlot, string> = {
  front: '證件正面',
  back: '證件背面',
  selfie: '手持證件自拍',
};

const EMPTY_KYC: KycRecord = {
  status: 'none',
  legalName: '',
  maskedIdNumber: '',
  docType: 'idCard',
  birthDate: '',
  uploadedSlots: [],
  submittedAt: null,
  reviewedAt: null,
  rejectReason: null,
};

interface AuthData {
  /** 已完成所有註冊步驟並進入 App。 */
  isAuthed: boolean;
  /** 已用電子郵件建立帳號。 */
  registered: boolean;
  /** 已完成個人檔案設定。 */
  onboarded: boolean;
  email: string;
  /**
   * 示範模式把密碼存在本機，只為了讓登出後還能再登入。
   * 接上後端後改成由伺服器保管雜湊值，前端不留任何密碼。
   */
  password: string;
  emailVerified: boolean;
  kyc: KycRecord;
  identityVerified: boolean;
  me: Profile;
  incognito: boolean;
  showOnlineStatus: boolean;
  showDistance: boolean;
  blockedIds: string[];
}

interface AuthState extends AuthData {
  register: (payload: { email: string; password: string; confirm: string }) => AuthResult;
  signIn: (payload: { email: string; password: string }) => AuthResult;
  verifyEmailCode: (code: string) => boolean;
  /** 忘記密碼：確認信箱是否存在，可以寄出重設驗證碼。 */
  requestPasswordReset: (email: string) => AuthResult;
  /** 忘記密碼：驗證碼通過後直接設定新密碼。 */
  resetPassword: (payload: { email: string; next: string; confirm: string }) => AuthResult;
  changePassword: (payload: { current: string; next: string; confirm: string }) => AuthResult;
  submitKyc: (input: KycInput) => void;
  setKycStatus: (status: KycStatus, rejectReason?: string) => void;
  resetKyc: () => void;
  finishOnboarding: (patch: Partial<Profile>) => void;
  updateMe: (patch: Partial<Profile>) => void;
  setPhoto: (index: number, uri: string) => void;
  addPhoto: (uri: string) => void;
  removePhoto: (index: number) => void;
  reorderPhotoToFront: (index: number) => void;
  setPrivacy: (patch: {
    incognito?: boolean;
    showOnlineStatus?: boolean;
    showDistance?: boolean;
  }) => void;
  setIdentityVerified: (value: boolean) => void;
  toggleBlocked: (id: string) => void;
  logout: () => void;
  deleteAccount: () => void;
}

const INITIAL: AuthData = {
  isAuthed: false,
  registered: false,
  onboarded: false,
  email: '',
  password: '',
  emailVerified: false,
  kyc: EMPTY_KYC,
  identityVerified: false,
  me: DEFAULT_ME,
  incognito: false,
  showOnlineStatus: true,
  showDistance: true,
  blockedIds: [],
};

/** 依帳號目前的完成度決定要跳去哪一步。 */
export function nextAuthRoute(state: Pick<AuthData, 'emailVerified' | 'kyc' | 'onboarded'>) {
  if (!state.emailVerified) return '/verify' as const;
  if (state.kyc.status !== 'verified') return '/kyc' as const;
  if (!state.onboarded) return '/onboarding' as const;
  return '/(tabs)' as const;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      register: ({ email, password, confirm }) => {
        const normalized = normalizeEmail(email);
        if (!isValidEmail(normalized)) return { ok: false, error: '請輸入正確的電子郵件地址' };
        const issue = passwordIssue(password);
        if (issue) return { ok: false, error: issue };
        if (password !== confirm) return { ok: false, error: '兩次輸入的密碼不一樣' };

        const state = get();
        if (state.registered && state.email === normalized) {
          return { ok: false, error: '這個信箱已經註冊過了，請直接登入' };
        }

        set({
          ...INITIAL,
          registered: true,
          email: normalized,
          password,
          me: { ...DEFAULT_ME, verified: false },
        });
        return { ok: true };
      },

      signIn: ({ email, password }) => {
        const normalized = normalizeEmail(email);
        if (!isValidEmail(normalized)) return { ok: false, error: '請輸入正確的電子郵件地址' };
        if (password.length === 0) return { ok: false, error: '請輸入密碼' };

        const state = get();
        if (!state.registered) return { ok: false, error: '找不到這個帳號，請先註冊' };
        if (state.email !== normalized) return { ok: false, error: '找不到這個帳號，請先註冊' };
        if (state.password !== password) return { ok: false, error: '密碼不正確，請再試一次' };

        set({ isAuthed: nextAuthRoute(state) === '/(tabs)' });
        return { ok: true };
      },

      verifyEmailCode: (code) => {
        const digits = code.replace(/\D/g, '');
        if (digits.length !== EMAIL_CODE_LENGTH) return false;
        set({ emailVerified: true });
        return true;
      },

      requestPasswordReset: (email) => {
        const normalized = normalizeEmail(email);
        if (!isValidEmail(normalized)) return { ok: false, error: '請輸入正確的電子郵件地址' };
        const state = get();
        if (!state.registered || state.email !== normalized) {
          return { ok: false, error: '找不到用這個信箱註冊的帳號' };
        }
        return { ok: true };
      },

      resetPassword: ({ email, next, confirm }) => {
        const normalized = normalizeEmail(email);
        const state = get();
        if (!state.registered || state.email !== normalized) {
          return { ok: false, error: '找不到用這個信箱註冊的帳號' };
        }
        const issue = passwordIssue(next);
        if (issue) return { ok: false, error: issue };
        if (next !== confirm) return { ok: false, error: '兩次輸入的新密碼不一樣' };
        if (next === state.password) return { ok: false, error: '新密碼不能和舊密碼相同' };
        // 能收到重設驗證碼就代表信箱可用，順便補上信箱驗證狀態。
        set({ password: next, emailVerified: true });
        return { ok: true };
      },

      changePassword: ({ current, next, confirm }) => {
        const state = get();
        if (!state.registered) return { ok: false, error: '尚未建立帳號' };
        if (state.password !== current) return { ok: false, error: '目前的密碼不正確' };
        const issue = passwordIssue(next);
        if (issue) return { ok: false, error: issue };
        if (next !== confirm) return { ok: false, error: '兩次輸入的新密碼不一樣' };
        if (next === current) return { ok: false, error: '新密碼不能和目前的密碼相同' };
        set({ password: next });
        return { ok: true };
      },

      submitKyc: (input) =>
        set((state) => ({
          kyc: {
            status: 'pending',
            legalName: input.legalName.trim(),
            maskedIdNumber: maskIdNumber(input.idNumber),
            docType: input.docType,
            birthDate: input.birthDate,
            uploadedSlots: input.uploadedSlots,
            submittedAt: Date.now(),
            reviewedAt: null,
            rejectReason: null,
          },
          identityVerified: false,
          me: { ...state.me, verified: false },
        })),

      setKycStatus: (status, rejectReason) =>
        set((state) => {
          const verified = status === 'verified';
          return {
            kyc: {
              ...state.kyc,
              status,
              reviewedAt: status === 'pending' ? null : Date.now(),
              rejectReason: rejectReason ?? null,
            },
            identityVerified: verified,
            me: { ...state.me, verified },
          };
        }),

      resetKyc: () =>
        set((state) => ({
          kyc: EMPTY_KYC,
          identityVerified: false,
          me: { ...state.me, verified: false },
        })),

      finishOnboarding: (patch) =>
        set((state) => ({
          isAuthed: true,
          onboarded: true,
          me: { ...state.me, ...patch },
        })),

      updateMe: (patch) => set((state) => ({ me: { ...state.me, ...patch } })),

      setPhoto: (index, uri) =>
        set((state) => {
          const photos = [...state.me.photos];
          photos[index] = uri;
          return { me: { ...state.me, photos } };
        }),

      addPhoto: (uri) =>
        set((state) => ({ me: { ...state.me, photos: [...state.me.photos, uri] } })),

      removePhoto: (index) =>
        set((state) => ({
          me: { ...state.me, photos: state.me.photos.filter((_, i) => i !== index) },
        })),

      reorderPhotoToFront: (index) =>
        set((state) => {
          const photos = [...state.me.photos];
          const [picked] = photos.splice(index, 1);
          if (!picked) return state;
          return { me: { ...state.me, photos: [picked, ...photos] } };
        }),

      setPrivacy: (patch) => set(patch),

      setIdentityVerified: (identityVerified) =>
        set((state) => ({ identityVerified, me: { ...state.me, verified: identityVerified } })),

      toggleBlocked: (id) => {
        const blocked = get().blockedIds;
        set({
          blockedIds: blocked.includes(id)
            ? blocked.filter((item) => item !== id)
            : [...blocked, id],
        });
      },

      /** 登出只結束這次的登入狀態，帳號、實名認證與個人檔案都留著。 */
      logout: () => set({ isAuthed: false }),

      /** 刪除帳號會把本機資料全部清空。 */
      deleteAccount: () => set({ ...INITIAL }),
    }),
    {
      name: 'jimatch-auth',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted, version) => {
        if (version >= 2) return persisted;
        // 版本 1 是手機號碼登入，改成信箱註冊後請使用者重新建立帳號。
        const old = (persisted ?? {}) as Partial<AuthData>;
        return {
          ...INITIAL,
          me: old.me ?? DEFAULT_ME,
          blockedIds: old.blockedIds ?? [],
        };
      },
    },
  ),
);

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return undefined;
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  return hydrated;
}
