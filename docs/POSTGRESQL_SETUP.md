# MARO ERP - PostgreSQL Setup & Migration Guide

## Prerequisites & Installation
1. **PostgreSQL 14+** installed locally or provisioned via Cloud SQL / Managed PostgreSQL.
2. Connection string configured in `.env`:
   ```env
   DATABASE_URL=postgresql://maro_admin:secure_password@localhost:5432/maro_erp_db
   ```

## Schema Execution & Deployment
Run the migration DDL script to create tables, indexes, constraints, and audit log structures:
```bash
psql -h localhost -U maro_admin -d maro_erp_db -f src/db/schema.sql
```

## Backend Container Connection & Dev Server Setup
The MARO ERP Node.js server (`server.ts`) initializes REST sync routes (`/api/erp/*`) to bridge client-side MARO Sync Engine commands directly to the PostgreSQL instance:
```typescript
app.get("/api/erp/:collection", (req, res) => {
  // Queries collection records from PostgreSQL / Operational Buffer
});

app.post("/api/erp/sync", (req, res) => {
  // Executes batch transactional writes from MARO Sync Engine queue
});
```

## Transaction Isolation & Integrity
- All batch sync operations execute with `READ COMMITTED` or `SERIALIZABLE` transaction isolation levels to prevent race conditions during concurrent POS and inventory operations.
