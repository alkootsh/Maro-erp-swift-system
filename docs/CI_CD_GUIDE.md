# CI/CD Guide
## MARO Business Platform - Continuous Integration & Deployment Pipeline

### 1. Pipeline Stages

```
[ Git Push / PR ] 
       │
       ▼
 Stage 1: Static Analysis (`npm run lint` & `tsc --noEmit`)
       │
       ▼
 Stage 2: Automated Unit & Integration Tests
       │
       ▼
 Stage 3: Production Build Compilation (`npm run build`)
       │
       ▼
 Stage 4: Cloud Run Container Packaging & Security Audit
       │
       ▼
 Stage 5: Zero-Downtime Blue-Green Deployment
```

---

### 2. Environment Variables & Secret Injection
- Production environment variables (`GEMINI_API_KEY`, `POSTGRES_URL`, `JWT_SECRET`) are injected via GCP Secret Manager into the Cloud Run container runtime.
- Never commit actual secrets or credentials to source control repository or `.env.example`.
