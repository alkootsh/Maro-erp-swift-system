# MARO ERP - AI Platform Documentation (v3.0)
## Master Enterprise Protocol v3.0

### Architecture Overview
MARO AI Intelligence Platform is an embedded, server-side and client-side offline-compatible AI engine designed for enterprise decision making, automated forecasting, and natural language analytics. It operates directly against PostgreSQL ERP transactional data and local offline caches.

### Core Capabilities

1. **Executive Dashboard & KPIs**:
   - Business Health Score calculation engine based on sales velocity, inventory turnover, gross margin, and cash flow ratio.
   - Real-time KPI monitoring across companies, branches, and warehouses.

2. **Automated Enterprise Reporting**:
   - Daily, Weekly, Monthly, and Annual summary reports.
   - Intelligent narrative generation for branch performance, sales trends, and inventory health.

3. **Predictive Analytics & Forecasting**:
   - **Sales & Demand Forecasting**: Moving average & exponential smoothing models for product reorder dates and stockout risks.
   - **Cash Flow Prediction**: Receivables vs payables aging projection.
   - **Product Expiry & Aging Analysis**: Automatic flagging of near-expiry batches and dead stock.

4. **Natural Language Query Engine**:
   - Supports Arabic and English natural language operational queries (e.g., "ما أكثر الأصناف مبيعاً هذا الشهر؟", "ما المنتجات التي يجب طلبها؟").
   - Direct translation to structured database queries executed against PostgreSQL / local sync stores.

5. **Proactive AI Recommendations & Fraud Detection**:
   - Reorder quantity recommendations based on lead time and safety stock.
   - Margin anomaly detection (flagging sales with unusually low or negative gross margin).
   - Credit limit warnings and suspicious activity detection.
