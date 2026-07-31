import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Printer, Download } from 'lucide-react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { useAuth } from './AuthProvider';

interface Product {
  id: string;
  name: string;
  quantity: number;
  reorderLevel: number;
}

export const StockAlerts: React.FC = () => {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [show, setShow] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    // Subscribe to products collection
    const unsub = MaroSyncEngine.subscribe<Product>('products', (products: Product[]) => {
      const lowStock = products.filter((p: Product) => (p.quantity || 0) <= (p.reorderLevel || 5));
      setLowStockProducts(lowStock);
      
      // Audit log the alert generation if we have items
      if (lowStock.length > 0) {
        console.log('[AUDIT] StockAlertsGenerated:', { user: user.uid, count: lowStock.length });
      }
    });
    
    return () => unsub();
  }, [user]);

  const generatePurchaseReport = () => {
    console.log('[AUDIT] PurchaseReportGenerated:', { user: user.uid, items: lowStockProducts.map(p => p.id) });
    alert('جارٍ توليد تقرير المشتريات المؤسسي...');
  };

  if (!show || !user || lowStockProducts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white border border-red-200 p-6 rounded-2xl shadow-xl w-96">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-gray-900 font-bold flex items-center gap-2 text-lg">
          <AlertTriangle size={20} className="text-red-500" />
          تنبيه مخزون منخفض
        </h4>
        <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>
      
      <div className="space-y-3 mb-6">
        {lowStockProducts.map(p => (
          <div key={p.id} className="flex justify-between items-center text-sm">
            <span className="font-medium text-gray-700">{p.name}</span>
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
              {p.quantity} متبقي
            </span>
          </div>
        ))}
      </div>

      <button 
        onClick={generatePurchaseReport}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition"
      >
        <Download size={18} />
        توليد تقرير المشتريات
      </button>
    </div>
  );
};
