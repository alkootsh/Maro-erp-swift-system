import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField } from './FormField';

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  name: string;
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  tooltip?: string;
  helperText?: string;
  containerClassName?: string;
  requiredAsterisk?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  name,
  label,
  options,
  placeholder,
  tooltip,
  helperText,
  containerClassName,
  requiredAsterisk,
  className = '',
  disabled,
  ...props
}) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name] as any;

  const { required, ...restProps } = props as any;

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
      <select
        id={name}
        {...register(name)}
        disabled={disabled}
        {...restProps}
        className={`w-full bg-[#0b0f17] border rounded-xl px-3 py-2.5 text-sm text-white transition-colors focus:outline-none ${
          error
            ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-950/10'
            : 'border-[#1e293b] focus:border-blue-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''} ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};
