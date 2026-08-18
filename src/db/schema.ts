/**
 * @file schema.ts
 * @module ملف إضافي في النظام
 * @description ملف جزء من نظام MARO ERP. الوظيفة: schema.ts.
 */
import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  uuid,
  index
} from 'drizzle-orm/pg-core';

// ==========================================
// CORE 0: TENANT & ISOLATION
// ==========================================

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default({}), // For Industry configurations & settings
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash'),
  role: varchar('role', { length: 100 }).notNull(), // RBAC role identifier
  permissions: jsonb('permissions').default({}), // Granular overrides
  failedAttempts: integer('failed_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  lastLoginAt: timestamp('last_login_at'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('users_tenant_idx').on(table.tenantId),
  emailIdx: index('users_email_idx').on(table.email),
}));

export const userBranches = pgTable('user_branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'cascade' }).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userTenantBranchIdx: index('user_branches_user_branch_idx').on(table.userId, table.branchId),
}));

// ==========================================
// CORE 1: FINANCE & ACCOUNTING
// ==========================================

export const chartOfAccounts = pgTable('chart_of_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  code: varchar('code', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  parentId: uuid('parent_id'), // Self-referencing for hierarchy
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default({}), // Dynamic fields per industry
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantCodeIdx: index('coa_tenant_code_idx').on(table.tenantId, table.code)
  };
});

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  reference: varchar('reference', { length: 100 }).notNull(),
  date: timestamp('date').notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('Draft').notNull(), // Draft, Posted, Cancelled
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const journalLines = pgTable('journal_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id, { onDelete: 'cascade' }).notNull(),
  accountId: uuid('account_id').references(() => chartOfAccounts.id).notNull(),
  debit: numeric('debit', { precision: 15, scale: 4 }).default('0').notNull(),
  credit: numeric('credit', { precision: 15, scale: 4 }).default('0').notNull(),
  description: text('description'),
  metadata: jsonb('metadata').default({}), // Dimensions, Cost Centers, etc.
});

