/**
 * @file smartSupport.ts
 * @module MARO Smart Support & Ticket Intelligence
 * @description نماذج وبيانات منظومة الدعم الفني الذكي المتكاملة لـ MARO Business Platform v4.0
 */

export type SupportModule = 
  | 'POS' 
  | 'INVENTORY' 
  | 'SALES' 
  | 'PURCHASES' 
  | 'ACCOUNTING' 
  | 'HARDWARE_PRINTING' 
  | 'SYNC_OFFLINE' 
  | 'SECURITY_LICENSING' 
  | 'ZATCA_E_INVOICE' 
  | 'REPORTS_BI' 
  | 'MANUFACTURING' 
  | 'GENERAL';

export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SessionStatus = 'ACTIVE' | 'RESOLVED_BY_AI' | 'ESCALATED' | 'ABANDONED';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export type KnowledgeStatus = 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED';

export interface DiagnosticAction {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  actionType: 'AUTO_CHECK' | 'USER_ACTION' | 'CONFIG_VERIFICATION' | 'SYSTEM_RETRY';
  autoActionKey?: 'CHECK_PERMISSIONS' | 'CHECK_SYNC_QUEUE' | 'CHECK_STOCK' | 'CHECK_PRINTER' | 'CHECK_LICENSE' | 'PING_SERVER';
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  resultMessage?: string;
  timestamp: string;
}

export interface SupportDiagnosis {
  module: SupportModule;
  screen?: string;
  feature?: string;
  errorType: string;
  severity: IssueSeverity;
  businessImpact: string;
  causeProbability: { cause: string; probability: number }[];
  matchedArticleId?: string;
  confidenceScore: number;
  isConfidenceReliable: boolean; // False if AI is unsure, avoiding false guesses
}

export interface SupportSession {
  id: string;
  tenantId: string;
  branchId: string;
  userId: string;
  userName: string;
  deviceId: string;
  screen: string;
  module: SupportModule;
  userQuery: string;
  diagnosis: SupportDiagnosis;
  actionsTaken: DiagnosticAction[];
  status: SessionStatus;
  currentStepIndex: number;
  resolvedArticleId?: string;
  feedbackRating?: number;
  feedbackComment?: string;
  ticketId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string; // e.g. TICK-2026-4821
  tenantId: string;
  companyName: string;
  branchId: string;
  branchName: string;
  userId: string;
  userName: string;
  userEmail?: string;
  deviceId: string;
  module: SupportModule;
  screen: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: TicketStatus;
  assignedTo?: string;
  assignedAgentName?: string;
  
  // AI Intelligence Context
  aiSessionId?: string;
  aiSummary: string;
  detectedSymptoms: string[];
  actionsAttempted: { step: number; title: string; result: string; status: string }[];
  diagnosticEvidence: Record<string, any>;
  recommendedNextAction: string;
  knowledgeArticlesUsed: string[];
  
  // Safe Client Telemetry Context
  clientContext: {
    appVersion: string;
    licensePlan: string;
    licenseStatus: string;
    isOnline: boolean;
    syncQueuePendingCount: number;
    recentErrorCode?: string;
    operatingSystem?: string;
    browserUserAgent?: string;
  };
  
  resolution?: string;
  resolvedAt?: string;
  resolutionTimeMinutes?: number;
  knowledgeCandidate?: boolean;
  knowledgeStatus?: KnowledgeStatus;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessageEvent {
  id: string;
  ticketId: string;
  senderType: 'USER' | 'AI_ASSISTANT' | 'SUPPORT_AGENT' | 'SYSTEM';
  senderName: string;
  message: string;
  attachments?: { name: string; url: string; type: string }[];
  isInternalNote?: boolean;
  createdAt: string;
}

export interface KnowledgeArticle {
  id: string;
  tenantId: string; // 'global' or tenant ID
  title: string;
  titleArabic: string;
  module: SupportModule;
  category: string;
  symptoms: string[];
  possibleCauses: string[];
  diagnosticSteps: {
    step: number;
    title: string;
    instruction: string;
    autoCheckAction?: string;
  }[];
  solution: string;
  solutionArabic: string;
  alternativeSolutions: string[];
  requiredPermissions: string[];
  affectedVersions: string[];
  severity: IssueSeverity;
  
  // Dynamic metrics
  attemptsCount: number;
  solvedCount: number;
  successRate: number; // percentage (e.g. 92.5%)
  avgResolutionSeconds: number;
  ratingAverage: number;
  
  status: KnowledgeStatus;
  tags: string[];
  mediaUrls: string[];
  originTicketId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemCluster {
  id: string;
  module: SupportModule;
  clusterKey: string;
  name: string;
  nameArabic: string;
  description: string;
  ticketCount: number;
  activeIssueCount: number;
  commonResolution: string;
  subClusters?: { name: string; count: number }[];
}

export interface SupportAnalyticsOverview {
  totalSessions: number;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  aiResolvedCount: number;
  humanResolvedCount: number;
  aiResolutionRate: number; // e.g. 72%
  humanEscalationRate: number; // e.g. 28%
  averageFirstResponseMinutes: number;
  averageResolutionMinutes: number;
  repeatedProblemsCount: number;
  topModules: { module: SupportModule; count: number; percentage: number }[];
  topBranches: { branchName: string; count: number }[];
  topClusters: { name: string; count: number; module: SupportModule }[];
  mostEffectiveSolutions: { title: string; successRate: number; count: number }[];
  failedSolutions: { title: string; failureRate: number; count: number }[];
  dailyTrends: { date: string; tickets: number; aiResolved: number; escalated: number }[];
}

export interface SimilarTicketMatch {
  ticket: SupportTicket;
  similarityScore: number; // percentage 0-100
  matchingFactors: string[];
  usedSolution?: string;
}
