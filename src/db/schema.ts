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
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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
