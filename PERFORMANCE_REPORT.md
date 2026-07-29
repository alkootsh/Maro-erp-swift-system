# Performance Report - Swift ERP

- **Client-Side**: Generally fast due to caching and React performance.
- **Database Reads**: High volume due to `onSnapshot` on collection root.
- **Bottlenecks**: Client-side data aggregation (Dashboard/Reports) is the biggest performance risk.
- **Recommendation**:
  1. Use pagination for all table views.
  2. Implement server-side aggregation for analytics.
  3. Index commonly queried fields in Firestore.
