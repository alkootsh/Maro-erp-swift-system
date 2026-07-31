# API Style Guide
## MARO Business Platform - RESTful API Specification Standard

### 1. Resource Endpoint Structure
- Endpoints use plural nouns: `/api/v1/products`, `/api/v1/invoices`, `/api/v1/warehouses`.
- Versioning is explicit in path: `/api/v1/...`.

---

### 2. HTTP Method Usage
- `GET`: Retrieve single item or collection. Safe and idempotent.
- `POST`: Create new entity or execute transaction command (`/api/v1/pos/sessions/open`).
- `PUT`: Replace entity completely.
- `PATCH`: Update specific entity fields.
- `DELETE`: Remove entity or mark as soft-deleted (`status = 'inactive'`).

---

### 3. Standard Response Wrapper
All API responses return a uniform JSON shape:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "inv_2026_00101",
    "invoiceNumber": "INV-2026-00101",
    "grandTotal": 12540.00
  },
  "message": "Invoice created successfully",
  "timestamp": "2026-07-30T08:15:00.000Z"
}
```

For errors:
```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Product SKU-IPHONE15 has insufficient quantity in Warehouse WH-01"
  },
  "timestamp": "2026-07-30T08:15:00.000Z"
}
```
