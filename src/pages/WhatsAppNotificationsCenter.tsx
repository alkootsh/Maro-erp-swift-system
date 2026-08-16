/**
 * @file WhatsAppNotificationsCenter.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: WhatsAppNotificationsCenter.tsx.
 */
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  MessageSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Eye, 
  Check, 
  ExternalLink, 
  Copy, 
  FileText, 
  UserCheck, 
  Truck, 
  DollarSign, 
  ShieldAlert, 
  Smartphone, 
  RefreshCw, 
  Settings, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Package,
  Layers,
  Inbox,
  Share2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  PeriodicAlertRule, 
  MerchantWhatsAppOrder, 
  NotificationDispatchLog, 
  WhatsAppGatewaySettings, 
  AlertCategory, 
  AlertSeverity,
  AlertFrequency
} from '../types/whatsappNotificationTypes';
import { WhatsAppNotificationService } from '../services/whatsappNotificationService';
import { SalesRepository } from '../repositories/salesRepository';
import { PurchaseRepository } from '../repositories/purchaseRepository';
import { CustomerRepository } from '../repositories/customerRepository';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { soundAlerts } from '../lib/soundAlerts';

export const WhatsAppNotificationsCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'INBOUND_ORDERS' | 'INVOICES_DISPATCH' | 'LOGS_SETTINGS'>('ALERTS');
  
  // State for data
  const [periodicRules, setPeriodicRules] = useState<PeriodicAlertRule[]>([]);
  const [inboundOrders, setInboundOrders] = useState<MerchantWhatsAppOrder[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<NotificationDispatchLog[]>([]);
  const [gatewaySettings, setGatewaySettings] = useState<WhatsAppGatewaySettings>(WhatsAppNotificationService.getSettings());
  
  // Modals and selections
  const [selectedRuleForPreview, setSelectedRuleForPreview] = useState<{ rule: PeriodicAlertRule; message: string } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<MerchantWhatsAppOrder | null>(null);
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  
  // Simulation input
  const [simulatorText, setSimulatorText] = useState('');
  const [simulatorMerchantName, setSimulatorMerchantName] = useState('سوبر ماركت النور (الحاج إبراهيم)');
  const [simulatorMerchantPhone, setSimulatorMerchantPhone] = useState('01098765432');
  const [simulatorPreset, setSimulatorPreset] = useState<'FOOD' | 'FASHION' | 'PHARMACY' | 'PARTS'>('FOOD');

  // New Rule Form
  const [newRule, setNewRule] = useState<Partial<PeriodicAlertRule>>({
    title: '',
    category: 'DAILY_SALES_PROFIT',
    frequency: 'DAILY_EVENING',
    customTime: '22:00',
    severity: 'HIGH',
    channels: ['WHATSAPP', 'EMAIL'],
    targetAudience: 'GENERAL_MANAGER',
    recipients: [{ name: 'المدير العام', phone: '01000000000', email: 'manager@maro-erp.com', role: 'General Manager' }],
    isActive: true,
    autoDispatchEnabled: true
  });

  const [copiedText, setCopiedText] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Reactive sync listeners
    const unsubRules = MaroSyncEngine.subscribe<PeriodicAlertRule>('periodic_alert_rules', (data) => {
      setPeriodicRules(data || WhatsAppNotificationService.getPeriodicRules());
    });

    const unsubOrders = MaroSyncEngine.subscribe<MerchantWhatsAppOrder>('merchant_whatsapp_orders', (data) => {
      setInboundOrders(data || WhatsAppNotificationService.getInboundOrders());
    });

    const unsubLogs = MaroSyncEngine.subscribe<NotificationDispatchLog>('notification_dispatch_logs', (data) => {
      setDispatchLogs(data || WhatsAppNotificationService.getDispatchLogs());
    });

    // Seed defaults
    setPeriodicRules(WhatsAppNotificationService.getPeriodicRules());
    setInboundOrders(WhatsAppNotificationService.getInboundOrders());
    setDispatchLogs(WhatsAppNotificationService.getDispatchLogs());

    return () => {
      unsubRules();
      unsubOrders();
      unsubLogs();
    };
  }, []);

  const showNotificationToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Trigger preview of alert
  const handlePreviewAlert = (rule: PeriodicAlertRule) => {
    const { messageText } = WhatsAppNotificationService.compilePeriodicAlertData(rule.category);
    setSelectedRuleForPreview({ rule, message: messageText });
  };

  // Immediate live trigger of alert
  const handleTriggerAlert = async (rule: PeriodicAlertRule) => {
    try {
      const logs = await WhatsAppNotificationService.triggerPeriodicAlert(rule.id, true);
      showNotificationToast(`تم إرسال التنبيه (${rule.title}) عبر الواتساب بنجاح!`);
      setSelectedRuleForPreview(null);
    } catch (err: any) {
      alert('خطأ في إرسال التنبيه: ' + err.message);
    }
  };

  // Convert Inbound Order to Sales Invoice
  const handleConvertToSalesInvoice = async (order: MerchantWhatsAppOrder) => {
    try {
      const invoice = await WhatsAppNotificationService.convertOrderToSalesInvoice(order);
      showNotificationToast(`تم تحويل طلبية التاجر (${order.merchantName}) بنجاح إلى فاتورة مبيعات رقم ${invoice.invoiceNumber} وتم إرسال الرد وتحديث المخزن والمديونية!`);
      setSelectedOrder(null);
    } catch (err: any) {
      alert('فشل في تحويل الطلبية: ' + err.message);
    }
  };

  // Convert Inbound Order to Purchase Bill
  const handleConvertToPurchaseBill = async (order: MerchantWhatsAppOrder) => {
    try {
      const bill = await WhatsAppNotificationService.convertOrderToPurchaseBill(order);
      showNotificationToast(`تم تحويل طلبية الواتساب بنجاح إلى أمر شراء رقم ${bill.billNumber}!`);
      setSelectedOrder(null);
    } catch (err: any) {
      alert('فشل في إنشاء أمر الشراء: ' + err.message);
    }
  };

  // Simulate Inbound WhatsApp Order
  const handleSimulateInboundOrder = async () => {
    if (!simulatorText.trim()) return;
    const parsedOrder = WhatsAppNotificationService.parseRawWhatsAppOrderText(
      simulatorText,
      simulatorMerchantName,
      simulatorMerchantPhone
    );
    await MaroSyncEngine.saveDocument('merchant_whatsapp_orders', parsedOrder, true);
    setIsSimulatorOpen(false);
    showNotificationToast(`تم استقبال وتحليل طلبية واتساب جديدة من (${simulatorMerchantName}) بنجاح!`);
    setActiveTab('INBOUND_ORDERS');
    setSelectedOrder(parsedOrder);
  };

  // Load simulator presets
  const handlePresetSelect = (preset: 'FOOD' | 'FASHION' | 'PHARMACY' | 'PARTS') => {
    setSimulatorPreset(preset);
    switch (preset) {
      case 'FOOD':
        setSimulatorMerchantName('سوبر ماركت الهدى والنور (الحاج إبراهيم)');
        setSimulatorMerchantPhone('01098765432');
        setSimulatorText(`السلام عليكم يا كابتن\nمحتاج أوردر عاجل لمحل البقالة:\n- 8 كرتونة جبن رومي بطارخ\n- 12 علبة تونة صن شاين قطع\n- 4 كرتونة زيت عباد شمس 1 لتر\n- 15 كيس سكر فاخر\nحملهم مع المندوب والتحصيل آجل زي كل أسبوع`);
        break;
      case 'FASHION':
        setSimulatorMerchantName('بوتيك لا روا للملابس والأحذية (التاجرة رانيا)');
        setSimulatorMerchantPhone('01223344556');
        setSimulatorText(`مساء الخير يا فندم\nعايزين نسحب كولكشن الأسبوع:\n- 5 جاكيت بليزر رجالي أسود XL\n- 10 قميص كلاسيك أبيض قطن L\n- 6 حذاء جلد طبيعي أسود مقاس 42\nياريت التوريد غداً صباحاً مع الفاتورة الضريبية`);
        break;
      case 'PHARMACY':
        setSimulatorMerchantName('صيدلية الشفاء التخصصية (د/ أحمد)');
        setSimulatorMerchantPhone('01122334455');
        setSimulatorText(`أهلاً بحضرتك\nطلبية أدوية عاجلة:\n- 20 علبة بنادول إكسترا أقراص\n- 10 عبوات فيتامين سي 1000\n- 15 شريط مضاد حيوي أوجمنتين 1 جم\nالمخزن المركزي - توريد آجل`);
        break;
      case 'PARTS':
        setSimulatorMerchantName('ورشة الأهرام لقطع غيار السيارات (الأسطى محمود)');
        setSimulatorMerchantPhone('01555666777');
        setSimulatorText(`مساء الفل يا باشا\nمحتاجين طلبيات الورشة:\n- 4 طقم تيل فرامل أمامي كوري\n- 6 فلتر زيت ماكينة أصلي\n- 2 بطارية جافة 70 أمبير\nجاهزين للاستلام كاش مع المندوب`);
        break;
    }
  };

  // Copy text helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Recent invoices for dispatch tab
  const recentInvoices = SalesRepository.getInvoices().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      <AnimatePresence>
        {actionSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-emerald-300 font-bold text-sm shadow-xl"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-400" size={20} />
              <span>{actionSuccessMessage}</span>
            </div>
            <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
              إغلاق
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Metrics & Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">تنبيهات الأعمال الدورية</p>
            <p className="text-2xl font-black text-white mt-1">{periodicRules.filter(r => r.isActive).length} تنبيه نشط</p>
            <p className="text-[11px] text-emerald-400 font-medium mt-1">واتساب + إيميل مجدول</p>
          </div>
          <div className="p-3.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Bell size={24} />
          </div>
        </div>

        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">طلبيات التجار المستلمة</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{inboundOrders.length} طلبية</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {inboundOrders.filter(o => o.status === 'CONVERTED_TO_SALES_INVOICE').length} تم تحويلها لفواتير
            </p>
          </div>
          <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <MessageSquare size={24} />
          </div>
        </div>

        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">رسائل الواتساب المرسلة</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{dispatchLogs.length} إشعار</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">فواتير + تقارير + مطالبات</p>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Send size={24} />
          </div>
        </div>

        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">بوابة الاتصال (Gateway)</p>
            <p className="text-lg font-black text-blue-400 mt-1">WhatsApp Web Direct</p>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              جاهز للإرسال والاستقبال 24/7
            </span>
          </div>
          <div className="p-3.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Smartphone size={24} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ALERTS')}
            className={cn(
              "flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap",
              activeTab === 'ALERTS'
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "bg-[#151b2b] text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Bell size={18} />
            <span>التنبيهات الدورية المجدولة للمدير والتاجرات</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/20 text-white">
              {periodicRules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('INBOUND_ORDERS')}
            className={cn(
              "flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap",
              activeTab === 'INBOUND_ORDERS'
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/25"
                : "bg-[#151b2b] text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Inbox size={18} />
            <span>استقبال طلبات التجار بالواتساب والتحويل الفوري</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/20 text-white">
              {inboundOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('INVOICES_DISPATCH')}
            className={cn(
              "flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap",
              activeTab === 'INVOICES_DISPATCH'
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                : "bg-[#151b2b] text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <FileText size={18} />
            <span>إرسال الفواتير والمطالبات بالواتساب</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS_SETTINGS')}
            className={cn(
              "flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap",
              activeTab === 'LOGS_SETTINGS'
                ? "bg-slate-700 text-white shadow-lg shadow-slate-700/25"
                : "bg-[#151b2b] text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Settings size={18} />
            <span>سجل الإرسال وإعدادات البوابة</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'ALERTS' && (
            <button
              onClick={() => setIsNewRuleModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold text-sm shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Plus size={18} />
              <span>إضافة تنبيه دوري جديد</span>
            </button>
          )}

          {activeTab === 'INBOUND_ORDERS' && (
            <button
              onClick={() => {
                handlePresetSelect('FOOD');
                setIsSimulatorOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-emerald-600 text-white rounded-xl hover:opacity-90 transition-all font-bold text-sm shadow-lg shadow-amber-600/20 active:scale-95"
            >
              <Sparkles size={18} />
              <span>محاكاة استقبال طلبية واتساب</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PERIODIC ALERTS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'ALERTS' && (
        <div className="space-y-6">
          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-white">قواعد التنبيهات الدورية المجدولة للمدير والمسؤولين</h3>
                <p className="text-slate-400 text-sm font-medium">
                  يقوم محرك MARO ERP بحساب بيانات المبيعات، المخزون، والمديونيات وإرسال تقارير دورية عبر الواتساب والإيميل
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {periodicRules.map((rule) => {
                const isCritical = rule.severity === 'CRITICAL';
                const isHigh = rule.severity === 'HIGH';

                return (
                  <div 
                    key={rule.id}
                    className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5 flex flex-col justify-between hover:border-blue-500/40 transition-all group relative overflow-hidden"
                  >
                    <div className={cn(
                      "absolute top-0 left-0 right-0 h-1",
                      isCritical ? "bg-red-500" : isHigh ? "bg-amber-500" : "bg-blue-500"
                    )} />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                          isCritical ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          isHigh ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        )}>
                          {rule.severity === 'CRITICAL' ? 'أهمية قصوى (حرج)' : rule.severity === 'HIGH' ? 'أهمية عالية' : 'تنبيه دوري'}
                        </span>
                        
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold bg-[#151b2b] px-3 py-1 rounded-lg border border-[#1e293b]">
                          <Clock size={14} className="text-blue-400" />
                          <span>
                            {rule.frequency === 'DAILY_EVENING' ? `يومياً ${rule.customTime || '11:00 م'}` :
                             rule.frequency === 'DAILY_MORNING' ? `صباحاً ${rule.customTime || '09:00 ص'}` :
                             rule.frequency === 'WEEKLY' ? 'أسبوعياً' :
                             rule.frequency === 'REALTIME' ? 'لحظي وفوري' : 'دوري'}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-black text-white text-base group-hover:text-blue-400 transition-colors">
                        {rule.title}
                      </h4>

                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        {rule.notes || 'تقرير تحليلي دوري للإدارة'}
                      </p>

                      <div className="pt-2 border-t border-[#1e293b] space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>المستلم المستهدف:</span>
                          <span className="font-bold text-slate-200">{rule.recipients[0]?.name || 'المدير العام'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>قنوات الإرسال:</span>
                          <div className="flex items-center gap-1 font-bold text-emerald-400">
                            {rule.channels.includes('WHATSAPP') && <span>WhatsApp</span>}
                            {rule.channels.includes('EMAIL') && <span>• Email</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#1e293b] flex items-center gap-2">
                      <button
                        onClick={() => handlePreviewAlert(rule)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#151b2b] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all border border-[#1e293b]"
                      >
                        <Eye size={14} />
                        <span>معاينة الرسالة</span>
                      </button>

                      <button
                        onClick={() => handleTriggerAlert(rule)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                      >
                        <Send size={14} />
                        <span>إرسال الآن للواتس</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INBOUND MERCHANT WHATSAPP ORDERS & AUTO-CONVERSION */}
      {/* ========================================================================= */}
      {activeTab === 'INBOUND_ORDERS' && (
        <div className="space-y-6">
          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-white">صندوق استقبال طلبات الشراء من التجار (WhatsApp Order Ingestion)</h3>
                <p className="text-slate-400 text-sm font-medium">
                  يقوم الذكاء الاصطناعي ومحلل النصوص الذكي بتحليل رسائل التجار والعملاء وتحويلها بضغطة زر واحدة لفواتير مبيعات معتمدة
                </p>
              </div>

              <button
                onClick={() => {
                  handlePresetSelect('FOOD');
                  setIsSimulatorOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-emerald-600 text-white rounded-xl hover:opacity-90 transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20"
              >
                <Sparkles size={16} />
                <span>محاكاة وصول رسالة تاجر جديدة</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-[#0f172a]/70 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">رقم الطلبية</th>
                    <th className="px-6 py-4">التاجر / العميل</th>
                    <th className="px-6 py-4">رقم الهاتف</th>
                    <th className="px-6 py-4">عدد الأصناف</th>
                    <th className="px-6 py-4">القيمة التقديرية</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4">وقت الاستلام</th>
                    <th className="px-6 py-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {inboundOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-bold">
                        لا توجد طلبات تجار حالياً في الصندوق
                      </td>
                    </tr>
                  ) : inboundOrders.map((order) => {
                    const isConverted = order.status === 'CONVERTED_TO_SALES_INVOICE' || order.status === 'CONVERTED_TO_PURCHASE_ORDER';
                    
                    return (
                      <tr key={order.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4 font-mono font-bold text-white">{order.orderNumber}</td>
                        <td className="px-6 py-4 font-bold text-slate-200">
                          <div className="flex items-center gap-2">
                            <span>{order.merchantName}</span>
                            {order.merchantType === 'CUSTOMER_MERCHANT' ? (
                              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold">تاجر عميل</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold">مورد</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-400 text-sm">{order.merchantPhone}</td>
                        <td className="px-6 py-4 text-slate-300 font-bold">{order.parsedItems.length} صنف</td>
                        <td className="px-6 py-4 font-mono font-black text-amber-400 text-base">
                          {formatCurrency(order.estimatedGrandTotal)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5",
                            order.status === 'CONVERTED_TO_SALES_INVOICE' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            order.status === 'CONVERTED_TO_PURCHASE_ORDER' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                            order.status === 'PARSED' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                            order.status === 'PENDING_REVIEW' && "bg-slate-700/50 text-slate-300 border-slate-600"
                          )}>
                            {order.status === 'CONVERTED_TO_SALES_INVOICE' ? 'تم التحويل لفاتورة مبيعات' :
                             order.status === 'CONVERTED_TO_PURCHASE_ORDER' ? 'تم التحويل لأمر شراء' :
                             order.status === 'PARSED' ? 'جاهز للمراجعة والتحويل' : 'جديد'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs font-medium">
                          {formatDate(order.receivedAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-blue-500/30 flex items-center gap-1.5"
                            >
                              <Eye size={14} />
                              <span>فحص والتحويل</span>
                            </button>

                            {!isConverted && (
                              <button
                                onClick={() => handleConvertToSalesInvoice(order)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                              >
                                <Check size={14} />
                                <span>تحويل لفاتورة</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVOICES & STATEMENTS WHATSAPP DISPATCH */}
      {/* ========================================================================= */}
      {activeTab === 'INVOICES_DISPATCH' && (
        <div className="space-y-6">
          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-white">إرسال الفواتير والمطالبات الضريبية عبر الواتساب</h3>
                <p className="text-slate-400 text-sm font-medium">
                  إرسال فوري لفواتير المبيعات الصادرة، أوامر الشراء للموردين، وتذكيرات مواعيد استحقاق المديونيات
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-300 text-sm uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-emerald-400" />
                <span>أحدث فواتير المبيعات الصادرة الجاهزة للإرسال:</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-[#0f172a]/70 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">رقم الفاتورة</th>
                      <th className="px-6 py-4">العميل</th>
                      <th className="px-6 py-4">المبلغ الشامل</th>
                      <th className="px-6 py-4">المدفوع / المتبقي</th>
                      <th className="px-6 py-4">التاريخ</th>
                      <th className="px-6 py-4 text-center">إجراءات الواتساب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {recentInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">لا توجد فواتير مبيعات سابقة</td>
                      </tr>
                    ) : recentInvoices.map((inv) => {
                      const msg = WhatsAppNotificationService.formatSalesInvoiceWhatsApp(inv);
                      const customerPhone = '01000000000'; // Default fallback

                      return (
                        <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 font-bold text-slate-200">{inv.customerName || 'عميل نقدي'}</td>
                          <td className="px-6 py-4 font-mono font-black text-blue-400">{formatCurrency(inv.grandTotal)}</td>
                          <td className="px-6 py-4 text-xs font-bold">
                            <span className="text-emerald-400">مسدد: {formatCurrency(inv.paidAmount)}</span>
                            {inv.dueAmount > 0 && <span className="text-amber-400 block">آجل: {formatCurrency(inv.dueAmount)}</span>}
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(inv.createdAt)}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  WhatsAppNotificationService.openWhatsAppDirectly(customerPhone, msg);
                                  showNotificationToast(`تم فتح الواتساب لإرسال الفاتورة (${inv.invoiceNumber})`);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 active:scale-95"
                              >
                                <Send size={14} />
                                <span>إرسال للعميل بالواتساب</span>
                              </button>

                              <button
                                onClick={() => handleCopy(msg)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                                title="نسخ نص الرسالة"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DISPATCH LOGS & SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'LOGS_SETTINGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Logs */}
          <div className="lg:col-span-2 bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Share2 size={20} className="text-blue-400" />
              <span>سجل الإرسال والمراجعة (Dispatch Audit Trail)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0f172a]/70 text-slate-500 font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3">الوقت</th>
                    <th className="px-4 py-3">القناة</th>
                    <th className="px-4 py-3">المستلم</th>
                    <th className="px-4 py-3">النوع / التقرير</th>
                    <th className="px-4 py-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {dispatchLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">لا توجد سجلات إرسال سابقة</td>
                    </tr>
                  ) : dispatchLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/20">
                      <td className="px-4 py-3 text-slate-400 font-mono">{formatDate(log.timestamp)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-400">{log.channel}</td>
                      <td className="px-4 py-3 font-bold text-white">{log.recipientName} ({log.recipientContact})</td>
                      <td className="px-4 py-3 text-slate-300">{log.title}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Settings size={20} className="text-purple-400" />
              <span>إعدادات بوابة الواتساب</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">مزود الخدمة (Provider)</label>
                <select 
                  value={gatewaySettings.provider}
                  onChange={(e) => {
                    const prov = e.target.value as any;
                    setGatewaySettings({ ...gatewaySettings, provider: prov });
                    WhatsAppNotificationService.updateSettings({ provider: prov });
                    toast.success('تم تحديث مزود خدمة بوابة الواتساب بنجاح');
                    soundAlerts.playSave();
                  }}
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="WHATSAPP_WEB_DIRECT">WhatsApp Web Direct (مباشر ومجاني لجميع الأجهزة)</option>
                  <option value="META_CLOUD_API">Meta Official WhatsApp Cloud API</option>
                  <option value="ULTRAMSG">UltraMsg Gateway</option>
                  <option value="GREEN_API">Green API Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">رقم هاتف المنظومة الإرسال الافتراضي</label>
                <input 
                  type="text" 
                  value={gatewaySettings.senderPhoneNumber}
                  onChange={(e) => {
                    setGatewaySettings({ ...gatewaySettings, senderPhoneNumber: e.target.value });
                    WhatsAppNotificationService.updateSettings({ senderPhoneNumber: e.target.value });
                  }}
                  onBlur={() => {
                    toast.success('تم حفظ رقم هاتف الإرسال الافتراضي بنجاح');
                    soundAlerts.playSave();
                  }}
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Manager Notification Settings */}
              <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-purple-300 text-sm">👑 توجيه إشعارات الإدارة العليا والمدير العام</h4>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">Background Alert Dispatch</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">رقم واتساب المدير العام / المالك</label>
                    <input 
                      type="text" 
                      value={gatewaySettings.managerPhoneNumber || '01050557853'}
                      onChange={(e) => {
                        setGatewaySettings({ ...gatewaySettings, managerPhoneNumber: e.target.value });
                        WhatsAppNotificationService.updateSettings({ managerPhoneNumber: e.target.value });
                      }}
                      onBlur={() => {
                        toast.success('تم حفظ رقم المدير العام وتأكيد ربطه بالبوابة');
                        soundAlerts.playSave();
                      }}
                      placeholder="01050557853"
                      className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">اسم صفة المدير المستلم</label>
                    <input 
                      type="text" 
                      value={gatewaySettings.managerName || 'المدير العام'}
                      onChange={(e) => {
                        setGatewaySettings({ ...gatewaySettings, managerName: e.target.value });
                        WhatsAppNotificationService.updateSettings({ managerName: e.target.value });
                      }}
                      onBlur={() => {
                        toast.success('تم تعديل مسمى المستلم الإداري وحفظه بنجاح');
                        soundAlerts.playSave();
                      }}
                      placeholder="المدير العام"
                      className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="pt-1 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-bold">
                    <input 
                      type="checkbox" 
                      checked={gatewaySettings.notifyOnShiftClose ?? true}
                      onChange={(e) => {
                        setGatewaySettings({ ...gatewaySettings, notifyOnShiftClose: e.target.checked });
                        WhatsAppNotificationService.updateSettings({ notifyOnShiftClose: e.target.checked });
                        toast.success(e.target.checked ? 'تم تفعيل إشعار تقفيل الوردية التلقائي للمدير' : 'تم إيقاف إشعار تقفيل الوردية للمدير');
                        soundAlerts.playSave();
                      }}
                      className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                    />
                    <span>إرسال إشعار تقفيل الوردية Z-Report تلقائياً إلى واتساب المدير</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-bold">
                    <input 
                      type="checkbox" 
                      checked={gatewaySettings.notifyOnShiftOpen ?? true}
                      onChange={(e) => {
                        setGatewaySettings({ ...gatewaySettings, notifyOnShiftOpen: e.target.checked });
                        WhatsAppNotificationService.updateSettings({ notifyOnShiftOpen: e.target.checked });
                        toast.success(e.target.checked ? 'تم تفعيل إشعار فتح الوردية التلقائي للمدير' : 'تم إيقاف إشعار فتح الوردية للمدير');
                        soundAlerts.playSave();
                      }}
                      className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                    />
                    <span>إشعار فتح وردية كاشير جديدة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-bold">
                    <input 
                      type="checkbox" 
                      checked={gatewaySettings.notifyOnCashierLogin ?? true}
                      onChange={(e) => {
                        setGatewaySettings({ ...gatewaySettings, notifyOnCashierLogin: e.target.checked });
                        WhatsAppNotificationService.updateSettings({ notifyOnCashierLogin: e.target.checked });
                        toast.success(e.target.checked ? 'تم تفعيل إشعار دخول الموظفين والكاشيرز للمدير' : 'تم إيقاف إشعار دخول الموظفين للمدير');
                        soundAlerts.playSave();
                      }}
                      className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                    />
                    <span>تنبيه تسجيل دخول الكاشير والمستخدمين</span>
                  </label>
                </div>

                <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-xl text-[11px] text-blue-200 leading-relaxed">
                  💡 <strong>طريقة العمل الذكية:</strong> جميع التنبيهات الإدارية وتنبيهات الكاشير تُرحل خلفياً إلى رقم المدير العام الموضح أعلاه وسجلات العمليات، دون فتح نوافذ منبثقة أو إزعاج الكاشير أو العميل أثناء استخدام النظام.
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-bold">
                  <input 
                    type="checkbox" 
                    checked={gatewaySettings.autoReplyConfirmation}
                    onChange={(e) => {
                      setGatewaySettings({ ...gatewaySettings, autoReplyConfirmation: e.target.checked });
                      WhatsAppNotificationService.updateSettings({ autoReplyConfirmation: e.target.checked });
                      toast.success(e.target.checked ? 'تم تفعيل الرد التلقائي لتأكيد استلام الطلبيات للتاجر' : 'تم إيقاف الرد التلقائي للتاجر');
                      soundAlerts.playSave();
                    }}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                  />
                  <span>إرسال رد تلقائي بتأكيد استلام الطلبية للتاجر</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PREVIEW & DIRECT TRIGGER ALERT */}
      {/* ========================================================================= */}
      {selectedRuleForPreview && (
        <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-2xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Smartphone size={22} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">{selectedRuleForPreview.rule.title}</h3>
                  <p className="text-xs text-slate-400">معاينة نص الرسالة قبل الإرسال للواتساب</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRuleForPreview(null)}
                className="text-slate-500 hover:text-white text-sm font-bold"
              >
                إغلاق
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* WhatsApp Mock Chat Bubble */}
              <div className="bg-[#0b141a] p-4 rounded-2xl border border-[#1e293b] space-y-2 relative">
                <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  <span>MARO ERP Business Dispatcher</span>
                  <span>الآن</span>
                </div>
                <div className="bg-[#005c4b] text-white p-4 rounded-2xl rounded-tr-none text-xs leading-relaxed whitespace-pre-wrap font-sans select-all">
                  {selectedRuleForPreview.message}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#1e293b]">
                <button
                  onClick={() => handleCopy(selectedRuleForPreview.message)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  <Copy size={16} />
                  <span>{copiedText ? 'تم النسخ!' : 'نسخ نص الرسالة'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRuleForPreview(null)}
                    className="px-5 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-700"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => handleTriggerAlert(selectedRuleForPreview.rule)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 active:scale-95"
                  >
                    <Send size={16} />
                    <span>إرسال فوري الآن للواتساب</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INBOUND ORDER DETAILS & INSTANT CONVERT */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#1e293b] shadow-2xl relative">
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a] sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-amber-400">{selectedOrder.orderNumber}</span>
                  <span className="text-slate-500">•</span>
                  <h3 className="font-black text-lg text-white">{selectedOrder.merchantName}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  هاتف التاجر: {selectedOrder.merchantPhone} | وقت الاستلام: {formatDate(selectedOrder.receivedAt)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-slate-500 hover:text-white text-sm font-bold"
              >
                إغلاق
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Raw message vs Parsed comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0f172a] p-4 rounded-2xl border border-[#1e293b] space-y-2">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-amber-400" />
                    <span>نص رسالة التاجر الواردة (WhatsApp Raw):</span>
                  </span>
                  <div className="p-3 bg-[#0b0f1a] rounded-xl text-xs text-slate-200 whitespace-pre-wrap font-sans border border-slate-800">
                    {selectedOrder.rawMessage}
                  </div>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-2xl border border-[#1e293b] space-y-2">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-400" />
                    <span>نتائج التحليل الذكي ومطابقة المخزون:</span>
                  </span>
                  <div className="p-3 bg-[#0b0f1a] rounded-xl text-xs space-y-2 border border-slate-800">
                    <div className="flex justify-between text-slate-300">
                      <span>عدد الأصناف المطابقة:</span>
                      <span className="font-bold text-emerald-400">{selectedOrder.parsedItems.length} صنف</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>المخزن الموجه للصرف:</span>
                      <span className="font-bold text-blue-400">{selectedOrder.warehouseName || 'المخزن الرئيسي'}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>طريقة الدفع المقترحة:</span>
                      <span className="font-bold text-amber-400">آجل / حساب تاجر</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-3">
                <h4 className="font-black text-white text-sm">تفاصيل الأصناف المحللة والأسعار:</h4>
                <div className="border border-[#1e293b] rounded-2xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#0f172a] text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="px-4 py-3">الصنف والوصف</th>
                        <th className="px-4 py-3">كود SKU</th>
                        <th className="px-4 py-3">الوحدة</th>
                        <th className="px-4 py-3">الكمية</th>
                        <th className="px-4 py-3">سعر الجملة</th>
                        <th className="px-4 py-3">الإجمالي</th>
                        <th className="px-4 py-3">حالة الرصيد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      {selectedOrder.parsedItems.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-bold text-white">{it.productName}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{it.matchedSku}</td>
                          <td className="px-4 py-3 text-slate-300 font-bold">{it.unit}</td>
                          <td className="px-4 py-3 font-black text-white text-sm">{it.quantity}</td>
                          <td className="px-4 py-3 font-mono text-slate-300">{formatCurrency(it.unitPrice)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-400">{formatCurrency(it.subtotal)}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold",
                              it.isStockSufficient ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                            )}>
                              {it.isStockSufficient ? `متوفر (${it.availableStock})` : `عجز بالمخزن`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#0f172a] font-bold">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-left text-slate-400">الإجمالي قبل الضريبة:</td>
                        <td colSpan={2} className="px-4 py-3 font-mono text-white">{formatCurrency(selectedOrder.estimatedUntaxed)}</td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-left text-slate-400">ضريبة القيمة المضافة (14%):</td>
                        <td colSpan={2} className="px-4 py-3 font-mono text-emerald-400">{formatCurrency(selectedOrder.estimatedTax)}</td>
                      </tr>
                      <tr className="text-sm">
                        <td colSpan={5} className="px-4 py-3 text-left text-amber-400">الإجمالي النهائي الشامل:</td>
                        <td colSpan={2} className="px-4 py-3 font-mono font-black text-amber-400 text-base">{formatCurrency(selectedOrder.estimatedGrandTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#1e293b]">
                <button
                  onClick={() => {
                    const msg = `أهلاً بك يا أستاذ ${selectedOrder.merchantName}، جاري مراجعة طلبيتك وسنوافيك بالفاتورة فوراً.`;
                    WhatsAppNotificationService.openWhatsAppDirectly(selectedOrder.merchantPhone, msg);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  <span>محادثة التاجر بالواتساب</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleConvertToPurchaseBill(selectedOrder)}
                    className="px-5 py-2.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-blue-500/30 flex items-center gap-2"
                  >
                    <Truck size={16} />
                    <span>تحويل لأمر شراء / توريد (مورد)</span>
                  </button>

                  <button
                    onClick={() => handleConvertToSalesInvoice(selectedOrder)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/25 active:scale-95 flex items-center gap-2"
                  >
                    <Check size={16} />
                    <span>تحويل فوري لفاتورة مبيعات معتمدة</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INBOUND ORDER SIMULATOR */}
      {/* ========================================================================= */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-2xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">محاكي استقبال طلبيات الواتساب من التجار</h3>
                  <p className="text-xs text-slate-400">اختبار وصول نص طبيعي من تاجر وتحليله بالذكاء الاصطناعي</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSimulatorOpen(false)}
                className="text-slate-500 hover:text-white text-sm font-bold"
              >
                إغلاق
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">نماذج جاهزة للأنشطة التجارية المختلفة:</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('FOOD')}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                      simulatorPreset === 'FOOD' ? "bg-amber-600 text-white border-amber-500" : "bg-[#0f172a] text-slate-400 border-[#1e293b]"
                    )}
                  >
                    بقالة وسوبر ماركت
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('FASHION')}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                      simulatorPreset === 'FASHION' ? "bg-amber-600 text-white border-amber-500" : "bg-[#0f172a] text-slate-400 border-[#1e293b]"
                    )}
                  >
                    أزياء وملابس
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('PHARMACY')}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                      simulatorPreset === 'PHARMACY' ? "bg-amber-600 text-white border-amber-500" : "bg-[#0f172a] text-slate-400 border-[#1e293b]"
                    )}
                  >
                    صيدليات وأدوية
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('PARTS')}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                      simulatorPreset === 'PARTS' ? "bg-amber-600 text-white border-amber-500" : "bg-[#0f172a] text-slate-400 border-[#1e293b]"
                    )}
                  >
                    قطع غيار وورش
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">اسم التاجر / المتجر:</label>
                  <input 
                    type="text" 
                    value={simulatorMerchantName}
                    onChange={(e) => setSimulatorMerchantName(e.target.value)}
                    className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">رقم الواتساب المرسل:</label>
                  <input 
                    type="text" 
                    value={simulatorMerchantPhone}
                    onChange={(e) => setSimulatorMerchantPhone(e.target.value)}
                    className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">نص رسالة الواتساب الواردة:</label>
                <textarea 
                  rows={6}
                  value={simulatorText}
                  onChange={(e) => setSimulatorText(e.target.value)}
                  placeholder="اكتب رسالة التاجر هنا باللغة العربية مع الكميات والوحدات..."
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl p-3 text-white text-xs font-medium focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsSimulatorOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSimulateInboundOrder}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 text-white text-xs font-bold hover:opacity-90 shadow-lg shadow-amber-600/20 active:scale-95 flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>استقبال وتحليل الطلبية فوراً</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CREATE CUSTOM PERIODIC RULE */}
      {/* ========================================================================= */}
      {isNewRuleModalOpen && (
        <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Bell size={22} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">إضافة تنبيه دوري مخصص جديد</h3>
                  <p className="text-xs text-slate-400">جدولة تنبيهات وتقارير تلقائية للمدراء والمسؤولين</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewRuleModalOpen(false)}
                className="text-slate-500 hover:text-white text-sm font-bold"
              >
                إغلاق
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">عنوان التنبيه:</label>
                <input 
                  type="text" 
                  value={newRule.title || ''}
                  onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                  placeholder="مثال: تقرير المبيعات المسائي للمدير العام..."
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">فئة التقرير / التنبيه:</label>
                  <select 
                    value={newRule.category || 'DAILY_SALES_PROFIT'}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value as any })}
                    className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="DAILY_SALES_PROFIT">ملخص المبيعات والسيولة والأرباح اليومية</option>
                    <option value="LOW_STOCK_REPLENISHMENT">نواقص المخزون والحد الأدنى للطلب</option>
                    <option value="CUSTOMER_DEBT_OVERDUE">مديونيات العملاء والتجار المستحقة</option>
                    <option value="CASH_DRAWER_CLOSING">إقفال الوردية وجرد الخزينة (Z-Report)</option>
                    <option value="EXPIRY_DATES_ALERT">تواريخ الصلاحية والتشغيلات المنتهية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">درجة الأهمية:</label>
                  <select 
                    value={newRule.severity || 'HIGH'}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as any })}
                    className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="CRITICAL">أهمية قصوى (حرج جداً)</option>
                    <option value="HIGH">أهمية عالية</option>
                    <option value="MEDIUM">أهمية متوسطة</option>
                    <option value="INFO">إعلامي واعتيادي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">التكرار والجدول الزمني:</label>
                  <select 
                    value={newRule.frequency || 'DAILY_EVENING'}
                    onChange={(e) => setNewRule({ ...newRule, frequency: e.target.value as any })}
                    className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="DAILY_EVENING">يومياً عند إغلاق النشاط (مساءً)</option>
                    <option value="DAILY_MORNING">يومياً قبل بدء العمل (صباحاً)</option>
                    <option value="WEEKLY">أسبوعياً</option>
                    <option value="MONTHLY">شهرياً</option>
                    <option value="REALTIME">فوري ولحظي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">وقت التنبيه المفضل:</label>
                  <input 
                    type="time" 
                    value={newRule.customTime || '22:00'}
                    onChange={(e) => setNewRule({ ...newRule, customTime: e.target.value })}
                    className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">اسم المستلم:</label>
                  <input 
                    type="text" 
                    value={newRule.recipients?.[0]?.name || ''}
                    onChange={(e) => {
                      const recs = [...(newRule.recipients || [{ name: '', phone: '', email: '', role: 'Lead' }])];
                      recs[0] = { ...recs[0], name: e.target.value };
                      setNewRule({ ...newRule, recipients: recs });
                    }}
                    placeholder="المدير العام..."
                    className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">رقم هاتف الواتساب:</label>
                  <input 
                    type="text" 
                    value={newRule.recipients?.[0]?.phone || ''}
                    onChange={(e) => {
                      const recs = [...(newRule.recipients || [{ name: '', phone: '', email: '', role: 'Lead' }])];
                      recs[0] = { ...recs[0], phone: e.target.value };
                      setNewRule({ ...newRule, recipients: recs });
                    }}
                    placeholder="010xxxxxxxx"
                    className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsNewRuleModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newRule.title) return;
                    const ruleId = `rule_${Date.now()}`;
                    const fullRule: PeriodicAlertRule = {
                      id: ruleId,
                      title: newRule.title,
                      category: newRule.category || 'DAILY_SALES_PROFIT',
                      frequency: newRule.frequency || 'DAILY_EVENING',
                      customTime: newRule.customTime || '22:00',
                      severity: newRule.severity || 'HIGH',
                      channels: ['WHATSAPP', 'EMAIL'],
                      targetAudience: newRule.targetAudience || 'GENERAL_MANAGER',
                      recipients: newRule.recipients || [{ name: 'المدير العام', phone: '01000000000', role: 'Manager' }],
                      isActive: true,
                      autoDispatchEnabled: true,
                      notes: 'قاعدة تنبيه مخصصة جديدة'
                    };
                    await WhatsAppNotificationService.savePeriodicRule(fullRule);
                    setIsNewRuleModalOpen(false);
                    showNotificationToast(`تم حفظ وتفعيل قاعدة التنبيه (${fullRule.title}) بنجاح!`);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  حفظ وتفعيل التنبيه
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
