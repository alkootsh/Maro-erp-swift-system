# Deployment Guide
## MARO Business Platform - Production Cloud Run Deployment

### 1. Production Build Protocol
- Build Command: `npm run build`
- Server Command: `node dist/server.cjs`
- Server Entry point binds to port `3000` and host `0.0.0.0`.

---

### 2. Database Migration Steps
1. Apply PostgreSQL DDL migrations:
   ```bash
   psql -h $POSTGRES_HOST -U $POSTGRES_USER -d maro_erp_db -f src/db/schema.sql
   ```
2. Verify table creation and index setup.
3. Start backend application container.

---

### 3. Container Verification
Check container status endpoint:
```bash
curl http://localhost:3000/api/health
# Response: {"status":"ok"}
```
