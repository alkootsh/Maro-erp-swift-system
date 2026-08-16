/**
 * @file LowStockReplenishmentModal.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: LowStockReplenishmentModal.tsx.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ShoppingCart, 
  FileText, 
  Send, 
  Check, 
  AlertTriangle, 
  ShieldAlert, 
  Package, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  TrendingUp, 
  Building2, 
  DollarSign,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { LowStockReplenishmentService, ReplenishmentItem } from '../../services/lowStockReplenishmentService';
import { SupplierRepository } from '../../repositories/supplierRepository';
import { Supplier, PurchaseOrder, PurchaseBill } from '../../types/sprint8';
import { formatCurrency, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselectedProductId?: string;
  onSuccess?: () => void;
}

export const LowStockReplenishmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  preselectedProductId,
  onSuccess
}) => {
  const [items, setItems] = useState<ReplenishmentItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bulkSupplierId, setBulkSupplierId] = useState<string>('');
  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  
  // Execution state
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrders, setCreatedOrders] = useState<PurchaseOrder[]>([]);
  const [createdBills, setCreatedBills] = useState<PurchaseBill[]>([]);
  const [processSuccess, setProcessSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'SUPPLIER_PREVIEW'>('ITEMS');

  // Load recommendations
  const loadData = () => {
    const recs = LowStockReplenishmentService.getReplenishmentRecommendations();
    const supps = SupplierRepository.getSuppliers();
    setItems(recs);
    setSuppliers(supps);

    if (preselectedProductId) {
      const found = recs.find(r => r.productId === preselectedProductId);
      if (found) {
        setSelectedIds(new Set([found.productId]));
      } else {
        setSelectedIds(new Set(recs.map(r => r.productId)));
      }
    } else {
      // Default: select all
      setSelectedIds(new Set(recs.map(r => r.productId)));
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setProcessSuccess(false);
      setCreatedOrders([]);
      setCreatedBills([]);
    }
  }, [isOpen, preselectedProductId]);

  const toggleSelect = (productId: string) => {
    const next = new Set(selectedIds);
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.productId)));
    }
  };

  const updateItemQty = (productId: string, newQty: number) => {
    setItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, orderQty: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const updateItemSupplier = (productId: string, supplierId: string) => {
    const supp = suppliers.find(s => s.id === supplierId);
    setItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          supplierId,
          supplierName: supp ? supp.name : item.supplierName,
          supplierPhone: supp ? supp.phone : item.supplierPhone
        };
      }
      return item;
    }));
  };

  const updateItemCost = (productId: string, unitCost: number) => {
    setItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, unitCost: Math.max(0, unitCost) };
      }
      return item;
    }));
  };

  const applyBulkSupplier = (supplierId: string) => {
    if (!supplierId) return;
    const supp = suppliers.find(s => s.id === supplierId);
    if (!supp) return;

    setItems(prev => prev.map(item => {
      if (selectedIds.has(item.productId)) {
        return {
          ...item,
          supplierId,
          supplierName: supp.name,
          supplierPhone: supp.phone
        };
      }
      return item;
    }));
  };

  const filteredItems = useMemo(() => {
    if (filterUrgency === 'ALL') return items;
    return items.filter(i => i.urgency === filterUrgency);
  }, [items, filterUrgency]);

  const selectedItemsList = useMemo(() => {
    return items.filter(i => selectedIds.has(i.productId));
  }, [items, selectedIds]);

  const totals = useMemo(() => {
    let count = selectedItemsList.length;
    let totalQty = 0;
    let totalUntaxed = 0;
    let totalTax = 0;

    for (const item of selectedItemsList) {
      totalQty += item.orderQty;
      const untaxed = item.orderQty * item.unitCost;
      const tax = untaxed * (item.taxRate / 100);
      totalUntaxed += untaxed;
      totalTax += tax;
    }

    return {
      count,
      totalQty,
      totalUntaxed,
      totalTax,
      grandTotal: totalUntaxed + totalTax
    };
  }, [selectedItemsList]);

  // Grouped by supplier for preview & WhatsApp dispatch
  const supplierGroups = useMemo(() => {
    return LowStockReplenishmentService.groupItemsBySupplier(selectedItemsList);
  }, [selectedItemsList]);

  // Actions
  const handleCreatePOs = async () => {
    if (selectedItemsList.length === 0) return;
    setIsProcessing(true);
    try {
      const orders = await LowStockReplenishmentService.convertToPurchaseOrders(selectedItemsList);
      setCreatedOrders(orders);
      setProcessSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إنشاء أوامر الشراء.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateBills = async () => {
    if (selectedItemsList.length === 0) return;
    setIsProcessing(true);
    try {
      const bills = await LowStockReplenishmentService.convertToPurchaseBills(selectedItemsList);
      setCreatedBills(bills);
      setProcessSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إنشاء فواتير الشراء.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-gradient-to-r from-blue-950/30 to-[#151b2b]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShoppingCart size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xl text-white">تحويل تنبيهات نقص المخزون لطلبيات وفواتير شراء للموردين</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {items.length} صنف بحاجة لإعادة طلب
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                توليد أوامر شراء معتمدة (Purchase Orders) أو فواتير استلام مخزني فورية وترحيلها لشجرة الحسابات وإرسالها عبر الواتساب للموردين.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Content */}
        {processSuccess ? (
          /* Success View */
          <div className="p-8 space-y-6 overflow-y-auto flex-1 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 size={44} />
            </div>
            <h2 className="text-2xl font-black text-white">تمت العملية بنجاح!</h2>
            <p className="text-slate-400 max-w-lg mx-auto text-sm">
              {createdBills.length > 0
                ? `تم توليد ${createdBills.length} فاتورة شراء واستلام مخزني وترحيل القيود المحاسبية وتحديث أرصدة المخزون وحسابات الموردين فوراً.`
                : `تم توليد ${createdOrders.length} أمر شراء معتمد (Purchase Orders) مجمع بحسب الموردين جاهز للإرسال والتوريد.`
              }
            </p>

            {/* Created Documents Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto text-right mt-6">
              {createdBills.map(bill => (
                <div key={bill.id} className="p-4 bg-slate-900/80 border border-[#1e293b] rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="text-emerald-400" size={18} />
                      <span className="font-bold text-white text-sm">{bill.billNumber}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300">فاتورة شراء</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">المورد: <span className="text-slate-200">{bill.supplierName}</span> ({bill.items.length} أصناف)</p>
                  </div>
                  <div className="text-left">
                    <span className="font-black text-emerald-400 text-sm">{formatCurrency(bill.grandTotal)}</span>
                    <p className="text-[10px] text-slate-500">تم الترحيل للمخزن</p>
                  </div>
                </div>
              ))}

              {createdOrders.map(order => (
                <div key={order.id} className="p-4 bg-slate-900/80 border border-[#1e293b] rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="text-blue-400" size={18} />
                      <span className="font-bold text-white text-sm">{order.poNumber}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-300">أمر شراء معتمد</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">المورد: <span className="text-slate-200">{order.supplierName}</span> ({order.items.length} أصناف)</p>
                  </div>
                  <div className="text-left">
                    <span className="font-black text-blue-400 text-sm">{formatCurrency(order.totalAmount)}</span>
                    <p className="text-[10px] text-slate-500">بانتظار التوريد</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Direct WhatsApp Actions per Supplier */}
            <div className="bg-[#101522] border border-[#1e293b] p-5 rounded-2xl max-w-4xl mx-auto text-right">
              <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-3">
                <Send size={16} className="text-emerald-400" />
                إرسال أوامر التوريد للموردين عبر الواتساب فوراً:
              </h4>
              <div className="space-y-2">
                {Array.from(supplierGroups.entries()).map(([suppId, group]) => {
                  const msg = LowStockReplenishmentService.formatSupplierOrderWhatsApp(group.supplier, group.items);
                  const waUrl = LowStockReplenishmentService.generateWhatsAppLink(group.supplier.phone, msg);
                  return (
                    <div key={suppId} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-sm font-bold text-white">{group.supplier.name}</p>
                        <p className="text-xs text-slate-400">{group.items.length} أصناف مخصصة للتوريد</p>
                      </div>
                      <a 
                        href={waUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                      >
                        <Send size={14} />
                        إرسال الطلبية عبر الواتساب
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all"
              >
                إغلاق والعودة
              </button>
            </div>
          </div>
        ) : (
          /* Normal Configuration View */
          <div className="flex-1 overflow-hidden flex flex-col">
            
            {/* Top Toolbar */}
            <div className="p-4 bg-slate-900/40 border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterUrgency('ALL')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors",
                    filterUrgency === 'ALL' ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                  )}
                >
                  جميع النواقص ({items.length})
                </button>
                <button
                  onClick={() => setFilterUrgency('CRITICAL')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1",
                    filterUrgency === 'CRITICAL' ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400 hover:text-red-400"
                  )}
                >
                  <ShieldAlert size={14} />
                  حرجة (نفد الرصيد 0)
                </button>
                <button
                  onClick={() => setFilterUrgency('HIGH')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1",
                    filterUrgency === 'HIGH' ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-400 hover:text-amber-400"
                  )}
                >
                  <AlertTriangle size={14} />
                  تحت حد الأمان
                </button>
              </div>

              {/* Bulk Supplier Assignment */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">تعيين مورد موحد للمحدد:</span>
                <select
                  value={bulkSupplierId}
                  onChange={(e) => {
                    setBulkSupplierId(e.target.value);
                    applyBulkSupplier(e.target.value);
                  }}
                  className="bg-[#151b2b] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="">اختر المورد...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredItems.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Package className="mx-auto text-slate-600 mb-2" size={40} />
                  <p className="font-bold">لا توجد أصناف تطابق الفلتر المحدد حالياً.</p>
                </div>
              ) : (
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#1e293b] text-slate-500 font-bold uppercase">
                      <th className="p-3 w-10">
                        <input 
                          type="checkbox"
                          checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-700 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">اسم الصنف و SKU</th>
                      <th className="p-3 text-center">الرصيد الحالي</th>
                      <th className="p-3 text-center">حد الأمان</th>
                      <th className="p-3 text-center">كمية الطلب المقترحة</th>
                      <th className="p-3">المورد المعتمد</th>
                      <th className="p-3 text-center">سعر التكلفة</th>
                      <th className="p-3 text-left">الإجمالي المتوقع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {filteredItems.map(item => {
                      const isSelected = selectedIds.has(item.productId);
                      const lineTotal = item.orderQty * item.unitCost * 1.14;

                      return (
                        <tr 
                          key={item.productId}
                          className={cn(
                            "hover:bg-slate-800/40 transition-colors",
                            isSelected ? "bg-blue-600/5" : "opacity-60"
                          )}
                        >
                          <td className="p-3">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(item.productId)}
                              className="rounded border-slate-700 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {item.urgency === 'CRITICAL' ? (
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="رصيد 0" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-amber-500" title="تحت حد الأمان" />
                              )}
                              <div>
                                <p className="font-bold text-white text-sm">{item.productName}</p>
                                <span className="font-mono text-slate-400 text-[10px]">{item.sku}</span>
                                {item.category && <span className="mr-2 text-[10px] text-slate-500">({item.category})</span>}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={cn(
                              "px-2.5 py-1 rounded-lg font-black text-xs",
                              item.currentStock <= 0 ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                            )}>
                              {item.currentStock}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-400">
                            {item.reorderLevel}
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center border border-[#1e293b] rounded-xl bg-slate-900 overflow-hidden">
                              <button 
                                onClick={() => updateItemQty(item.productId, item.orderQty - 5)}
                                className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800"
                              >
                                -
                              </button>
                              <input 
                                type="number" 
                                value={item.orderQty}
                                onChange={(e) => updateItemQty(item.productId, parseInt(e.target.value) || 1)}
                                className="w-16 text-center bg-transparent font-black text-white text-xs focus:outline-none"
                              />
                              <button 
                                onClick={() => updateItemQty(item.productId, item.orderQty + 5)}
                                className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-3">
                            <select
                              value={item.supplierId}
                              onChange={(e) => updateItemSupplier(item.productId, e.target.value)}
                              className="w-full bg-slate-900 border border-[#1e293b] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                            >
                              {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            <input 
                              type="number"
                              value={item.unitCost}
                              onChange={(e) => updateItemCost(item.productId, parseFloat(e.target.value) || 0)}
                              className="w-20 text-center bg-slate-900 border border-[#1e293b] rounded-xl px-2 py-1 text-xs text-slate-200 font-bold"
                            />
                          </td>
                          <td className="p-3 text-left font-black text-slate-200">
                            {formatCurrency(lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Summary & Actions */}
            <div className="p-5 border-t border-[#1e293b] bg-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Financial Totals */}
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">الأصناف المحددة:</span>
                  <span className="text-base font-black text-white">{totals.count} صنف ({totals.totalQty} وحدة)</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">الصافي بدون ضريبة:</span>
                  <span className="text-base font-bold text-slate-300">{formatCurrency(totals.totalUntaxed)}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">ضريبة القيمة المضافة (14%):</span>
                  <span className="text-base font-bold text-emerald-400">{formatCurrency(totals.totalTax)}</span>
                </div>
                <div className="border-r border-[#1e293b] pr-6">
                  <span className="text-[11px] font-bold text-amber-400 block">إجمالي تكلفة التوريد:</span>
                  <span className="text-xl font-black text-amber-400">{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>

              {/* Conversion Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  disabled={totals.count === 0 || isProcessing}
                  onClick={handleCreatePOs}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50"
                  title="إنشاء أوامر شراء رسمية وإرسالها للموردين للتجهيز"
                >
                  <ShoppingCart size={16} />
                  <span>توليد أوامر شراء معتمدة (POs)</span>
                </button>

                <button
                  disabled={totals.count === 0 || isProcessing}
                  onClick={handleCreateBills}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                  title="إنشاء فواتير شراء واستلام البضاعة فورياً في المخازن وترحيل القيود المحاسبية"
                >
                  <FileText size={16} />
                  <span>إنشاء فواتير شراء واستلام مخزني فوري</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
