# Localization & Internationalization Guide
## MARO Business Platform - RTL/LTR & Multi-Language Standard

### 1. Bilingual Architecture (Arabic & English)
The MARO Business Platform natively supports **Arabic (RTL)** as the primary UI layout and **English (LTR)** as a secondary international layout.

```typescript
export type SupportedLanguage = 'ar' | 'en';
export type TextDirection = 'rtl' | 'ltr';

export interface LocaleConfig {
  code: SupportedLanguage;
  dir: TextDirection;
  label: string;
  fontFamily: string;
}
```

---

### 2. RTL Layout Guidelines (Tailwind CSS)
- **Logical Tailwind Spacing**: Use logical properties (`ms-`, `me-`, `ps-`, `pe-`) instead of absolute physical directions (`ml-`, `mr-`, `pl-`, `pr-`) to ensure automatic layout flipping when toggling direction.
- **Dynamic HTML Direction**: Root `<html>` element dynamically receives `dir="rtl"` or `dir="ltr"` attribute based on active user context.
- **Font Typography Pairing**:
  - Arabic Mode: `Cairo`, `Plus Jakarta Sans`, sans-serif.
  - English Mode: `Plus Jakarta Sans`, system-ui, sans-serif.

---

### 3. Number, Currency & Date Formatting
All numeric values, currency amounts, and timestamps must be formatted using standard `Intl` browser APIs:

```typescript
// Currency Formatter
export function formatCurrency(amount: number, currencyCode = 'EGP', locale = 'ar-EG'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2
  }).format(amount);
}
```
