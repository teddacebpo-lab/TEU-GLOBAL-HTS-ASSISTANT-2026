
// types.ts

export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export type SubscriptionTier = 'Free' | 'Basic' | 'Pro' | 'Enterprise';

export interface UserFeatures {
  canUploadImage: boolean;
  canUseVoice: boolean;
  maxHistory: number;
  queryLimits: {
    text: number; // Use Infinity for unlimited
    image: number; // Use Infinity for unlimited
  };
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  subscription: SubscriptionTier;
  features: UserFeatures;
  subscriptionExpires?: string; // YYYY-MM-DD format
}

export interface SubscriptionRequest {
  id: string;
  email: string;
  password: string;
  requestedTier: SubscriptionTier;
  status: 'pending';
}

export interface UserUsage {
  date: string; // YYYY-MM-DD
  textQueries: number;
  imageQueries: number;
}


export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export interface PrintData {
  query: string;
  htsCode: string;
  scenarioDescription: string;
  dutyInfo: {
    general: string;
    special: string;
    column2: string;
  };
  tariffInfo: string;
  complianceInfo: string;
  quickStats?: {
    totalDuty: number;
    baseDuty: number;
    additionalCount: number;
    agencies: string[];
  }
}

export type AiBehavior = 'concise' | 'detailed' | 'default';

export interface ClassificationHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  viewType: 'classification' | 'lookup';
}

export interface PasswordResetRequest {
    email: string;
    code: string;
    expires: number; // timestamp
}

export interface HtsRecommendation {
  scenario: string;
  htsCode: string;
  description: string;
}

export interface AdditionalTariff {
  name: string;
  rate: number;
  code: string;
}

export interface QuickStatsData {
  totalDuty: number;
  baseDuty: number;
  additionalTariffs: AdditionalTariff[];
  agencies: string[];
}

export interface ComplianceAlert {
  title: string;
  description: string;
  type: 'success' | 'info' | 'warning';
}

export interface AnalysisData {
  recommendations: HtsRecommendation[];
  quickStats: QuickStatsData;
  complianceAlerts: ComplianceAlert[];
}
