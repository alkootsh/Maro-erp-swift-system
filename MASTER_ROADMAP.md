# Master Roadmap - Swift ERP

### v1.0 (Stability & Cleanup)
- Replace simulation logic in `Inventory.tsx` with real queries.
- Refine existing CRUD operations to handle edge cases.
- Tighten Firestore security rules for `suppliers` and `transactions`.

### v2.0 (Analytics & Performance)
- Implement Cloud Functions for server-side aggregation (Sales, Profit, Inventory Value).
- Introduce pagination for all heavy tables (Invoices, Bills).
- Add advanced financial reporting features (P&L, Cash Flow).

### v3.0 (Advanced Features)
- Multi-branch/Multi-warehouse support.
- Audit logging (track *who* changed *what* and *when*).
- Comprehensive RBAC overhaul (User groups, specific permission sets).
