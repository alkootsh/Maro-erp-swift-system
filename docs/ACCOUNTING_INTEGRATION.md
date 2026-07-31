# Accounting Integration Architecture
## MARO Business Platform - General Ledger & Automated Postings

### 1. Automated Double-Entry Journal Postings

When transactions execute in Sales, Purchases, or Inventory, the MARO Event Bus automatically generates balanced General Ledger (GL) journal entries:

#### Transaction 1: Sales Invoice Approval
- **Debit**: Accounts Receivable / Cash / Bank (`11100`) -> `+Gross Total`
- **Credit**: Sales Revenue (`41100`) -> `-Net Sales`
- **Credit**: VAT Payable (`21400`) -> `-VAT Amount`
- **Debit**: Cost of Goods Sold - COGS (`51100`) -> `+Item Cost Price`
- **Credit**: Inventory Asset (`11300`) -> `-Item Cost Price`

#### Transaction 2: Purchase Bill Approval
- **Debit**: Inventory Asset (`11300`) -> `+Goods Cost`
- **Debit**: VAT Input Tax (`11400`) -> `+VAT Amount`
- **Credit**: Accounts Payable - Vendor (`21100`) -> `-Total Bill`

#### Transaction 3: POS Cash Sale
- **Debit**: POS Cash Clearing (`11110`) -> `+Total Collected`
- **Credit**: Retail Sales Revenue (`41200`) -> `-Sales Total`
- **Credit**: VAT Payable (`21400`) -> `-VAT Amount`

---

### 2. Chart of Accounts (COA) Structure
1. **Assets (`10000`)**: Current Assets, Bank, Cash, Receivables, Inventory.
2. **Liabilities (`20000`)**: Accounts Payable, Tax Payables, Accrued Expenses.
3. **Equity (`30000`)**: Retained Earnings, Owner Capital.
4. **Revenue (`40000`)**: Retail Sales, Wholesale Sales, Service Income.
5. **Expenses (`50000`)**: Cost of Goods Sold, Rent, Salaries, Depreciation.
