/**
 * @file KeyboardSearchSelect.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description حقل بحث واختيار ذكي فائق السرعة يدعم لوحة المفاتيح بالكامل (الأسهم، مفتاح الإدخال Enter، الفهرسة الفورية، والتنقل التلقائي للحقل التالي).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Check, ChevronDown, X, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SearchOption {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  meta?: string;
  secondaryMeta?: string;
  disabled?: boolean;
  raw?: any;
}

interface KeyboardSearchSelectProps {
  id?: string;
  label?: string;
  placeholder?: string;
  options: SearchOption[];
  value?: string;
  onChange: (selectedId: string, item?: SearchOption) => void;
  onAdvanceToNextField?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  renderCustomItem?: (item: SearchOption, isHighlighted: boolean) => React.ReactNode;
  clearable?: boolean;
  emptyMessage?: string;
  onNotFoundAction?: (searchTerm: string) => void;
  notFoundActionLabel?: string;
  shortcutBadge?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

// Arabic character normalization helper for fuzzy searching
function normalizeArabic(text: string = ''): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/[ـ]/g, '') // Tatweel
    .replace(/[\u064B-\u065F]/g, ''); // Diacritics
}

export const KeyboardSearchSelect: React.FC<KeyboardSearchSelectProps> = ({
  id,
  label,
  placeholder = 'ابحث بالاسم، الكود، أو رقم الهاتف...',
  options,
  value,
  onChange,
  onAdvanceToNextField,
  autoFocus = false,
  disabled = false,
  required = false,
  className,
  inputClassName,
  dropdownClassName,
  renderCustomItem,
  clearable = true,
  emptyMessage = 'لا توجد نتائج مطابقة لبحثك',
  onNotFoundAction,
  notFoundActionLabel = '+ إضافة صنف جديد (F4)',
  shortcutBadge,
  inputRef: externalInputRef
}) => {
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const listRef = useRef<HTMLDivElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Selected item lookup
  const selectedItem = useMemo(() => {
    return options.find(opt => opt.id === value);
  }, [options, value]);

  // Synchronize input text when value changes externally
  useEffect(() => {
    if (selectedItem) {
      setSearchTerm(selectedItem.title);
    } else if (!value) {
      setSearchTerm('');
    }
  }, [selectedItem, value]);

  // Filter options based on fuzzy term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return options;
    }
    const normSearch = normalizeArabic(searchTerm);
    return options.filter(opt => {
      const normTitle = normalizeArabic(opt.title);
      const normSubtitle = normalizeArabic(opt.subtitle || '');
      const normMeta = normalizeArabic(opt.meta || '');
      const normSec = normalizeArabic(opt.secondaryMeta || '');

      return (
        normTitle.includes(normSearch) ||
        normSubtitle.includes(normSearch) ||
        normMeta.includes(normSearch) ||
        normSec.includes(normSearch)
      );
    });
  }, [options, searchTerm]);

  // Keep highlighted index in valid range
  useEffect(() => {
    if (highlightedIndex >= filteredOptions.length) {
      setHighlightedIndex(Math.max(0, filteredOptions.length - 1));
    }
  }, [filteredOptions.length, highlightedIndex]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const selectOption = (opt: SearchOption) => {
    if (opt.disabled) return;
    onChange(opt.id, opt);
    setSearchTerm(opt.title);
    setIsOpen(false);

    // If caller provided callback to jump to next input field
    if (onAdvanceToNextField) {
      setTimeout(() => {
        onAdvanceToNextField();
      }, 50);
    } else {
      // Default auto-focus advance
      setTimeout(() => {
        if (inputRef.current) {
          const form = inputRef.current.closest('form, div[data-smart-nav="true"], body');
          if (form) {
            const focusables = Array.from(form.querySelectorAll<HTMLElement>(
              'input:not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]), button[data-focusable="true"]'
            )).filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);
            const myIndex = focusables.indexOf(inputRef.current);
            if (myIndex >= 0 && myIndex < focusables.length - 1) {
              const nextEl = focusables[myIndex + 1];
              nextEl.focus();
              if (nextEl instanceof HTMLInputElement) {
                nextEl.select();
              }
            }
          }
        }
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        selectOption(filteredOptions[highlightedIndex]);
      } else if (onAdvanceToNextField) {
        onAdvanceToNextField();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Tab') {
      if (isOpen && filteredOptions.length > 0 && highlightedIndex >= 0) {
        selectOption(filteredOptions[highlightedIndex]);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
    setSearchTerm('');
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={cn("relative text-right", className)}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={id} className="block text-xs font-bold text-slate-400">
            {label} {required && <span className="text-red-400">*</span>}
          </label>
          {shortcutBadge && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">
              {shortcutBadge}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center gap-1.5">
          <Search size={16} />
        </div>

        <input
          id={id}
          ref={inputRef}
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          value={searchTerm}
          autoComplete="off"
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={(e) => {
            e.target.select();
            setIsOpen(true);
          }}
          onBlur={() => {
            // Delay closing so clicks on dropdown items register
            setTimeout(() => {
              setIsOpen(false);
              if (selectedItem) {
                setSearchTerm(selectedItem.title);
              }
            }, 200);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full pr-10 pl-10 py-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs font-bold transition-all placeholder:text-slate-500",
            "focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
            isOpen && "border-emerald-500 ring-2 ring-emerald-500/20",
            disabled && "opacity-50 cursor-not-allowed bg-slate-900",
            inputClassName
          )}
        />

        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {clearable && searchTerm && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }
            }}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronDown size={14} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && !disabled && (
        <div
          ref={listRef}
          className={cn(
            "absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-[#151b2b] border border-[#1e293b] rounded-2xl shadow-2xl divide-y divide-[#1e293b]/60",
            dropdownClassName
          )}
        >
          {filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertCircle size={18} />
                <span className="font-bold">{emptyMessage}</span>
              </div>
              {onNotFoundAction && searchTerm.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onNotFoundAction(searchTerm);
                  }}
                  className="w-full py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-amber-950/40"
                >
                  <span>{notFoundActionLabel}</span>
                  <span className="bg-amber-900/60 text-amber-200 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                    "{searchTerm.length > 20 ? searchTerm.substring(0, 20) + '...' : searchTerm}"
                  </span>
                </button>
              )}
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const isSelected = opt.id === value;

              if (renderCustomItem) {
                return (
                  <div
                    key={opt.id}
                    onClick={() => selectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isHighlighted && "bg-emerald-600/20",
                      isSelected && "bg-emerald-500/10",
                      opt.disabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {renderCustomItem(opt, isHighlighted)}
                  </div>
                );
              }

              return (
                <div
                  key={opt.id}
                  onClick={() => selectOption(opt)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    "p-3 flex items-center justify-between cursor-pointer transition-all text-xs",
                    isHighlighted ? "bg-emerald-600/20 text-white" : "hover:bg-slate-800/60 text-slate-200",
                    isSelected && "border-r-4 border-r-emerald-500 font-black",
                    opt.disabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold truncate text-white">{opt.title}</span>
                      {opt.badge && (
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-md font-bold font-mono",
                            opt.badgeColor || "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                          )}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>

                    {(opt.subtitle || opt.meta) && (
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        {opt.subtitle && <span>{opt.subtitle}</span>}
                        {opt.meta && <span className="font-mono text-slate-300">{opt.meta}</span>}
                        {opt.secondaryMeta && (
                          <span className="font-mono text-amber-400 font-bold">{opt.secondaryMeta}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mr-2">
                    {isSelected && <Check size={16} className="text-emerald-400" />}
                    {isHighlighted && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                        Enter ↵
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
