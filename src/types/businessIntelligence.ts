/**
 * @file businessIntelligence.ts
 * @module تعريفات الأنواع والبيانات (TypeScript Types)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: businessIntelligence.ts.
 */
export interface BusinessHealth {
  id: string;
  companyId: string;
  branchId: string;
  score: number; // 0-100
  metrics: Record<string, number>;
  calculatedAt: Date;
  aiExplanation: string;
}

export interface KPI {
  id: string;
  name: string;
  description: string;
  target: number;
  actual: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  weight: number;
}

export interface AnalyticsResult {
  id: string;
  module: string;
  type: 'sales' | 'inventory' | 'finance' | 'customer';
  data: any;
  generatedAt: Date;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  variables: Record<string, number>;
  impact: Record<string, number>;
  createdAt: Date;
}

export interface AIRecommendation {
  id: string;
  type: string;
  content: string;
  reason: string;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface PredictionResult {
  id: string;
  type: 'sales' | 'inventory' | 'cashflow';
  prediction: number;
  confidence: number;
  period: string;
  generatedAt: Date;
}

export interface RootCauseAnalysis {
  id: string;
  insightId: string;
  whatHappened: string;
  whyItHappened: string;
  responsibleEntityId?: string; // Branch, Employee, Customer
  impactFinancial: number;
  confidence: number;
  createdAt: Date;
}
