/**
 * @file StockAlerts.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: StockAlerts.tsx.
 */
import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Download, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { useAuth } from './AuthProvider';

interface Product {
  id: string;
  name?: string;
  nameAr?: string;
  quantity?: number;
  stockInCurrentBranch?: number;
  reorderLevel?: number;
  minStockLevel?: number;
}

export const StockAlerts: React.FC = () => {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('maro_stock_alerts_dismissed') === 'true';
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    // Subscribe to products collection
    const unsub = MaroSyncEngine.subscribe<Product>('products', (products: Product[]) => {
      const lowStock = products.filter((p: Product) => {
        const qty = p.quantity !== undefined ? p.quantity : (p.stockInCurrentBranch || 0);
        const limit = p.reorderLevel !== undefined ? p.reorderLevel : (p.minStockLevel || 5);
        return qty <= limit;
      });
      setLowStockProducts(lowStock);
      
      if (lowStock.length > 0) {
        console.log('[AUDIT] StockAlertsGenerated:', { user: user.uid, count: lowStock.length });
      }
    });
    
    return () => unsub();
  }, [user]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('maro_stock_alerts_dismissed', 'true');
    toast('تم إخفاء تنبيهات المخزون لهذه الجلسة', { icon: '🔔' });
  };

  const generatePurchaseReport = () => {
    console.log('[AUDIT] PurchaseReportGenerated:', { user: user?.uid, items: lowStockProducts.map(p => p.id) });
    
    // Generate CSV content for low stock purchase report
    const headers = ['رقم الصنف (ID)', 'اسم الصنف', 'الكمية المتبقية', 'حد الطلب', 'الكمية المقترحة للطلب'];
    const rows = lowStockProducts.map(p => {
      const name = p.nameAr || p.name || 'صنف بدون اسم';
      const qty = p.quantity !== undefined ? p.quantity : (p.stockInCurrentBranch || 0);
      const limit = p.reorderLevel !== undefined ? p.reorderLevel : (p.minStockLevel || 5);
      const suggestedOrder = Math.max(0, (limit * 2) - qty);
      return [p.id, `"${name}"`, qty, limit, suggestedOrder];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `low_stock_purchase_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('تم بنجاح توليد وتنزيل تقرير المشتريات المؤسسي لأصناف المخزون المنخفض!');
    setIsDismissed(true);
    sessionStorage.setItem('maro_stock_alerts_dismissed', 'true');
  };

  if (isDismissed || !user || lowStockProducts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[100] sm:w-96 max-w-full bg-[#151b2b]/95 border border-red-500/40 p-4 sm:p-5 rounded-2xl shadow-2xl backdrop-blur-md text-white transition-all animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between mb-3 border-b border-red-500/20 pb-3">
        <h4 className="text-white font-black flex items-center gap-2 text-sm sm:text-base">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <span>تنبيه مخزون منخفض ({lowStockProducts.length})</span>
        </h4>
        <button 
          onClick={handleDismiss} 
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          title="إغلاق وتأجيل التنبيه"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1 text-xs custom-scrollbar">
        {lowStockProducts.map(p => {
          const name = p.nameAr || p.name || 'صنف بدون اسم';
          const qty = p.quantity !== undefined ? p.quantity : (p.stockInCurrentBranch || 0);
          return (
            <div key={p.id} className="flex justify-between items-center p-2 rounded-xl bg-[#1c263b] border border-slate-700/60">
              <span className="font-bold text-slate-200 truncate max-w-[200px]">{name}</span>
              <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-lg text-[11px] font-black shrink-0">
                متبقي: {qty}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={generatePurchaseReport}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition active:scale-95"
        >
          <Download size={14} />
          <span>توليد تقرير المشتريات</span>
        </button>
        <button 
          onClick={handleDismiss}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition shrink-0"
        >
          تأجيل
        </button>
      </div>
    </div>
  );
};

