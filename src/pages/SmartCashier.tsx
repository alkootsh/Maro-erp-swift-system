/**
 * @file SmartCashier.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: SmartCashier.tsx.
 */
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Barcode, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Package, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  X, 
  DollarSign, 
  TrendingUp, 
  Tag, 
  Key, 
  RefreshCw,
  Sliders,
  Check,
  ShoppingBag,
  Scale
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { ScaleCalculatorModal } from '../components/pos/ScaleCalculatorModal';
import { POSCustomGroupsManager, POSCustomGroup, POSCustomGroupService } from '../components/pos/POSCustomGroupsManager';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

export const SmartCashier: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'reports' | 'settings'>('pos');

  // Trial & License State
  const [trialData, setTrialData] = useState<{ startDate: number; isActivated: boolean; licenseKey: string }>(() => {
    const saved = localStorage.getItem('smart_cashier_trial');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    const initial = { startDate: Date.now(), isActivated: false, licenseKey: '' };
    localStorage.setItem('smart_cashier_trial', JSON.stringify(initial));
    return initial;
  });

  const [inputKey, setInputKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [keySuccess, setKeySuccess] = useState('');

  // Calculate remaining trial days (15 days total)
  const daysPassed = Math.floor((Date.now() - trialData.startDate) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, 15 - daysPassed);
  const isTrialExpired = remainingDays === 0 && !trialData.isActivated;

  // Inventory State
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'أرز المصري الفاخر 1كج', sku: 'RIC-001', barcode: '12345678', price: 35, cost: 28, stock: 45, category: 'حبوب' },
    { id: '2', name: 'زيت عباد الشمس 700مل', sku: 'OIL-002', barcode: '87654321', price: 65, cost: 55, stock: 8, category: 'زيوت' },
    { id: '3', name: 'سكر الأبيض المكرر 1كج', sku: 'SUG-003', barcode: '11223344', price: 32, cost: 26, stock: 50, category: 'حبوب' },
    { id: '4', name: 'شاي ليبتون العطور 100 فتلة', sku: 'TEA-004', barcode: '44332211', price: 95, cost: 80, stock: 12, category: 'مشروبات' },
    { id: '5', name: 'مياه معدنية طبيعية 1.5لتر', sku: 'WAT-005', barcode: '55667788', price: 8, cost: 5, stock: 120, category: 'مشروبات' },
  ]);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'vodafone'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerFps, setScannerFps] = useState(10);
  const [scannerQrBox, setScannerQrBox] = useState(250);
  const [simulatedBarcode, setSimulatedBarcode] = useState('');

  // Scale Modal & Custom Groups State
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [scaleProduct, setScaleProduct] = useState<any>(null);
  const [isCustomGroupsOpen, setIsCustomGroupsOpen] = useState(false);
  const [customGroups, setCustomGroups] = useState<POSCustomGroup[]>(() => POSCustomGroupService.getGroups());
  const [selectedCustomGroupId, setSelectedCustomGroupId] = useState<string | null>(null);

  // Spacebar (زر المسطرة) listener for Scale items calculation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.key === ' ') && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsScaleModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save/Load Cart & Inventory to localStorage
  useEffect(() => {
    const savedInv = localStorage.getItem('smart_cashier_inventory');
    if (savedInv) {
      try { setProducts(JSON.parse(savedInv)); } catch { /* ignore */ }
    }
  }, []);

  const updateInventory = (newInv: Product[]) => {
    setProducts(newInv);
    localStorage.setItem('smart_cashier_inventory', JSON.stringify(newInv));
  };

  // Cart Handlers
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCost = cart.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const cartProfit = cartTotal - cartCost;

  const handleCheckout = () => {
    // Deduct stock
    const updated = products.map(p => {
      const cartItem = cart.find(ci => ci.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    });
    updateInventory(updated);
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCart([]);
      setIsCheckoutModalOpen(false);
      setCheckoutSuccess(false);
      setAmountPaid('');
    }, 1800);
  };

  const handleActivateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim() === 'SMART-123') {
      const updated = { ...trialData, isActivated: true, licenseKey: inputKey.trim() };
      setTrialData(updated);
      localStorage.setItem('smart_cashier_trial', JSON.stringify(updated));
      setKeySuccess('تم تفعيل النسخة الكاملة بنجاح تام! شكراً لك.');
      setKeyError('');
    } else {
      setKeyError('مفتاح التفعيل غير صحيح. جرب المفتاح التجريبي: SMART-123');
      setKeySuccess('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Trial Expired Guard Modal */}
      {isTrialExpired && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-red-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/30">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-black text-white">انتهت فترة التجربة المجانية (15 يوماً)</h2>
            <p className="text-xs text-slate-300">
              لاستمرار استخدام نظام Smart Cashier للمحلات والأنشطة الصغيرة بكامل الصلاحيات، يرجى إدخال مفتاح التفعيل الرسمي.
            </p>
            <form onSubmit={handleActivateLicense} className="space-y-3 pt-2">
              <input
                type="text"
                placeholder="أدخل مفتاح التفعيل (مثال: SMART-123)"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white text-center font-mono text-sm focus:outline-none focus:border-blue-500"
              />
              {keyError && <p className="text-xs text-red-400 font-bold">{keyError}</p>}
              {keySuccess && <p className="text-xs text-emerald-400 font-bold">{keySuccess}</p>}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 text-xs"
              >
                تفعيل النسخة الآن
              </button>
            </form>
            <div className="text-[11px] text-slate-500 font-mono">
              مفتاح تجريبي للتجربة الفورية: <span className="text-blue-400 font-bold">SMART-123</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              Smart Cashier v3.2 Mini Edition
            </span>
            <span className="text-xs text-emerald-400 font-bold">● نظام مصغر وخفيف للمحلات والأنشطة الصغيرة</span>
          </div>
          <h1 className="text-2xl font-black text-white">نظام الكاشير الذكي والمحلات التجارية</h1>
          <p className="text-xs text-slate-400 mt-1">
            نقاط بيع سريعة، مسح باركود بالكاميرا، إدارة مخزون، وتقارير أرباح فورية تعمل بكفاءة حتى بدون إنترنت (Offline-First).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] px-4 py-2.5 rounded-xl border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 block">حالة الترخيص</span>
            <span className={cn("font-mono font-bold text-xs", trialData.isActivated ? "text-emerald-400" : "text-amber-400")}>
              {trialData.isActivated ? 'نسخة مفعلة كاملة ✓' : `تجريبي (${remainingDays} أيام متبقية)`}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('pos')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeTab === 'pos' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <ShoppingCart size={16} />
          <span>نقطة البيع (POS)</span>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeTab === 'inventory' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Package size={16} />
          <span>المخزون والأصناف</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeTab === 'reports' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <BarChart3 size={16} />
          <span>التقارير والأرباح</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeTab === 'settings' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Settings size={16} />
          <span>إعدادات النظام والترخيص</span>
        </button>
      </div>

      {/* Tab 1: POS Screen */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Catalog */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#151b2b] p-4 rounded-2xl border border-slate-800 flex flex-col space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3.5 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="ابحث عن اسم المنتج، SKU، أو الباركود..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => setIsScaleModalOpen(true)}
                  className="flex items-center gap-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm"
                  title="تفعيل زر المسطرة Space للبيع بالوزن والقيمة"
                >
                  <Scale size={16} />
                  <span>المسطرة (Space) ⚖️</span>
                </button>
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/25 whitespace-nowrap"
                >
                  <Camera size={16} />
                  <span>ماسح الكاميرا</span>
                </button>
              </div>

              {/* Quick Categories Bar */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pt-1 border-t border-slate-800/80">
                <button
                  onClick={() => setSelectedCustomGroupId(null)}
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0",
                    !selectedCustomGroupId ? "bg-blue-600 text-white border-blue-500" : "bg-[#0f172a] text-slate-400 border-slate-800 hover:bg-slate-800"
                  )}
                >
                  الكل
                </button>

                {customGroups.map(grp => (
                  <button
                    key={grp.id}
                    onClick={() => setSelectedCustomGroupId(grp.id)}
                    className={cn(
                      "px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5",
                      selectedCustomGroupId === grp.id
                        ? "bg-purple-600 text-white border-purple-400"
                        : "bg-purple-950/30 text-purple-300 border-purple-500/30 hover:bg-purple-900/40"
                    )}
                  >
                    <span className={`w-2 h-2 rounded-full ${grp.badgeColor}`} />
                    <span>{grp.name}</span>
                  </button>
                ))}

                <button
                  onClick={() => setIsCustomGroupsOpen(true)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <Sliders size={13} className="text-purple-400" />
                  <span>تخصيص المجموعات ⚙️</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {products
                .filter(p => p.name.includes(searchQuery) || p.barcode.includes(searchQuery) || p.sku.includes(searchQuery))
                .map(product => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-[#151b2b] p-4 rounded-2xl border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all space-y-2 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-blue-400 font-mono font-bold bg-blue-500/10 px-2 py-0.5 rounded-md">
                          {product.category}
                        </span>
                        <span className={cn("text-[10px] font-bold", product.stock > 10 ? "text-emerald-400" : "text-red-400")}>
                          المخزون: {product.stock}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-xs mt-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="font-mono text-emerald-400 font-black text-sm">{formatCurrency(product.price)}</span>
                      <span className="w-7 h-7 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Plus size={14} />
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Cart & Checkout */}
          <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 h-[600px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-blue-400" />
                  <h3 className="font-bold text-white text-sm">سلة المبيعات الحالية</h3>
                </div>
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-mono font-bold">
                  {cart.reduce((s, i) => s + i.quantity, 0)} قطعة
                </span>
              </div>

              <div className="overflow-y-auto max-h-[340px] divide-y divide-slate-800/60 mt-3 space-y-2">
                {cart.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    السلة فارغة حالياً. اضغط على أي منتج لإضافته.
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="pt-2.5 pb-2.5 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-xs truncate">{item.name}</h4>
                        <span className="text-[11px] font-mono text-emerald-400">{formatCurrency(item.price)} للقطعة</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 bg-slate-800 text-slate-300 rounded-lg flex items-center justify-center hover:bg-slate-700"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-mono text-white text-xs font-bold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 bg-slate-800 text-slate-300 rounded-lg flex items-center justify-center hover:bg-slate-700"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-6 h-6 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-500/30 ml-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>الإجمالي الفرعي:</span>
                  <span className="text-white">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>ضريبة القيمة المضافة (14%):</span>
                  <span className="text-white">{formatCurrency(cartTotal * 0.14)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                  <span>المبلغ الإجمالي النهائي:</span>
                  <span className="text-emerald-400">{formatCurrency(cartTotal * 1.14)}</span>
                </div>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutModalOpen(true)}
                className={cn(
                  "w-full py-3.5 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2",
                  cart.length > 0 ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25" : "bg-slate-800 text-slate-500 cursor-not-allowed"
                )}
              >
                <CheckCircle2 size={16} />
                <span>إتمام البيع والدفع السريع</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Inventory Management */}
      {activeTab === 'inventory' && (
        <div className="bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">إدارة الأصناف والمخزون المتاح</h3>
            <span className="text-xs text-blue-400 font-bold">تحديث فوري وتتبع الأرصدة (Offline-First)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0f172a] text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">كود SKU / الباركود</th>
                  <th className="p-4">اسم المنتج</th>
                  <th className="p-4">التصنيف</th>
                  <th className="p-4">سعر التكلفة</th>
                  <th className="p-4">سعر البيع</th>
                  <th className="p-4">المخزون الحالي</th>
                  <th className="p-4 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-slate-800/30 transition-all">
                    <td className="p-4 font-bold text-blue-400">{product.sku} <span className="text-slate-500 text-[10px]">({product.barcode})</span></td>
                    <td className="p-4 font-sans font-bold text-white">{product.name}</td>
                    <td className="p-4 font-sans text-slate-300">{product.category}</td>
                    <td className="p-4 text-slate-400">{formatCurrency(product.cost)}</td>
                    <td className="p-4 text-emerald-400 font-bold">{formatCurrency(product.price)}</td>
                    <td className="p-4 font-bold text-white">{product.stock} قطعة</td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-xl font-bold text-[10px] font-sans",
                        product.stock > 10 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {product.stock > 10 ? 'متوفر' : 'منخفض جداً'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Reports & Analytics */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block font-bold">إجمالي المبيعات المحققة</span>
              <p className="text-2xl font-black text-emerald-400 font-mono">14,850 ج.م</p>
              <span className="text-[11px] text-emerald-400 font-bold">● نمو 18% عن الأسبوع السابق</span>
            </div>
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block font-bold">صافي الأرباح التقديرية</span>
              <p className="text-2xl font-black text-blue-400 font-mono">3,920 ج.م</p>
              <span className="text-[11px] text-blue-400 font-bold">● هامش ربح ممتاز 26.4%</span>
            </div>
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block font-bold">تنبيهات الأصناف الحرجة</span>
              <p className="text-2xl font-black text-red-400 font-mono">1 صنف</p>
              <span className="text-[11px] text-red-400 font-bold">● يتطلب طلب شراء فوري</span>
            </div>
          </div>

          <div className="bg-[#151b2b] p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm">أداء المبيعات خلال أيام الأسبوع</h3>
            <div className="grid grid-cols-7 gap-3 pt-4">
              {[
                { day: 'السبت', val: 1800 },
                { day: 'الأحد', val: 2400 },
                { day: 'الإثنين', val: 1950 },
                { day: 'الثلاثاء', val: 2100 },
                { day: 'الأربعاء', val: 2800 },
                { day: 'الخميس', val: 3200 },
                { day: 'الجمعة', val: 600 },
              ].map((item, idx) => (
                <div key={idx} className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 text-center space-y-2">
                  <span className="text-[11px] text-slate-400 block font-bold">{item.day}</span>
                  <div className="h-24 bg-slate-800/50 rounded-lg flex items-end justify-center p-1">
                    <div 
                      className="w-full bg-blue-600 rounded-md transition-all"
                      style={{ height: `${(item.val / 3500) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-mono text-xs text-white font-bold">{item.val} ج.م</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Settings & License */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#151b2b] p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Key size={18} className="text-blue-400" />
              <h3 className="font-bold text-white text-sm">إدارة الترخيص والاشتراك</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800/60 font-mono">
                <span className="text-slate-400">حالة التفعيل:</span>
                <span className={trialData.isActivated ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {trialData.isActivated ? 'مفعل دائم (Full License)' : 'فترة تجريبية'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60 font-mono">
                <span className="text-slate-400">الأيام المتبقية:</span>
                <span className="text-white font-bold">{remainingDays} يوم</span>
              </div>

              {!trialData.isActivated && (
                <form onSubmit={handleActivateLicense} className="space-y-3 pt-3">
                  <label className="text-slate-300 block font-bold">أدخل مفتاح التفعيل الرسمي:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="SMART-123"
                      value={inputKey}
                      onChange={e => setInputKey(e.target.value)}
                      className="flex-1 bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-xs shadow-lg shadow-blue-600/20"
                    >
                      تفعيل
                    </button>
                  </div>
                  {keyError && <p className="text-xs text-red-400 font-bold">{keyError}</p>}
                  {keySuccess && <p className="text-xs text-emerald-400 font-bold">{keySuccess}</p>}
                </form>
              )}
            </div>
          </div>

          <div className="bg-[#151b2b] p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sliders size={18} className="text-blue-400" />
              <h3 className="font-bold text-white text-sm">إعدادات الكاميرا والماسح الضوئي</h3>
            </div>
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between text-slate-300 font-bold">
                  <span>سرعة التقاط الإطارات (FPS):</span>
                  <span className="font-mono text-blue-400">{scannerFps} FPS</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={scannerFps}
                  onChange={e => setScannerFps(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-slate-300 font-bold">
                  <span>حجم مربع المسح (QR Box Size):</span>
                  <span className="font-mono text-blue-400">{scannerQrBox}px</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="350"
                  step="25"
                  value={scannerQrBox}
                  onChange={e => setScannerQrBox(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">تأكيد عملية الدفع وإصدار الفواتير</h3>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {checkoutSuccess ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 animate-bounce">
                  <Check size={32} />
                </div>
                <h4 className="font-black text-white text-base">تم إتمام الفاتورة وتحديث المخزون بنجاح!</h4>
                <p className="text-xs text-slate-400">جاري طباعة الإيصال الحراري...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-2 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>إجمالي الأصناف:</span>
                    <span className="text-white font-bold">{cart.reduce((s, i) => s + i.quantity, 0)} قطعة</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>المبلغ المستحق (شامل الضريبة):</span>
                    <span className="text-emerald-400 font-bold text-sm">{formatCurrency(cartTotal * 1.14)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 block font-bold">اختر طريقة السداد:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', label: 'نقداً (Cash)' },
                      { id: 'card', label: 'بطاقة ائتمان' },
                      { id: 'vodafone', label: 'فودافون كاش' },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={cn(
                          "py-2.5 rounded-xl font-bold border transition-all text-center",
                          paymentMethod === m.id ? "bg-blue-600/20 text-blue-400 border-blue-500/50" : "bg-[#0f172a] text-slate-400 border-slate-800"
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 block font-bold">المبلغ المدفوع من العميل:</label>
                  <input
                    type="number"
                    placeholder="أدخل المبلغ..."
                    value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                  {amountPaid && Number(amountPaid) >= cartTotal * 1.14 && (
                    <div className="text-emerald-400 font-mono font-bold pt-1">
                      المتبقي (الباقي للعميل): {formatCurrency(Number(amountPaid) - cartTotal * 1.14)}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/25 mt-2"
                >
                  تأكيد ودفع وطباعة الفاتورة
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Camera size={18} className="text-blue-400" />
                <span>ماسح الباركود عبر كاميرا الويب</span>
              </h3>
              <button onClick={() => setIsScannerOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="relative bg-black rounded-2xl h-64 flex flex-col items-center justify-center border-2 border-dashed border-blue-500/50 p-4">
              <div className="absolute inset-4 border-2 border-blue-500 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500/80 animate-pulse"></div>
              </div>
              <Camera size={48} className="text-slate-600 mb-2 animate-pulse" />
              <p className="text-xs text-slate-400">جاري تشغيل عدسة الكاميرا (FPS: {scannerFps})...</p>
              <p className="text-[10px] text-slate-500 mt-1">وجه الباركود نحو المربع المحدد</p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-slate-400 text-xs block">تجربة محاكاة قراءة باركود سريع:</label>
              <div className="grid grid-cols-2 gap-2">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      addToCart(p);
                      setIsScannerOpen(false);
                    }}
                    className="bg-[#0f172a] hover:bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-right text-xs transition-all"
                  >
                    <span className="font-bold text-white block truncate">{p.name}</span>
                    <span className="text-[10px] font-mono text-blue-400">{p.barcode}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsScannerOpen(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all mt-2"
            >
              إغلاق الماسح
            </button>
          </div>
        </div>
      )}

      {/* Scale Calculator Modal (زر المسطرة) */}
      <ScaleCalculatorModal
        isOpen={isScaleModalOpen}
        onClose={() => setIsScaleModalOpen(false)}
        products={products.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          price: p.price,
          costPrice: p.cost,
          quantity: p.stock,
          category: p.category,
          unit: 'كجم',
          isWeighted: true
        })) as any}
        initialProduct={scaleProduct}
        onConfirm={(prod, weightKg, totalAmount) => {
          const cartItem: CartItem = {
            id: prod.id,
            name: prod.name,
            sku: prod.sku,
            barcode: prod.barcode || '',
            price: prod.price,
            cost: prod.costPrice || 0,
            stock: prod.quantity,
            category: prod.category || 'ميزان',
            quantity: weightKg
          };
          setCart(prev => {
            const existing = prev.find(i => i.id === prod.id);
            if (existing) {
              return prev.map(i => i.id === prod.id ? { ...i, quantity: weightKg } : i);
            }
            return [...prev, cartItem];
          });
        }}
      />

      {/* POS Custom Groups Manager */}
      <POSCustomGroupsManager
        isOpen={isCustomGroupsOpen}
        onClose={() => setIsCustomGroupsOpen(false)}
        products={products.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          price: p.price,
          costPrice: p.cost,
          quantity: p.stock,
          category: p.category,
          unit: 'قطعة'
        })) as any}
        onGroupsChanged={(updated) => setCustomGroups(updated)}
      />
    </div>
  );
};
