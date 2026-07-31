# MARO ERP - Form Validation Guidelines
## Master Enterprise Protocol v2.0

### Absolute Validation Rules

1. **NO Native HTML5 Validation**
   - **Never** add `required`, `min`, `max`, `maxlength`, or `pattern` attributes to HTML input elements.
   - **Always** add `noValidate` to `<form>` tags via `<FormProvider>`.

2. **ALL Validation Belongs in Zod**
   - Do NOT write manual `if (!name) alert(...)` checks in UI event handlers.
   - Define all schemas in Zod domain files (e.g., `src/lib/productValidation.ts`).

3. **Arabic Localized Error Messages**
   - Every Zod validation rule must explicitly specify an Arabic message string.
   - Example:
     ```ts
     name: z.string().min(1, 'اسم المنتج مطلوب'),
     price: z.number().min(0, 'سعر البيع لا يمكن أن يكون بالسالب')
     ```

4. **Tab-Aware Auto Focus**
   - For multi-tab forms, define a mapping from field name to tab ID.
   - Ensure `onError` callback switches tabs automatically and focuses the first invalid element.

5. **Double Click Protection**
   - Use `LoadingButton` for form submit buttons.
   - Check `methods.formState.isSubmitting` or local `loading` state to prevent duplicate server/sync requests.

6. **Offline First Persistence**
   - Validated data must persist locally via `MaroSyncEngine` even when network connection is absent.
