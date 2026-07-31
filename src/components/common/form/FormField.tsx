import React from 'react';
import { HelpCircle } from 'lucide-react';
import { ErrorMessage } from './ErrorMessage';
import { FieldError } from 'react-hook-form';

interface FormFieldProps {
  label?: string;
  name: string;
  required?: boolean;
  tooltip?: string;
  helperText?: string;
  error?: FieldError | string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  required,
  tooltip,
  helperText,
  error,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={name} className="text-xs font-medium text-slate-300 flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-red-400 font-bold">*</span>}
          </label>
          {tooltip && (
            <div className="group relative cursor-pointer text-slate-400 hover:text-blue-400">
              <HelpCircle size={13} />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 bg-[#0b0f17] border border-[#1e293b] text-[11px] text-slate-300 rounded-lg shadow-xl z-30 pointer-events-none">
                {tooltip}
              </div>
            </div>
          )}
        </div>
      )}
      {children}
      {helperText && !error && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}
      <ErrorMessage error={error} />
    </div>
  );
};
