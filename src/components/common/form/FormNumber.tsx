/**
 * @file FormNumber.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: FormNumber.tsx.
 */
import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FormField } from './FormField';
import { Plus, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import { parseArabicNumbers } from '../../../lib/utils';

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
  showStepper?: boolean;
  min?: number;
  max?: number;
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
  step = 'any',
  showStepper = false,
  min,
  max
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
        render={({ field }) => {
          const numValue = Number(field.value) || 0;
          const stepAmount = typeof step === 'number' ? step : 1;

          const handleIncrement = () => {
            const nextVal = numValue + stepAmount;
            if (max !== undefined && nextVal > max) return;
            field.onChange(nextVal);
          };

          const handleDecrement = () => {
            const nextVal = numValue - stepAmount;
            if (min !== undefined && nextVal < min) return;
            field.onChange(nextVal < 0 && min === 0 ? 0 : nextVal);
          };

          if (showStepper) {
            return (
              <div className="flex items-center gap-1 w-full">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={disabled || (min !== undefined && numValue <= min)}
                  className="px-3 py-2.5 bg-[#1e293b] hover:bg-slate-700 active:bg-slate-800 text-slate-200 border border-[#334155] rounded-xl font-bold text-sm select-none cursor-pointer transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="إنقاص الكمية (-)"
                >
                  <Minus size={16} />
                </button>

                <div className="relative flex-1">
                  <input
                    id={name}
                    type="text"
                    inputMode="decimal"
                    dir="ltr"
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === '+' || e.code === 'NumpadAdd') {
                        e.preventDefault();
                        handleIncrement();
                      } else if (e.key === 'ArrowDown' || e.key === '-' || e.code === 'NumpadSubtract') {
                        e.preventDefault();
                        handleDecrement();
                      } else if (e.key === 'Enter' || e.code === 'NumpadEnter') {
                        e.preventDefault();
                        const form = e.currentTarget.form;
                        if (form) {
                          const elements = Array.from(form.elements) as HTMLElement[];
                          const index = elements.indexOf(e.currentTarget);
                          if (index > -1 && index < elements.length - 1) {
                             let nextIndex = index + 1;
                             while(nextIndex < elements.length) {
                               const nextEl = elements[nextIndex];
                               if(!nextEl.hasAttribute('disabled') && nextEl.tabIndex >= 0) {
                                  nextEl.focus();
                                  break;
                               }
                               nextIndex++;
                             }
                          }
                        }
                      }
                    }}
                    value={field.value !== undefined && field.value !== null ? field.value : ''}
                    onChange={(e) => {
                      let valStr = parseArabicNumbers(e.target.value);
                      valStr = valStr.replace(/[^0-9.-]/g, '');
                      if (valStr === '' || valStr === '-') {
                        field.onChange(valStr === '' ? 0 : valStr);
                      } else {
                        const num = Number(valStr);
                        // Allow ending with dot for decimal typing
                        if (valStr.endsWith('.')) {
                           field.onChange(valStr);
                        } else if (!isNaN(num)) {
                           field.onChange(num);
                        }
                      }
                    }}
                    onBlur={(e) => {
                       const valStr = e.target.value;
                       const num = Number(valStr);
                       if (!isNaN(num)) {
                          field.onChange(num);
                       } else {
                          field.onChange(0);
                       }
                       field.onBlur();
                    }}
                    name={field.name}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`w-full bg-[#0b0f17] border rounded-xl px-3 py-2.5 text-center font-bold text-sm text-white placeholder-slate-500 transition-colors focus:outline-none ${
                      error
                        ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-950/10'
                        : 'border-[#1e293b] focus:border-blue-500'
                    } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''} ${className}`}
                  />
                  <div className="absolute left-1 top-1 bottom-1 flex flex-col justify-center">
                    <button
                      type="button"
                      onClick={handleIncrement}
                      disabled={disabled || (max !== undefined && numValue >= max)}
                      className="p-0.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="زيادة"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={handleDecrement}
                      disabled={disabled || (min !== undefined && numValue <= min)}
                      className="p-0.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="إنقاص"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={disabled || (max !== undefined && numValue >= max)}
                  className="px-3 py-2.5 bg-[#1e293b] hover:bg-slate-700 active:bg-slate-800 text-slate-200 border border-[#334155] rounded-xl font-bold text-sm select-none cursor-pointer transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="زيادة الكمية (+)"
                >
                  <Plus size={16} />
                </button>
              </div>
            );
          }

          return (
            <input
              id={name}
              type="text"
              inputMode="decimal"
              dir="ltr"
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === '+' || e.code === 'NumpadAdd') {
                  e.preventDefault();
                  handleIncrement();
                } else if (e.key === 'ArrowDown' || e.key === '-' || e.code === 'NumpadSubtract') {
                  e.preventDefault();
                  handleDecrement();
                } else if (e.key === 'Enter' || e.code === 'NumpadEnter') {
                  e.preventDefault();
                  const form = e.currentTarget.form;
                  if (form) {
                    const elements = Array.from(form.elements) as HTMLElement[];
                    const index = elements.indexOf(e.currentTarget);
                    if (index > -1 && index < elements.length - 1) {
                       let nextIndex = index + 1;
                       while(nextIndex < elements.length) {
                         const nextEl = elements[nextIndex];
                         if(!nextEl.hasAttribute('disabled') && nextEl.tabIndex >= 0) {
                            nextEl.focus();
                            break;
                         }
                         nextIndex++;
                       }
                    }
                  }
                }
              }}
              value={field.value !== undefined && field.value !== null ? field.value : ''}
              onChange={(e) => {
                let valStr = parseArabicNumbers(e.target.value);
                valStr = valStr.replace(/[^0-9.-]/g, '');
                if (valStr === '' || valStr === '-') {
                  field.onChange(valStr === '' ? 0 : valStr);
                } else {
                  const num = Number(valStr);
                  if (valStr.endsWith('.')) {
                     field.onChange(valStr);
                  } else if (!isNaN(num)) {
                     field.onChange(num);
                  }
                }
              }}
              onBlur={(e) => {
                 const valStr = e.target.value;
                 const num = Number(valStr);
                 if (!isNaN(num)) {
                    field.onChange(num);
                 } else {
                    field.onChange(0);
                 }
                 field.onBlur();
              }}
              name={field.name}
              disabled={disabled}
              placeholder={placeholder}
              className={`w-full bg-[#0b0f17] border rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none ${
                error
                  ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-950/10'
                  : 'border-[#1e293b] focus:border-blue-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''} ${className}`}
            />
          );
        }}
      />
    </FormField>
  );
};
