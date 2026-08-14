export type UserRole = 'client' | 'talent';

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type BudgetLevelId = 'B1' | 'B2' | 'B3' | 'B4' | 'B5';

export interface BudgetLevel {
  id: BudgetLevelId;
  label: string;
  hint: string;
}

export const BUDGET_LEVELS: BudgetLevel[] = [
  { id: 'B1', label: '1,000 元以下', hint: '小型急件' },
  { id: 'B2', label: '1,000 – 5,000 元', hint: '單次到府' },
  { id: 'B3', label: '5,000 – 20,000 元', hint: '標準專案' },
  { id: 'B4', label: '20,000 元以上', hint: '大型委託' },
  { id: 'B5', label: '價格面議', hint: '討論後報價' },
];

export interface GigLocation {
  region: string;
  detail?: string;
  latitude?: number;
  longitude?: number;
  source: 'gps' | 'manual';
}

export interface Gig {
  id: string;
  title: string;
  categoryId: string;
  tag: string;
  detail: string;
  location: GigLocation;
  budgetLevel: BudgetLevelId;
  isUrgent: boolean;
  clientId: string;
  clientName: string;
  createdAt: number;
  status: 'open' | 'talking' | 'closed';
}

export type ModerationState = 'clean' | 'flagged';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  at: number;
  moderation: ModerationState;
  flaggedTerms: string[];
}

export interface Conversation {
  id: string;
  gigId: string;
  gigTitle: string;
  tag: string;
  clientId: string;
  clientName: string;
  talentId: string;
  talentName: string;
  createdAt: number;
  lastMessageAt: number;
  isReported: boolean;
}

export interface TalentProfile {
  id: string;
  name: string;
  region: string;
  tags: string[];
  isPremium: boolean;
  verification: VerificationStatus;
  credentialUri?: string;
  completedJobs: number;
  rating: number;
}

export interface VerificationRequest {
  id: string;
  talentId: string;
  talentName: string;
  region: string;
  tags: string[];
  credentialUri?: string;
  submittedAt: number;
  status: VerificationStatus;
  note?: string;
}

export interface AbuseReport {
  id: string;
  conversationId: string;
  reportedUserId: string;
  reportedUserName: string;
  reporterName: string;
  reason: string;
  createdAt: number;
  transcript: ChatMessage[];
  resolved: boolean;
}

export interface WeeklyPoint {
  weekLabel: string;
  value: number;
}
