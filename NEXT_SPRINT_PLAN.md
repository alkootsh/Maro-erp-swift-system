# MARO Business Platform - Next Sprint Plan (Sprint 8 Design Specification)

## Overview
- **Target Sprint**: Sprint 8 - Enterprise Sales, POS, Procurement & Multi-Channel Logistics
- **Phase**: Architecture Design Phase (Code Implementation Frozen Pending Design Sign-off)

## Key Design Artifacts Generated (`/docs/`)
1. `docs/SPRINT_8_ARCHITECTURE.md`: High-level system architecture & plugin framework.
2. `docs/SALES_DOMAIN_MODEL.md`: Domain entities for Invoices, POS Sessions, Credit Notes, Price Lists, Customer Ledgers.
3. `docs/PURCHASE_DOMAIN_MODEL.md`: Requisitions, POs, GRNs, Bills, Supplier Ledgers.
4. `docs/INVENTORY_TRANSACTION_FLOW.md`: FIFO batch tracking, serial numbers, multi-unit conversions, barcode scale decoding.
5. `docs/POS_TRANSACTION_FLOW.md`: Offline POS session lifecycle, terminal state machine, payment processing.
6. `docs/ACCOUNTING_INTEGRATION.md`: Automated GL journal entries for inventory, sales, purchases, and cost of goods sold (COGS).
7. `docs/SYNC_FLOW_SPRINT8.md`: Offline sync protocol for high-frequency sales transactions & stock reservations.
8. `docs/API_SPEC_SPRINT8.md`: REST API endpoint specification for sales, procurement, and POS sync.
9. `docs/DATABASE_CHANGES_SPRINT8.md`: PostgreSQL DDL extensions for Sprint 8 entities.
