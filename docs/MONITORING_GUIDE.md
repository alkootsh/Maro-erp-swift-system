# Monitoring & Alerting Guide
## MARO Business Platform - Health Checks & Alerting Matrix

### 1. Health Check Probes
- **Liveness Probe (`/api/health`)**: Returns `200 OK` if Express server process is responsive.
- **Readiness Probe (`/api/health/readiness`)**: Verifies connection pool to PostgreSQL central database (`SELECT 1`).
- **Sync Engine Probe (`/api/health/sync`)**: Verifies sync queue queue worker health and background processing state.

---

### 2. Alerting Matrix & Escalation Thresholds

| Alert Name | Metric Condition | Severity | Escalation Path |
| :--- | :--- | :--- | :--- |
| **DatabaseConnectionPoolExhausted** | PostgreSQL pool active connections > 90% for 2 minutes | Critical | PagerDuty to On-Call DevOps |
| **HighSyncQueueBacklog** | Terminal sync queue > 1,000 pending ops for 10 minutes | Warning | Alert email to Store IT Lead |
| **ZATCASubmissionFailureRate** | Saudi Arabia E-Invoice submission 5xx error rate > 2% | High | Slack notification to Integration Team |
| **HighAPILatencyP99** | API endpoint P99 response time > 1,000 ms for 5 minutes | Medium | Jira ticket generated for Performance team |
| **UnusualCashDrawerVariance** | POS shift close cash drawer variance > EGP 500 | Warning | Automated notification to Branch Manager |
