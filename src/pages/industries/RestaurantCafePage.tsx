/**
 * @file RestaurantCafePage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: RestaurantCafePage.tsx.
 */
// MARO ERP - Restaurant, Cafe & Kitchen Display System (KDS) Module
import React, { useState } from 'react';
import { 
  Utensils, 
  Layers, 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  Users, 
  Plus, 
  Sparkles, 
  DollarSign, 
  ShoppingBag,
  Bell
} from 'lucide-react';
import { IndustryModuleEngine } from '../../lib/industryModuleEngine';
import { RestaurantTable, KitchenOrderTicket } from '../../types/industryModules';
import { cn } from '../../lib/utils';

export const RestaurantCafePage: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>(IndustryModuleEngine.getRestaurantTables());
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'tables' | 'kds' | 'recipes'>('tables');

  const [kdsOrders, setKdsOrders] = useState<KitchenOrderTicket[]>([
    {
      id: 'kds_1',
      kotNumber: 'KOT-101',
      orderType: 'DINE_IN',
      tableNumber: 'T-01',
      waiterName: 'أحمد كمال',
      createdAt: '14:20',
      estimatedMinutes: 15,
      items: [
        { id: 'i1', itemName: 'برجر لحم أنجوس مدخن دبل', quantity: 2, notes: 'بدون بصل، بطاطس مقرمشة', status: 'COOKING' },
        { id: 'i2', itemName: 'بيتزا مارجريتا حجم عائلي', quantity: 1, notes: 'جبنة زيادة ومشروم', status: 'READY' },
        { id: 'i3', itemName: 'عصير موهيتو باشن فروت', quantity: 2, status: 'SERVED' }
      ]
    },
    {
      id: 'kds_2',
      kotNumber: 'KOT-102',
      orderType: 'TAKEAWAY',
      waiterName: 'كاشير الصالة',
      createdAt: '14:28',
      estimatedMinutes: 10,
      items: [
        { id: 'i4', itemName: 'شاورما لحم عربي دبل', quantity: 3, notes: 'تومية إكسترا وحار', status: 'COOKING' },
        { id: 'i5', itemName: 'بطاطس ودجز حار', quantity: 2, status: 'COOKING' }
      ]
    }
  ]);

  const handleUpdateItemStatus = (orderId: string, itemId: string, newStatus: any) => {
    setKdsOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          items: order.items.map(item => item.id === itemId ? { ...item, status: newStatus } : item)
        };
      }
      return order;
    }));
  };

  const filteredTables = tables.filter(t => selectedZone === 'ALL' || t.zone === selectedZone);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#151b2b] border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600"></div>
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl shadow-lg shadow-amber-500/10">
            <Utensils size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">موديول المطاعم، الكافيهات وشاشة المطبخ (KDS)</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                Restaurant & KDS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">مخطط صالة الطاولات، شاشات المطبخ الفورية، وخصم مكونات الوجبة من مخزن الخامات تلقائياً</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
        <button 
          onClick={() => setActiveTab('tables')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all",
            activeTab === 'tables' ? "bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          <Layers size={16} />
          <span>مخطط الطاولات والصالة ({tables.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab('kds')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all",
            activeTab === 'kds' ? "bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          <ChefHat size={16} />
          <span>شاشة المطبخ المباشرة (KDS Screen)</span>
        </button>
      </div>

      {/* Tab: Tables */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap">المنطقة:</span>
            {['ALL', 'الصالة الرئيسية', 'العائلات', 'التراس الخارجي', 'VIP'].map(z => (
              <button 
                key={z}
                onClick={() => setSelectedZone(z)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all",
                  selectedZone === z ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-[#151b2b] border-[#1e293b] text-slate-400 hover:text-white"
                )}
              >
                {z === 'ALL' ? 'كل الصالات' : z}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredTables.map(tbl => (
              <div 
                key={tbl.id}
                className={cn(
                  "border rounded-3xl p-5 space-y-3 transition-all relative overflow-hidden shadow-lg",
                  tbl.status === 'OCCUPIED' ? "bg-amber-500/10 border-amber-500/40 text-amber-300" :
                  tbl.status === 'RESERVED' ? "bg-purple-500/10 border-purple-500/40 text-purple-300" :
                  "bg-[#151b2b] border-[#1e293b] text-slate-400"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-lg font-black text-white">{tbl.tableNumber}</span>
                    <p className="text-[10px] text-slate-400">{tbl.zone}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <Users size={14} />
                    <span>{tbl.capacity} أفراد</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1e293b]/60 flex items-center justify-between text-xs">
                  <span className="font-bold">
                    {tbl.status === 'OCCUPIED' ? 'مشغولة (طلب جاري)' : tbl.status === 'RESERVED' ? 'محجوزة' : 'شاغرة (جاهزة)'}
                  </span>
                  {tbl.currentTotal && (
                    <span className="font-mono font-black text-white">{tbl.currentTotal} ج.م</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: KDS Screen */}
      {activeTab === 'kds' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {kdsOrders.map(order => (
            <div key={order.id} className="bg-[#151b2b] border border-amber-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-mono text-xs font-bold">
                    {order.kotNumber}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {order.orderType === 'DINE_IN' ? `طاولة: ${order.tableNumber}` : 'سفري / Takeaway'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                  <Clock size={14} />
                  <span>{order.createdAt} ({order.estimatedMinutes} دقيقة)</span>
                </div>
              </div>

              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="p-3 bg-[#0f172a] rounded-2xl border border-[#1e293b] flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-white text-xs">
                        <span className="text-amber-400 font-mono text-sm ml-1.5">{item.quantity}x</span>
                        {item.itemName}
                      </p>
                      {item.notes && <p className="text-[10px] text-amber-300 mt-0.5">ملاحظات: {item.notes}</p>}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleUpdateItemStatus(order.id, item.id, item.status === 'COOKING' ? 'READY' : 'COOKING')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all",
                          item.status === 'READY' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        )}
                      >
                        {item.status === 'READY' ? 'جاهز للتسليم ✓' : 'قيد الطهي 🔥'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
