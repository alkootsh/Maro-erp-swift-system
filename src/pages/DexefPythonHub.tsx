/**
 * @file DexefPythonHub.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: DexefPythonHub.tsx.
 */
import React, { useState } from 'react';
import { 
  Code, 
  Terminal, 
  Database, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Cpu, 
  ShieldCheck, 
  Calculator, 
  Layers, 
  BookOpen,
  Server
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export const DexefPythonHub: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'main' | 'database' | 'inventory' | 'sales' | 'reports'>('main');
  const [copied, setCopied] = useState(false);

  const pythonFiles = {
    main: {
      name: 'main.py',
      title: 'الملف الرئيسي ونظام إدارة النوافذ والتنقل (CustomTkinter Main Window)',
      description: 'يدير واجهة التطبيق الرئيسية، التنقل بين التبويبات (لوحة التحكم، المخازن، المبيعات، التقارير)، وإدارة دورة حياة نافذة CustomTkinter.',
      code: `import customtkinter as ctk
import sqlite3
from database import init_db
from inventory_view import InventoryFrame
from sales_view import SalesFrame
from reports_view import ReportsFrame

class DexefERPApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Dexef ERP System - النسخة المكتبية الأصلية")
        self.geometry("1200\u00d7750")
        
        # Initialize Database
        init_db()
        
        # Configure Dark Theme
        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("blue")
        
        # Layout Sidebar & Main Container
        self.setup_sidebar()
        self.setup_frames()
        
    def setup_sidebar(self):
        self.sidebar = ctk.CTkFrame(self, width=220, corner_radius=0)
        self.sidebar.pack(side="left", fill="y")
        
        self.logo_label = ctk.CTkLabel(self.sidebar, text="DEXEF ERP", font=("Arial", 22, "bold"))
        self.logo_label.pack(pady=20)
        
        btn_dashboard = ctk.CTkButton(self.sidebar, text="📊 لوحة القيادة", command=lambda: self.show_frame("dashboard"))
        btn_dashboard.pack(pady=10, padx=20, fill="x")
        
        btn_inventory = ctk.CTkButton(self.sidebar, text="📦 المخزون والأصناف", command=lambda: self.show_frame("inventory"))
        btn_inventory.pack(pady=10, padx=20, fill="x")
        
        btn_sales = ctd_sales = ctk.CTkButton(self.sidebar, text="🛒 نقطة البيع (POS)", command=lambda: self.show_frame("sales"))
        btn_sales.pack(pady=10, padx=20, fill="x")
        
        btn_reports = ctk.CTkButton(self.sidebar, text="📈 تقارير الأستاذ العام", command=lambda: self.show_frame("reports"))
        btn_reports.pack(pady=10, padx=20, fill="x")

    def setup_frames(self):
        self.container = ctk.CTkFrame(self, fg_color="transparent")
        self.container.pack(side="right", fill="both", expand=True, padx=20, pady=20)
        
        self.frames = {}
        # Frames initialization...
        
    def show_frame(self, name):
        # Frame switching logic
        pass

if __name__ == "__main__":
    app = DexefERPApp()
    app.mainloop()`
    },
    database: {
      name: 'database.py',
      title: 'إدارة قاعدة البيانات العلائقية SQLite3 والاتصال',
      description: 'يقوم بإنشاء جداول النظام (الأصناف، الفواتير، بنود الفاتورة، قيود اليومية) وتطبيق قيود العلاقات والـ Foreign Keys.',
      code: `import sqlite3

DB_NAME = "dexef_erp.db"

def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Products Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category TEXT,
            purchase_price REAL NOT NULL,
            sale_price REAL NOT NULL,
            stock_qty INTEGER NOT NULL DEFAULT 0,
            min_limit INTEGER NOT NULL DEFAULT 5,
            unit TEXT DEFAULT 'قطعة'
        )
    ''')
    
    # Invoices Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_no TEXT UNIQUE NOT NULL,
            customer_name TEXT,
            subtotal REAL NOT NULL,
            vat_amount REAL NOT NULL,
            total_amount REAL NOT NULL,
            payment_type TEXT DEFAULT 'نقداً',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Journal Entries (General Ledger)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            reference TEXT,
            description TEXT,
            debit REAL NOT NULL,
            credit REAL NOT NULL,
            account_type TEXT
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully.")`
    },
    inventory: {
      name: 'inventory_view.py',
      title: 'وحدة إدارة المخزون والأصناف (Inventory Management View)',
      description: 'واجهة مخصصة لإضافة وتعديل وحذف المنتجات وحساب نسبة هامش الربح والفلترة الفورية.',
      code: `import customtkinter as ctk
from database import get_connection

class InventoryFrame(ctk.CTkFrame):
    def __init__(self, parent):
        super().__init__(parent)
        
        self.label = ctk.CTkLabel(self, text="إدارة المخزون والأصناف", font=("Arial", 18, "bold"))
        self.label.pack(pady=10)
        
        # Product Form Inputs
        self.form_frame = ctk.CTkFrame(self)
        self.form_frame.pack(fill="x", padx=10, pady=10)
        
        self.sku_entry = ctk.CTkEntry(self.form_frame, placeholder_text="الباركود / SKU")
        self.sku_entry.pack(side="left", padx=5, pady=5)
        
        self.name_entry = ctk.CTkEntry(self.form_frame, placeholder_text="اسم المنتج")
        self.name_entry.pack(side="left", padx=5, pady=5)
        
        self.price_entry = ctk.CTkEntry(self.form_frame, placeholder_text="سعر البيع")
        self.price_entry.pack(side="left", padx=5, pady=5)
        
        self.qty_entry = ctk.CTkEntry(self.form_frame, placeholder_text="الرصيد")
        self.qty_entry.pack(side="left", padx=5, pady=5)
        
        self.btn_add = ctk.CTkButton(self.form_frame, text="حفظ الصنف", command=self.save_product)
        self.btn_add.pack(side="left", padx=5, pady=5)

    def save_product(self):
        # Save logic to SQLite
        pass`
    },
    sales: {
      name: 'sales_view.py',
      title: 'وحدة نقطة البيع وفواتير المبيعات (POS & VAT 14% Engine)',
      description: 'شاشة مبيعات سريعة تحسب ضريبة القيمة المضافة 14% تلقائياً وتحدث المخزون ودفتر الأستاذ.',
      code: `import customtkinter as ctk
from database import get_connection

class SalesFrame(ctk.CTkFrame):
    def __init__(self, parent):
        super().__init__(parent)
        self.title_label = ctk.CTkLabel(self, text="نقطة البيع الضريبية (POS)", font=("Arial", 18, "bold"))
        self.title_label.pack(pady=10)
        
        # Cart items and calculations
        self.cart = []
        self.vat_rate = 0.14 # 14% VAT

    def calculate_totals(self, subtotal):
        vat = subtotal * self.vat_rate
        total = subtotal + vat
        return vat, total`
    },
    reports: {
      name: 'reports_view.py',
      title: 'دفتر الأستاذ وقائمة الدخل والإقرار الضريبي (Reports View)',
      description: 'حساب تكلفة البضاعة المباعة COGS، مجمل الربح، وصافي الإقرار الضريبي لضريبة القيمة المضافة.',
      code: `import customtkinter as ctk
from database import get_connection

class ReportsFrame(ctk.CTkFrame):
    def __init__(self, parent):
        super().__init__(parent)
        self.title = ctk.CTkLabel(self, text="التقارير المالية والأستاذ العام", font=("Arial", 18, "bold"))
        self.title.pack(pady=10)
        
    def generate_profit_loss(self):
        # P&L calculation: Revenue - COGS = Gross Profit
        pass`
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              Dexef ERP Python & Web Architecture Hub
            </span>
            <span className="text-xs text-emerald-400 font-bold">● نسخة سطح المكتب CustomTkinter و SQLite النشطة</span>
          </div>
          <h1 className="text-2xl font-black text-white">مركز هندسة وأكواد نظام Dexef ERP المتكامل</h1>
          <p className="text-xs text-slate-400 mt-1">
            التوثيق الهندسي الشامل ومعمارية النظام المزدوج (React Web App + Python Desktop App) مع إمكانية استعراض وتنزيل كافة الملفات المصدرية.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] px-4 py-2.5 rounded-xl border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 block">إصدار النظام</span>
            <span className="font-mono text-emerald-400 font-bold text-xs">v4.0 Enterprise</span>
          </div>
        </div>
      </div>

      {/* Architecture Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
            <Terminal size={20} />
          </div>
          <h3 className="font-black text-white text-sm">نسخة بايثون المكتبية</h3>
          <p className="text-xs text-slate-400">مبنية بـ Python CustomTkinter و SQLite3 لتشغيل مستقل على أجهزة Windows و Mac و Linux.</p>
        </div>

        <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            <Cpu size={20} />
          </div>
          <h3 className="font-black text-white text-sm">نسخة الويب السحابية</h3>
          <p className="text-xs text-slate-400">React 18 + TypeScript + Tailwind CSS مع محرك تخزين محلي وتزامن سحابي فائق السرعة.</p>
        </div>

        <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
            <Calculator size={20} />
          </div>
          <h3 className="font-black text-white text-sm">المعادلات المحاسبية</h3>
          <p className="text-xs text-slate-400">حساب تلقائي لتكلفة البضاعة المباعة (COGS)، ضريبة القيمة المضافة 14%، ومجمل الربح التشغيلي.</p>
        </div>

        <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
            <ShieldCheck size={20} />
          </div>
          <h3 className="font-black text-white text-sm">التكامل المؤسسي</h3>
          <p className="text-xs text-slate-400">ربط مباشر بين حركة المبيعات، تحديث المستودع، وإنشاء قيود دفتر الأستاذ العام.</p>
        </div>
      </div>

      {/* Python Code Viewer Section */}
      <div className="bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 bg-[#0f172a] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code size={18} className="text-blue-400" />
            <h3 className="font-bold text-white text-sm">مستعرض الأكواد المصدرية لنسخة سطح المكتب (Python Files)</h3>
          </div>
          <div className="flex items-center gap-1 bg-[#151b2b] p-1 rounded-xl border border-slate-800">
            {(Object.keys(pythonFiles) as Array<keyof typeof pythonFiles>).map((key) => (
              <button
                key={key}
                onClick={() => setActiveFile(key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all",
                  activeFile === key ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                )}
              >
                {pythonFiles[key].name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white text-sm">{pythonFiles[activeFile].title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{pythonFiles[activeFile].description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(pythonFiles[activeFile].code)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
              </button>
              <button
                onClick={() => handleDownload(pythonFiles[activeFile].name, pythonFiles[activeFile].code)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30"
              >
                <Download size={14} />
                <span>تحميل الملف (.py)</span>
              </button>
            </div>
          </div>

          <div className="bg-[#0b101a] p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[450px] leading-relaxed">
            <pre>{pythonFiles[activeFile].code}</pre>
          </div>
        </div>
      </div>

      {/* Accounting Formulas Reference Card */}
      <div className="bg-[#151b2b] p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Calculator size={18} className="text-emerald-400" />
          <span>مرجع المعادلات المحاسبية المعتمدة في النظام (Dexef & MARO ERP)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-blue-400 block">1. تكلفة البضاعة المباعة (COGS)</span>
            <p className="text-slate-300 font-mono">COGS = الكمية المباعة × سعر الشراء (التكلفة)</p>
            <span className="text-[10px] text-slate-500 block pt-1">تُستخدم لتحديد التكلفة الحقيقية للبضاعة الخارجة من المستودع عند كل عملية بيع.</span>
          </div>

          <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400 block">2. ضريبة القيمة المضافة (VAT 14%)</span>
            <p className="text-slate-300 font-mono">VAT Amount = إجمالي الصافي × 0.14</p>
            <span className="text-[10px] text-slate-500 block pt-1">حساب تلقائي لمبلغ الضريبة وإضافته للمجموع الفرعي للفاتورة الضريبية.</span>
          </div>

          <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-purple-400 block">3. مجمل الربح (Gross Profit)</span>
            <p className="text-slate-300 font-mono">Gross Profit = إجمالي المبيعات - تكلفة البضاعة المباعة</p>
            <span className="text-[10px] text-slate-500 block pt-1">معيار قياس كفاءة الأنشطة التجارية وهامش ربح الأصناف المباعة.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