// ==========================================
// CORE 2: INVENTORY & WAREHOUSE ENGINE
// ==========================================

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  code: varchar('code', { length: 100 }).notNull(),
  barcode: varchar('barcode', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).default('Stock').notNull(), // Stock, Service, Consumable
  costPrice: numeric('cost_price', { precision: 15, scale: 4 }).default('0'),
  salePrice: numeric('sale_price', { precision: 15, scale: 4 }).default('0'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('15.00'),
  stockQuantity: numeric('stock_quantity', { precision: 15, scale: 4 }).default('0'),
  unit: varchar('unit', { length: 50 }).default('PCS'),
  category: varchar('category', { length: 100 }).default('General'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default({}), // Variants, custom fields, batches, expiry
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stockLedger = pgTable('stock_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id).notNull(),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(), // Purchase, Sale, Transfer, Adjustment, POS
  reference: varchar('reference', { length: 100 }),
  quantity: numeric('quantity', { precision: 15, scale: 4 }).notNull(), // Positive for incoming, negative for outgoing
  unitCost: numeric('unit_cost', { precision: 15, scale: 4 }).notNull(),
  totalCost: numeric('total_cost', { precision: 15, scale: 4 }).default('0'),
  date: timestamp('date').defaultNow().notNull(),
  metadata: jsonb('metadata').default({}), // Batches, Expiry, Serial tracking dynamically injected
}, (table) => {
  return {
    tenantProductWhIdx: index('ledger_tenant_prod_wh_idx').on(table.tenantId, table.productId, table.warehouseId)
  };
});

// ==========================================
// CORE 3: CUSTOMERS & SUPPLIERS (ENTITIES)
// ==========================================

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  taxNumber: varchar('tax_number', { length: 100 }),
  creditLimit: numeric('credit_limit', { precision: 15, scale: 2 }).default('0'),
  currentBalance: numeric('current_balance', { precision: 15, scale: 2 }).default('0'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  taxNumber: varchar('tax_number', { length: 100 }),
  currentBalance: numeric('current_balance', { precision: 15, scale: 2 }).default('0'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// CORE 4: SALES MODULE
// ==========================================

export const salesInvoices = pgTable('sales_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  customerName: varchar('customer_name', { length: 255 }),
  date: timestamp('date').notNull(),
  subtotal: numeric('subtotal', { precision: 15, scale: 4 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 4 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 15, scale: 4 }).default('0'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 4 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 15, scale: 4 }).default('0'),
  status: varchar('status', { length: 50 }).default('Paid').notNull(), // Draft, Paid, PartiallyPaid, Cancelled
  paymentMethod: varchar('payment_method', { length: 50 }).default('Cash'), // Cash, Card, Credit, Split
  source: varchar('source', { length: 50 }).default('DirectSales'), // POS, DirectSales, ECommerce
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const salesInvoiceLines = pgTable('sales_invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => salesInvoices.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  productName: varchar('product_name', { length: 255 }),
  quantity: numeric('quantity', { precision: 15, scale: 4 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 4 }).notNull(),
  unitCost: numeric('unit_cost', { precision: 15, scale: 4 }).default('0'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('15.00'),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 4 }).default('0').notNull(),
  totalPrice: numeric('total_price', { precision: 15, scale: 4 }).notNull(),
  metadata: jsonb('metadata').default({}),
});

// ==========================================
// CORE 5: PURCHASES (BILLS) MODULE
// ==========================================

export const purchaseInvoices = pgTable('purchase_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  billNumber: varchar('bill_number', { length: 100 }).notNull(),
  supplierId: uuid('supplier_id').references(() => suppliers.id),
  supplierName: varchar('supplier_name', { length: 255 }),
  date: timestamp('date').notNull(),
  subtotal: numeric('subtotal', { precision: 15, scale: 4 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 4 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 4 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 15, scale: 4 }).default('0'),
  status: varchar('status', { length: 50 }).default('Paid').notNull(), // Draft, Paid, PartiallyPaid, Cancelled
  paymentMethod: varchar('payment_method', { length: 50 }).default('Cash'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const purchaseInvoiceLines = pgTable('purchase_invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  billId: uuid('bill_id').references(() => purchaseInvoices.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  productName: varchar('product_name', { length: 255 }),
  quantity: numeric('quantity', { precision: 15, scale: 4 }).notNull(),
  unitCost: numeric('unit_cost', { precision: 15, scale: 4 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('15.00'),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 4 }).default('0').notNull(),
  totalCost: numeric('total_cost', { precision: 15, scale: 4 }).notNull(),
  metadata: jsonb('metadata').default({}),
});

// ==========================================
// CORE 6: POS TERMINAL & SESSIONS
// ==========================================

export const posSessions = pgTable('pos_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  cashierId: uuid('cashier_id').references(() => users.id),
  terminalName: varchar('terminal_name', { length: 100 }).default('POS Terminal 1'),
  openingCash: numeric('opening_cash', { precision: 15, scale: 2 }).notNull(),
  closingCash: numeric('closing_cash', { precision: 15, scale: 2 }),
  totalSales: numeric('total_sales', { precision: 15, scale: 2 }).default('0'),
  status: varchar('status', { length: 50 }).default('Open').notNull(), // Open, Closed
  openedAt: timestamp('opened_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
  metadata: jsonb('metadata').default({}),
});

// ==========================================
// SECURITY & LICENSING (NEW)
// ==========================================

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  refreshTokenHash: text('refresh_token_hash'),
  ipAddress: varchar('ip_address', { length: 100 }),
  userAgent: text('user_agent'),
  deviceInfo: jsonb('device_info').default({}),
  replacedBySessionId: uuid('replaced_by_session_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
}, (table) => ({
  userIdx: index('sessions_user_idx').on(table.userId),
  tenantIdx: index('sessions_tenant_idx').on(table.tenantId),
  refreshTokenHashIdx: index('sessions_refresh_hash_idx').on(table.refreshTokenHash),
}));

export const licenses = pgTable('licenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  licenseKey: varchar('license_key', { length: 255 }),
  plan: varchar('plan', { length: 50 }).default('TRIAL').notNull(), // TRIAL, BASIC, PRO, ENTERPRISE
  status: varchar('status', { length: 50 }).default('ACTIVE').notNull(), // TRIAL, ACTIVE, GRACE_PERIOD, SUSPENDED, EXPIRED, CANCELLED
  startDate: timestamp('start_date').defaultNow().notNull(),
  expiryDate: timestamp('expiry_date').notNull(),
  gracePeriodEndsAt: timestamp('grace_period_ends_at'),
  maxUsers: integer('max_users').default(10).notNull(),
  maxBranches: integer('max_branches').default(3).notNull(),
  maxWarehouses: integer('max_warehouses').default(5).notNull(),
  maxPosDevices: integer('max_pos_devices').default(5).notNull(),
  enabledModules: jsonb('enabled_modules').default([]), // List of allowed module IDs e.g. ["POS", "SALES", "PURCHASES", "INVENTORY", "ACCOUNTING", "REPORTS", "AI", "CRM", "MANUFACTURING"]
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('licenses_tenant_idx').on(table.tenantId),
  statusIdx: index('licenses_status_idx').on(table.status),
}));

