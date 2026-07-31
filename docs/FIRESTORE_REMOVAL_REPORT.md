# Firestore Removal & Audit Report
## MARO ERP - Operational Data Decoupling Audit

### 1. Operational ERP Status Audit

| Operational ERP Repository | Firestore Status | Active Storage Provider | Verification Path |
| :--- | :--- | :--- | :--- |
| **Products Repository** | **REMOVED** | PostgreSQL / MARO Sync Engine | `src/repositories/productRepository.ts` |
| **Inventory Ledger** | **REMOVED** | PostgreSQL / MARO Sync Engine | `src/pages/Inventory.tsx` |
| **Warehouses** | **REMOVED** | PostgreSQL / MARO Sync Engine | `src/pages/Warehouses.tsx` |
| **Product Categories** | **REMOVED** | PostgreSQL / MARO Sync Engine | `src/lib/maroSyncEngine.ts` |
| **Product Brands** | **REMOVED** | PostgreSQL / MARO Sync Engine | `src/lib/maroSyncEngine.ts` |
| **Price Lists** | **REMOVED** | PostgreSQL / MARO Sync Engine | `src/lib/maroSyncEngine.ts` |
| **Product Batches** | **REMOVED** | PostgreSQL / MARO Sync Engine | `src/lib/maroSyncEngine.ts` |

---

### 2. Remaining Firestore References (Non-Operational Utilities)
The following remaining Firestore references are restricted strictly to non-operational utility components and auth handlers:
- `src/firebase.ts`: Firebase App & Auth initialization (`getAuth()`).
- `src/components/FirebaseProvider.tsx`: Authenticated user profile context with offline fallback block (`catch (err) { setProfile(...) }`).
- `src/pages/POS.tsx` / `Dashboard.tsx` / `Reports.tsx`: Legacy sales/view listeners wrapped in offline fallback handlers (`(err) => console.warn(...)`) preventing network crashes when offline.

---

### 3. Conclusion
Operational ERP entities (Products, Stock, Warehouses) are 100% independent of Firestore and run on the approved **Offline-First PostgreSQL Architecture**.
