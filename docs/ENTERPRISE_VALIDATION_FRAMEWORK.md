# MARO ERP - Enterprise Validation Framework Documentation

## Architecture Overview
The MARO Enterprise Validation Framework standardizes form validation across the platform according to Master Enterprise Development Protocol v2.0.

### Key Architectural Rules
1. **Zero HTML5 Validation**: All native HTML5 validation attributes (`required`, `min`, `max`, `pattern`, etc.) are stripped. All `<form>` tags carry `noValidate`.
2. **React Hook Form + Zod Resolver**: Form state management is handled exclusively by `react-hook-form` bound to Zod schemas via `@hookform/resolvers/zod`.
3. **No UI Manual Validation**: UI components do not contain manual validation state or imperative checks.
4. **Centralized Schemas**: All validation schemas reside in dedicated validation domain modules (e.g. `/src/lib/productValidation.ts`).
5. **Arabic Inline Error Messages**: All Zod error messages are localized in clear Arabic.
6. **Visual Highlighting & Focus**: Fields with validation errors display red border styling, inline Arabic helper text, and auto-focus the first invalid field upon submission.
7. **Multi-Tab Auto Navigation**: When submitting a multi-tab form with errors, the framework automatically switches to the tab containing the first failing field.
8. **Validation Summary Bar**: Displays a scannable summary box at the top of the dialog whenever validation fails, listing all errors grouped with quick-jump links.
9. **Duplicate Click Protection**: Save buttons feature a loading spinner state (`LoadingButton`) and disable pointer events during submission.
10. **Offline Persistence Integration**: Validated data streams down the pipeline:
    `Validation -> Service Layer -> Repository -> UnitOfWork -> MARO Sync Engine -> Audit Log`.

---

## Component Suite
Located in `/src/components/common/form/`:
- `FormProvider`: Wraps `<RHFFormProvider>` and `<form noValidate>`
- `FormInput`: Text & email inputs with Zod registration and Arabic error display
- `FormNumber`: Number inputs with step & numeric coercion
- `FormSelect`: Select dropdowns
- `FormTextarea`: Textarea controls
- `FormSwitch`: Toggle switch components
- `ValidationSummary`: Top error banner with jump links
- `LoadingButton`: Submit button with loading state
- `ErrorMessage`: Inline Arabic error renderer

---

## Example Usage

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productMasterSchema, ProductMasterInput } from '@/lib/productValidation';
import { FormProvider, FormInput, FormNumber, ValidationSummary, LoadingButton } from '@/components/common/form';

export const ProductModal = () => {
  const methods = useForm<ProductMasterInput>({
    resolver: zodResolver(productMasterSchema),
    defaultValues: { name: '', sku: '', price: 0 }
  });

  const onSubmit = async (data: ProductMasterInput) => {
    await ProductService.createProduct(data);
  };

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <ValidationSummary errors={methods.formState.errors} />
      <FormInput name="name" label="اسم المنتج *" requiredAsterisk />
      <FormInput name="sku" label="رمز المنتج (SKU) *" requiredAsterisk />
      <FormNumber name="price" label="سعر البيع *" requiredAsterisk />
      <LoadingButton loading={methods.formState.isSubmitting}>حفظ</LoadingButton>
    </FormProvider>
  );
};
```
