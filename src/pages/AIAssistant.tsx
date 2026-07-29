import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'مرحباً! أنا مساعدك الذكي في سويفت ERP. يمكنني مساعدتك في تقارير المبيعات الشهرية، حالة المخزون، وتحليل الأداء. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getSystemContext = async () => {
    try {
      const contextData: any = {};
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // 1. Invoices (Sales) Aggregation
      const invoicesSnap = await getDocs(collection(db, 'invoices'));
      const invoices = invoicesSnap.docs.map(d => d.data() as any);
      
      let currentMonthSales = 0;
      let lastMonthSales = 0;
      let totalSales = 0;
      let totalPaid = 0;
      let totalUnpaid = 0;

      invoices.forEach(inv => {
        const amount = inv.totalAmount || 0;
        totalSales += amount;
        totalPaid += (inv.paidAmount || 0);
        totalUnpaid += ((inv.totalAmount || 0) - (inv.paidAmount || 0));
        
        let date = null;
        if (inv.date) {
            date = inv.date.toDate ? inv.date.toDate() : new Date(inv.date);
        }
        
        if (date) {
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                currentMonthSales += amount;
            } else if (
                (currentMonth === 0 && date.getMonth() === 11 && date.getFullYear() === currentYear - 1) ||
                (date.getMonth() === currentMonth - 1 && date.getFullYear() === currentYear)
            ) {
                lastMonthSales += amount;
            }
        }
      });
      
      contextData.sales = {
        totalAllTime: totalSales,
        totalPaid: totalPaid,
        totalUnpaid: totalUnpaid,
        currentMonth: currentMonthSales,
        lastMonth: lastMonthSales,
        totalInvoicesCount: invoices.length
      };

      // 2. Products & Inventory
      const productsSnap = await getDocs(collection(db, 'products'));
      const products = productsSnap.docs.map(d => d.data() as any);
      contextData.inventory = {
        totalItemsCount: products.length,
        totalInventoryValue: products.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0),
        lowStockItems: products.filter(p => (p.quantity || 0) <= (p.minQuantity || 5)).map(p => ({name: p.name, quantity: p.quantity}))
      };
      
      // 3. Customers
      const customersSnap = await getDocs(collection(db, 'customers'));
      contextData.customersCount = customersSnap.size;

      // 4. Purchases (Bills)
      const billsSnap = await getDocs(collection(db, 'bills'));
      const bills = billsSnap.docs.map(d => d.data() as any);
      let currentMonthPurchases = 0;
      bills.forEach(bill => {
        let date = null;
        if (bill.date) {
            date = bill.date.toDate ? bill.date.toDate() : new Date(bill.date);
        }
        if (date && date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            currentMonthPurchases += (bill.totalAmount || 0);
        }
      });
      contextData.purchases = {
        currentMonth: currentMonthPurchases,
        totalCount: bills.length
      };

      contextData.currentDate = now.toLocaleString('ar-EG');
      
      return JSON.stringify(contextData, null, 2);
    } catch (error) {
      console.error("Error gathering context:", error);
      return "لا يمكن الوصول للبيانات حالياً.";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const context = await getSystemContext();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })).concat([{ role: 'user', parts: [{ text: userMessage }] }]),
          context: context
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const assistantMessage = data.text || "عذراً، حدث خطأ في معالجة طلبك.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "عذراً، واجهت مشكلة في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "flex flex-col bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden transition-all duration-300",
      isFullScreen 
        ? "fixed inset-0 z-[100] m-0 rounded-none h-screen" 
        : "h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] mt-[-10px] md:mt-0"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-[#1e293b] bg-[#0f172a]/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm md:text-base">المساعد الذكي لـ سويفت ERP</h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              متصل وجاهز للمساعدة
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-colors"
            title={isFullScreen ? "تصغير" : "تكبير الشاشة"}
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button 
            onClick={() => setMessages([messages[0]])}
            className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
            title="مسح المحادثة"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#0b0f1a]/30">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={cn(
              "flex gap-3 md:gap-4 max-w-[95%] md:max-w-[85%]",
              message.role === 'user' ? "mr-auto flex-row-reverse" : "ml-auto"
            )}
          >
            <div className={cn(
              "w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0 border",
              message.role === 'user' ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-blue-600/10 border-blue-600/20 text-blue-400"
            )}>
              {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
              "p-3 md:p-4 rounded-2xl text-sm leading-relaxed shadow-lg overflow-hidden",
              message.role === 'user' 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-[#1e293b] text-slate-200 border border-[#334155] rounded-tl-none"
            )}>
              <div className="markdown-body text-xs md:text-sm">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 md:gap-4 ml-auto max-w-[95%] md:max-w-[85%]">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-[#1e293b] border border-[#334155] p-3 md:p-4 rounded-2xl rounded-tl-none flex items-center gap-3 text-slate-400 text-sm shadow-lg">
              <Loader2 size={16} className="animate-spin text-blue-500" />
              <span className="font-medium text-xs md:text-sm">جاري التفكير وجمع البيانات...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-6 border-t border-[#1e293b] bg-[#0f172a]/50">
        <div className="relative max-w-4xl mx-auto">
          <input 
            type="text" 
            placeholder="مثال: كم بلغت مبيعات الشهر الماضي؟ أو ما هي المنتجات التي أوشكت على النفاذ؟" 
            className="w-full pr-4 pl-12 py-3 md:py-4 bg-[#1e293b] border border-[#334155] rounded-xl md:rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xl text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 p-2 md:p-2.5 rounded-xl transition-all",
              input.trim() && !isLoading 
                ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20" 
                : "text-slate-600 cursor-not-allowed"
            )}
          >
            <Send size={18} className="md:w-5 md:h-5" />
          </button>
        </div>
        <p className="text-[9px] md:text-[10px] text-center text-slate-600 mt-2 md:mt-4 font-medium uppercase tracking-wider">
          مساعد سويفت الذكي متصل بقاعدة البيانات الحية. قد يرتكب الذكاء الاصطناعي أخطاء، يرجى مراجعة التقارير الهامة.
        </p>
      </div>
    </div>
  );
};
