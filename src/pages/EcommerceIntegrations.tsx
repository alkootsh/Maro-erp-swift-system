/**
 * @file EcommerceIntegrations.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: EcommerceIntegrations.tsx.
 */
import React, { useState } from 'react';
import { 
  Globe, 
  ShoppingCart, 
  RefreshCw, 
  Settings2, 
  Store, 
  CheckCircle2, 
  AlertTriangle,
  Link as LinkIcon,
  Package,
  Activity
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export const EcommerceIntegrations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'platforms' | 'sync'>('platforms');

  const platforms = [
    { id: 'salla', name: 'منصة سلة (Salla)', icon: '🛒', status: 'connected', lastSync: 'قبل 5 دقائق', orders: 145 },
    { id: 'zid', name: 'منصة زد (Zid)', icon: '🛍️', status: 'connected', lastSync: 'قبل 12 دقيقة', orders: 89 },
    { id: 'shopify', name: 'شوبيفاي (Shopify)', icon: '🌐', status: 'disconnected', lastSync: '-', orders: 0 },
    { id: 'woo', name: 'ووكومرس (WooCommerce)', icon: '📦', status: 'connected', lastSync: 'قبل ساعة', orders: 34 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Phase 15: Omnichannel
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">التجارة الإلكترونية والربط (Omnichannel)</h1>
          <p className="text-xs text-slate-400 mt-1">
            ربط مباشر مع منصات التجارة الإلكترونية، مزامنة المخزون والطلبات فورياً.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 flex items-center gap-3">
             <RefreshCw className="text-blue-400 animate-spin-slow" size={24} />
             <div>
               <p className="text-[10px] text-slate-400">حالة المزامنة</p>
               <p className="text-xs font-bold text-emerald-400">نشط (Auto-Sync)</p>
             </div>
           </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('platforms')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'platforms' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Store size={16} /> المنصات والمتاجر
        </button>
        <button
          onClick={() => setActiveTab('sync')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'sync' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Activity size={16} /> سجل المزامنة (Sync Logs)
        </button>
      </div>

      {activeTab === 'platforms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {platforms.map(platform => (
            <div key={platform.id} className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 flex flex-col hover:border-blue-900/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-3xl">{platform.icon}</div>
                <span className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold border",
                  platform.status === 'connected' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                )}>
                  {platform.status === 'connected' ? 'متصل' : 'غير متصل'}
                </span>
              </div>
              <h3 className="text-white font-bold mb-2">{platform.name}</h3>
              <div className="space-y-2 flex-1 mt-2">
                <div className="flex justify-between text-xs p-2 bg-[#0f172a] rounded-lg">
                  <span className="text-slate-400">آخر مزامنة</span>
                  <span className="text-white font-mono">{platform.lastSync}</span>
                </div>
                <div className="flex justify-between text-xs p-2 bg-[#0f172a] rounded-lg">
                  <span className="text-slate-400">طلبات اليوم</span>
                  <span className="text-blue-400 font-bold">{platform.orders}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800">
                <button className={cn(
                  "w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                  platform.status === 'connected' ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
                )}>
                  {platform.status === 'connected' ? <Settings2 size={14} /> : <LinkIcon size={14} />}
                  {platform.status === 'connected' ? 'إعدادات الربط' : 'توصيل الآن'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sync' && (
        <div className="bg-[#151b2b] rounded-2xl border border-slate-800 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
          <RefreshCw size={48} className="text-slate-600 mb-4 animate-spin-slow" />
          <h3 className="text-lg font-bold text-white mb-2">سجل المزامنة الحية (Live Sync Logs)</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            يتم تحديث المخزون والأسعار وسحب الطلبات الجديدة من كافة المنصات المربوطة تلقائياً كل دقيقة.
          </p>
        </div>
      )}
    </div>
  );
};
