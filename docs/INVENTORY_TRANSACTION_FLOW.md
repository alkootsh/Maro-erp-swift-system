# Inventory Transaction Flow Specification
## MARO Business Platform - Advanced Stock & Logistics Engine

### 1. Transaction Flow Architecture

```
[Sales Invoice / POS / Transfer] 
               │
               ▼
   Validate Stock Availability (Local Storage Buffer)
               │
               ▼
   Resolve Barcode / Barcode Scale Format (EAN13 Price/Weight Embedded)
               │
               ▼
   Select Inventory Valuation Layer (FIFO Batch Queue)
               │
               ▼
   Deduct Quantity & Record Serial / Batch Movement
               │
               ▼
   Unit Conversion Factor Application (e.g. 1 Carton = 24 Pieces)
               │
               ▼
   Generate `inventory_movements` Transaction Ledger Row
               │
               ▼
   Enqueue Operation to MARO Sync Engine Queue
```

---

### 2. Barcode Scale Decoding Protocol
To support Hypermarkets & Supermarkets, the inventory engine decodes 13-digit scale barcodes (`EAN-13`):
- **Structure**: `20 [5-digit Product SKU] [5-digit Price/Weight] [1 Check Digit]`.
- Example: `2000105025004`
  - Prefix `20`: Embedded scale barcode.
  - Item SKU `00105`: Linked product ID.
  - Value `02500`: Represents 2.500 kg or 25.00 EGP depending on configuration.

---

### 3. FIFO Batch & Expiry Allocation Algorithm
1. Query active product batches ordered by `expiry_date ASC` (First-Expired, First-Out - FEFO) or `created_at ASC` (FIFO).
2. Fulfill requested transaction quantity from oldest active batch.
3. If quantity exceeds oldest batch, split row across subsequent batches.
4. Update `batch_quantity` and append movement ledger.
