# POS Transaction Flow Specification
## MARO Business Platform - Touch & Mobile POS Engine

### 1. Terminal Session Lifecycle

```
┌──────────────────┐
│  Open POS Session│ (Requires Float Amount & Cashier Selection)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Active Sales Loop│ ◄── Barcode Scanner / Touch UI Grid / Scale
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Payment Processing│ (Cash, Card, Customer Credit, Split Payment)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Receipt Printing │ (Thermal Printer ESC/POS Protocol & QR Tax Code)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Close POS Session│ (Cash Count Reconciliation & Variance Calculation)
└──────────────────┘
```

---

### 2. Offline Resilience Protocol
- **Local Storage Indexing**: All active POS categories, products, prices, and barcodes are cached locally in IndexedDB.
- **Offline Receipt Generation**: Receipts are assigned a unique local transaction code `POS-TERM01-20260730-0001` and queued instantly in `maroSyncEngine`.
- **Z-Report Session Reconciliation**: At session close, local terminal totals (Total Sales, Cash Collected, Card Payments, Refunds) are matched against actual physical drawer cash count to generate Z-Report variance logs.
