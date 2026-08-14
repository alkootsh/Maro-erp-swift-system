# MARO ERP — Global Competitive Roadmap

## The Vision
**MARO** is: `Lite + Dynamic + Fast + Industry Adaptive`
*(Swift ERP remains a separate project focused on Full Enterprise ERP)*

The core architectural philosophy is that MARO dynamically shapes itself based on the company's industry and size, without becoming a bloated monolith.

## Core Architectural Rules
1. **Core Transaction Engine**: Strictly Relational and ACID (PostgreSQL).
2. **Dynamic Layer**: Uses `JSONB` for metadata, custom fields, and industry-specific configurations.
3. **Isolation**: The Accounting and Inventory core must be strictly protected from the Dynamic Engine.
4. **Localization**: Localization Layer is separated from the Core ERP.

---

## Practical Execution Priorities

### Priority 0 (P0) - The Foundation & Core
- **Core Security + Tenant Isolation**
- **Finance Engine** (General Ledger, AP/AR, Financial Statements)
- **Inventory Core** (Stock Balance, Warehouses, Movements)
- **Sales** (Orders, Invoices, POS)
- **Purchases** (POs, Goods Receipts, Bills)
- **POS Engine** (Offline capable, fast, touch-friendly)

### Priority 1 (P1) - The Adaptive Layer
- **Industry Engine** (Dynamic configuration based on business type)
- **Custom Fields & Dynamic Forms**
- **Dynamic Reports & Dashboard Builder**
- **Workflow Engine** (Approvals, Transitions)
- **CRM** (Leads, Pipeline, Activities)
- **Advanced Inventory** (Batches, Expiry, Serial, Multi-bin)

### Priority 2 (P2) - Expansions
- **Manufacturing** (BOM, MRP, Routing)
- **Industry Packs** (Food, Automotive, Contracting, etc.)
- **HR & Payroll**
- **E-commerce Sync**
- **Mobile Applications**

### Priority 3 (P3) - The Future & Intelligence
- **AI Copilot & Advanced AI Agents**
- **App Marketplace**
- **Globalization** (Multi-currency, Tax Engines)
- **Platform Ecosystem** (APIs, Webhooks)

---
*This roadmap dictates all engineering decisions for the MARO ERP project.*
