import React from 'react';
import { AlertCircle } from 'lucide-react';
import { FieldError } from 'react-hook-form';

interface ErrorMessageProps {
  error?: FieldError | string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, className = '' }) => {
  const message = typeof error === 'string' ? error : error?.message;

  if (!message) return null;

  return (
    <div className={`flex items-center gap-1.5 mt-1.5 text-xs font-medium text-red-400 animate-in fade-in ${className}`}>
      <AlertCircle size={13} className="shrink-0 text-red-400" />
      <span>{message}</span>
    </div>
  );
};
