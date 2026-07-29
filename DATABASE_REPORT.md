# Database Report - Swift ERP

- **Database**: Firebase Firestore.
- **Schema**: Defined in `firebase-blueprint.json`.
- **Entities**: Product, Customer, Supplier, Invoice, Bill, Transaction, User.
- **Performance**: Reliance on `onSnapshot` is good for real-time, but aggregation of thousands of documents on the client side (e.g., in `Dashboard.tsx`) will be slow and expensive.
- **Recommendation**: Implement Cloud Functions for server-side aggregations (e.g., pre-computing sales totals daily) to improve client performance and reduce read costs.
