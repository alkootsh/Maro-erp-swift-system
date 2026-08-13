// MARO ERP - USB & Bluetooth Barcode Scanner Interface & Manager
import React, { useState, useEffect } from 'react';
import { 
  Usb, 
  Bluetooth, 
  Barcode, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Volume2, 
  VolumeX, 
  Sliders, 
  History, 
  Zap, 
  Play, 
  Trash2, 
  Info, 
  Scale, 
  Settings,
  ShieldCheck,
  Activity,
  Layers
} from 'lucide-react';
import { usbScannerEngine, ScannerSettings, ScanLogEntry } from '../services/usbScannerEngine';
import { formatCurrency } from '../lib/utils';

interface USBScannerManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const USBScannerBadge: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [status, setStatus] = useState({ connected: true, scanCount: 0 });

  useEffect(() => {
    const unsub = usbScannerEngine.subscribeStatus((st) => {
      setStatus({ connected: st.connected, scanCount: st.scanCount });
    });
    return unsub;
  }, []);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-[#151b2b] hover:bg-slate-800 border border-emerald-500/30 rounded-xl text-xs font-bold text-slate-200 transition-all hover:scale-105 active:scale-95 group shadow-sm"
      title="إدارة ماسح الباركود USB / Bluetooth"
    >
      <div className="relative flex items-center justify-center">
        <Usb size={15} className="text-emerald-400 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
      </div>
      <span className="hidden sm:inline text-emerald-400">ماسح الباركود USB/BT</span>
      {status.scanCount > 0 && (
        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md text-[10px] font-black">
          {status.scanCount}
        </span>
      )}
    </button>
  );
};

