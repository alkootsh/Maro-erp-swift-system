# Error Handling Guide
## MARO Business Platform - Exception Management & Fault Tolerance

### 1. Error Classification Matrix

| Error Class | Category | System Behavior | User Communication |
| :--- | :--- | :--- | :--- |
| `ValidationError` | Client Input | Rejects transaction, flags fields | Red inline alert with field error text |
| `NetworkError` | Connectivity | Enqueues op to `MaroSyncEngine` | Status badge toggles to `Offline Mode` |
| `SyncConflictError`| Data Sync | Applies `Server-Wins` Vector Merge | Toast notification summarizing resolved fields |
| `DatabaseError` | PostgreSQL | Transaction rollback via UoW | Standard API 500 error response with trace ID |
| `AuthError` | Security | Invalidates token, redirects login | Session expired toast modal |

---

### 2. Standardized Error Handling Pattern

```typescript
export class ERPError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ERPError';
  }
}

// Global Exception Wrapper
export async function executeWithErrorBoundary<T>(
  action: () => Promise<T>,
  fallbackValue: T,
  contextName: string
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    console.error(`[MARO Error Boundary - ${contextName}]`, error);
    return fallbackValue;
  }
}
```
