# Observability Guide
## MARO Business Platform - Telemetry & Performance Metrics Standard

### 1. Telemetry Metrics Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MARO Observability Dashboard                     │
├───────────────────┬───────────────────┬────────────────────────────────┤
│  Application      │  Business         │  MARO Sync Engine              │
│  - Node Memory    │  - Real-time GMV  │  - Queue Pending Count         │
│  - Event Loop Lag │  - Active Sessions│  - Batch Sync Latency (ms)     │
│  - Active WS Conn │  - Invoice Volume │  - Vector Conflict Resolution  │
├───────────────────┼───────────────────┼────────────────────────────────┤
│  Database (PG)    │  API Gateway      │  System Auditing               │
│  - Pool Usage     │  - Throughput QPS │  - Failed Login Threshold      │
│  - Slow Queries   │  - P95/P99 Latency│  - Privilege Mutations         │
│  - Lock Wait Time │  - 5xx Error Rate │  - Z-Report Variances          │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

### 2. Metric Specifications

#### 2.1 MARO Sync Engine Metrics
- `maro_sync_queue_size`: Gauge tracking pending offline operations in local buffer. Alert threshold: `> 500 ops`.
- `maro_sync_batch_latency_ms`: Histogram measuring round-trip time for `/api/erp/sync` batch dispatch. Target: `< 300 ms`.
- `maro_sync_conflict_count`: Counter tracking vector-timestamp conflict merges.

#### 2.2 Business ERP Metrics
- `erp_gross_merchandise_value_egp`: Real-time gauge of total processed invoice value across branches.
- `erp_inventory_out_of_stock_count`: Real-time gauge of SKUs below reorder threshold.

#### 2.3 API Gateway Metrics
- `api_request_duration_seconds`: Histogram measuring endpoint latency. P95 Target: `< 100 ms`, P99 Target: `< 250 ms`.
- `api_http_requests_total`: Counter bucketed by status code (`2xx`, `4xx`, `5xx`).
