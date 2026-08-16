/**
 * @file FunctionKeyBar.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: FunctionKeyBar.tsx.
 */
// MARO ERP - Global POS & ERP Function Key Toolbar & Keyboard Mode Bar
// Sprint 8.2 Usability Architecture

import React, { useState, useEffect } from 'react';
import { 
  Keyboard, 
  HelpCircle, 
  User, 
  Barcode, 
  PauseCircle, 
  PlayCircle, 
  Percent, 
  DollarSign, 
  CreditCard, 
  CheckCircle2, 
  Printer, 
  Calculator, 
  Trash2,
  Sparkles,
  ArrowRightLeft,
  Binary
} from 'lucide-react';
import { POSFunctionKeyRegistry, POSKeyMapping } from '../../lib/posFunctionKeyRegistry';
import { cn } from '../../lib/utils';

interface FunctionKeyBarProps {
  onExecuteKey?: (key: string, actionId: string) => void;
  activeInputType?: 'numeric' | 'text' | 'barcode';
}

export const FunctionKeyBar: React.FC<FunctionKeyBarProps> = ({ 
  onExecuteKey,
  activeInputType = 'numeric'
}) => {
  const [mappings, setMappings] = useState<POSKeyMapping[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    // Load F-Key mappings
    const rawMappings = POSFunctionKeyRegistry.getKeyMappings();
    setMappings(rawMappings.slice(0, 12)); // Display F1 to F12

    // Keydown listener highlight effect
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.startsWith('F') && /^F(1[0-2]|[1-9])$/.test(e.key)) {
        setActiveKey(e.key);
        setTimeout(() => setActiveKey(null), 300);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getKeyIcon = (actionId: string) => {
    switch (actionId) {
      case 'NEW_INVOICE': return <Sparkles size={14} className="text-emerald-400" />;
      case 'CUSTOMER_SEARCH': return <User size={14} className="text-blue-400" />;
      case 'MANUAL_BARCODE': return <Barcode size={14} className="text-purple-400" />;
      case 'HOLD_INVOICE': return <PauseCircle size={14} className="text-amber-400" />;
      case 'RESUME_INVOICE': return <PlayCircle size={14} className="text-indigo-400" />;
      case 'DISCOUNT_PERCENT': return <Percent size={14} className="text-pink-400" />;
      case 'CASH_PAYMENT': return <DollarSign size={14} className="text-emerald-400" />;
      case 'VISA_PAYMENT': return <CreditCard size={14} className="text-blue-400" />;
      case 'MIXED_PAYMENT': return <CheckCircle2 size={14} className="text-amber-400" />;
      case 'CLOSE_SHIFT': return <Printer size={14} className="text-red-400" />;
      case 'CALCULATOR': return <Calculator size={14} className="text-slate-400" />;
      case 'DELETE_INVOICE': return <Trash2 size={14} className="text-rose-400" />;
      default: return <Keyboard size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="bg-[#0b0f1a] border-t border-[#1e293b] p-2 text-right select-none shadow-2xl">
      <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#151b2b] border border-[#1e293b] rounded-lg text-[10px] font-bold text-slate-300">
            <Keyboard size={13} className="text-blue-400" />
            <span>شريط مفاتيح الوظائف السريعة (F1 → F12)</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[9px] font-bold">
            <ArrowRightLeft size={11} />
            <span>التنقل الذكي بمفتاح [Enter ↵] والأسهم</span>
          </span>
        </div>

        {/* Input Keyboard Mode Indicator */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-bold hidden md:inline">وضع لوحة المفاتيح:</span>
          <span className={cn(
            "px-2.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border",
            activeInputType === 'numeric' ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-blue-500/10 text-blue-400 border-blue-500/30"
          )}>
            <Binary size={12} />
            <span>{activeInputType === 'numeric' ? 'أرقام [Numeric Keyboard 123]' : 'حروف [Text Keyboard ABC]'}</span>
          </span>
        </div>
      </div>

      {/* Function Keys Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
        {mappings.map((m) => {
          const action = POSFunctionKeyRegistry.getActionById(m.actionId);
          const isPressed = activeKey === m.key;
          return (
            <button
              key={m.key}
              onClick={() => onExecuteKey && onExecuteKey(m.key, m.actionId)}
              className={cn(
                "p-1.5 rounded-xl border text-right transition-all flex flex-col justify-between h-14 relative overflow-hidden group active:scale-95",
                isPressed ? "ring-2 ring-blue-400 scale-95" : "hover:border-slate-600",
                m.color || 'bg-[#151b2b] border-[#1e293b]'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-black font-mono px-1 py-0.2 rounded bg-black/40 text-white border border-white/10">
                  {m.key}
                </span>
                {getKeyIcon(m.actionId)}
              </div>
              <span className="text-[10px] font-bold text-white truncate block w-full leading-tight mt-1">
                {m.customLabel || action?.name || m.actionId}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
