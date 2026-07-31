# Coding Standards
## MARO Business Platform - Enterprise TypeScript & Architecture Standards

### 1. General Principles
- **Strict TypeScript**: `noImplicitAny`, `strictNullChecks`, and `noUnusedLocals` are strictly enforced across all modules.
- **Clean Architecture & CQRS**: Business logic must reside in Commands, Queries, Repositories, or Domain Services. Presentation components must never perform direct SQL queries or mutation side-effects.
- **Immutability**: Avoid mutating objects or array arguments. Return new object instances using spread operators or immutable transformations.
- **Explicit Return Types**: All exported functions, methods, and CQRS handlers must declare explicit return types.
- **No Any Type**: The `any` type is forbidden. Use `unknown` with type guards or generic type parameter constraints.

---

### 2. File Organization & Imports
1. **Import Order**:
   - External standard libraries & React dependencies (`react`, `express`, `lucide-react`).
   - Core MARO Architecture (`src/cqrs/`, `src/lib/maroSyncEngine.ts`).
   - Domain Types & Interfaces (`src/types/`).
   - Repositories & Services (`src/repositories/`, `src/services/`).
   - UI Components (`src/components/`).
   - Helpers & Utilities (`src/lib/`).
2. **Top-Level Exports**: Every file should export its primary class/component or named functions. Avoid export default unless strictly required by React lazy routing.

---

### 3. Component & Logic Guidelines
- **Functional Components**: All React components must be functional components utilizing React Hooks.
- **Hook Dependencies**: `useEffect` dependencies must be explicitly declared. Never pass un-memoized object/array literals into hook dependency arrays.
- **Prop Validation**: Component props must be typed using explicit `interface ComponentProps`.
