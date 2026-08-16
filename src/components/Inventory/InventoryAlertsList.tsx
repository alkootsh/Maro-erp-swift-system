/**
 * @file InventoryAlertsList.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: InventoryAlertsList.tsx.
 */
import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  CheckCircle, 
  Package, 
  ArrowRight, 
  ShoppingCart, 
  Send,
  FileText,
  Sparkles
} from 'lucide-react';
import { InventoryAlert, AlertSeverity } from '../../types/inventoryIntelligence';
import { cn } from '../../lib/utils';
import { LowStockReplenishmentService } from '../../services/lowStockReplenishmentService';

interface Props {
  alerts: InventoryAlert[];
  onResolve: (id: string) => void;
  onOpenReplenishmentModal?: (productId?: string) => void;
}

const SeverityIcon = ({ severity }: { severity: AlertSeverity }) => {
  switch (severity) {
    case 'critical': return <ShieldAlert className="text-red-500" size={20} />;
    case 'high': return <AlertTriangle className="text-amber-500" size={20} />;
    case 'medium': return <AlertTriangle className="text-yellow-500" size={20} />;
    default: return <Info className="text-blue-500" size={20} />;
  }
};

export const InventoryAlertsList: React.FC<Props> = ({ alerts, onResolve, onOpenReplenishmentModal }) => {
  const handleQuickWhatsApp = (alert: InventoryAlert) => {
    const recs = LowStockReplenishmentService.getReplenishmentRecommendations();
    const matched = recs.find(r => r.productId === alert.productId) || {
      productId: alert.productId,
      productName: alert.productName,
      sku: 'SKU-REQ',
      orderQty: 20,
      unitCost: 50,
      supplierName: 'المورد الرئيسي',
      supplierPhone: '01000000000',
      currentStock: 0,
      reorderLevel: 10,
      maxStockLevel: 50,
      recommendedQty: 20,
      taxRate: 14,
      supplierId: 'supp_default',
      urgency: 'HIGH' as const
    };

    const msg = LowStockReplenishmentService.formatSupplierOrderWhatsApp(
      { name: matched.supplierName, phone: matched.supplierPhone },
      [matched]
    );
    const link = LowStockReplenishmentService.generateWhatsAppLink(matched.supplierPhone, msg);
    window.open(link, '_blank');
  };

  return (
    <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden mt-6">
      <div className="p-4 border-b border-[#1e293b] bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white text-base">مركز تنبيهات المخزون الذكي</h3>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {alerts.length} تنبيه نشط
          </span>
        </div>
        {alerts.length > 0 && onOpenReplenishmentModal && (
          <button
            onClick={() => onOpenReplenishmentModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/20 transition-all active:scale-95"
          >
            <ShoppingCart size={15} />
            <span>تحويل جميع النواقص لطلبيات وفواتير شراء للموردين</span>
          </button>
        )}
      </div>
      <div className="divide-y divide-[#1e293b]">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-bold">لا توجد تنبيهات نقص مخزون حالياً ✅</div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-800/30 transition-colors gap-3">
              <div className="flex items-center gap-4">
                <SeverityIcon severity={alert.severity} />
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    {alert.productName}
                    {alert.severity === 'critical' && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        نفاد كامل
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{alert.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-auto">
                {onOpenReplenishmentModal && (
                  <button 
                    onClick={() => onOpenReplenishmentModal(alert.productId)}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="تحويل الصنف لأمر أو فاتورة شراء فوري"
                  >
                    <ShoppingCart size={14} />
                    <span>إنشاء طلب / فاتورة شراء</span>
                  </button>
                )}
                <button
                  onClick={() => handleQuickWhatsApp(alert)}
                  className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl border border-emerald-500/20 transition-colors"
                  title="إرسال طلب توريد سريع للمورد عبر الواتساب"
                >
                  <Send size={16} />
                </button>
                <button 
                  onClick={() => onResolve(alert.id)}
                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors"
                  title="تعيين التنبيه كمعالج"
                >
                  <CheckCircle size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

