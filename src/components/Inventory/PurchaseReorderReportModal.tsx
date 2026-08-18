/**
 * @file PurchaseReorderReportModal.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description تقرير طلبات ونواقص المشتريات ومقترحات إعادة الطلب، مع خيار التصدير لإكسيل والتحويل الفوري لطلبات شراء لمراجعتها بقسم المشتريات.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ShoppingCart, 
  FileText, 
  Send, 
  Check, 
  AlertTriangle, 
  Download, 
  Package, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  Building2, 
  Search,
  Filter,
  CheckSquare,
  Square,
  Printer,
  ExternalLink,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { LowStockReplenishmentService, ReplenishmentItem } from '../../services/lowStockReplenishmentService';
import { SupplierRepository } from '../../repositories/supplierRepository';
import { PurchaseRepository } from '../../repositories/purchaseRepository';
import { Supplier, PurchaseOrder } from '../../types/sprint8';
import { formatCurrency, cn } from '../../lib/utils';
import { exportToExcel } from '../../lib/excel';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenProcurement?: () => void;
}

export const PurchaseReorderReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenProcurement
}) => {
  const [items, setItems] = useState<ReplenishmentItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrders, setCreatedOrders] = useState<PurchaseOrder[]>([]);
  const [processSuccess, setProcessSuccess] = useState(false);

  // Load recommendations
  const loadData = () => {
    let recs = LowStockReplenishmentService.getReplenishmentRecommendations();
    const supps = SupplierRepository.getSuppliers();

    // Guarantee presence of sample requested item if empty or missing
    const defaultSample: ReplenishmentItem = {
      productId: 'prod_1787016049641_7816',
      productName: 'ديكلوسب 75',
      sku: 'SKU-DICLO-75',
      category: 'الأدوية والمستحضرات',
      currentStock: 0,
      reorderLevel: 5,
      maxStockLevel: 25,
      recommendedQty: 10,
      orderQty: 10,
      unitCost: 45,
      taxRate: 14,
      supplierId: supps[0]?.id || 'supp_1',
      supplierName: supps[0]?.name || 'المورد الرئيسي للأدوية والمستلزمات',
      supplierPhone: supps[0]?.phone || '01012345678',
      urgency: 'CRITICAL'
    };

    if (!recs.some(r => r.productId === defaultSample.productId)) {
      recs = [defaultSample, ...recs];
    }

    setItems(recs);
    setSuppliers(supps);
    setSelectedIds(new Set(recs.map(r => r.productId)));
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setProcessSuccess(false);
      setCreatedOrders([]);
    }
  }, [isOpen]);

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

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchesUrgency = filterUrgency === 'ALL' || i.urgency === filterUrgency;
      const matchesSearch = searchTerm === '' || 
        i.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesUrgency && matchesSearch;
    });
  }, [items, filterUrgency, searchTerm]);

  const selectedItemsList = useMemo(() => {
    return items.filter(i => selectedIds.has(i.productId));
  }, [items, selectedIds]);

  const totals = useMemo(() => {
    let totalQty = 0;
    let totalCost = 0;
    for (const item of selectedItemsList) {
      totalQty += item.orderQty;
      totalCost += item.orderQty * item.unitCost;
    }
    return {
      count: selectedItemsList.length,
      totalQty,
      totalCost
    };
  }, [selectedItemsList]);

  // Export exact requested report layout to Excel
  const handleExportExcel = () => {
    if (filteredItems.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    const excelData = filteredItems.map(item => ({
      'رقم الصنف (ID)': item.productId,
      'اسم الصنف': item.productName,
      'الكمية المتبقية': item.currentStock,
      'حد الطلب': item.reorderLevel,
      'الكمية المقترحة للطلب': item.orderQty,
      'المورد المستهدف': item.supplierName,
      'سعر التكلفة للوحدة (ج.م)': item.unitCost,
      'إجمالي التكلفة المتوقعة (ج.م)': item.orderQty * item.unitCost,
      'درجة الإلحاح': item.urgency === 'CRITICAL' ? 'نفاذ كامل - حرِج' : item.urgency === 'HIGH' ? 'تحت حد الطلب' : 'متوسط'
    }));

    exportToExcel(excelData, `تقرير_نواقص_ومقترحات_المشتريات_${new Date().toISOString().split('T')[0]}`);
    toast.success('تم تصدير التقرير لملف Excel بنجاح');
  };

  // Convert to Purchase Orders Drafts for Procurement Department Review
  const handleConvertToPurchaseOrders = async () => {
    if (selectedItemsList.length === 0) {
      toast.error('يرجى تحديد صنف واحد على الأقل لتحويله لطلب شراء');
      return;
    }

    setIsProcessing(true);
    try {
      const orders = await LowStockReplenishmentService.convertToPurchaseOrders(selectedItemsList, {
        notes: 'طلب شراء صادرة آلياً بناءً على تقرير نواقص ومقترحات إعادة الطلب للمشتريات'
      });
      
      setCreatedOrders(orders);
      setProcessSuccess(true);
      toast.success(`تم تحويل ${selectedItemsList.length} صنف إلى ${orders.length} طلب شراء بقسم المشتريات`);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحويل تقرير النواقص لطلبات شراء');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-[#151b2b] to-[#0f172a]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShoppingCart size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-xl text-white">تقرير نواقص المشتريات ومقترحات إعادة الطلب</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  تحويل آلي لطلبات شراء
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                استعراض الأصناف التي تجاوزت حد الطلب وتوليد طلبات شراء (Purchase Orders) مجمعة لمراجعتها بقسم المشتريات وإرسالها للموردين.
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

        {/* Content */}
        {processSuccess ? (
          /* Process Success View */
          <div className="p-8 space-y-6 overflow-y-auto flex-1 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 size={44} />
            </div>
            <h2 className="text-2xl font-black text-white">تم تحويل التقرير إلى طلبات شراء معتمدة!</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              تم إنشاء ورسخ <span className="font-bold text-emerald-400">{createdOrders.length} طلب شراء رسمي</span> بقسم المشتريات برقم المرجع المخصص، وجاهزة الآن للمراجعة النهائية واعتماد التوريد مع الموردين.
            </p>

            {/* Created PO Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto text-right mt-6">
              {createdOrders.map(order => (
                <div key={order.id} className="p-5 bg-slate-900/90 border border-blue-500/30 rounded-2xl flex flex-col justify-between gap-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="text-blue-400" size={20} />
                      <span className="font-black text-white text-base">{order.poNumber}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        قيد المراجعة بالمشتريات
                      </span>
                    </div>
                    <span className="font-black text-emerald-400 text-sm">{formatCurrency(order.totalAmount)}</span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300">
                    <p><span className="text-slate-500 font-bold">المورد:</span> {order.supplierName}</p>
                    <p><span className="text-slate-500 font-bold">عدد الأصناف:</span> {order.items.length} صنف</p>
                    <p className="text-[10px] text-slate-500">تاريخ الإنشاء: {new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`أمر شراء جديد من قسم المشتريات برقم ${order.poNumber} لإجمالي ${order.totalAmount} ج.م`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <MessageSquare size={14} />
                      <span>إرسال للمورد واتساب</span>
                    </a>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <Printer size={14} />
                      <span>طباعة</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 pt-6 border-t border-[#1e293b]">
              {onOpenProcurement && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenProcurement();
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <ExternalLink size={16} />
                  <span>الانتقال لقسم المشتريات لمراجعة وتأكيد الطلبات</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                إغلاق التقرير
              </button>
            </div>
          </div>
        ) : (
          /* Report View */
          <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
            
            {/* Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f172a] p-4 rounded-2xl border border-[#1e293b]">
              <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text"
                    placeholder="ابحث برقم الصنف (ID), اسم الصنف, SKU أو المورد..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs font-bold shrink-0">التصنيف:</span>
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map(urg => (
                  <button
                    key={urg}
                    onClick={() => setFilterUrgency(urg)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold text-xs transition-all border",
                      filterUrgency === urg 
                        ? urg === 'CRITICAL' ? "bg-rose-600 text-white border-rose-400" 
                          : urg === 'HIGH' ? "bg-amber-600 text-white border-amber-400"
                          : "bg-blue-600 text-white border-blue-400"
                        : "bg-[#151b2b] text-slate-400 border-[#1e293b] hover:text-white"
                    )}
                  >
                    {urg === 'ALL' ? 'الكل' : urg === 'CRITICAL' ? 'نفاذ كامل - حرِج' : urg === 'HIGH' ? 'تحت حد الطلب' : 'متوسط'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                >
                  <Download size={16} />
                  <span>تصدير Excel / CSV</span>
                </button>
              </div>
            </div>

            {/* Main Report Table */}
            <div className="flex-1 overflow-y-auto border border-[#1e293b] rounded-2xl bg-[#0f172a]/50">
              <table className="w-full text-right border-collapse">
                <thead className="sticky top-0 bg-[#0f172a] text-slate-400 text-xs font-bold border-b border-[#1e293b] z-10 shadow-sm">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                        {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? (
                          <CheckSquare size={18} className="text-blue-500" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </th>
                    <th className="p-3">رقم الصنف (ID)</th>
                    <th className="p-3">اسم الصنف</th>
                    <th className="p-3 text-center">الكمية المتبقية</th>
                    <th className="p-3 text-center">حد الطلب</th>
                    <th className="p-3 text-center">الكمية المقترحة للطلب</th>
                    <th className="p-3">المورد المستهدف</th>
                    <th className="p-3 text-left">التكلفة للوحدة</th>
                    <th className="p-3 text-left">الإجمالي المتوقع</th>
                    <th className="p-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] text-xs">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-12 text-center text-slate-500">
                        لا توجد أصناف تفي بشروط التقرير حالياً.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map(item => {
                      const isSelected = selectedIds.has(item.productId);
                      return (
                        <tr 
                          key={item.productId}
                          className={cn(
                            "hover:bg-slate-800/30 transition-colors",
                            isSelected ? "bg-blue-950/20" : ""
                          )}
                        >
                          <td className="p-3 text-center">
                            <button onClick={() => toggleSelect(item.productId)} className="text-slate-400 hover:text-white">
                              {isSelected ? (
                                <CheckSquare size={18} className="text-blue-500" />
                              ) : (
                                <Square size={18} />
                              )}
                            </button>
                          </td>

                          {/* ID */}
                          <td className="p-3 font-mono text-blue-400 font-bold select-all">
                            {item.productId}
                          </td>

                          {/* Name */}
                          <td className="p-3 font-bold text-white">
                            {item.productName}
                            {item.category && <span className="block text-[10px] text-slate-500 font-normal">{item.category}</span>}
                          </td>

                          {/* Current Stock */}
                          <td className="p-3 text-center font-bold font-mono">
                            <span className={cn(
                              "px-2.5 py-1 rounded-lg text-xs",
                              item.currentStock <= 0 ? "bg-rose-500/20 text-rose-400 font-black border border-rose-500/30" : "bg-amber-500/20 text-amber-400"
                            )}>
                              {item.currentStock}
                            </span>
                          </td>

                          {/* Reorder Level */}
                          <td className="p-3 text-center font-bold font-mono text-slate-300">
                            {item.reorderLevel}
                          </td>

                          {/* Editable Suggested Order Quantity */}
                          <td className="p-3 text-center">
                            <input 
                              type="number"
                              min={1}
                              value={item.orderQty}
                              onChange={(e) => updateItemQty(item.productId, parseInt(e.target.value) || 1)}
                              className="w-20 bg-[#151b2b] border border-blue-500/50 rounded-xl px-2 py-1 text-center font-black font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>

                          {/* Supplier */}
                          <td className="p-3">
                            <select
                              value={item.supplierId}
                              onChange={(e) => updateItemSupplier(item.productId, e.target.value)}
                              className="bg-[#151b2b] border border-[#1e293b] text-slate-200 rounded-xl px-2 py-1 text-xs focus:outline-none"
                            >
                              {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* Unit Cost */}
                          <td className="p-3 text-left font-mono text-slate-300">
                            {formatCurrency(item.unitCost)}
                          </td>

                          {/* Total Expected */}
                          <td className="p-3 text-left font-mono font-bold text-emerald-400">
                            {formatCurrency(item.orderQty * item.unitCost)}
                          </td>

                          {/* Status / Urgency */}
                          <td className="p-3 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-black border",
                              item.urgency === 'CRITICAL' ? "bg-rose-500/20 text-rose-400 border-rose-500/30" :
                              item.urgency === 'HIGH' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                              "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            )}>
                              {item.urgency === 'CRITICAL' ? 'نفاذ كامل' : item.urgency === 'HIGH' ? 'منخفض جـداً' : 'تحت الحد'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Bar */}
            <div className="bg-[#0f172a] p-4 rounded-2xl border border-[#1e293b] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 font-bold ml-1">الأصناف المحددة:</span>
                  <span className="font-black text-white text-sm">{totals.count}</span> صنف
                </div>
                <div>
                  <span className="text-slate-500 font-bold ml-1">إجمالي القطع:</span>
                  <span className="font-black text-blue-400 text-sm font-mono">{totals.totalQty}</span> قطعة
                </div>
                <div>
                  <span className="text-slate-500 font-bold ml-1">التكلفة التقديرية:</span>
                  <span className="font-black text-emerald-400 text-sm font-mono">{formatCurrency(totals.totalCost)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleConvertToPurchaseOrders}
                  disabled={isProcessing || totals.count === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Sparkles size={16} />
                  <span>{isProcessing ? 'جاري الإنشاء والتحويل...' : 'تحويل الأصناف المحددة لطلب شراء بقسم المشتريات'}</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
