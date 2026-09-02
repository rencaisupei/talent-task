import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useAdminStore } from '@/lib/stores/admin';

/** 聯絡表單的問題分類。 */
export type SupportTopic = 'account' | 'payment' | 'safety' | 'bug' | 'feature' | 'other';

export type SupportTicketStatus = 'submitted' | 'inProgress' | 'answered' | 'closed';

/** 表單上的分類顯示順序。 */
export const SUPPORT_TOPICS: SupportTopic[] = [
  'account',
  'payment',
  'safety',
  'bug',
  'feature',
  'other',
];

export const SUPPORT_TOPIC_LABEL: Record<SupportTopic, string> = {
  account: '帳號與登入',
  payment: '付款與代幣',
  safety: '檢舉與安全',
  bug: '功能異常',
  feature: '功能建議',
  other: '其他問題',
};

export const SUPPORT_TOPIC_HINT: Record<SupportTopic, string> = {
  account: '無法登入、信箱驗證、實名認證',
  payment: '訂閱、代幣、發票與退款',
  safety: '騷擾、詐騙、可疑帳號',
  bug: '閃退、畫面異常、功能沒反應',
  feature: '想要的新功能或改善建議',
  other: '以上都不符合',
};

export const SUPPORT_STATUS_LABEL: Record<SupportTicketStatus, string> = {
  submitted: '已送出',
  inProgress: '處理中',
  answered: '已回覆',
  closed: '已結案',
};

/** 客服單回覆的工作日承諾，畫面與條款共用同一個數字。 */
export const SUPPORT_REPLY_DAYS = 3;

export interface SupportTicket {
  id: string;
  /** 給使用者對照的單號。 */
  ref: string;
  topic: SupportTopic;
  email: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  /** 使用者同意附上的版本／裝置資訊，沒同意時為 null。 */
  deviceInfo: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface SupportTicketInput {
  topic: SupportTopic;
  email: string;
  subject: string;
  message: string;
  deviceInfo?: string | null;
}

interface SupportState {
  tickets: SupportTicket[];
  submit: (input: SupportTicketInput) => SupportTicket;
  closeTicket: (id: string) => void;
  clearTickets: () => void;
}

function pad(value: number) {
  return `${value}`.padStart(2, '0');
}

/** 單號格式：JM-YYMMDD-1234，方便使用者在信件中引用。 */
function makeRef(now: Date) {
  const stamp = `${`${now.getFullYear()}`.slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const serial = `${Math.floor(1000 + Math.random() * 9000)}`;
  return `JM-${stamp}-${serial}`;
}

export const useSupportStore = create<SupportState>()(
  persist(
    (set) => ({
      tickets: [],

      submit: (input) => {
        const now = Date.now();
        const ticket: SupportTicket = {
          id: `ticket-${now}-${Math.random().toString(36).slice(2, 7)}`,
          ref: makeRef(new Date(now)),
          topic: input.topic,
          email: input.email.trim().toLowerCase(),
          subject: input.subject.trim(),
          message: input.message.trim(),
          status: 'submitted',
          deviceInfo: input.deviceInfo ?? null,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({ tickets: [ticket, ...state.tickets].slice(0, 50) }));

        // 讓後台的稽核紀錄看得到新進的客服單。
        useAdminStore
          .getState()
          .logAgent('聯絡表單', `新進客服單（${SUPPORT_TOPIC_LABEL[ticket.topic]}）`, ticket.ref);

        return ticket;
      },

      closeTicket: (id) =>
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === id ? { ...ticket, status: 'closed', updatedAt: Date.now() } : ticket,
          ),
        })),

      clearTickets: () => set({ tickets: [] }),
    }),
    {
      name: 'jimatch-support',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ tickets: state.tickets }),
    },
  ),
);

/** 尚未結案的客服單數量，用在設定頁的提示。 */
export function useOpenTicketCount() {
  return useSupportStore(
    (state) => state.tickets.filter((ticket) => ticket.status !== 'closed').length,
  );
}
