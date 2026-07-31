# REST API Specification (Sprint 8)
## MARO Business Platform - Enterprise API Specification

### 1. Invoices & Sales Endpoints

#### `POST /api/v1/sales/invoices`
Creates a new invoice transaction and records customer ledger entry.
- **Request Body**:
  ```json
  {
    "invoiceNumber": "INV-2026-00101",
    "type": "RETAIL",
    "customerId": "cust_101",
    "branchId": "branch_main",
    "warehouseId": "wh_01",
    "items": [
      {
        "productId": "prod_101",
        "quantity": 2,
        "unitPrice": 5500.00,
        "discountPercent": 0,
        "taxRate": 14.00
      }
    ],
    "paidAmount": 12540.00,
    "paymentMethod": "CASH"
  }
  ```
- **Response**: `201 Created` with generated Invoice ID and Tax QR string.

#### `GET /api/v1/sales/invoices?customerId={id}&status={status}`
Fetches filtered list of sales invoices.

---

### 2. POS Session Endpoints

#### `POST /api/v1/pos/sessions/open`
Opens a new terminal cash session.
- **Payload**: `{ "terminalId": "TERM-01", "cashierId": "user_02", "openingFloat": 500.00 }`.

#### `POST /api/v1/pos/sessions/close`
Closes session and posts cash count reconciliation.
- **Payload**: `{ "sessionId": "pos_sess_101", "closingCash": 14250.00, "notes": "Shift completed without discrepancy" }`.

---

### 3. Procurement Endpoints

#### `POST /api/v1/purchases/orders`
Creates a new Purchase Order.

#### `POST /api/v1/purchases/bills`
Registers a supplier bill and updates Accounts Payable balance.
