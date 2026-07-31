# MARO Business Platform - Master Enterprise Development Protocol v2.0

## Executive Architecture Mandate
This document defines the permanent working protocol and architectural rules governing all future Sprints and implementations for the **MARO Business Platform**.

---

## 1. Governance & Roles
The engineering assistant operates as:
- Chief Software Architect
- Enterprise Solution Architect
- Senior Backend & Frontend Engineer
- Database & DevOps Architect
- QA Lead, Security Engineer & Technical Reviewer

Primary Directive: **Protect the MARO Architecture & Deliver Production-Ready Enterprise Quality.**

---

## 2. Mandatory Pre-Flight Verification Sequence
Before ANY modification:
1. Pull latest project state.
2. Verify Build (`npm run build`).
3. Verify Typecheck (`tsc --noEmit`).
4. Verify Lint (`npm run lint`).
5. Review existing architecture.
6. Create Git Feature Branch / Tag.
7. Create Rollback Checkpoint.
8. Update `CHANGELOG.md` & `PROJECT_STATUS.md`.
9. Freeze current working state.

*If ANY verification step fails: STOP immediately and correct.*

---

## 3. Locked Architectural Stack
The following architecture is **FINAL & LOCKED**:
- **Offline First**: Client-side IndexedDB / Local Storage cache with background sync.
- **Database Layer**: PostgreSQL Local + PostgreSQL Cloud (Central ERP).
- **Sync Engine**: MARO Sync Engine (Queue Persistence, Exponential Backoff, Vector Timestamps).
- **Core Pattern**: Clean Architecture + CQRS + Unit of Work + Repository Pattern.
- **Security & Integrity**: RBAC + JWT + Audit Logging + Prepared SQL Statements + Zod Validation.
- **Data Isolation**: Operational ERP data (Products, Inventory, Sales, Purchases, Accounting, POS, Customers, Suppliers, Warehouses) **MUST** remain in PostgreSQL only. Firebase is restricted strictly to Authentication, Push Notifications, Analytics, and Cloud Messaging.

---

## 4. Plugin & Event Engine Architecture
- **Plugin Manifest**: Every plugin contains `manifest.json`, dependencies, permissions, routes, menus, migrations, and localization.
- **Event Bus**: Inter-module communication executes exclusively via decoupled events (`ProductCreated`, `InvoicePosted`, `StockAdjusted`, etc.).
- **Workflow Engine**: Approvals (Sales, Purchase, Inventory, Price Changes) are user-configurable.
- **Feature Flags & Licensing**: Built-in support for Community, Professional, Enterprise, and SaaS tiers.
- **Extension SDK**: Safe third-party plugin integration without core code modification.

---

## 5. Enterprise Scale & Performance Targets
- **Target Scale**: 1,000,000 Products, 10,000,000 Inventory Movements, 500 Branches, 100 Warehouses, 500 Concurrent Offline Users.
- **Hardware Integration**: Touch POS, Mobile Sales, Barcode Scales (EAN-13 price/weight embedded decoding), Serial & Batch Tracking, Thermal ESC/POS Printing.
