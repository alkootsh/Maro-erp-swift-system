/**
 * @file InventoryIntelligenceDashboard.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: InventoryIntelligenceDashboard.tsx.
 */
import React, { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, TrendingUp, Package } from 'lucide-react';
import { ProductMaster } from '../../types/productMaster';

interface Props {
  products: ProductMaster[];
}

export const InventoryIntelligenceDashboard: React.FC<Props> = ({ products }) => {
  const metrics = useMemo(() => {
    const totalSKUs = products.length;
    const lowStock = products.filter(p => (p.quantity || 0) <= (p.reorderLevel || 5)).length;
    const outOfStock = products.filter(p => (p.quantity || 0) <= 0).length;
    const inventoryValue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.costPrice || p.price || 0)), 0);
    
    // Health score calculation
    let score = 100;
    if (outOfStock > 0) score -= 20;
    if (lowStock > 0) score -= 10;
    if (inventoryValue === 0) score -= 20;
    
    return { totalSKUs, lowStock, outOfStock, inventoryValue, score: Math.max(0, score) };
  }, [products]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] flex items-center gap-4">
        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
          <ShieldCheck size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Inventory Health Score</p>
          <p className="text-2xl font-black text-white">{metrics.score}/100</p>
        </div>
      </div>
      
      <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] flex items-center gap-4">
        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
          <AlertTriangle size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Critical Alerts</p>
          <p className="text-2xl font-black text-white">{metrics.lowStock + metrics.outOfStock}</p>
        </div>
      </div>

      <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] flex items-center gap-4">
        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
          <Package size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Total Inventory Value</p>
          <p className="text-xl font-black text-white">{metrics.inventoryValue.toLocaleString()} SAR</p>
        </div>
      </div>

      <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] flex items-center gap-4">
        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
          <TrendingUp size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Total SKUs</p>
          <p className="text-2xl font-black text-white">{metrics.totalSKUs}</p>
        </div>
      </div>
    </div>
  );
};
