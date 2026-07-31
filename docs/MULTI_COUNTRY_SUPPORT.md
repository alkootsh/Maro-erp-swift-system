# Multi-Country Support Specification
## MARO Business Platform - MENA Region Compliance Engine

### 1. Supported Countries Matrix

| Country | Standard VAT Rate | Tax Authority | Electronic Invoicing Requirement | Default Currency |
| :--- | :--- | :--- | :--- | :--- |
| **Egypt (مصر)** | 14.00% | Egyptian Tax Authority (ETA) | ETA SDK JSON/UBL E-Invoicing API | EGP (ج.م) |
| **Saudi Arabia (السعودية)** | 15.00% | ZATCA (هيئـة الزكاة والضريبة والجمارك) | ZATCA Phase 2 XML/UBL 2.1 + Cryptographic Stamp + TLV Base64 QR | SAR (ر.س) |
| **UAE (الإمارات)** | 5.00% | Federal Tax Authority (FTA) | E-Invoicing Network (Peppol Framework) | AED (د.إ) |
| **Kuwait (الكويت)** | 0.00% / Custom | Ministry of Finance (MoF) | Standard Tax Invoice Format | KWD (د.ك) |
| **Qatar (قطر)** | 0.00% / 5.00% | General Tax Authority (GTA) | Dhareeba E-Tax Integration | QAR (ر.ق) |
| **Bahrain (البحرين)** | 10.00% | National Bureau for Revenue (NBR) | NBR Compliant Invoice & QR | BHD (د.ب) |
| **Oman (عُمان)** | 5.00% | Oman Tax Authority (OTA) | Oman Tax QR & Standard Format | OMR (ر.ع) |

---

### 2. Electronic Invoice Integration Layer (E-Invoicing Adapter Pattern)

The platform provides a pluggable **E-Invoicing Integration Layer**:

```typescript
export interface IEInvoiceAdapter {
  countryCode: string;
  generateInvoicePayload(invoice: InvoiceMaster): Promise<string | Record<string, unknown>>;
  generateTaxQRCode(invoice: InvoiceMaster): Promise<string>;
  submitToTaxAuthority(invoice: InvoiceMaster): Promise<TaxSubmissionResult>;
}
```

#### Country Adapters:
1. `ZATCAEInvoiceAdapter` (Saudi Arabia): Constructs UBL 2.1 XML, calculates ECDSA secp256k1 cryptographic stamp, and generates TLV Base64 encoded QR codes containing Seller Name, TRN, Timestamp, Invoice Total, and VAT Amount.
2. `ETAEInvoiceAdapter` (Egypt): Constructs ETA JSON payload, formats line items with EGS / GS1 commodity codes, and signs using PKCS#11 hardware token.
3. `FTAEInvoiceAdapter` (UAE): Generates Peppol BIS Billing 3.0 UBL XML format.

---

### 3. Multi-Currency Engine
- **Exchange Rate Ledger**: Maintains daily exchange rates between local base currency and foreign transaction currencies.
- **Dual Currency Ledger Display**: Every transaction stores amount in local transaction currency AND base reporting currency, calculating unrealized/realized foreign exchange gain/loss automatically.
