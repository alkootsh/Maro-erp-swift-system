# Performance Guidelines
## MARO Business Platform - Enterprise Scale & Speed Benchmarks

### 1. High-Performance Architectural Rules
- **Optimized UI Rendering**: Virtualized lists (`react-window` / `@tanstack/react-virtual`) for data tables rendering over 500 rows.
- **Local Storage / IndexedDB Indexing**: Secondary indices on product SKU, barcode, and customer tax ID for sub-5ms local searches.
- **Batch Processing**: Dispatches up to 100 queued mutations per network request batch to minimize HTTP header overhead.
- **Memory Optimization**: Unsubscribe from event listeners and sync engine channels on component unmount (`useEffect` cleanup).

---

### 2. SLA Performance Targets

| Metric | Enterprise Target Threshold | Benchmark Goal |
| :--- | :--- | :--- |
| **Local Barcode Lookup** | < 10 ms | **< 2 ms** |
| **Local Cart Add Item** | < 15 ms | **< 4 ms** |
| **Product Search (100,000 items)** | < 50 ms | **< 15 ms** |
| **Batch Sync Dispatch (100 ops)** | < 300 ms | **< 150 ms** |
| **Initial ERP Load** | < 1,500 ms | **< 800 ms** |
