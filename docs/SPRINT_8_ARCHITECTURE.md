# Sprint 8 System Architecture & Plugin Architecture Specification
## MARO Business Platform - Enterprise Architecture Design

### 1. Architectural Philosophy
Sprint 8 expands the MARO Business Platform into a unified Enterprise Resource Planning (ERP) engine designed for Retail, Wholesale, Hypermarkets, Multi-Branch, and Multi-Company operations. It preserves the locked **Offline-First PostgreSQL Architecture** established in Sprint 7 while introducing a **Plugin-Based Core Engine**.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MARO Core ERP Shell & UI                           │
└────┬────────────────────────────┬─────────────────────────┬─────────────┘
     │                            │                         │
     ▼                            ▼                         ▼
┌─────────┐                ┌─────────────┐           ┌──────────────┐
│  Sales  │                │ Procurement │           │ Touch & Mobile│
│ Core    │                │ Core        │           │ POS Engine   │
└────┬────┘                └──────┬──────┘           └──────┬───────┘
     │                            │                         │
     └────────────────────────────┼─────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │  MARO Plugin Manager    │
                     │  (Hook & Event Bus)     │
                     └────────────┬────────────┘
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
┌──────────────┐          ┌──────────────┐            ┌──────────────┐
│ Retail Plugin│          │ Restaurant   │            │ Pharmacy     │
│ (Scales/Bar) │          │ (Kitchen KDS)│            │ (Batch/Exp)  │
└──────────────┘          └──────────────┘            └──────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │   MARO Sync Engine      │
                     │  (PostgreSQL Offline)   │
                     └─────────────────────────┘
```

---

### 2. Multi-Entity Scope Support
- **Multi-Company & Multi-Branch Hierarchy**: System isolation at tenant, company, branch, and warehouse levels using scoped foreign keys (`company_id`, `branch_id`, `warehouse_id`).
- **Plugin Architecture**: Clean separation between core transaction handlers and domain plugins (Retail, Restaurant, Pharmacy, Manufacturing) via event bus hooks (`onInvoiceCreated`, `onStockReserved`, `onPaymentProcessed`).
- **Zero-Latency Touch & Mobile POS**: Client-side offline terminal running entirely on local IndexedDB/MARO Sync Engine buffer, capable of ringing sales, printing receipts, and scanning barcodes without network connectivity.