export const devices = pgTable('devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  deviceId: varchar('device_id', { length: 255 }).notNull().unique(), // Hardware ID / UUID
  terminalName: varchar('terminal_name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastConnectedAt: timestamp('last_connected_at'),
  metadata: jsonb('metadata').default({}),
}, (table) => ({
  tenantDeviceIdx: index('devices_tenant_device_idx').on(table.tenantId, table.deviceId),
}));

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 255 }).notNull(), // LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, LOGOUT_ALL, BRUTE_FORCE_LOCK, LICENSE_EXPIRED_ACCESS, etc.
  entityType: varchar('entity_type', { length: 100 }), // User, Session, License, Tenant, Branch, Document
  entityId: varchar('entity_id', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 100 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'), // Details, before/after, reason, failed credentials info (without password)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantActionIdx: index('audit_logs_tenant_action_idx').on(table.tenantId, table.action),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}));

// ==========================================
// CORE 7: MARO SMART SUPPORT & INTELLIGENCE
// ==========================================

export const supportSessions = pgTable('support_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  userId: uuid('user_id').references(() => users.id),
  userName: varchar('user_name', { length: 255 }).notNull(),
  deviceId: varchar('device_id', { length: 255 }).notNull(),
  screen: varchar('screen', { length: 100 }),
  module: varchar('module', { length: 50 }).notNull(),
  userQuery: text('user_query').notNull(),
  diagnosis: jsonb('diagnosis').notNull(),
  actionsTaken: jsonb('actions_taken').default([]),
  status: varchar('status', { length: 50 }).default('ACTIVE').notNull(), // ACTIVE, RESOLVED_BY_AI, ESCALATED, ABANDONED
  currentStepIndex: integer('current_step_index').default(0).notNull(),
  resolvedArticleId: varchar('resolved_article_id', { length: 255 }),
  feedbackRating: integer('feedback_rating'),
  feedbackComment: text('feedback_comment'),
  ticketId: varchar('ticket_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('support_sessions_tenant_idx').on(table.tenantId),
  moduleIdx: index('support_sessions_module_idx').on(table.module),
  statusIdx: index('support_sessions_status_idx').on(table.status),
}));