export const USBScannerModal: React.FC<USBScannerManagerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'SANDBOX' | 'SETTINGS' | 'HARDWARE'>('SANDBOX');
  const [settings, setSettings] = useState<ScannerSettings>(usbScannerEngine.getSettings());
  const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>(usbScannerEngine.getScanLogs());
  const [testInput, setTestInput] = useState<string>('');
  const [webHidStatus, setWebHidStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsubStatus = usbScannerEngine.subscribeStatus(() => {
      setScanLogs(usbScannerEngine.getScanLogs());
    });

    return unsubStatus;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSettingChange = (key: keyof ScannerSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    usbScannerEngine.saveSettings(updated);
  };

  const handleSimulateScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testInput.trim()) return;
    usbScannerEngine.processRawBarcode(testInput, 18);
    setTestInput('');
  };

  const handlePairWebHID = async () => {
    setWebHidStatus('جاري البحث عن أجهزة USB HID...');
    const success = await usbScannerEngine.requestWebHIDPairing();
    if (success) {
      setWebHidStatus('تم الاقتران المباشر مع ماسح USB بنجاح!');
    } else {
      setWebHidStatus('لم يتم اختيار جهاز أو أن المتصفح لا يدعم WebHID. يعمل الماسح تلقائياً عبر لمح لوحة المفاتيح HID.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right" dir="rtl">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-gradient-to-r from-[#131b2e] to-[#0f172a]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Barcode size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">إدارة واجهة ماسحات الباركود السريعة</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  نشط ومعاير (USB / Bluetooth)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                دعم الإدخال الفائق للماسحات الليزرية والـ 2D مع معالجة فواتير الميزان وإشعارات الصوت اللحظية
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1e293b] bg-[#151b2b] px-6 gap-2">
          <button
            onClick={() => setActiveTab('SANDBOX')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'SANDBOX'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity size={16} />
            اختبار المسح المباشر والسجل
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'SETTINGS'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders size={16} />
            إعدادات السرعة والصوت
          </button>

          <button
            onClick={() => setActiveTab('HARDWARE')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'HARDWARE'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Usb size={16} />
            ربط العتاد (WebHID / Bluetooth)
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: SANDBOX & TEST LOGS */}
          {activeTab === 'SANDBOX' && (
            <div className="space-y-6">
              
              {/* Scan Test Box */}
              <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Zap size={16} className="text-amber-400" />
                    منصة قراءة واختبار الباركود الحية:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => usbScannerEngine.playBeep('SUCCESS')}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold rounded-lg transition-colors"
                    >
                      تجربة صوت النجاح
                    </button>
                    <button
                      type="button"
                      onClick={() => usbScannerEngine.playBeep('SCALE')}
                      className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[11px] font-bold rounded-lg transition-colors"
                    >
                      صوت باركود الميزان
                    </button>
                    <button
                      type="button"
                      onClick={() => usbScannerEngine.playBeep('ERROR')}
                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold rounded-lg transition-colors"
                    >
                      صوت الخطأ
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSimulateScan} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="قم بمسح الباركود باستخدام الماسح أو اكتب الباركود لاختباره..."
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="flex-1 px-4 py-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-sm"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <Play size={16} />
                    اختبار المسح
                  </button>
                </form>
                <p className="text-[11px] text-slate-500">
                  ملاحظة: يمكنك توجيه ماسح الباركود الـ USB أو البلوتوث مباشرة نحو الشاشة ليمسح أي صنف بدون الحاجة للنقر على حقل الإدخال!
                </p>
              </div>

              {/* Scan History Log */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <History size={16} className="text-blue-400" />
                    سجل العمليات الممسوحة مؤخراً ({scanLogs.length})
                  </h3>
                  {scanLogs.length > 0 && (
                    <button
                      onClick={() => usbScannerEngine.clearScanLogs()}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={14} />
                      مسح السجل
                    </button>
                  )}
                </div>

                {scanLogs.length === 0 ? (
                  <div className="bg-[#151b2b] p-8 rounded-2xl border border-[#1e293b] text-center space-y-2">
                    <Barcode size={32} className="mx-auto text-slate-600 animate-bounce" />
                    <p className="text-slate-400 text-sm font-bold">لم يتم مسح أي باركود حتى الآن</p>
                    <p className="text-slate-500 text-xs">قم بمسح أي صنف باستخدام ماسح الـ USB أو دخل الباركود في حقل الاختبار أعلاه.</p>
                  </div>
                ) : (
                  <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-900/60 text-slate-400 font-bold uppercase border-b border-[#1e293b]">
                          <tr>
                            <th className="p-3">الباركود الخام</th>
                            <th className="p-3">النوع والتنسيق</th>
                            <th className="p-3">اسم المنتج / الكمية</th>
                            <th className="p-3">سرعة الإدخال</th>
                            <th className="p-3">الحالة</th>
                            <th className="p-3">الوقت</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e293b]">
                          {scanLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 font-mono text-emerald-400 font-bold">
                                {log.rawBarcode}
                              </td>
                              <td className="p-3 text-slate-300">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold">
                                  {log.parsedResult.type}
                                </span>
                              </td>
                              <td className="p-3 text-white font-medium">
                                {log.parsedResult.product ? (
                                  <div>
                                    <span>{log.parsedResult.product.name}</span>
                                    {log.parsedResult.isScaleBarcode && (
                                      <span className="mr-2 text-xs text-blue-400 font-bold">
                                        ({log.parsedResult.quantity} كجم / وحدة)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-rose-400 font-bold">غير مسجل بالمنظومة</span>
                                )}
                              </td>
                              <td className="p-3 text-slate-400 font-mono">
                                {log.scanDurationMs} ms
                              </td>
                              <td className="p-3">
                                {log.status === 'SUCCESS' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px] font-bold">
                                    <CheckCircle2 size={12} />
                                    تم التناول
                                  </span>
                                )}
                                {log.status === 'SCALE_ITEM' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold">
                                    <Scale size={12} />
                                    ميزان إلكتروني
                                  </span>
                                )}
                                {log.status === 'NOT_FOUND' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded text-[10px] font-bold">
                                    <AlertTriangle size={12} />
                                    صنف مفقود
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-slate-500 font-mono text-[11px]">
                                {log.timestamp}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: SETTINGS & CALIBRATION */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Latency Threshold */}
                <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      <Zap size={16} className="text-emerald-400" />
                      عتبة المهلة بين الأحرف (Max Latency):
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {settings.maxInterKeyDelayMs} ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="100"
                    step="5"
                    value={settings.maxInterKeyDelayMs}
                    onChange={(e) => handleSettingChange('maxInterKeyDelayMs', Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    المهلة القصوى بالمللي ثانية بين الضغطات لتمييز ماسح الباركود السريع عن الكتابة اليدوية. القيمة الموصى بها لماسحات USB هي 40-50ms.
                  </p>
                </div>

                {/* Audio Beep Settings */}
                <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      {settings.audioBeepEnabled ? <Volume2 size={16} className="text-blue-400" /> : <VolumeX size={16} className="text-slate-500" />}
                      التنبيهات الصوتية الحية (Beep Sound):
                    </label>
                    <button
                      onClick={() => handleSettingChange('audioBeepEnabled', !settings.audioBeepEnabled)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        settings.audioBeepEnabled
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {settings.audioBeepEnabled ? 'مفعل' : 'معطل'}
                    </button>
                  </div>

                  {settings.audioBeepEnabled && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>مستوى الصوت:</span>
                        <span className="font-mono text-blue-400 font-bold">{Math.round(settings.beepVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={settings.beepVolume}
                        onChange={(e) => handleSettingChange('beepVolume', Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400">
                    يعزز استجابة الكاشير بصوت تأكيد عالي الدقة بدون الحاجة للنظر للشاشة عند كل صنف.
                  </p>
                </div>

              </div>

              {/* Scale & General Toggles */}
              <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] space-y-4">
                <h4 className="text-xs font-bold text-slate-200 border-b border-[#1e293b] pb-2">
                  خيارات معالجة التنسيقات المتقدمة
                </h4>

                <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
                  <div>
                    <p className="text-xs font-bold text-white">التقاط وتحليل باركود الميزان الإلكتروني تلقائياً</p>
                    <p className="text-[11px] text-slate-400">يدعم الباركودات البادئة بـ (21 - 22 - 27) لاستخراج الوزن والسعر المضمن فوراُ.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoAddScaleItems}
                    onChange={(e) => handleSettingChange('autoAddScaleItems', e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-bold text-white">تنظيف زوائد التحكم (Strip Control Chars)</p>
                    <p className="text-[11px] text-slate-400">تصفية رموز التحكم البادئة والناهية (STX, ETX, CR, LF) تلقائياً قبل القراءة.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.stripPrefixSuffix}
                    onChange={(e) => handleSettingChange('stripPrefixSuffix', e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: HARDWARE CONNECTIONS */}
          {activeTab === 'HARDWARE' && (
            <div className="space-y-6">
              
              <div className="bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/20 p-6 rounded-2xl space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Usb size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">اقتران عتاد USB المباشر (WebHID API)</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      يسمح الربط المباشر بطلب الوصول إلى ماسحات الـ USB بالكامل لمنع تداخل الأحرف مع واجهات الإدخال الأخرى في المتصفح.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handlePairWebHID}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                  >
                    <Usb size={16} />
                    ربط جهاز USB جديد عبر WebHID
                  </button>

                  {webHidStatus && (
                    <p className="text-xs font-bold text-amber-400 mt-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                      {webHidStatus}
                    </p>
                  )}
                </div>
              </div>

              {/* Bluetooth Guidance */}
              <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b] space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Bluetooth size={18} />
                  تعليمات ماسحات البلوتوث (Bluetooth Scanners)
                </div>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                  <li>قم باقتران ماسح البلوتوث مع جهاز الكمبيوتر/التابلت كجهاز إدخال (HID Keyboard Mode).</li>
                  <li>بمجرد الاقتران، يقوم النظام بالتقاط القراءات تلقائياً وإضافتها للفاتورة الحالية بسرعة متناهية.</li>
                  <li>تأكد من اختيار وضع السلسلة الزُمنية المرتفعة (Fast Carriage Return) من دليل تشغيل الماسح.</li>
                </ul>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1e293b] bg-[#151b2b] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>محرك الباركود الفائق - متوافق مع كافة ماسحات USB و Bluetooth و GS1</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
