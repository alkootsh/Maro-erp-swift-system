# Data Retention Policy
## MARO Business Platform - Compliance & Archival Standard

### 1. Retention Schedule Matrix

| Data Category | Retention Period | Storage Tier | Archival Action |
| :--- | :--- | :--- | :--- |
| **Sales Invoices & Credit Notes** | 10 Years (Tax Compliance) | Hot PostgreSQL -> Cold Compressed Storage | Automated yearly partition archival |
| **General Ledger & COA Entries** | 10 Years (Audit Mandate) | Hot PostgreSQL | Permanent tax ledger preservation |
| **Inventory Movement Logs** | 3 Years | Hot PostgreSQL -> Cold Parquet Storage | Aggregated monthly stock movement summary kept in Hot |
| **POS Terminal Session Logs** | 1 Year | Hot PostgreSQL | Purged after annual financial closing |
| **System Audit Logs** | 5 Years | Write-Once-Read-Many (WORM) Storage | Immutable audit storage bucket |

---

### 2. Automated Archival Engine
Partitioned PostgreSQL tables (`invoices_2026`, `inventory_movements_2026`) are detached at fiscal year end and compressed into Apache Parquet format for long-term analytical queries.
