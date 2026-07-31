import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FormField } from './FormField';

interface FormSwitchProps {
  name: string;
  label: string;
  description?: string;
  tooltip?: string;
  containerClassName?: string;
  disabled?: boolean;
}

export const FormSwitch: React.FC<FormSwitchProps> = ({
  name,
  label,
  description,
  tooltip,
  containerClassName,
  disabled = false
}) => {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[name] as any;

  return (
    <FormField
      name={name}
      tooltip={tooltip}
      error={error}
      className={containerClassName}
    >
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <label className={`flex items-center justify-between p-3 rounded-xl border border-[#1e293b] bg-[#0b0f17] cursor-pointer hover:border-slate-700 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">{label}</span>
              {description && <span className="text-[11px] text-slate-400 block">{description}</span>}
            </div>
            <input
              type="checkbox"
              checked={!!field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              disabled={disabled}
              className="sr-only peer"
            />
            <div className="relative w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        )}
      />
    </FormField>
  );
};
