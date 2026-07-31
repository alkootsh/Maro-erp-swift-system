# PostgreSQL DDL Changes Specification (Sprint 8)
## MARO Business Platform - Database Extension DDL

```sql
-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    tax_number VARCHAR(100),
    credit_limit NUMERIC(15, 4) DEFAULT 0.0000,
    credit_days INT DEFAULT 0,
    price_list_id VARCHAR(64) DEFAULT 'RETAIL',
    current_balance NUMERIC(15, 4) DEFAULT 0.0000,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'RETAIL',
    customer_id VARCHAR(64) REFERENCES customers(id),
    branch_id VARCHAR(64) DEFAULT 'main_branch',
    warehouse_id VARCHAR(64) REFERENCES warehouses(id),
    total_untaxed NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    total_tax NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    total_discount NUMERIC(15, 4) DEFAULT 0.0000,
    grand_total NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    paid_amount NUMERIC(15, 4) DEFAULT 0.0000,
    due_amount NUMERIC(15, 4) DEFAULT 0.0000,
    status VARCHAR(50) DEFAULT 'APPROVED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Line Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id VARCHAR(64) PRIMARY KEY,
    invoice_id VARCHAR(64) REFERENCES invoices(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES products(id),
    unit_name VARCHAR(50) DEFAULT 'piece',
    quantity NUMERIC(15, 4) NOT NULL,
    unit_price NUMERIC(15, 4) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 14.00,
    line_total NUMERIC(15, 4) NOT NULL
);

-- POS Sessions Table
CREATE TABLE IF NOT EXISTS pos_sessions (
    id VARCHAR(64) PRIMARY KEY,
    terminal_id VARCHAR(64) NOT NULL,
    cashier_id VARCHAR(64) NOT NULL,
    opening_float NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    closing_cash NUMERIC(15, 4) DEFAULT 0.0000,
    total_sales NUMERIC(15, 4) DEFAULT 0.0000,
    status VARCHAR(20) DEFAULT 'OPEN',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    tax_number VARCHAR(100),
    current_balance NUMERIC(15, 4) DEFAULT 0.0000,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_status ON pos_sessions(status);
```
