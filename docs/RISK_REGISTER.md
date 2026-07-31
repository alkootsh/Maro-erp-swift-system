# Enterprise Risk Register
## MARO Business Platform - Risk Management & Mitigation Matrix

### Active Risk Log

| Risk ID | Risk Category | Description | Severity | Probability | Mitigation Strategy | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-001** | Data Integrity | Offline POS transaction conflicts on multi-lane concurrent checkouts | High | Medium | Sequence pre-allocation ranges per terminal (`TERM01-001` to `TERM01-999`) and atomic PostgreSQL row locks (`FOR UPDATE`). | Backend Lead |
| **RSK-002** | Compliance | Non-compliance with country E-Invoicing laws (e.g. Saudi ZATCA Phase 2 XML/UBL 2.1 QR validation) | High | Low | Country Configuration Adapter & Electronic Invoice Integration Layer with isolated tax rule validators. | Compliance Officer |
| **RSK-003** | Performance | Local storage buffer overflow on low-memory POS devices (>100,000 SKUs) | Medium | Medium | IndexedDB chunking with `idb` driver and LRU (Least Recently Used) cache purging for inactive product assets. | Frontend Lead |
| **RSK-004** | Security | Unencrypted local offline sales database on POS hardware | High | Low | WebCrypto API client-side AES-GCM 256-bit encryption for local offline queue storage keys. | Security Lead |
| **RSK-005** | Network | Server queue congestion during mass end-of-day store syncs | Medium | High | Exponential backoff retry with random jitter in `MARO Sync Engine` and API rate-limiting per store branch. | DevOps Engineer |
