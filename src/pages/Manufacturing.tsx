import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  Layers, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Package, 
  Wrench, 
  DollarSign, 
  ArrowRight, 
  Boxes, 
  Cpu, 
  Search, 
  Check, 
  Sparkles,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { BillOfMaterials, WorkOrder, BOMComponent, ProductionOperation } from '../types/manufacturing';
import { ManufacturingRepository } from '../repositories/manufacturingRepository';
import { ProductRepository } from '../repositories/productRepository';
import { formatCurrency, cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

export const Manufacturing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'boms' | 'mrp'>('orders');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [boms, setBOMs] = useState<BillOfMaterials[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [isNewWOModalOpen, setIsNewWOModalOpen] = useState(false);
  const [isNewBOMModalOpen, setIsNewBOMModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for New Work Order
  const [selectedBOMId, setSelectedBOMId] = useState('');
  const [woPlannedQty, setWoPlannedQty] = useState(1);
  const [woManager, setWoManager] = useState('مدير الإنتاج');
  const [woDueDate, setWoDueDate] = useState('');

  // Form states for New BOM
  const [bomName, setBomName] = useState('');
  const [bomFinishedProduct, setBomFinishedProduct] = useState('');
  const [bomYieldQty, setBomYieldQty] = useState(1);
  const [bomUnit, setBomUnit] = useState('قطعة');
  const [bomComponents, setBomComponents] = useState<BOMComponent[]>([]);
  const [bomOperations, setBomOperations] = useState<ProductionOperation[]>([]);

  // Refresh data
  const loadData = () => {
    const loadedBoms = ManufacturingRepository.getBOMs();
    const loadedWos = ManufacturingRepository.getWorkOrders();
    const loadedProds = ProductRepository.getProducts();
    setBOMs(loadedBoms);
    setWorkOrders(loadedWos);
    setProducts(loadedProds);
    if (loadedBoms.length > 0 && !selectedBOMId) {
      setSelectedBOMId(loadedBoms[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const unsubBoms = MaroSyncEngine.subscribe('boms', () => loadData());
    const unsubWos = MaroSyncEngine.subscribe('work_orders', () => loadData());
    return () => {
      unsubBoms();
      unsubWos();
    };
  }, []);

  // Handle Complete Work Order
  const handleCompleteWO = (woId: string) => {
    try {
      const wo = workOrders.find(w => w.id === woId);
      if (!wo) return;
      ManufacturingRepository.completeWorkOrder(woId, wo.plannedQuantity, 0);
      toast.success(`تم استلام الإنتاج التام لأمر الشغل ${wo.orderNumber} وتحديث المخزون والقيود المحاسبية بنجاح`);
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ أثناء إتمام أمر التشغيل');
    }
  };

  // Handle Create Work Order
  const handleCreateWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBOM = boms.find(b => b.id === selectedBOMId);
    if (!targetBOM) {
      toast.error('يرجى اختيار قائمة مواد التصنيع (BOM)');
      return;
    }
    ManufacturingRepository.createWorkOrderFromBOM(
      targetBOM,
      Number(woPlannedQty) || 1,
      'w1',
      'w1',
      woManager,
      woDueDate
    );
    toast.success('تم إصدار أمر التصنيع بنجاح');
    setIsNewWOModalOpen(false);
    loadData();
  };

  // Handle Add Component to BOM Draft
  const handleAddComponentToBOM = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    const newComp: BOMComponent = {
      id: `cmp_${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku || prod.barcode || 'RAW-00',
      unitName: 'قطعة',
      quantityRequired: 1,
      scrapPercentage: 0,
      unitCost: prod.costPrice || prod.price || 100,
      totalCost: prod.costPrice || prod.price || 100
    };
    setBomComponents(prev => [...prev, newComp]);
  };

  // Handle Add Operation to BOM Draft
  const handleAddOperationToBOM = () => {
    const seq = bomOperations.length + 1;
    const newOp: ProductionOperation = {
      id: `op_${Date.now()}`,
      sequence: seq,
      operationName: `مرحلة التشغيل رقم #${seq}`,
      workCenterName: 'خط الإنتاج الرئيسي',
      estimatedDurationHours: 1,
      hourlyRate: 80,
      overheadCost: 20,
      totalCost: 100
    };
    setBomOperations(prev => [...prev, newOp]);
  };

  // Save new BOM
  const handleSaveBOM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomName || !bomFinishedProduct) {
      toast.error('يرجى كتابة اسم القائمة واختيار المنتج التام');
      return;
    }
    const finished = products.find(p => p.id === bomFinishedProduct);
    const matCost = bomComponents.reduce((acc, c) => acc + c.totalCost, 0);
    const labCost = bomOperations.reduce((acc, o) => acc + (o.estimatedDurationHours * o.hourlyRate), 0);
    const ovhCost = bomOperations.reduce((acc, o) => acc + o.overheadCost, 0);
    const totalUnitCost = (matCost + labCost + ovhCost) / (bomYieldQty || 1);

    const newBom: BillOfMaterials = {
      id: `bom_${Date.now()}`,
      bomCode: `BOM-2026-${(boms.length + 1).toString().padStart(3, '0')}`,
      name: bomName,
      finishedProductId: bomFinishedProduct,
      finishedProductName: finished?.name || 'منتج تام',
      finishedProductSku: finished?.sku || 'PROD-FG',
      yieldQuantity: bomYieldQty,
      unitName: bomUnit,
      status: 'ACTIVE',
      components: bomComponents,
      operations: bomOperations,
      materialCost: matCost,
      laborCost: labCost,
      overheadCost: ovhCost,
      totalUnitCost,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    ManufacturingRepository.saveBOM(newBom);
    toast.success('تم حفظ قائمة مواد التصنيع بنجاح');
    setIsNewBOMModalOpen(false);
    loadData();
  };

  // KPIs
  const totalWOs = workOrders.length;
  const inProgressWOs = workOrders.filter(w => w.status === 'IN_PROGRESS' || w.status === 'RELEASED').length;
  const completedWOs = workOrders.filter(w => w.status === 'COMPLETED').length;
  const totalProductionValuation = workOrders.reduce((acc, w) => acc + w.totalCost, 0);

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Factory size={26} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">إدارة التصنيع والإنتاج (Manufacturing & MRP)</h2>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">قوائم المواد (BOM)، أوامر التشغيل، تتبع مراحل الإنتاج، وتكلفة المنتجات التامة</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsNewBOMModalOpen(true)}
            className="flex items-center gap-2 bg-[#151b2b] border border-[#1e293b] text-slate-200 hover:text-white px-4 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors text-xs"
          >
            <Layers size={16} className="text-blue-400" />
            <span>قائمة مواد جديدة (BOM)</span>
          </button>

          <button 
            onClick={() => setIsNewWOModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-5 py-2.5 rounded-xl font-bold hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20 text-xs"
          >
            <Plus size={16} />
            <span>إصدار أمر تصنيع (Work Order)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي أوامر التصنيع</span>
            <Factory className="text-amber-400" size={20} />
          </div>
          <div className="text-2xl font-black text-white">{totalWOs}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-semibold">أوامر الإنتاج المسجلة بالنظام</div>
        </div>

        <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">قيد التشغيل بالمصنع</span>
            <Clock className="text-blue-400" size={20} />
          </div>
          <div className="text-2xl font-black text-blue-400">{inProgressWOs}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-semibold">خطوط إنتاج نشطة حالياً</div>
        </div>

        <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">الإنتاج التام المكتمل</span>
            <CheckCircle2 className="text-emerald-400" size={20} />
          </div>
          <div className="text-2xl font-black text-emerald-400">{completedWOs}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-semibold">جاهز للتسليم أو التخزين</div>
        </div>

        <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي قيمة تكلفة التصنيع</span>
            <DollarSign className="text-amber-400" size={20} />
          </div>
          <div className="text-2xl font-black text-amber-400">{formatCurrency(totalProductionValuation)}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-semibold">مواد خام + عمالة + مصاريف</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-2 bg-[#151b2b] p-1.5 rounded-xl border border-[#1e293b]">
          <button 
            onClick={() => setActiveTab('orders')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === 'orders' ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" : "text-slate-400 hover:text-white"
            )}
          >
            <Factory size={16} />
            <span>أوامر التشغيل والإنتاج ({workOrders.length})</span>
          </button>

          <button 
            onClick={() => setActiveTab('boms')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === 'boms' ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" : "text-slate-400 hover:text-white"
            )}
          >
            <Layers size={16} />
            <span>قوائم مواد التصنيع BOM ({boms.length})</span>
          </button>

          <button 
            onClick={() => setActiveTab('mrp')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === 'mrp' ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" : "text-slate-400 hover:text-white"
            )}
          >
            <Boxes size={16} />
            <span>تخطيط الاحتياجات (MRP & المواد الخام)</span>
          </button>
        </div>

        <div className="relative w-64">
          <input 
            type="text" 
            placeholder="بحث بالرقم أو المنتج..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pl-8"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
        </div>
      </div>

      {/* Main Content Areas */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#0f172a] text-slate-400 border-b border-[#1e293b] font-bold">
                    <th className="py-3.5 px-4">رقم الأمر</th>
                    <th className="py-3.5 px-4">المنتج التام</th>
                    <th className="py-3.5 px-4">قائمة التصنيع BOM</th>
                    <th className="py-3.5 px-4 text-center">الكمية المخططة</th>
                    <th className="py-3.5 px-4 text-center">المنفذ</th>
                    <th className="py-3.5 px-4">مراحل الإنتاج والتشغيل</th>
                    <th className="py-3.5 px-4">إجمالي التكلفة</th>
                    <th className="py-3.5 px-4">الحالة</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] font-semibold text-slate-200">
                  {workOrders
                    .filter(wo => wo.orderNumber.includes(searchQuery) || wo.finishedProductName.includes(searchQuery))
                    .map((wo) => {
                      const completedStages = wo.stages.filter(s => s.status === 'COMPLETED').length;
                      const progressPct = Math.round((completedStages / (wo.stages.length || 1)) * 100);

                      return (
                        <tr key={wo.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{wo.orderNumber}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{wo.finishedProductName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{wo.finishedProductSku}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{wo.bomName}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-white">{wo.plannedQuantity}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-emerald-400">{wo.producedQuantity}</td>
                          <td className="py-3.5 px-4 min-w-[180px]">
                            <div className="flex items-center justify-between text-[10px] mb-1 text-slate-400">
                              <span>المرحلة ({completedStages}/{wo.stages.length})</span>
                              <span>{progressPct}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500" 
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-black text-amber-400">{formatCurrency(wo.totalCost)}</td>
                          <td className="py-3.5 px-4">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                              wo.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              wo.status === 'IN_PROGRESS' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                              "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            )}>
                              {wo.status === 'COMPLETED' ? 'مكتمل وتام' : wo.status === 'IN_PROGRESS' ? 'قيد التشغيل' : 'مجهز للتنفيذ'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {wo.status !== 'COMPLETED' ? (
                              <button 
                                onClick={() => handleCompleteWO(wo.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
                              >
                                <Check size={14} />
                                <span>إتمام وتخزين</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-bold">تم الإدخال للمخزن</span>
                            )}
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

      {activeTab === 'boms' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {boms.map((bom) => (
            <div key={bom.id} className="bg-[#151b2b] rounded-2xl border border-[#1e293b] p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{bom.bomCode}</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">نشط (v{bom.version})</span>
                  </div>
                  <h3 className="font-bold text-base text-white mt-1.5">{bom.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">المنتج التام الناتج: <span className="font-bold text-slate-200">{bom.finishedProductName}</span> (الكمية: {bom.yieldQuantity} {bom.unitName})</p>
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-slate-500 font-bold">تكلفة الوحدة التامة</div>
                  <div className="text-lg font-black text-amber-400">{formatCurrency(bom.totalUnitCost)}</div>
                </div>
              </div>

              {/* Components List */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Package size={14} className="text-blue-400" />
                  <span>المكونات والمواد الخام المطلوبة ({bom.components.length})</span>
                </h4>
                <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-3 divide-y divide-[#1e293b] text-xs">
                  {bom.components.map((c) => (
                    <div key={c.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{c.productName}</div>
                        <div className="text-[10px] text-slate-500">الكمية: {c.quantityRequired} {c.unitName} {c.scrapPercentage > 0 && `(هالك: ${c.scrapPercentage}%)`}</div>
                      </div>
                      <div className="font-black text-slate-300">{formatCurrency(c.totalCost)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operations */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Wrench size={14} className="text-amber-400" />
                  <span>مراحل الإنتاج والتشغيل ({bom.operations.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {bom.operations.map((op) => (
                    <div key={op.id} className="bg-[#0f172a] p-2.5 rounded-xl border border-[#1e293b]">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                        <span>#{op.sequence}</span>
                        <span>{op.operationName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">{op.workCenterName} • {op.estimatedDurationHours} ساعة</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs">
                <div className="text-slate-400 font-bold">
                  مواد خام: {formatCurrency(bom.materialCost)} | تشغيل: {formatCurrency(bom.laborCost + bom.overheadCost)}
                </div>
                <button 
                  onClick={() => {
                    setSelectedBOMId(bom.id);
                    setIsNewWOModalOpen(true);
                  }}
                  className="bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30 px-3 py-1.5 rounded-lg font-bold transition-all inline-flex items-center gap-1.5"
                >
                  <Play size={14} />
                  <span>بدء أمر تشغيل</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'mrp' && (
        <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">تحليل الاحتياجات وتوفر المواد الخام بالمخازن (MRP Analysis)</h3>
              <p className="text-xs text-slate-400 mt-0.5">مقارنة الكميات المطلوبة في أوامر التشغيل المفتوحة مع الأرصدة الحالية في المخزن</p>
            </div>
            <button 
              onClick={() => toast.success('تم تحديث فحص المخزون والاحتياجات')}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold"
            >
              <RefreshCw size={14} />
              <span>إعادة الفحص</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#0f172a] text-slate-400 border-b border-[#1e293b] font-bold">
                  <th className="py-3 px-4">المادة الخام</th>
                  <th className="py-3 px-4">رمز الصنف SKU</th>
                  <th className="py-3 px-4 text-center">الرصيد المتاح بالمخزن</th>
                  <th className="py-3 px-4 text-center">المطلوب للإنتاج الحالي</th>
                  <th className="py-3 px-4 text-center">حالة التوفر</th>
                  <th className="py-3 px-4 text-center">الإجراء الموصى به</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] font-semibold text-slate-200">
                {products.slice(0, 8).map((p) => {
                  const required = 10;
                  const available = p.stock || 25;
                  const isShortage = available < required;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{p.sku || p.barcode || 'RAW-MAT'}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-300">{available} وحدة</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-400">{required} وحدة</td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                          isShortage ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        )}>
                          {isShortage ? 'عجز في المخزون' : 'متوفر ومغطي للإنتاج'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isShortage ? (
                          <button 
                            onClick={() => toast.success(`تم إنشاء طلب شراء للمورد للصنف: ${p.name}`)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold"
                          >
                            طلب شراء فوري
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold">جاهز للصرف لخط الإنتاج</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Work Order */}
      {isNewWOModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Factory size={20} className="text-amber-500" />
                <span>إصدار أمر تصنيع وتشغيل جديد</span>
              </h3>
              <button onClick={() => setIsNewWOModalOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">اختر قائمة مواد التصنيع (BOM) *</label>
                <select 
                  value={selectedBOMId} 
                  onChange={(e) => setSelectedBOMId(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-500"
                  required
                >
                  {boms.map(b => (
                    <option key={b.id} value={b.id}>{b.bomCode} - {b.name} (تكلفة: {formatCurrency(b.totalUnitCost)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">الكمية المطلوبة للإنتاج *</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={woPlannedQty} 
                    onChange={(e) => setWoPlannedQty(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">المسؤول / المهندس</label>
                  <input 
                    type="text" 
                    value={woManager} 
                    onChange={(e) => setWoManager(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1.5">تاريخ التسليم المتوقع</label>
                <input 
                  type="date" 
                  value={woDueDate} 
                  onChange={(e) => setWoDueDate(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsNewWOModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-md shadow-amber-600/20"
                >
                  إصدار أمر التشغيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New BOM */}
      {isNewBOMModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers size={20} className="text-amber-500" />
                <span>إنشاء قائمة مواد تصنيع جديدة (Bill of Materials)</span>
              </h3>
              <button onClick={() => setIsNewBOMModalOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveBOM} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">اسم قائمة التصنيع *</label>
                  <input 
                    type="text" 
                    placeholder="مثال: تجميع عصير برتقال طبيعي 1 لتر"
                    value={bomName} 
                    onChange={(e) => setBomName(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">المنتج التام النهائي *</label>
                  <select 
                    value={bomFinishedProduct}
                    onChange={(e) => setBomFinishedProduct(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                    required
                  >
                    <option value="">-- اختر المنتج التام --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku || p.barcode || 'PROD'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Components */}
              <div className="bg-[#0f172a] p-4 rounded-xl border border-[#1e293b] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">المكونات والمواد الخام</h4>
                  <div className="flex items-center gap-2">
                    <select 
                      id="comp-select"
                      className="bg-[#151b2b] border border-[#1e293b] rounded-lg px-2 py-1 text-slate-300 text-[11px]"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddComponentToBOM(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">+ أضف مادة خام...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {bomComponents.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-3">لم يتم إضافة مواد خام بعد</p>
                ) : (
                  <div className="space-y-2">
                    {bomComponents.map((c, idx) => (
                      <div key={c.id} className="flex items-center justify-between bg-[#151b2b] p-2.5 rounded-lg border border-[#1e293b]">
                        <span className="font-bold text-white">{c.productName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">الكمية: {c.quantityRequired}</span>
                          <span className="font-black text-amber-400">{formatCurrency(c.totalCost)}</span>
                          <button 
                            type="button" 
                            onClick={() => setBomComponents(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Operations */}
              <div className="bg-[#0f172a] p-4 rounded-xl border border-[#1e293b] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">مراحل الإنتاج والتشغيل</h4>
                  <button 
                    type="button"
                    onClick={handleAddOperationToBOM}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                  >
                    + إضافة مرحلة تشغيل
                  </button>
                </div>

                {bomOperations.map((op, idx) => (
                  <div key={op.id} className="flex items-center justify-between bg-[#151b2b] p-2.5 rounded-lg border border-[#1e293b]">
                    <div>
                      <span className="font-bold text-white">#{op.sequence} {op.operationName}</span>
                      <span className="text-[10px] text-slate-500 mr-2">({op.workCenterName})</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setBomOperations(prev => prev.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-300 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsNewBOMModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-md shadow-amber-600/20"
                >
                  حفظ قائمة المواد BOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
