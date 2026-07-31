import React from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { FieldErrors } from 'react-hook-form';

interface ValidationSummaryProps {
  errors: FieldErrors;
  fieldTabMap?: Record<string, { tabId: string; tabLabel: string; fieldLabel: string }>;
  onSelectError?: (fieldName: string, tabId?: string) => void;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  fieldTabMap = {},
  onSelectError,
  className = ''
}) => {
  const errorEntries = Object.entries(errors).filter(([_, err]) => Boolean(err?.message));

  if (errorEntries.length === 0) return null;

  return (
    <div className={`p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 animate-in fade-in space-y-2 ${className}`}>
      <div className="flex items-center gap-2 font-bold text-xs text-red-400">
        <AlertTriangle size={16} className="shrink-0 text-red-400" />
        <span>توجد أخطاء في المدخلات يرجى تصحيحها للتمكن من الحفظ ({errorEntries.length} خطأ):</span>
      </div>
      <ul className="space-y-1.5 pt-1 text-xs pr-5 list-disc marker:text-red-400">
        {errorEntries.map(([fieldName, err]) => {
          const mapping = fieldTabMap[fieldName];
          const tabLabel = mapping?.tabLabel;
          const fieldLabel = mapping?.fieldLabel || fieldName;
          const message = typeof err?.message === 'string' ? err.message : 'قيمة غير صالحة';

          return (
            <li key={fieldName} className="group">
              <button
                type="button"
                onClick={() => onSelectError?.(fieldName, mapping?.tabId)}
                className="text-right hover:underline text-red-300 font-medium inline-flex items-center gap-1 group-hover:text-red-100 transition-colors"
              >
                <span>
                  {tabLabel ? `[تبويب: ${tabLabel}] ` : ''}
                  <strong className="font-bold">{fieldLabel}:</strong> {message}
                </span>
                <ArrowLeft size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
