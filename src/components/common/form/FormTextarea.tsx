/**
 * @file FormTextarea.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: FormTextarea.tsx.
 */
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField } from './FormField';

interface FormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {
  name: string;
  label?: string;
  tooltip?: string;
  helperText?: string;
  containerClassName?: string;
  requiredAsterisk?: boolean;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  name,
  label,
  tooltip,
  helperText,
  containerClassName,
  requiredAsterisk,
  className = '',
  rows = 3,
  disabled,
  ...props
}) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name] as any;

  const { required, minLength, maxLength, ...restProps } = props as any;

  return (
    <FormField
      label={label}
      name={name}
      required={requiredAsterisk || required}
      tooltip={tooltip}
      helperText={helperText}
      error={error}
      className={containerClassName}
    >
      <textarea
        id={name}
        rows={rows}
        {...register(name)}
        disabled={disabled}
        {...restProps}
        className={`w-full bg-[#0b0f17] border rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none ${
          error
            ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-950/10'
            : 'border-[#1e293b] focus:border-blue-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''} ${className}`}
      />
    </FormField>
  );
};
