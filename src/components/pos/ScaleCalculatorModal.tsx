/**
 * @file ScaleCalculatorModal.tsx
 * @module POS Scale & Weight Calculator
 * @description نافذة احتساب القيمة والوزن لأصناف الميزان والأصناف بدون باركود (تُفتح بضغط زر المسطرة Space)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Scale, Calculator, X, Check, Search, Sparkles, Tag, DollarSign, ArrowLeftRight } from 'lucide-react';
import { ProductMaster } from '../../types/productMaster';
import { formatCurrency, playSystemChime, parseArabicNumbers } from '../../lib/utils';

interface ScaleCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductMaster | null;
  allProducts: ProductMaster[];
  onConfirm: (product: ProductMaster, weightKg: number, totalAmount: number) => void;
}

export const ScaleCalculatorModal: React.FC<ScaleCalculatorModalProps> = ({
  isOpen,
  onClose,
  product: initialProduct,
  allProducts,
  onConfirm
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductMaster | null>(initialProduct);
  const [searchQuery, setSearchQuery] = useState('');
  const [weightKgInput, setWeightKgInput] = useState<string>('1.000');
  const [totalAmountInput, setTotalAmountInput] = useState<string>('');
  const [unitMode, setUnitMode] = useState<'kg' | 'gram'>('kg');
  const [inputFocusField, setInputFocusField] = useState<'weight' | 'amount'>('weight');

  const weightInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Filter scale & non-barcoded products if user wants to pick an item inside modal
  const scaleProducts = allProducts.filter(p => {
    const isScale = p.isWeighted || p.category?.includes('ميزان') || p.category?.includes('خضروات') || p.category?.includes('لحوم') || p.unit === 'كجم' || !p.barcode;
    const matchesSearch = searchQuery ? (p.name.includes(searchQuery) || p.sku.includes(searchQuery)) : true;
    return isScale && matchesSearch;
  });

  useEffect(() => {
    if (initialProduct) {
      setSelectedProduct(initialProduct);
      const price = initialProduct.price || 1;
      setWeightKgInput('1.000');
      setTotalAmountInput(price.toFixed(2));
    } else if (allProducts.length > 0) {
      const firstScale = allProducts.find(p => p.isWeighted || p.unit === 'كجم' || !p.barcode) || allProducts[0];
      setSelectedProduct(firstScale);
      setWeightKgInput('1.000');
      setTotalAmountInput((firstScale.price || 1).toFixed(2));
    }
  }, [initialProduct, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        weightInputRef.current?.focus();
        weightInputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const unitPrice = selectedProduct?.price || 0;

  // Handle weight change -> calculate total amount
  const handleWeightChange = (rawVal: string) => {
    const cleanStr = parseArabicNumbers(rawVal).replace(/[^0-9.]/g, '');
    setWeightKgInput(cleanStr);

    const valNum = parseFloat(cleanStr) || 0;
    const weightInKg = unitMode === 'gram' ? valNum / 1000 : valNum;
    const calculatedAmount = weightInKg * unitPrice;
    setTotalAmountInput(calculatedAmount > 0 ? calculatedAmount.toFixed(2) : '');
  };

  // Handle total amount change -> calculate weight in KG
  const handleAmountChange = (rawVal: string) => {
    const cleanStr = parseArabicNumbers(rawVal).replace(/[^0-9.]/g, '');
    setTotalAmountInput(cleanStr);

    const amountNum = parseFloat(cleanStr) || 0;
    if (unitPrice > 0 && amountNum > 0) {
      const calculatedKg = amountNum / unitPrice;
      const displayWeight = unitMode === 'gram' ? calculatedKg * 1000 : calculatedKg;
      setWeightKgInput(displayWeight.toFixed(3));
    } else {
      setWeightKgInput('0.000');
    }
  };

  // Toggle between KG and Gram
  const handleToggleUnitMode = () => {
    const newMode = unitMode === 'kg' ? 'gram' : 'kg';
    setUnitMode(newMode);
    
    // Recalculate input string
    const currentKg = parseFloat(weightKgInput) || 0;
    if (newMode === 'gram') {
      const grams = currentKg < 50 ? currentKg * 1000 : currentKg;
      setWeightKgInput(grams.toFixed(0));
    } else {
      const kgs = currentKg > 50 ? currentKg / 1000 : currentKg;
      setWeightKgInput(kgs.toFixed(3));
    }
  };

  const handleApplyPresetWeight = (kg: number) => {
    if (unitMode === 'gram') {
      setWeightKgInput((kg * 1000).toString());
    } else {
      setWeightKgInput(kg.toFixed(3));
    }
    const amount = kg * unitPrice;
    setTotalAmountInput(amount.toFixed(2));
  };

  const handleApplyPresetAmount = (amount: number) => {
    setTotalAmountInput(amount.toString());
    if (unitPrice > 0) {
      const kg = amount / unitPrice;
      setWeightKgInput(unitMode === 'gram' ? (kg * 1000).toFixed(0) : kg.toFixed(3));
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProduct) return;

    const rawWeight = parseFloat(weightKgInput) || 0;
    const weightInKg = unitMode === 'gram' ? rawWeight / 1000 : rawWeight;
    const totalAmount = parseFloat(totalAmountInput) || (weightInKg * unitPrice);

    if (weightInKg <= 0) {
      playSystemChime('warning');
      alert('يرجى إدخال وزن أو قيمة صالحة أكبر من الصفر');
      return;
    }

    playSystemChime('confirm');
    onConfirm(selectedProduct, weightInKg, totalAmount);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans text-right dir-rtl">
      <div className="bg-[#151b2b] w-full max-w-xl rounded-3xl border border-blue-500/40 shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Scale size={26} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>شاشة احتساب الميزان والقيمة (زر المسطرة Space)</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-mono border border-amber-500/30">Space Key</span>
              </h3>
              <p className="text-xs text-slate-400">حدد الوزن المطلوب بالكجم/الجرام أو أدخل المبلغ المطلوب مباشرةً</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Product Selector / Display */}
        <div className="bg-[#0b0f19] border border-[#1e293b] p-4 rounded-2xl space-y-3">
          <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Tag size={14} />
            <span>الصنف المحدد للميزان:</span>
          </label>
          {selectedProduct ? (
            <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <div>
                <h4 className="font-bold text-white text-base">{selectedProduct.name}</h4>
                <p className="text-xs text-slate-400 font-mono">الكود: {selectedProduct.sku} | القسم: {selectedProduct.category || 'عام'}</p>
              </div>
              <div className="text-left font-mono">
                <span className="text-[10px] text-slate-400 block">سعر الكيلو (سعر الوحدة)</span>
                <span className="text-lg font-black text-emerald-400">{formatCurrency(selectedProduct.price)} / كجم</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="ابحث باسم صنف الميزان أو الفاكهة/الخضار..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2 text-white text-xs"
              />
              <div className="max-h-36 overflow-y-auto space-y-1">
                {scaleProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(p);
                      setTotalAmountInput((p.price || 0).toFixed(2));
                    }}
                    className="w-full text-right p-2.5 bg-slate-800 hover:bg-blue-600/30 rounded-xl text-xs font-bold text-slate-200 flex justify-between items-center"
                  >
                    <span>{p.name}</span>
                    <span className="text-emerald-400 font-mono">{formatCurrency(p.price)} /كجم</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dual Input Section */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Weight Input */}
            <div className={`p-4 rounded-2xl border transition-all ${inputFocusField === 'weight' ? 'bg-amber-950/20 border-amber-500/60 shadow-lg shadow-amber-500/10' : 'bg-[#0b0f19] border-[#1e293b]'}`}>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Scale size={16} className="text-amber-400" />
                  <span>الوزن المطلـوب</span>
                </label>
                <button
                  type="button"
                  onClick={handleToggleUnitMode}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border border-amber-500/30"
                >
                  <ArrowLeftRight size={12} />
                  <span>{unitMode === 'kg' ? 'كجم (KG)' : 'جرام (Gram)'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  ref={weightInputRef}
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  value={weightKgInput}
                  onFocus={() => setInputFocusField('weight')}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  className="w-full bg-[#151b2b] border border-amber-500/40 rounded-xl px-4 py-3 text-white text-2xl font-mono font-black text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="0.000"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                  {unitMode === 'kg' ? 'كجم' : 'جرام'}
                </span>
              </div>
            </div>

            {/* Total Price Amount Input */}
            <div className={`p-4 rounded-2xl border transition-all ${inputFocusField === 'amount' ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-500/10' : 'bg-[#0b0f19] border-[#1e293b]'}`}>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <DollarSign size={16} className="text-emerald-400" />
                  <span>القيمـة المطلوبـة (مبلغ كلي)</span>
                </label>
                <span className="text-[10px] text-slate-400">حساب آلي للوزن</span>
              </div>
              <div className="relative">
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  value={totalAmountInput}
                  onFocus={() => setInputFocusField('amount')}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full bg-[#151b2b] border border-emerald-500/40 rounded-xl px-4 py-3 text-white text-2xl font-mono font-black text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-400"
                  placeholder="0.00"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400 font-mono">
                  ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Quick Presets Buttons */}
          <div className="space-y-3 bg-[#0b0f19] p-4 rounded-2xl border border-[#1e293b]">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">اختصارات الأوزان السريعة:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '250جرام (ربع)', kg: 0.25 },
                  { label: '500جرام (نصف)', kg: 0.50 },
                  { label: '750جرام (3/4)', kg: 0.75 },
                  { label: '1 كجم', kg: 1.0 },
                  { label: '1.5 كجم', kg: 1.5 },
                  { label: '2 كجم', kg: 2.0 },
                  { label: '3 كجم', kg: 3.0 },
                  { label: '5 كجم', kg: 5.0 }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPresetWeight(preset.kg)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-amber-600 hover:text-slate-950 text-slate-200 rounded-xl text-xs font-bold font-mono transition-all border border-slate-700"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">اختصارات المبالغ والقيمة السريعة:</span>
              <div className="flex flex-wrap gap-1.5">
                {[10, 20, 50, 100, 150, 200, 500].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleApplyPresetAmount(amount)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-300 rounded-xl text-xs font-bold font-mono transition-all border border-slate-700"
                  >
                    {amount} ج.م
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!selectedProduct}
              className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Check size={18} />
              <span>إضافة الصنف للسلة بالوزن المخصص (Enter)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
