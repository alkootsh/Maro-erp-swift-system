-- MARO ERP - Operational PostgreSQL Database DDL Schema
-- Sprint 7: Product & Inventory Foundation Architecture

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Product Categories Table
CREATE TABLE IF NOT EXISTS product_categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id VARCHAR(64) REFERENCES product_categories(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_code ON product_categories(code);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON product_categories(parent_id);

-- 2. Product Groups Table
CREATE TABLE IF NOT EXISTS product_groups (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    category_id VARCHAR(64) REFERENCES product_categories(id) ON DELETE CASCADE,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(100),
    country VARCHAR(100),
    website VARCHAR(255),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Manufacturers Table
CREATE TABLE IF NOT EXISTS manufacturers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(100),
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Warehouses Table
CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    location TEXT,
    is_main BOOLEAN NOT NULL DEFAULT FALSE,
    manager_name VARCHAR(255),
    phone VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warehouses_is_main ON warehouses(is_main);

-- 6. Products Master Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(15, 4) NOT NULL DEFAULT 0.0000 CHECK (price >= 0),
    cost_price NUMERIC(15, 4) NOT NULL DEFAULT 0.0000 CHECK (cost_price >= 0),
    wholesale_price NUMERIC(15, 4) DEFAULT 0.0000,
    min_price NUMERIC(15, 4) DEFAULT 0.0000,
    quantity NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    opening_balance NUMERIC(15, 4) DEFAULT 0.0000,
    reorder_level NUMERIC(15, 4) DEFAULT 5.0000,
    max_stock_level NUMERIC(15, 4) DEFAULT 1000.0000,
    category VARCHAR(255) NOT NULL,
    category_id VARCHAR(64) REFERENCES product_categories(id) ON DELETE SET NULL,
    group_id VARCHAR(64) REFERENCES product_groups(id) ON DELETE SET NULL,
    brand_id VARCHAR(64) REFERENCES brands(id) ON DELETE SET NULL,
    manufacturer_id VARCHAR(64) REFERENCES manufacturers(id) ON DELETE SET NULL,
    barcode VARCHAR(100),
    tax_rate NUMERIC(5, 2) DEFAULT 14.00,
    is_taxable BOOLEAN DEFAULT TRUE,
    allow_negative_stock BOOLEAN DEFAULT FALSE,
    valuation_method VARCHAR(20) DEFAULT 'FIFO' CHECK (valuation_method IN ('FIFO', 'LIFO', 'AVCO')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    created_by VARCHAR(255),
    units JSONB DEFAULT '[]'::jsonb,
    barcodes JSONB DEFAULT '[]'::jsonb,
    warehouse_stocks JSONB DEFAULT '[]'::jsonb,
    price_lists JSONB DEFAULT '[]'::jsonb,
    batches JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- 7. Inventory Movements Ledger Table
CREATE TABLE IF NOT EXISTS inventory_movements (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    warehouse_id VARCHAR(64) REFERENCES warehouses(id) ON DELETE SET NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out', 'transfer', 'adjustment')),
    quantity NUMERIC(15, 4) NOT NULL,
    unit_cost NUMERIC(15, 4) DEFAULT 0.0000,
    reason TEXT NOT NULL,
    reference_type VARCHAR(50), -- 'INVOICE', 'BILL', 'RETURN', 'ADJUSTMENT'
    reference_id VARCHAR(64),
    performed_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON inventory_movements(type);
CREATE INDEX IF NOT EXISTS idx_movements_created ON inventory_movements(created_at);

-- 8. Global Inventory Settings Table
CREATE TABLE IF NOT EXISTS inventory_settings (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'global',
    default_valuation_method VARCHAR(20) DEFAULT 'FIFO',
    allow_negative_stock BOOLEAN DEFAULT FALSE,
    default_tax_rate NUMERIC(5, 2) DEFAULT 14.00,
    default_reorder_level NUMERIC(15, 4) DEFAULT 5.00,
    enforce_batch_tracking BOOLEAN DEFAULT FALSE,
    enforce_expiry_tracking BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'SYNC')),
    target_id VARCHAR(64) NOT NULL,
    target_name VARCHAR(255),
    user_email VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- 10. POS Function Keys Customization Table
CREATE TABLE IF NOT EXISTS pos_function_keys (
    id VARCHAR(64) PRIMARY KEY,
    terminal_id VARCHAR(64) NOT NULL DEFAULT 'term_01',
    key_code VARCHAR(10) NOT NULL, -- 'F1'..'F12'
    action_id VARCHAR(100) NOT NULL,
    custom_label VARCHAR(255),
    color VARCHAR(50) DEFAULT 'bg-blue-600',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pos_fkeys_terminal ON pos_function_keys(terminal_id);
CREATE INDEX IF NOT EXISTS idx_pos_fkeys_code ON pos_function_keys(key_code);

-- 11. System Licenses Table (Layer 1 Developer Account)
CREATE TABLE IF NOT EXISTS system_licenses (
    license_key VARCHAR(128) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'enterprise',
    max_users INTEGER DEFAULT 50,
    max_terminals INTEGER DEFAULT 20,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 year',
    enabled_modules JSONB DEFAULT '[]'::jsonb,
    custom_features JSONB DEFAULT '{}'::jsonb
);

-- 12. Feature Flags Matrix Table
CREATE TABLE IF NOT EXISTS feature_flags (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    module VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'enabled',
    description TEXT,
    requires_plan VARCHAR(50) DEFAULT 'standard',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Granular Roles & Permissions Table (Layer 2 & Layer 3)
CREATE TABLE IF NOT EXISTS roles_permissions (
    id VARCHAR(64) PRIMARY KEY,
    role_id VARCHAR(64) NOT NULL UNIQUE,
    role_name VARCHAR(255) NOT NULL,
    button_permissions JSONB DEFAULT '{}'::jsonb,
    field_permissions JSONB DEFAULT '{}'::jsonb,
    allowed_modules JSONB DEFAULT '[]'::jsonb,
    allowed_screens JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Comprehensive Security Audit Logs Table
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_role VARCHAR(64) NOT NULL,
    company_id VARCHAR(64) DEFAULT 'comp_01',
    branch_id VARCHAR(64),
    warehouse_id VARCHAR(64),
    terminal_id VARCHAR(64),
    device_info TEXT,
    computer_name VARCHAR(255),
    operating_system VARCHAR(100),
    browser VARCHAR(100),
    ip_address VARCHAR(45),
    mac_address VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    screen VARCHAR(100),
    document_no VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    execution_duration_ms INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT TRUE,
    failure_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_sec_audit_user ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sec_audit_module ON security_audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_sec_audit_timestamp ON security_audit_logs(timestamp);

-- 15. Security Alerts Table
CREATE TABLE IF NOT EXISTS security_alerts (
    id VARCHAR(64) PRIMARY KEY,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    details TEXT,
    user_id VARCHAR(64),
    user_email VARCHAR(255),
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN DEFAULT FALSE
);

-- 16. Business Intelligence Tables

-- Business Health Snapshot
CREATE TABLE IF NOT EXISTS business_health (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    branch_id VARCHAR(64),
    score INTEGER NOT NULL DEFAULT 0,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- KPI Definitions
CREATE TABLE IF NOT EXISTS kpi_definitions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weight NUMERIC(5,2) DEFAULT 1.00,
    calculation_formula TEXT NOT NULL
);

-- KPI Values
CREATE TABLE IF NOT EXISTS kpi_values (
    id VARCHAR(64) PRIMARY KEY,
    kpi_id VARCHAR(64) NOT NULL REFERENCES kpi_definitions(id),
    value NUMERIC(15,4) NOT NULL,
    target NUMERIC(15,4) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    reason TEXT,
    confidence NUMERIC(5,2),
    affected_entities JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dashboards
CREATE TABLE IF NOT EXISTS saved_dashboards (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    layout JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


