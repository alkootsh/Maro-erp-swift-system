import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FormField } from './FormField';

interface FormNumberProps {
  name: string;
  label?: string;
  placeholder?: string;
  tooltip?: string;
  helperText?: string;
  containerClassName?: string;
  className?: string;
  disabled?: boolean;
  requiredAsterisk?: boolean;
  step?: string | number;
}

export const FormNumber: React.FC<FormNumberProps> = ({
  name,
  label,
  placeholder,
  tooltip,
  helperText,
  containerClassName,
  className = '',
  disabled = false,
  requiredAsterisk = false,
  step = 'any'
}) => {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[name] as any;

  return (
    <FormField
      label={label}
      name={name}
      required={requiredAsterisk}
      tooltip={tooltip}
      helperText={helperText}
      error={error}
      className={containerClassName}
    >
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <input
            id={name}
            type="number"
            step={step}
            value={field.value ?? 0}
            onChange={(e) => {
              const val = e.target.value;
              field.onChange(val === '' ? 0 : Number(val));
            }}
            onBlur={field.onBlur}
            name={field.name}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full bg-[#0b0f17] border rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none ${
              error
                ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-950/10'
                : 'border-[#1e293b] focus:border-blue-500'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''} ${className}`}
          />
        )}
      />
    </FormField>
  );
};