export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketNumber: varchar('ticket_number', { length: 50 }).notNull().unique(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  branchName: varchar('branch_name', { length: 255 }),
  userId: uuid('user_id').references(() => users.id),
  userName: varchar('user_name', { length: 255 }).notNull(),
  userEmail: varchar('user_email', { length: 255 }),
  deviceId: varchar('device_id', { length: 255 }).notNull(),
  module: varchar('module', { length: 50 }).notNull(),
  screen: varchar('screen', { length: 100 }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  severity: varchar('severity', { length: 20 }).default('MEDIUM').notNull(),
  status: varchar('status', { length: 50 }).default('OPEN').notNull(),
  assignedTo: varchar('assigned_to', { length: 255 }),
  assignedAgentName: varchar('assigned_agent_name', { length: 255 }),
  aiSessionId: varchar('ai_session_id', { length: 255 }),
  aiSummary: text('ai_summary'),
  detectedSymptoms: jsonb('detected_symptoms').default([]),
  actionsAttempted: jsonb('actions_attempted').default([]),
  diagnosticEvidence: jsonb('diagnostic_evidence').default({}),
  recommendedNextAction: text('recommended_next_action'),
  knowledgeArticlesUsed: jsonb('knowledge_articles_used').default([]),
  clientContext: jsonb('client_context').default({}),
  resolution: text('resolution'),
  resolvedAt: timestamp('resolved_at'),
  resolutionTimeMinutes: integer('resolution_time_minutes'),
  knowledgeCandidate: boolean('knowledge_candidate').default(false),
  knowledgeStatus: varchar('knowledge_status', { length: 50 }).default('NONE'),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('support_tickets_tenant_idx').on(table.tenantId),
  ticketNumberIdx: index('support_tickets_number_idx').on(table.ticketNumber),
  statusIdx: index('support_tickets_status_idx').on(table.status),
  moduleIdx: index('support_tickets_module_idx').on(table.module),
}));

export const supportTicketEvents = pgTable('support_ticket_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').references(() => supportTickets.id, { onDelete: 'cascade' }).notNull(),
  senderType: varchar('sender_type', { length: 50 }).notNull(), // USER, AI_ASSISTANT, SUPPORT_AGENT, SYSTEM
  senderName: varchar('sender_name', { length: 255 }).notNull(),
  message: text('message').notNull(),
  attachments: jsonb('attachments').default([]),
  isInternalNote: boolean('is_internal_note').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  ticketIdx: index('support_ticket_events_ticket_idx').on(table.ticketId),
}));

export const supportKnowledgeArticles = pgTable('support_knowledge_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: varchar('tenant_id', { length: 255 }).default('global').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  titleArabic: varchar('title_arabic', { length: 255 }).notNull(),
  module: varchar('module', { length: 50 }).notNull(),
  category: varchar('category', { length: 100 }),
  symptoms: jsonb('symptoms').default([]),
  possibleCauses: jsonb('possible_causes').default([]),
  diagnosticSteps: jsonb('diagnostic_steps').default([]),
  solution: text('solution').notNull(),
  solutionArabic: text('solution_arabic').notNull(),
  alternativeSolutions: jsonb('alternative_solutions').default([]),
  requiredPermissions: jsonb('required_permissions').default([]),
  affectedVersions: jsonb('affected_versions').default([]),
  severity: varchar('severity', { length: 20 }).default('MEDIUM'),
  attemptsCount: integer('attempts_count').default(0).notNull(),
  solvedCount: integer('solved_count').default(0).notNull(),
  avgResolutionSeconds: integer('avg_resolution_seconds').default(120),
  ratingAverage: numeric('rating_average', { precision: 3, scale: 2 }).default('5.00'),
  status: varchar('status', { length: 50 }).default('APPROVED').notNull(),
  tags: jsonb('tags').default([]),
  mediaUrls: jsonb('media_urls').default([]),
  originTicketId: varchar('origin_ticket_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  moduleIdx: index('support_kb_module_idx').on(table.module),
  statusIdx: index('support_kb_status_idx').on(table.status),
}));

export const supportProblemClusters = pgTable('support_problem_clusters', {
  id: uuid('id').primaryKey().defaultRandom(),
  module: varchar('module', { length: 50 }).notNull(),
  clusterKey: varchar('cluster_key', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  nameArabic: varchar('name_arabic', { length: 255 }).notNull(),
  description: text('description'),
  ticketCount: integer('ticket_count').default(0).notNull(),
  activeIssueCount: integer('active_issue_count').default(0).notNull(),
  commonResolution: text('common_resolution'),
  subClusters: jsonb('sub_clusters').default([]),
});

