# Backup and Recovery Standard
## MARO Business Platform - Enterprise Data Preservation Standard

### 1. PostgreSQL Backup Policy
- **Automated Continuous Backup (Point-in-Time Recovery - PITR)**: Cloud SQL / PostgreSQL Write-Ahead Logs (WAL) streamed continuously to multi-region cloud bucket, enabling recovery to any second within a 35-day window.
- **Daily Full Backups**: Automated full database snapshots executed every night at 01:00 UTC. Retention period: 365 days.
- **Client Offline Local Backups**: Automated hourly JSON snapshots of local IndexedDB sales queue exported to local client filesystem `/backup/maro_local_pos.json`.

---

### 2. Recovery Time & Point Objectives
- **Recovery Point Objective (RPO)**: < 1 second for cloud PostgreSQL transactions; 0 seconds for offline local POS terminals.
- **Recovery Time Objective (RTO)**: < 15 minutes for cloud central database failover; < 1 minute for local POS terminal swap.

---

### 3. Recovery Verification Drills
Quarterly automated recovery drills test restoring PITR backups to isolated staging databases and executing complete checksum verification on product inventory ledgers and customer balances.
