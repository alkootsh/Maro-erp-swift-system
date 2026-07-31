# Plugin Development Guide
## MARO Business Platform - Extension SDK & Plugin Architecture

### 1. Plugin Architecture Overview
The MARO Business Platform supports isolated industry plugins (e.g. Pharmacy, Restaurant, Hypermarket) without altering Core source files.

```
/src/plugins/pharmacy/
├── manifest.json
├── index.ts
├── routes.tsx
├── components/
└── db/
    └── migrations.sql
```

---

### 2. Plugin Manifest Structure (`manifest.json`)

```json
{
  "id": "maro-plugin-pharmacy",
  "name": "MARO Enterprise Pharmacy Engine",
  "version": "1.0.0",
  "author": "MARO Platform Team",
  "minCoreVersion": "0.7.0",
  "permissions": ["inventory:read", "inventory:batch_write"],
  "hooks": ["onInvoiceCreated", "onProductFormRender"],
  "routes": [
    { "path": "/pharmacy/prescriptions", "component": "PrescriptionsPage" }
  ]
}
```

---

### 3. Event Bus Integration
Plugins subscribe to Core platform events via the MARO Event Bus:
```typescript
MaroEventBus.subscribe('onInvoiceCreated', async (event: InvoiceCreatedEvent) => {
  // Execute pharmacy prescription lock or drug interaction check
});
```
