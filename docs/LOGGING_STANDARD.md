# Logging Standard
## MARO Business Platform - Enterprise Telemetry & Audit Logging Standard

### 1. Log Severity Levels
- **FATAL (Level 0)**: Unrecoverable system failure (PostgreSQL connection down, server crash).
- **ERROR (Level 1)**: Recoverable transaction error (Validation failed, failed sync retry).
- **WARN (Level 2)**: Degraded operation (Offline fallback triggered, high sync latency).
- **INFO (Level 3)**: Key business milestones (Invoice created, shift closed, user logged in).
- **DEBUG (Level 4)**: Diagnostic details (Sync payload trace, SQL statement parameters).

---

### 2. Structured Audit Entry Format
All audit logs are written to PostgreSQL `audit_logs` table and formatted as JSON:

```json
{
  "timestamp": "2026-07-30T08:15:00.000Z",
  "level": "INFO",
  "userId": "user_cashier_01",
  "branchId": "branch_main",
  "module": "POS",
  "action": "CREATE_INVOICE",
  "entityId": "inv_2026_00102",
  "payloadSummary": "Invoice total EGP 12,540.00 created offline",
  "clientIp": "192.168.1.45"
}
```

---

### 3. Log Protection Policy
- Password fields, tokens, credit card details, and national identification numbers must **NEVER** be written to logs. Sanitizer utility filters sensitive JSON keys (`password`, `token`, `cvv`, `secret`).
