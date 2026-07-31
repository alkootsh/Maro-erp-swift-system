# MARO Business Platform - Sprint 8 Implementation Document
## Enterprise Sales & Purchasing Engine Implementation

### 1. Executive Overview
Sprint 8 delivers the complete **Enterprise Sales & Purchasing Engine** for the MARO Business Platform. The engine enforces clean architecture, CQRS pattern, Unit of Work transactional consistency, PostgreSQL data layer with MARO Sync Engine offline-first resilience, and double-entry accounting automation.

---

### 2. Core Functional Scope & Components Implemented

#### 2.1 Sales Engine (`src/repositories/salesRepository.ts`, `quotationRepository.ts`, `salesOrderRepository.ts`, `salesReturnRepository.ts`)
- **Quotations (Sales Quotation)**: Full lifecycle management (`DRAFT` -> `SENT` -> `ACCEPTED` / `REJECTED` -> `CONVERTED`). Automatic conversion into Sales Invoices or Sales Orders.
- **Sales Orders (SO)**: Multi-item sales orders with delivery status tracking (`PENDING`, `SHIPPED`, `PARTIAL`, `DELIVERED`), automated customer credit limit validation, and stock reservation.
- **Sales Invoices**: Support for Retail, Wholesale, and POS sales invoices, with draft mode, approval workflows, partial payments, discount lines, and ZATCA / ETA Base64 TLV Tax QR Code generation.
- **Sales Returns**: Processing of sales returns with automatic inventory restocking/scrap classification, customer ledger credit note postings, and reverse GL journal postings.
- **Customer Credit Limits**: Strict real-time validation of credit limits and outstanding balance prior to order/invoice approval via `CreditValidationEngine`.

#### 2.2 Purchasing Engine (`src/repositories/purchaseRepository.ts`, `procurementRepository.ts`)
- **Purchase Requests (PR)**: Departmental requisition forms with approval workflows and estimated budget tracking.
- **Request for Quotation (RFQ)**: Supplier quote collection and evaluation engine.
- **Purchase Orders (PO)**: Multi-line purchase orders with supplier payment term validation and expected delivery tracking.
- **Goods Received Notes (GRN)**: Material inspection and partial receiving engine with batch/expiry tracking and automatic warehouse balance increments.
- **Purchase Bills & Supplier Debit Notes**: Purchase invoice recording with automated double-entry Accounts Payable journal postings and debit note adjustments.

#### 2.3 Inventory Integration & Ledger Synchronization
- Every sale, purchase, transfer, or return automatically:
  - Updates warehouse stock balances.
  - Creates immutable `InventoryMovement` ledger records.
  - Logs audit entries into `audit_logs` collection.
  - Emits event bus events (`InvoiceCreated`, `PurchaseApproved`, `ReturnProcessed`, `InventoryMoved`).
  - Enqueues batch sync operations into MARO Sync Engine for PostgreSQL background replication.

#### 2.4 Enterprise Pricing Engine (`src/services/pricingEngine.ts`)
- **Price Lists**: Unlimited price list support (`RETAIL`, `WHOLESALE`, `VIP`, `CONTRACT`).
- **Volume Tier Discounts**: Automatic discount tier selection based on order quantity threshold.
- **Time-based Promotions**: Date-bounded percentage and fixed-amount promotional rules.

#### 2.5 Enterprise Barcode & Scale Engine (`src/services/barcodeEngine.ts`)
- Format support for `EAN-13`, `EAN-8`, `UPC`, `Code128`, `GS1-128`, `QR`, and `DataMatrix`.
- Weighted & Price Embedded Scale Barcode Parser (e.g. prefix `21`/`27` parsing weight in kg or embedded total price).

---

### 3. CQRS & Unit of Work Integration
- **Command Handlers** (`src/cqrs/commands.ts`):
  - `CreateQuotationCommand`, `ConvertQuotationToInvoiceCommand`, `CreateSalesOrderCommand`, `RecordDeliveryCommand`, `ProcessSalesReturnCommand`
  - `CreatePurchaseRequestCommand`, `CreateRFQCommand`, `RecordGoodsReceivedCommand`, `IssueSupplierDebitNoteCommand`
- **Query Handlers** (`src/cqrs/queries.ts`):
  - `GetSalesQuotationsQuery`, `GetSalesOrdersQuery`, `GetSalesReturnsQuery`
  - `GetPurchaseRequestsQuery`, `GetRFQsQuery`, `GetGRNsQuery`, `GetSupplierDebitNotesQuery`, `GetPriceListsQuery`
- **Unit of Work** (`src/cqrs/unitOfWork.ts`):
  - Ensures atomic registration of multi-entity mutations with atomic commit and rollback capabilities.

---

### 4. Verification & Status
- **TypeScript Compilation**: PASS (`compile_applet` - 0 errors)
- **Linter Verification**: PASS (`lint_applet` - 0 errors)
- **Architecture Protocol Compliance**: 100% compliant with MASTER ENTERPRISE DEVELOPMENT PROTOCOL.
