/**
 * @file Bills.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: Bills.tsx.
 */
import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  X, 
  PlusCircle, 
  MinusCircle,
  Send,
  ShoppingCart,
  Sparkles
} from 'lucide-react';
import { PurchaseBill, PurchaseBillItem, Supplier } from '../types/sprint8';
import { ProductMaster } from '../types/productMaster';
import { SupplierRepository } from '../repositories/supplierRepository';
import { ProductRepository } from '../repositories/productRepository';
import { CreatePurchaseBillCommand } from '../cqrs/commands';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { WhatsAppNotificationService } from '../services/whatsappNotificationService';
import { LowStockReplenishmentModal } from '../components/Inventory/LowStockReplenishmentModal';
import { LowStockReplenishmentService } from '../services/lowStockReplenishmentService';

export const Bills: React.FC = () => {
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [isReplenishOpen, setIsReplenishOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    // Reactive subscription to purchase_bills in local store
    const unsubscribe = MaroSyncEngine.subscribe<PurchaseBill>('purchase_bills', (data) => {
      setBills(data || []);
    });

    const recs = LowStockReplenishmentService.getReplenishmentRecommendations();
    setLowStockCount(recs.length);

    return () => unsubscribe();
  }, []);

  const filteredBills = bills.filter(b => 
    b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.supplierName && b.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPurchasesAmount = bills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
  const totalTaxInput = bills.reduce((sum, b) => sum + (b.totalTax || 0), 0);
  const totalPaidToSuppliers = bills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">إجمالي المشتريات</p>
          <p className="text-2xl font-black text-white mt-1">{formatCurrency(totalPurchasesAmount)}</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">ضريبة المدخلات (VAT Input 14%)</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(totalTaxInput)}</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">المسدد للموردين</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{formatCurrency(totalPaidToSuppliers)}</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">فواتير الشراء المعتمدة</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{bills.length}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="بحث برقم الفاتورة أو اسم المورد..." 
            className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsReplenishOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl transition-all font-bold shadow-lg shadow-amber-600/20 active:scale-95"
          >
            <ShoppingCart size={18} />
            <span>توليد فواتير من نواقص المخزون</span>
            {lowStockCount > 0 && (
              <span className="bg-amber-900/80 text-amber-200 text-xs px-2 py-0.5 rounded-full font-black">
                {lowStockCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus size={18} />
            <span>تسجيل فاتورة شراء جديدة</span>
          </button>
        </div>
      </div>

      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">رقم الفاتورة</th>
                <th className="px-6 py-4">المورد</th>
                <th className="px-6 py-4">الصافي بدون ضريبة</th>
                <th className="px-6 py-4">ضريبة الشراء (14%)</th>
                <th className="px-6 py-4">الإجمالي الشامل</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-600 font-bold">لا توجد فواتير شراء حالياً</td>
                </tr>
              ) : filteredBills.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-white">{b.billNumber}</td>
                  <td className="px-6 py-4 font-bold text-slate-300">{b.supplierName || 'مورد عام'}</td>
                  <td className="px-6 py-4 font-mono text-slate-400">{formatCurrency(b.totalUntaxed)}</td>
                  <td className="px-6 py-4 font-mono text-emerald-400">{formatCurrency(b.totalTax)}</td>
                  <td className="px-6 py-4 font-mono font-black text-blue-400 text-base">{formatCurrency(b.grandTotal)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold border inline-block",
                      b.status === 'PAID' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      b.status === 'PARTIALLY_PAID' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      {b.status === 'PAID' ? 'مسددة بالكامل' : b.status === 'PARTIALLY_PAID' ? 'مسددة جزئياً' : 'آجلة (غير مسددة)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-mono">{formatDate(new Date(b.createdAt))}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-center">
                      <button 
                        onClick={() => setSelectedBill(b)}
                        className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"
                        title="عرض تفاصيل الفاتورة"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          const supplier = SupplierRepository.getSupplierById(b.supplierId);
                          const targetPhone = supplier?.phone || prompt('أدخل رقم هاتف الواتساب الخاص بالمورد:', '') || '';
                          if (targetPhone) {
                            const msg = WhatsAppNotificationService.formatPurchaseBillWhatsApp(b);
                            WhatsAppNotificationService.openWhatsAppDirectly(targetPhone, msg);
                          }
                        }}
                        className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors flex items-center gap-1"
                        title="إرسال أمر الشراء للمورد عبر الواتساب"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Form Modal */}
      {isModalOpen && (
        <CreateBillModal onClose={() => setIsModalOpen(false)} />
      )}

      {/* Bill Detail View Modal */}
      {selectedBill && (
        <BillDetailModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}

      {/* Low Stock Replenishment Modal */}
      {isReplenishOpen && (
        <LowStockReplenishmentModal
          isOpen={isReplenishOpen}
          onClose={() => {
            setIsReplenishOpen(false);
            const recs = LowStockReplenishmentService.getReplenishmentRecommendations();
            setLowStockCount(recs.length);
          }}
          onSuccess={() => {
            const recs = LowStockReplenishmentService.getReplenishmentRecommendations();
            setLowStockCount(recs.length);
          }}
        />
      )}
    </div>
  );
};

const CreateBillModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(() => {
    return localStorage.getItem('maro_bill_draft_supplierId') || '';
  });
  const [isPaidCash, setIsPaidCash] = useState<boolean>(() => {
    return localStorage.getItem('maro_bill_draft_isPaidCash') === 'true';
  });
  const [items, setItems] = useState<PurchaseBillItem[]>(() => {
    try {
      const saved = localStorage.getItem('maro_bill_draft_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setSuppliers(SupplierRepository.getSuppliers());
    setProducts(ProductRepository.getProducts());
  }, []);

  // Auto-save draft effect
  useEffect(() => {
    localStorage.setItem('maro_bill_draft_supplierId', selectedSupplierId);
    localStorage.setItem('maro_bill_draft_isPaidCash', isPaidCash ? 'true' : 'false');
    localStorage.setItem('maro_bill_draft_items', JSON.stringify(items));
  }, [selectedSupplierId, isPaidCash, items]);

  const handleAddItem = (prod: ProductMaster) => {
    const existingIndex = items.findIndex(i => i.productId === prod.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      const unitCost = updated[existingIndex].unitCost;
      const untaxed = updated[existingIndex].quantity * unitCost;
      updated[existingIndex].lineTotal = untaxed * 1.14;
      setItems(updated);
    } else {
      const cost = prod.costPrice || prod.price || 0;
      setItems([...items, {
        id: `pbi_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unitName: 'قطعة',
        quantity: 1,
        unitCost: cost,
        taxRate: 14,
        lineTotal: cost * 1.14
      }]);
    }
  };

  const handleUpdateQty = (index: number, delta: number) => {
    const updated = [...items];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
      const untaxed = updated[index].quantity * updated[index].unitCost;
      updated[index].lineTotal = untaxed * 1.14;
    }
    setItems(updated);
  };

  const handleUpdateCost = (index: number, unitCost: number) => {
    const updated = [...items];
    updated[index].unitCost = unitCost;
    const untaxed = updated[index].quantity * unitCost;
    updated[index].lineTotal = untaxed * 1.14;
    setItems(updated);
  };

  let totalUntaxed = 0;
  let totalTax = 0;
  items.forEach(item => {
    const lineUntaxed = item.quantity * item.unitCost;
    const lineTax = lineUntaxed * ((item.taxRate || 14) / 100);
    totalUntaxed += lineUntaxed;
    totalTax += lineTax;
  });
  const grandTotal = totalUntaxed + totalTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('يرجى إضافة منتج واحد على الأقل للفاتورة');
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplierId);

    try {
      const cmd = new CreatePurchaseBillCommand({
        warehouseId: 'wh_main',
        supplierId: selectedSupplierId || 'general_supplier',
        supplierName: supplier ? supplier.name : 'مورد عام',
        items,
        totalUntaxed,
        totalTax,
        grandTotal,
        paidAmount: isPaidCash ? grandTotal : 0,
        dueAmount: isPaidCash ? 0 : grandTotal,
        status: isPaidCash ? 'PAID' : 'APPROVED'
      });

      await cmd.execute();
      localStorage.removeItem('maro_bill_draft_supplierId');
      localStorage.removeItem('maro_bill_draft_isPaidCash');
      localStorage.removeItem('maro_bill_draft_items');
      onClose();
    } catch (e: any) {
      alert(e.message || 'حدث خطأ أثناء تسجيل فاتورة الشراء');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#151b2b] w-full max-w-5xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden my-8">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <h3 className="font-black text-xl text-white">تسجيل فاتورة شراء واستلام مخزني</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">المورد</label>
              <select
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
              >
                <option value="">-- مورد عام (نقدي) --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.currentBalance)} مستحق له)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">طريقة السداد</label>
              <select
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500"
                value={isPaidCash ? 'CASH' : 'CREDIT'}
                onChange={(e) => setIsPaidCash(e.target.value === 'CASH')}
              >
                <option value="CREDIT">آجل على حساب المورد (AP Credit)</option>
                <option value="CASH">نقداً فوراً (Cash Paid)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">المستودع المستقبل للبضاعة</label>
              <input 
                disabled
                type="text" 
                className="w-full px-4 py-2.5 bg-[#1e293b]/50 border border-[#334155] rounded-xl text-slate-400 font-bold"
                value="المستودع الرئيسي (Main Warehouse)"
              />
            </div>
          </div>

          {/* Items Selector & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#1e293b]/50 p-4 rounded-2xl border border-[#334155] space-y-3 max-h-[350px] overflow-y-auto">
              <p className="text-xs font-bold text-slate-400 uppercase">اختر أصناف المشتريات:</p>
              {products.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAddItem(p)}
                  className="w-full text-right p-3 bg-[#151b2b] hover:bg-blue-600/20 border border-[#334155] rounded-xl transition-all flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{p.name}</div>
                    <div className="text-xs text-slate-500">SKU: {p.sku}</div>
                  </div>
                  <div className="font-mono font-black text-blue-400 text-sm">{formatCurrency(p.costPrice || p.price)}</div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase">عناصر فاتورة الشراء:</p>
              <div className="border border-[#334155] rounded-2xl overflow-hidden bg-[#151b2b]">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="px-4 py-3">المنتج</th>
                      <th className="px-4 py-3">تكلفة الوحدة (EGP)</th>
                      <th className="px-4 py-3">الكمية الموردة</th>
                      <th className="px-4 py-3">الضريبة (14%)</th>
                      <th className="px-4 py-3">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-600 font-bold">لم يتم إضافة أي أصناف بعد</td>
                      </tr>
                    ) : items.map((item, idx) => {
                      const untaxed = item.quantity * item.unitCost;
                      const tax = untaxed * 0.14;
                      const lineTotal = untaxed + tax;
                      return (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-bold text-white">{item.productName}</td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" 
                              step="0.01"
                              className="w-24 px-2 py-1 bg-[#1e293b] border border-[#334155] rounded text-white text-center font-mono"
                              value={item.unitCost}
                              onChange={(e) => handleUpdateCost(idx, parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => handleUpdateQty(idx, -1)} className="p-1 hover:bg-slate-800 text-slate-400 rounded"><MinusCircle size={14} /></button>
                              <span className="font-bold text-white font-mono">{item.quantity}</span>
                              <button type="button" onClick={() => handleUpdateQty(idx, 1)} className="p-1 hover:bg-slate-800 text-slate-400 rounded"><PlusCircle size={14} /></button>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-emerald-400">{formatCurrency(tax)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-blue-400">{formatCurrency(lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-[#1e293b]/70 p-5 rounded-2xl border border-[#334155] flex justify-between items-center">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-slate-400 font-bold block text-xs">إجمالي تكلفة المشتريات الصافي:</span>
                <span className="font-mono font-bold text-white text-base">{formatCurrency(totalUntaxed)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-xs">ضريبة المدخلات (14% VAT):</span>
                <span className="font-mono font-bold text-emerald-400 text-base">{formatCurrency(totalTax)}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase block">إجمالي فاتورة الشراء النهائي:</span>
              <span className="text-3xl font-black font-mono text-blue-400">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-black text-lg shadow-lg shadow-blue-600/20"
            >
              حفظ فاتورة الشراء إضافة للمخزون وترحيل القيد
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-8 bg-[#1e293b] text-slate-300 py-3.5 rounded-xl font-bold hover:bg-[#334155]"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BillDetailModal: React.FC<{ bill: PurchaseBill; onClose: () => void }> = ({ bill, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <h3 className="font-bold text-xl text-white">تفاصيل فاتورة المشتريات {bill.billNumber}</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const supplier = SupplierRepository.getSupplierById(bill.supplierId);
                const targetPhone = supplier?.phone || prompt('أدخل رقم هاتف الواتساب الخاص بالمورد:', '') || '';
                if (targetPhone) {
                  const msg = WhatsAppNotificationService.formatPurchaseBillWhatsApp(bill);
                  WhatsAppNotificationService.openWhatsAppDirectly(targetPhone, msg);
                }
              }}
              className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Send size={16} />
              إرسال للمورد بالواتس
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex justify-between items-center bg-[#1e293b] p-4 rounded-xl border border-[#334155]">
            <div>
              <span className="text-xs text-slate-400 block font-bold">المورد:</span>
              <span className="text-base font-bold text-white">{bill.supplierName}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-bold">التاريخ:</span>
              <span className="text-sm font-mono text-slate-300">{formatDate(new Date(bill.createdAt))}</span>
            </div>
          </div>

          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/50 text-slate-400 font-bold uppercase">
              <tr>
                <th className="px-3 py-2">الصنف</th>
                <th className="px-3 py-2">الكمية</th>
                <th className="px-3 py-2">التكلفة</th>
                <th className="px-3 py-2">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {bill.items.map((it, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2.5 font-bold text-white">{it.productName}</td>
                  <td className="px-3 py-2.5 font-mono">{it.quantity}</td>
                  <td className="px-3 py-2.5 font-mono">{formatCurrency(it.unitCost)}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-blue-400">{formatCurrency(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-[#1e293b]/50 p-4 rounded-xl border border-[#334155] space-y-1 text-left font-mono">
            <div className="text-xs text-slate-400">الصافي: {formatCurrency(bill.totalUntaxed)}</div>
            <div className="text-xs text-emerald-400">ضريبة الشراء (14%): {formatCurrency(bill.totalTax)}</div>
            <div className="text-lg font-black text-blue-400">الإجمالي النهائي: {formatCurrency(bill.grandTotal)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
