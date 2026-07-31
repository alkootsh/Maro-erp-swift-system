# MARO ERP - Form Architecture Specification
## Master Enterprise Protocol v2.0

### Architectural Principles
1. **Unidirectional Data Flow**: Form data flows from Zod Schema definition -> React Hook Form Context -> Form Controls -> Domain Service -> Repository -> MARO Sync Engine.
2. **Zero Browser Validation**: `<form noValidate>` prevents native browser tooltip interference. All rules reside in Zod schemas.
3. **Decoupled UI Layer**: UI components read validation state exclusively from React Hook Form's `formState.errors`.
4. **Reusability**: Reusable form inputs in `/src/components/common/form/` standardise styling, focus management, RTL Arabic error rendering, and accessibilty.

---

### Folder & Component Structure
```
src/
├── components/
│   └── common/
│       └── form/
│           ├── ErrorMessage.tsx       # Localized error text renderer
│           ├── FormField.tsx          # Wrapper for label, help text & error
│           ├── FormInput.tsx          # Standard text/email input
│           ├── FormNumber.tsx         # Numeric input with coercion
│           ├── FormSelect.tsx         # Dropdown select control
│           ├── FormTextarea.tsx       # Multiline text input
│           ├── FormSwitch.tsx         # Toggle switch control
│           ├── ValidationSummary.tsx  # Global error banner with jump links
│           ├── LoadingButton.tsx      # Button with loading state & double-click protection
│           ├── FormProvider.tsx       # Context provider wrapper
│           └── index.ts               # Central export barrel
```

---

### End-to-End Execution Flow
1. **User Action**: User submits the form.
2. **Validation Layer**: `zodResolver` evaluates inputs against `productMasterSchema`.
3. **On Error**:
   - `handleFormError` triggers.
   - Active tab switches to the tab containing the first invalid field.
   - Field receives `autofocus`, red border styling, and inline Arabic error.
   - `ValidationSummary` renders at the top with clickable error links.
4. **On Success**:
   - `LoadingButton` renders a spinner and disables duplicate clicks.
   - `ProductService.createProduct()` runs business logic and checks SKU uniqueness.
   - `ProductRepository.addProduct()` updates local state and writes to `MaroSyncEngine`.
   - Audit log entry recorded into `audit_logs`.
   - Success toast shown, form closes, and product list refreshes.
