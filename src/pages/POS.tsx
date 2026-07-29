import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Clock,
  Tag,
  Maximize2,
  X,
  Package,
  Barcode
} from 'lucide-react';
import { collection, onSnapshot, addDoc, serverTimestamp, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { toast } from 'react-hot-toast';

const CATEGORIES = ['الكل', 'مواد غذائية', 'مشروبات', 'خضروات وفواكه', 'لحوم ودواجن', 'ألبان وأجبان', 'عناية شخصية', 'مواد تنظيف', 'مستلزمات منزلية', 'حلويات وسكاكر', 'بقوليات'];

const FUNCTION_KEYS = [
  { key: 'F1', name: 'بحث صنف', color: 'bg-blue-600' },
  { key: 'F2', name: 'بحث عميل', color: 'bg-emerald-600' },
  { key: 'F3', name: 'بيع بالقيمة', color: 'bg-amber-600' },
  { key: 'F4', name: 'خصم على...', color: 'bg-red-600' },
  { key: 'F5', name: 'تعليق الفاتورة', color: 'bg-purple-600' },
  { key: 'F6', name: 'طباعة آخر فاتورة', color: 'bg-sky-600' },
  { key: 'F7', name: 'دفع نقدي', color: 'bg-blue-500' },
  { key: 'F8', name: 'دفع بطاقة', color: 'bg-emerald-500' },
  { key: 'F9', name: 'دفع آجل', color: 'bg-amber-500' },
  { key: 'F10', name: 'تقرير يومي', color: 'bg-red-500' },
  { key: 'F11', name: 'فتح الدرج', color: 'bg-purple-500' },
  { key: 'F12', name: 'مسح السلة', color: 'bg-slate-600' },
];

export const POS: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSaleByValueModalOpen, setIsSaleByValueModalOpen] = useState(false);
  const [saleByValueAmount, setSaleByValueAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [lastInvoice, setLastInvoice] = useState<any>(null);

  useEffect(() => {
    const unsubProds = onSnapshot(collection(db, 'products'), (snap) => {
      const prods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(prods);
      setFilteredProducts(prods);
    });

    const unsubCusts = onSnapshot(collection(db, 'customers'), (snap) => {
      setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAlerts = onSnapshot(doc(db, 'settings', 'alerts'), (snap) => {
      if (snap.exists()) {
        const allAlerts = snap.data().list || [];
        setActiveAlerts(allAlerts.filter((a: any) => a.isActive));
      }
    });

    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setCurrentUserData(userDoc.data());
        }
      }
    };
    fetchUserData();

    return () => {
      unsubProds();
      unsubCusts();
      unsubAlerts();
    };
  }, []);

  useEffect(() => {
    // Global keyboard listener for hardware scanners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 2) {
          handleBarcodeScan(barcodeBuffer);
        }
        setBarcodeBuffer('');
      } else if (e.key.length === 1) {
        setBarcodeBuffer(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [barcodeBuffer, products]);

  const handleBarcodeScan = (barcode: string) => {
    // Check for scale barcode (EAN-13 starting with 20-29)
    if (barcode.length === 13 && barcode.match(/^2[0-9]/)) {
      const itemCode = barcode.substring(2, 7);
      const weightOrPrice = parseInt(barcode.substring(7, 12), 10);
      
      const product = products.find(p => p.sku === itemCode || p.sku.endsWith(itemCode));
      if (product) {
        const quantity = weightOrPrice / 1000;
        addToCart(product, quantity);
        setSearchQuery('');
        toast.success(`تم إضافة ${product.name} (وزن: ${quantity} كجم)`);
        return;
      }
    }

    const product = products.find(p => p.sku === barcode || (p.barcodes && p.barcodes.includes(barcode)));
    if (product) {
      addToCart(product, 1);
      setSearchQuery('');
    } else {
      toast.error('لم يتم العثور على المنتج');
    }
  };

  useEffect(() => {
    let result = products;
    if (selectedCategory !== 'الكل') {
      result = result.filter(p => p.category === selectedCategory);
    }
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(result);
  }, [searchQuery, selectedCategory, products]);

  const addToCart = (product: any, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async (print: boolean = false) => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const now = serverTimestamp();
      const invoiceData = {
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || 'عميل نقدي',
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        totalAmount: total,
        paidAmount: parseFloat(paidAmount) || total,
        changeAmount: (parseFloat(paidAmount) || total) - total,
        status: paymentMethod === 'credit' ? 'pending' : 'paid',
        paymentMethod: paymentMethod,
        date: now,
      };

      await addDoc(collection(db, 'invoices'), invoiceData);

      if (selectedCustomer) {
        await updateDoc(doc(db, 'customers', selectedCustomer.id), {
          lastPurchaseDate: now
        });
      }

      if (print) {
        setLastInvoice({ id: 'INV-' + Math.floor(Math.random() * 10000), ...invoiceData });
        setTimeout(() => {
          window.print();
        }, 100);
      }

      setCart([]);
      setSelectedCustomer(null);
      setIsPaymentModalOpen(false);
      setPaidAmount('');
      alert('تمت عملية البيع بنجاح');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إتمام العملية');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaleByValue = () => {
    const amount = parseFloat(saleByValueAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const genericProduct = {
      id: `val-${Date.now()}`,
      name: 'بيع بقيمة',
      price: amount,
      category: 'عام',
      stock: 999
    };
    
    addToCart(genericProduct);
    setIsSaleByValueModalOpen(false);
    setSaleByValueAmount('');
  };

  const filteredAlerts = activeAlerts.filter(alert => {
    const isTargetedUser = alert.targetUsers.length === 0 || alert.targetUsers.includes(auth.currentUser?.uid);
    const isTargetedDept = alert.targetDepartments.length === 0 || (currentUserData?.department && alert.targetDepartments.includes(currentUserData.department));
    return isTargetedUser && isTargetedDept;
  });

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0b0f1a] -m-8">
      {/* Function Keys Header - Enlarged */}
      <div className="bg-[#0f172a] border-b border-[#1e293b] p-3 flex gap-3 overflow-x-auto no-scrollbar shadow-lg z-10">
        {FUNCTION_KEYS.map((fk) => (
          <button 
            key={fk.key}
            onClick={() => {
              if (fk.key === 'F3') setIsSaleByValueModalOpen(true);
              if (fk.key === 'F7') { setPaymentMethod('cash'); setIsPaymentModalOpen(true); }
              if (fk.key === 'F8') { setPaymentMethod('card'); setIsPaymentModalOpen(true); }
              if (fk.key === 'F12') setCart([]);
            }}
            className={cn(
              "flex-shrink-0 px-6 py-4 rounded-xl flex flex-col items-center justify-center min-w-[120px] transition-all active:scale-95 hover:brightness-110 shadow-md",
              fk.color
            )}
          >
            <span className="text-xs font-black text-white/50 mb-1">{fk.key}</span>
            <span className="text-sm font-black text-white whitespace-nowrap">{fk.name}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden flex-row-reverse">
        {/* Right: Cart Section (Moved to Right) */}
        <div className="w-[450px] bg-[#0f172a] border-r border-[#1e293b] flex flex-col shadow-2xl z-10">
          <div className="p-5 border-b border-[#1e293b] flex items-center justify-between bg-[#151b2b]">
            <div className="text-right flex-1">
              <h3 className="font-black text-lg text-white">{selectedCustomer?.name || 'عميل نقدي'}</h3>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">تفاصيل العميل الحالي</p>
            </div>
            <button 
              onClick={() => setIsCustomerModalOpen(true)}
              className="p-3 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all mr-4"
            >
              <User size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0b0f1a]/50">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-6 opacity-50">
                <div className="w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center border-4 border-dashed border-slate-800">
                  <ShoppingCart size={64} strokeWidth={1} />
                </div>
                <div className="text-center">
                  <p className="font-black text-xl mb-2">السلة فارغة</p>
                  <p className="text-sm max-w-[200px]">ابدأ بإضافة المنتجات من القائمة اليسرى أو عبر مسح الباركود</p>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#151b2b] p-4 rounded-2xl border border-[#1e293b] shadow-lg group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-start justify-between mb-3">
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="text-right flex-1 pr-4">
                        <p className="text-base font-black text-white leading-tight mb-1">{item.name}</p>
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-slate-500 font-bold">{item.quantity} × {formatCurrency(item.price)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50">
                      <div className="text-lg font-black text-blue-400">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                      <div className="flex items-center gap-4 bg-slate-900 rounded-xl p-1.5 border border-slate-800">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-base font-black text-white min-w-[30px] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          <div className="p-8 bg-[#151b2b] border-t border-[#1e293b] space-y-6 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-sm font-bold">
                <span>{formatCurrency(total)}</span>
                <span>المجموع الفرعي</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 text-sm font-bold">
                <span className="text-red-400">0.00 ر.س</span>
                <span>الخصم</span>
              </div>
            </div>
            
            <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-600/20">
              <div className="flex items-center justify-between text-white">
                <span className="text-3xl font-black tracking-tighter">{formatCurrency(total)}</span>
                <span className="text-sm font-black uppercase tracking-widest opacity-70">الإجمالي النهائي</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={isProcessing || cart.length === 0}
                className="flex items-center justify-center gap-3 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                <CreditCard size={24} />
                <span>إتمام عملية الدفع (F7)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Left: Product Grid Section (Moved to Left) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0b0f1a]">
          {/* Search & Categories */}
          <div className="p-6 bg-[#0f172a] border-b border-[#1e293b] space-y-6 shadow-md">
            <div className="relative group">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={24} />
              <input 
                type="text"
                placeholder="مسح باركود أو بحث بالاسم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-2xl py-4 pr-14 pl-16 text-white text-lg focus:outline-none focus:border-blue-500 transition-all shadow-inner placeholder:text-slate-600"
              />
              <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <button 
                  onClick={() => setIsScannerOpen(true)}
                  className="p-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                  title="مسح باركود بالكاميرا"
                >
                  <Barcode size={24} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-6 py-3 rounded-xl text-sm font-black whitespace-nowrap transition-all border",
                    selectedCategory === cat 
                      ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20" 
                      : "bg-[#151b2b] text-slate-400 border-[#1e293b] hover:bg-slate-800 hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-4 flex flex-col items-center text-center group hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-600/10 transition-all active:scale-95 relative overflow-hidden"
                >
                  <div className="w-full aspect-square bg-slate-900 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden shadow-inner">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <Package size={48} className="text-slate-800 group-hover:text-blue-900 transition-colors" />
                    )}
                    <div className={cn(
                      "absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black text-white shadow-lg",
                      product.stock <= 5 ? "bg-red-600" : "bg-blue-600"
                    )}>
                      {product.stock} قطعة
                    </div>
                  </div>
                  <p className="text-sm font-black text-white mb-2 line-clamp-2 h-10 leading-tight">{product.name}</p>
                  <div className="mt-auto w-full pt-3 border-t border-slate-800/50">
                    <p className="text-lg font-black text-blue-400 tracking-tighter">{formatCurrency(product.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#151b2b] w-full max-w-2xl rounded-[2rem] border border-[#1e293b] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]">
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                  <X size={24} />
                </button>
                <h3 className="text-2xl font-black text-white tracking-tight">إتمام عملية الدفع</h3>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-[#0b0f1a] p-6 rounded-2xl border border-[#1e293b]">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 text-right">المبلغ الإجمالي</p>
                    <p className="text-4xl font-black text-blue-500 text-right tracking-tighter">{formatCurrency(total)}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-slate-400 text-sm font-bold text-right">طريقة الدفع</p>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setPaymentMethod('cash')}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold",
                          paymentMethod === 'cash' ? "bg-blue-600/20 border-blue-600 text-white" : "bg-slate-900 border-slate-800 text-slate-500"
                        )}
                      >
                        <Banknote size={24} />
                        <span className="text-xs">نقدي</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('card')}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold",
                          paymentMethod === 'card' ? "bg-emerald-600/20 border-emerald-600 text-white" : "bg-slate-900 border-slate-800 text-slate-500"
                        )}
                      >
                        <CreditCard size={24} />
                        <span className="text-xs">بطاقة</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('credit')}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold",
                          paymentMethod === 'credit' ? "bg-amber-600/20 border-amber-600 text-white" : "bg-slate-900 border-slate-800 text-slate-500"
                        )}
                      >
                        <Clock size={24} />
                        <span className="text-xs">آجل</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-slate-400 text-sm font-bold text-right mb-2">المبلغ المدفوع</p>
                    <input 
                      type="number"
                      placeholder="0.00"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full bg-[#0b0f1a] border-2 border-[#1e293b] rounded-2xl py-4 px-6 text-2xl font-black text-white text-right focus:outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                  
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 text-right">المبلغ المتبقي</p>
                    <p className={cn(
                      "text-3xl font-black text-right tracking-tighter",
                      (parseFloat(paidAmount) || 0) - total >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {formatCurrency(Math.max(0, (parseFloat(paidAmount) || 0) - total))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-[#0f172a] border-t border-[#1e293b] grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleCheckout(false)}
                  disabled={isProcessing}
                  className="py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-lg transition-all"
                >
                  حفظ بدون طباعة
                </button>
                <button 
                  onClick={() => handleCheckout(true)}
                  disabled={isProcessing}
                  className="py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-600/20"
                >
                  حفظ وطباعة إيصال
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sale By Value Modal */}
      <AnimatePresence>
        {isSaleByValueModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]">
                <button onClick={() => setIsSaleByValueModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
                <h3 className="font-black text-xl text-white">بيع بالقيمة</h3>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <p className="text-slate-400 text-sm font-bold text-right mb-2">أدخل المبلغ</p>
                  <input 
                    type="number"
                    autoFocus
                    value={saleByValueAmount}
                    onChange={(e) => setSaleByValueAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaleByValue()}
                    className="w-full bg-[#0b0f1a] border-2 border-[#1e293b] rounded-2xl py-5 px-6 text-3xl font-black text-white text-right focus:outline-none focus:border-amber-600 transition-all"
                    placeholder="0.00"
                  />
                </div>
                <button 
                  onClick={handleSaleByValue}
                  className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-amber-600/20"
                >
                  إضافة للسلة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isScannerOpen && (
        <BarcodeScanner 
          onScan={handleBarcodeScan} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}

      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-md rounded-2xl border border-[#1e293b] overflow-hidden">
            <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
              <h3 className="font-bold text-white">اختيار عميل</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
              <button 
                onClick={() => { setSelectedCustomer(null); setIsCustomerModalOpen(false); }}
                className="w-full text-right p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800 text-slate-400 transition-colors"
              >
                عميل نقدي (افتراضي)
              </button>
              {customers.map(c => (
                <button 
                  key={c.id}
                  onClick={() => { setSelectedCustomer(c); setIsCustomerModalOpen(false); }}
                  className="w-full text-right p-3 rounded-xl bg-[#1e293b] border border-[#334155] hover:border-blue-500 text-white transition-all"
                >
                  <div className="font-bold">{c.name}</div>
                  <div className="text-[10px] text-slate-500">{c.phone}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Ticker */}
      <div className="bg-[#0f172a] border-t border-[#1e293b] px-4 py-1 flex items-center justify-between text-[10px] font-bold overflow-hidden">
        <div className="flex items-center gap-4 text-slate-500 flex-shrink-0">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {new Date().toLocaleTimeString('ar-EG')}
          </span>
          <span className="text-emerald-500">متصل بالخادم</span>
        </div>
        <div className="flex-1 flex items-center justify-end overflow-hidden">
          <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
            {filteredAlerts.length === 0 ? (
              <span className="text-slate-600">لا توجد تنبيهات نشطة حالياً</span>
            ) : filteredAlerts.map((alert, idx) => (
              <span 
                key={idx} 
                className={cn(
                  "flex items-center gap-2",
                  alert.type === 'info' && "text-blue-500",
                  alert.type === 'warning' && "text-amber-500",
                  alert.type === 'error' && "text-red-500",
                  alert.type === 'success' && "text-emerald-500"
                )}
              >
                {alert.type === 'warning' && '🔥'}
                {alert.type === 'info' && '📢'}
                {alert.type === 'success' && '✅'}
                {alert.type === 'error' && '⚠️'}
                {alert.message}
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* Hidden Thermal Receipt Print Section */}
      {lastInvoice && (
        <div className="print-only hidden">
          <div className="thermal-receipt p-4 text-black bg-white">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-2">سويفت ERP</h2>
              <p className="text-sm">فاتورة مبيعات</p>
              <p className="text-xs">رقم: {lastInvoice.id}</p>
              <p className="text-xs">التاريخ: {new Date().toLocaleString('ar-EG')}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-xs">العميل: {lastInvoice.customerName}</p>
              <p className="text-xs">طريقة الدفع: {lastInvoice.paymentMethod === 'cash' ? 'نقدي' : lastInvoice.paymentMethod === 'card' ? 'بطاقة' : 'آجل'}</p>
            </div>

            <table className="w-full text-sm mb-4 border-t border-b border-black py-2">
              <thead>
                <tr className="border-b border-dashed border-black">
                  <th className="text-right py-1">الصنف</th>
                  <th className="text-center py-1">الكمية</th>
                  <th className="text-center py-1">السعر</th>
                  <th className="text-left py-1">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {lastInvoice.items.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="text-right py-1">{item.name}</td>
                    <td className="text-center py-1">{item.quantity}</td>
                    <td className="text-center py-1">{item.price}</td>
                    <td className="text-left py-1">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 mb-4 text-sm font-bold">
              <div className="flex justify-between">
                <span>الإجمالي:</span>
                <span>{formatCurrency(lastInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>المدفوع:</span>
                <span>{formatCurrency(lastInvoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>الباقي:</span>
                <span>{formatCurrency(lastInvoice.changeAmount)}</span>
              </div>
            </div>

            <div className="text-center text-xs mt-6 border-t border-black pt-2">
              <p>شكراً لتسوقكم معنا!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
