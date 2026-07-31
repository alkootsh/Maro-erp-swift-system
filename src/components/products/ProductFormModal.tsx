// MARO ERP - Comprehensive Product Master Form Modal
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Package, 
  Layers, 
  Barcode, 
  Building2, 
  DollarSign, 
  Calendar, 
  Image as ImageIcon,
  Paperclip,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { ProductMaster, ProductUnit, ProductBarcode, WarehouseStockItem, ProductPriceListItem, ProductBatch, ProductImage, ProductAttachment, ProductCategory, ProductGroup, Brand, Manufacturer } from '../../types/productMaster';
import { ProductService } from '../../services/productService';
import { ProductRepository } from '../../repositories/productRepository';
import { toast } from 'react-hot-toast';

import { QuickAddModal } from './QuickAddModal';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: ProductMaster | null;
  categories: ProductCategory[];
  groups: ProductGroup[];
  brands: Brand[];
  manufacturers: Manufacturer[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  categories,
  groups,
  brands,
  manufacturers
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'units' | 'barcodes' | 'warehouses' | 'pricelists' | 'batches' | 'media' | 'inventory_advanced' | 'accounting'>('general');

  const [loading, setLoading] = useState(false);

  // Core Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [category, setCategory] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [reorderLevel, setReorderLevel] = useState<number>(5);
  const [isTaxable, setIsTaxable] = useState(true);
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active');


  // Extended Phase 2 States
  const [nameArabic, setNameArabic] = useState('');
  const [nameEnglish, setNameEnglish] = useState('');
  const [shortName, setShortName] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [model, setModel] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [preferredSupplierId, setPreferredSupplierId] = useState('');
  const [salesRepresentativeId, setSalesRepresentativeId] = useState('');
  const [notes, setNotes] = useState('');
  
  const [mainGroupId, setMainGroupId] = useState('');
  const [subGroupId, setSubGroupId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [season, setSeason] = useState('');
  const [productType, setProductType] = useState<'standard' | 'service' | 'combo' | 'raw_material'>('standard');
  
  const [safetyStock, setSafetyStock] = useState<number>(0);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(0);
  const [stockPolicy, setStockPolicy] = useState<'fifo' | 'lifo' | 'weighted_average'>('fifo');
  const [batchTracking, setBatchTracking] = useState(false);
  const [expiryTracking, setExpiryTracking] = useState(false);
  const [serialNumberTracking, setSerialNumberTracking] = useState(false);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [maxStockLevel, setMaxStockLevel] = useState<number>(0);
  
  const [allowFraction, setAllowFraction] = useState(false);
  
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [distributorPrice, setDistributorPrice] = useState<number>(0);
  const [vipPrice, setVipPrice] = useState<number>(0);
  const [maximumDiscountPercent, setMaximumDiscountPercent] = useState<number>(0);
  const [minimumMarginPercent, setMinimumMarginPercent] = useState<number>(0);
  const [taxIncluded, setTaxIncluded] = useState(false);
  
  const [inventoryAccount, setInventoryAccount] = useState('');
  const [salesAccount, setSalesAccount] = useState('');
  const [purchaseAccount, setPurchaseAccount] = useState('');
  const [cogsAccount, setCogsAccount] = useState('');
  const [vatAccount, setVatAccount] = useState('');
  const [costCenter, setCostCenter] = useState('');
  
  
  const [gs1Code, setGs1Code] = useState("");
  const [etaCode, setEtaCode] = useState('');

  const [gtin, setGtin] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [zatcaCode, setZatcaCode] = useState('');

  // Rich Lists
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [barcodes, setBarcodes] = useState<ProductBarcode[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStockItem[]>([]);
  const [priceLists, setPriceLists] = useState<ProductPriceListItem[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [attachments, setAttachments] = useState<ProductAttachment[]>([]);

  // Local Form Inputs for array items
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitSymbol, setNewUnitSymbol] = useState('');
  const [newUnitFactor, setNewUnitFactor] = useState(1);
  const [newUnitBarcode, setNewUnitBarcode] = useState('');

  const [newBarcodeCode, setNewBarcodeCode] = useState('');
  const [newBarcodeType, setNewBarcodeType] = useState<'EAN13' | 'UPC' | 'CODE128' | 'CUSTOM'>('EAN13');

  const [newWhName, setNewWhName] = useState('المخزن الرئيسي');
  const [newWhQty, setNewWhQty] = useState(0);

  const [newPlName, setNewPlName] = useState('جملة');
  const [newPlPrice, setNewPlPrice] = useState(0);

  const [newBatchNo, setNewBatchNo] = useState('');
  const [newBatchMfg, setNewBatchMfg] = useState('');
  const [newBatchExp, setNewBatchExp] = useState('');
  const [newBatchQty, setNewBatchQty] = useState(0);

  const [newImageUrl, setNewImageUrl] = useState('');

  const [quickAddType, setQuickAddType] = useState<'category' | 'group' | 'brand' | 'manufacturer' | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || '');
      setSku(editingProduct.sku || '');
      setDescription(editingProduct.description || '');
      setPrice(editingProduct.price || 0);
      setCostPrice(editingProduct.costPrice || 0);
      setQuantity(editingProduct.quantity || 0);
      setCategory(editingProduct.category || '');
      setCategoryId(editingProduct.categoryId || '');
      setGroupId(editingProduct.groupId || '');
      setBrandId(editingProduct.brandId || '');
      setManufacturerId(editingProduct.manufacturerId || '');
      setReorderLevel(editingProduct.reorderLevel || 5);
      setIsTaxable(editingProduct.isTaxable !== false);
      setStatus(editingProduct.status || 'active');

      setUnits(editingProduct.units || []);
      setBarcodes(editingProduct.barcodes || []);
      setWarehouseStocks(editingProduct.warehouseStocks || []);
      setPriceLists(editingProduct.priceLists || []);
      setBatches(editingProduct.batches || []);
      setImages(editingProduct.images || []);
      setAttachments(editingProduct.attachments || []);

      setNameArabic(editingProduct.nameArabic || '');
      setNameEnglish(editingProduct.nameEnglish || '');
      setShortName(editingProduct.shortName || '');
      setCountryOfOrigin(editingProduct.countryOfOrigin || '');
      setModel(editingProduct.model || '');
      setSupplierId(editingProduct.supplierId || '');
      setPreferredSupplierId(editingProduct.preferredSupplierId || '');
      setSalesRepresentativeId(editingProduct.salesRepresentativeId || '');
      setNotes(editingProduct.notes || '');
      
      setMainGroupId(editingProduct.mainGroupId || '');
      setSubGroupId(editingProduct.subGroupId || '');
      setDepartmentId(editingProduct.departmentId || '');
      setSeason(editingProduct.season || '');
      setProductType(editingProduct.productType || 'standard');
      
      setSafetyStock(editingProduct.safetyStock || 0);
      setLeadTimeDays(editingProduct.leadTimeDays || 0);
      setStockPolicy(editingProduct.stockPolicy || 'fifo');
      setBatchTracking(editingProduct.batchTracking || false);
      setExpiryTracking(editingProduct.expiryTracking || false);
      setSerialNumberTracking(editingProduct.serialNumberTracking || false);
      setAllowNegativeStock(editingProduct.allowNegativeStock || false);
      setMaxStockLevel(editingProduct.maxStockLevel || 0);
      
      setAllowFraction(editingProduct.allowFraction || false);
      
      setWholesalePrice(editingProduct.wholesalePrice || 0);
      setDistributorPrice(editingProduct.distributorPrice || 0);
      setVipPrice(editingProduct.vipPrice || 0);
      setMaximumDiscountPercent(editingProduct.maximumDiscountPercent || 0);
      setMinimumMarginPercent(editingProduct.minimumMarginPercent || 0);
      setTaxIncluded(editingProduct.taxIncluded || false);
      
      setInventoryAccount(editingProduct.inventoryAccount || '');
      setSalesAccount(editingProduct.salesAccount || '');
      setPurchaseAccount(editingProduct.purchaseAccount || '');
      setCogsAccount(editingProduct.cogsAccount || '');
      setVatAccount(editingProduct.vatAccount || '');
      setCostCenter(editingProduct.costCenter || '');
      
      setGs1Code(editingProduct.gs1Code || '');
      setEtaCode(editingProduct.etaCode || '');
      setGtin(editingProduct.gtin || '');
      setHsCode(editingProduct.hsCode || '');
      setZatcaCode(editingProduct.zatcaCode || '');

    } else {
      // Reset form
      setName('');
      setSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`);
      setDescription('');
      setPrice(0);
      setCostPrice(0);
      setQuantity(0);
      setCategory(categories[0]?.name || 'عام');
      setCategoryId(categories[0]?.id || '');
      setGroupId('');
      setBrandId('');
      setManufacturerId('');
      setReorderLevel(5);
      setIsTaxable(true);
      setStatus('active');

      setUnits([{ id: 'unit-1', name: ' قطعة', symbol: 'قطعة', factor: 1, isBaseUnit: true }]);
      setBarcodes([]);
      setWarehouseStocks([{ warehouseId: 'wh-main', warehouseName: 'المخزن الرئيسي', quantity: 0 }]);
      setPriceLists([
        { priceListId: 'pl-retail', priceListName: 'بيطاعي (قطاعي)', price: 0 },
        { priceListId: 'pl-wholesale', priceListName: 'جملة', price: 0 }
      ]);
      setBatches([]);
      setImages([]);
      setAttachments([]);

      setNameArabic('');
      setNameEnglish('');
      setShortName('');
      setCountryOfOrigin('');
      setModel('');
      setSupplierId('');
      setPreferredSupplierId('');
      setSalesRepresentativeId('');
      setNotes('');
      
      setMainGroupId('');
      setSubGroupId('');
      setDepartmentId('');
      setSeason('');
      setProductType('standard');
      
      setSafetyStock(0);
      setLeadTimeDays(0);
      setStockPolicy('fifo');
      setBatchTracking(false);
      setExpiryTracking(false);
      setSerialNumberTracking(false);
      setAllowNegativeStock(false);
      setMaxStockLevel(0);
      
      setAllowFraction(false);
      
      setWholesalePrice(0);
      setDistributorPrice(0);
      setVipPrice(0);
      setMaximumDiscountPercent(0);
      setMinimumMarginPercent(0);
      setTaxIncluded(false);
      
      setInventoryAccount('');
      setSalesAccount('');
      setPurchaseAccount('');
      setCogsAccount('');
      setVatAccount('');
      setCostCenter('');
      
      setGs1Code('');
      setEtaCode('');
      setGtin('');
      setHsCode('');
      setZatcaCode('');

    }
  }, [editingProduct, isOpen, categories]);

  if (!isOpen) return null;

  // Handlers for Units
  const handleAddUnit = () => {
    if (!newUnitName || !newUnitSymbol) {
      toast.error('اسم الوحدة والرمز مطلوبة');
      return;
    }
    setUnits([
      ...units,
      {
        id: `unit-${Date.now()}`,
        name: newUnitName,
        symbol: newUnitSymbol,
        factor: Number(newUnitFactor) || 1,
        isBaseUnit: false,
        barcode: newUnitBarcode
      }
    ]);
    setNewUnitName('');
    setNewUnitSymbol('');
    setNewUnitFactor(1);
    setNewUnitBarcode('');
  };

  const handleRemoveUnit = (id: string) => {
    setUnits(units.filter(u => u.id !== id));
  };

  // Handlers for Barcodes
  const handleAddBarcode = () => {
    if (!newBarcodeCode) {
      toast.error('يرجى كتابة رمز الباركود');
      return;
    }
    setBarcodes([
      ...barcodes,
      {
        id: `bc-${Date.now()}`,
        code: newBarcodeCode,
        type: newBarcodeType,
        isPrimary: barcodes.length === 0
      }
    ]);
    setNewBarcodeCode('');
  };

  // Handlers for Warehouse Stock
  const handleAddWarehouseStock = () => {
    if (!newWhName) return;
    setWarehouseStocks([
      ...warehouseStocks,
      {
        warehouseId: `wh-${Date.now()}`,
        warehouseName: newWhName,
        quantity: Number(newWhQty) || 0
      }
    ]);
    setNewWhName('');
    setNewWhQty(0);
  };

  // Handlers for Batches
  const handleAddBatch = () => {
    if (!newBatchNo) {
      toast.error('رقم الوجبة/التشغيلة مطلوب');
      return;
    }
    setBatches([
      ...batches,
      {
        id: `batch-${Date.now()}`,
        batchNumber: newBatchNo,
        manufacturingDate: newBatchMfg,
        expiryDate: newBatchExp,
        quantity: Number(newBatchQty) || 0,
        status: 'active'
      }
    ]);
    setNewBatchNo('');
    setNewBatchMfg('');
    setNewBatchExp('');
    setNewBatchQty(0);
  };

  // Handlers for Images
  const handleAddImage = () => {
    if (!newImageUrl) return;
    setImages([
      ...images,
      {
        id: `img-${Date.now()}`,
        url: newImageUrl,
        isPrimary: images.length === 0
      }
    ]);
    setNewImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) {
      toast.error('يرجى كتابة اسم المنتج ورمز SKU');
      return;
    }
    setLoading(true);

    const selCategory = categories.find(c => c.id === categoryId)?.name || category || 'عام';
    const selGroup = groups.find(g => g.id === groupId)?.name;
    const selBrand = brands.find(b => b.id === brandId)?.name;
    const selMfr = manufacturers.find(m => m.id === manufacturerId)?.name;

    const payload = {
      name,
      sku,
      description,
      price: Number(price) || 0,
      costPrice: Number(costPrice) || 0,
      quantity: Number(quantity) || 0,
      category: selCategory,
      categoryId,
      groupId,
      groupName: selGroup,
      brandId,
      brandName: selBrand,
      manufacturerId,
      manufacturerName: selMfr,
      reorderLevel: Number(reorderLevel) || 5,
      isTaxable,
      status,
      units,
      barcodes,
      warehouseStocks,
      priceLists,
      batches,
      images,
      attachments,
      openingBalance: Number(quantity) || 0,

      nameArabic,
      nameEnglish,
      shortName,
      countryOfOrigin,
      model,
      supplierId,
      preferredSupplierId,
      salesRepresentativeId,
      notes,
      
      mainGroupId,
      subGroupId,
      departmentId,
      season,
      productType,
      
      safetyStock: Number(safetyStock) || 0,
      leadTimeDays: Number(leadTimeDays) || 0,
      stockPolicy,
      batchTracking,
      expiryTracking,
      serialNumberTracking,
      allowNegativeStock,
      maxStockLevel: Number(maxStockLevel) || 0,
      
      allowFraction,
      
      wholesalePrice: Number(wholesalePrice) || 0,
      distributorPrice: Number(distributorPrice) || 0,
      vipPrice: Number(vipPrice) || 0,
      maximumDiscountPercent: Number(maximumDiscountPercent) || 0,
      minimumMarginPercent: Number(minimumMarginPercent) || 0,
      taxIncluded,
      
      inventoryAccount,
      salesAccount,
      purchaseAccount,
      cogsAccount,
      vatAccount,
      costCenter,
      
      gs1Code,
      gtin,
      hsCode,
      zatcaCode,

    };

    try {
      if (editingProduct?.id) {
        await ProductService.updateProduct(editingProduct.id, payload);
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        await ProductService.createProduct(payload);
        toast.success('تم إنشاء المنتج بنجاح');
      }
      onClose();
    } catch (err: any) {
      toast.error('حدث خطأ أثناء حفظ المنتج: ' + (err.message || 'بيانات غير صالحة'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#151b2b] border border-[#1e293b] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0b0f17]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
              <Package size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {editingProduct ? `تعديل المنتج: ${editingProduct.name}` : 'إضافة منتج جديد (Product Master)'}
              </h3>
              <p className="text-xs text-slate-400">سجل البيانات الشامل للمنتج، الوحدات، الباركودات، الوجبات والأنساق</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1e293b]">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 bg-[#0b0f17] border-b border-[#1e293b] overflow-x-auto text-xs font-bold no-scrollbar">
          {[
            { id: 'general', label: 'البيانات الأساسية', icon: Package },
            { id: 'inventory_advanced', label: 'المخزون والصلاحية', icon: Layers },
            { id: 'units', label: 'الوحدات والتعبئة', icon: Layers },
            { id: 'barcodes', label: 'الباركودات المتعددة', icon: Barcode },
            { id: 'warehouses', label: 'المخازن والأماكن', icon: Building2 },
            { id: 'pricelists', label: 'قوائم الأسعار', icon: DollarSign },
            { id: 'batches', label: 'الوجبات والصلاحية', icon: Calendar },
            { id: 'media', label: 'الصور والمرفقات', icon: ImageIcon },
            { id: 'accounting', label: 'الحسابات والفاتورة الإلكترونية', icon: Tag },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: General Info */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">اسم المنتج *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثل: شاشة سامسونج 27 بوصة"
                    className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">رمز المنتج (SKU) *</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">سعر البيع (ج.م) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold text-green-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">سعر التكلفة (ج.م)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">الكمية الكلية الإجمالية</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">حد إعادة الطلب</label>
                  <input
                    type="number"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(Number(e.target.value))}
                    className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-400 block">الفئة الرئيسية (Category)</label>
                    <button type="button" onClick={() => setQuickAddType('category')} className="text-blue-400 hover:text-blue-300 text-xs font-bold">+ جديد</button>
                  </div>
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      const catObj = categories.find(c => c.id === e.target.value);
                      if (catObj) setCategory(catObj.name);
                    }}
                    className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- اختر الفئة --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-400 block">المجموعة (Product Group)</label>
                    <button type="button" onClick={() => setQuickAddType('group')} className="text-blue-400 hover:text-blue-300 text-xs font-bold">+ جديد</button>
                  </div>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- اختر المجموعة --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-400 block">العلامة التجارية (Brand)</label>
                    <button type="button" onClick={() => setQuickAddType('brand')} className="text-blue-400 hover:text-blue-300 text-xs font-bold">+ جديد</button>
                  </div>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- اختر الماركة --</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-400 block">الجهة المصنعة (Manufacturer)</label>
                    <button type="button" onClick={() => setQuickAddType('manufacturer')} className="text-blue-400 hover:text-blue-300 text-xs font-bold">+ جديد</button>
                  </div>
                  <select
                    value={manufacturerId}
                    onChange={(e) => setManufacturerId(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- اختر المصنّع --</option>
                    {manufacturers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">الوصف التفصيلي للمنتج</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="مواصفات الفنية وتفاصيل المنتج..."
                  className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTaxable}
                    onChange={(e) => setIsTaxable(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  خاضع لضريبة القيمة المضافة
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: Unlimited Units */}
          {activeTab === 'units' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase">إضافة وحدة تعبئة جديدة (مثل: كرتونة، دسطة، صندوق)</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">اسم الوحدة</label>
                    <input
                      type="text"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                      placeholder="مثل: كرتونة"
                      className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">رمز الوحدة</label>
                    <input
                      type="text"
                      value={newUnitSymbol}
                      onChange={(e) => setNewUnitSymbol(e.target.value)}
                      placeholder="ctn"
                      className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">معامل التحويل للأساسية</label>
                    <input
                      type="number"
                      value={newUnitFactor}
                      onChange={(e) => setNewUnitFactor(Number(e.target.value))}
                      placeholder="12"
                      className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">باركود الوحدة (اختياري)</label>
                    <input
                      type="text"
                      value={newUnitBarcode}
                      onChange={(e) => setNewUnitBarcode(e.target.value)}
                      placeholder="12345678"
                      className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddUnit}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <Plus size={14} /> إضافة الوحدة
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400">الوحدات المحددة لهذا المنتج</h4>
                {units.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-[#0b0f17] border border-[#1e293b] rounded-xl">
                    <div className="flex items-center gap-3">
                      <Layers size={18} className="text-blue-400" />
                      <div>
                        <span className="font-bold text-white text-sm">{u.name} ({u.symbol})</span>
                        <span className="text-xs text-slate-400 ml-3">
                          {u.isBaseUnit ? 'الوحدة الأساسية (1:1)' : `يساوي ${u.factor} من الوحدة الأساسية`}
                        </span>
                      </div>
                    </div>
                    {!u.isBaseUnit && (
                      <button type="button" onClick={() => handleRemoveUnit(u.id)} className="text-red-400 p-1">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Unlimited Barcodes */}
          {activeTab === 'barcodes' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase">إضافة رمز باركود إضافي</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">رمز الباركود *</label>
                    <input
                      type="text"
                      value={newBarcodeCode}
                      onChange={(e) => setNewBarcodeCode(e.target.value)}
                      placeholder="629100000000"
                      className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">نوع الباركود</label>
                    <select
                      value={newBarcodeType}
                      onChange={(e) => setNewBarcodeType(e.target.value as any)}
                      className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    >
                      <option value="EAN13">EAN-13 International</option>
                      <option value="UPC">UPC Standard</option>
                      <option value="CODE128">Code 128</option>
                      <option value="CUSTOM">Custom / Internal</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddBarcode}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <Plus size={14} /> ربط الباركود
                </button>
              </div>

              <div className="space-y-2">
                {barcodes.map((bc) => (
                  <div key={bc.id} className="flex items-center justify-between p-3 bg-[#0b0f17] border border-[#1e293b] rounded-xl">
                    <div className="flex items-center gap-3">
                      <Barcode size={18} className="text-purple-400" />
                      <span className="font-mono text-white text-sm font-bold">{bc.code}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{bc.type}</span>
                    </div>
                    <button type="button" onClick={() => setBarcodes(barcodes.filter(b => b.id !== bc.id))} className="text-red-400 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Multi-Warehouse Stock */}
          {activeTab === 'warehouses' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase">تخصيص رصيد لمخزن محدد</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">اسم المخزن</label>
                    <input
                      type="text"
                      value={newWhName}
                      onChange={(e) => setNewWhName(e.target.value)}
                      placeholder="المخزن الفرعي"
                      className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">الكمية المتاحة</label>
                    <input
                      type="number"
                      value={newWhQty}
                      onChange={(e) => setNewWhQty(Number(e.target.value))}
                      className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>
                <button type="button" onClick={handleAddWarehouseStock} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                  <Plus size={14} /> إضافة رصيد المخزن
                </button>
              </div>

              <div className="space-y-2">
                {warehouseStocks.map((ws, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#0b0f17] border border-[#1e293b] rounded-xl">
                    <div className="flex items-center gap-3">
                      <Building2 size={18} className="text-emerald-400" />
                      <span className="font-bold text-white text-sm">{ws.warehouseName}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">{ws.quantity} قطعة</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Price Lists */}
          {activeTab === 'pricelists' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase">أسعار الفئات وقوائم البيع المخصصة</h4>
                {priceLists.map((pl, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#0b0f17] border border-[#1e293b] rounded-xl">
                    <span className="font-bold text-white text-sm">{pl.priceListName}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={pl.price}
                        onChange={(e) => {
                          const updated = [...priceLists];
                          updated[idx].price = Number(e.target.value);
                          setPriceLists(updated);
                        }}
                        className="w-28 bg-[#151b2b] border border-[#1e293b] rounded-lg p-1.5 text-xs text-white text-center font-bold"
                      />
                      <span className="text-xs text-slate-400">ج.م</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Batches & Expiry */}
          {activeTab === 'batches' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase">إضافة وجبة/تشغيلة برقم وتاريخ صلاحية</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">رقم التشغيلة (Batch #)</label>
                    <input
                      type="text"
                      value={newBatchNo}
                      onChange={(e) => setNewBatchNo(e.target.value)}
                      placeholder="BAT-2026-001"
                      className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">تاريخ الإنتاج</label>
                    <input
                      type="date"
                      value={newBatchMfg}
                      onChange={(e) => setNewBatchMfg(e.target.value)}
                      className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">تاريخ انتهاء الصلاحية</label>
                    <input
                      type="date"
                      value={newBatchExp}
                      onChange={(e) => setNewBatchExp(e.target.value)}
                      className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">كمية التشغيلة</label>
                    <input
                      type="number"
                      value={newBatchQty}
                      onChange={(e) => setNewBatchQty(Number(e.target.value))}
                      className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>
                <button type="button" onClick={handleAddBatch} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                  <Plus size={14} /> إضافة التشغيلة
                </button>
              </div>

              <div className="space-y-2">
                {batches.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-[#0b0f17] border border-[#1e293b] rounded-xl">
                    <div>
                      <span className="font-bold text-white text-sm">وجبة #{b.batchNumber}</span>
                      <div className="text-xs text-slate-400 mt-1 flex gap-3">
                        {b.expiryDate && <span>انتهاء: {b.expiryDate}</span>}
                        <span>الكمية: {b.quantity} قطعة</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => setBatches(batches.filter(item => item.id !== b.id))} className="text-red-400 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: Media & Attachments */}
          {activeTab === 'media' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase">رابط صورة التوضيحية للمنتج</h4>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                  />
                  <button type="button" onClick={handleAddImage} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 rounded-lg flex items-center gap-1">
                    <Plus size={14} /> إضافة صورة
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative group bg-[#0b0f17] border border-[#1e293b] rounded-xl overflow-hidden p-2">
                    <img src={img.url} alt="product" className="w-full h-32 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter(i => i.id !== img.id))}
                      className="absolute top-3 right-3 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* TAB 8: Advanced Inventory */}
          {activeTab === 'inventory_advanced' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b]">
                  <h4 className="text-sm font-bold text-emerald-400 mb-3">سياسات المخزون والتتبع</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input type="checkbox" checked={batchTracking} onChange={(e) => setBatchTracking(e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
                      تتبع التشغيلات (Batches)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input type="checkbox" checked={expiryTracking} onChange={(e) => setExpiryTracking(e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
                      تتبع تاريخ الصلاحية
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input type="checkbox" checked={serialNumberTracking} onChange={(e) => setSerialNumberTracking(e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
                      تتبع الأرقام التسلسلية (Serials)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input type="checkbox" checked={allowNegativeStock} onChange={(e) => setAllowNegativeStock(e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
                      السماح بالسحب بالسالب
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input type="checkbox" checked={allowFraction} onChange={(e) => setAllowFraction(e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
                      السماح بالكسور (Fractions)
                    </label>
                  </div>
                </div>

                <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] md:col-span-2">
                  <h4 className="text-sm font-bold text-blue-400 mb-3">مستويات الأمان والمخزون</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">مخزون الأمان (Safety Stock)</label>
                      <input type="number" value={safetyStock} onChange={(e) => setSafetyStock(Number(e.target.value))} className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">فترة التوريد بالأيام (Lead Time)</label>
                      <input type="number" value={leadTimeDays} onChange={(e) => setLeadTimeDays(Number(e.target.value))} className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">الحد الأقصى للمخزون</label>
                      <input type="number" value={maxStockLevel} onChange={(e) => setMaxStockLevel(Number(e.target.value))} className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">سياسة الصرف (Stock Policy)</label>
                      <select value={stockPolicy} onChange={(e) => setStockPolicy(e.target.value as any)} className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                        <option value="fifo">ما يرد أولاً يصرف أولاً (FIFO)</option>
                        <option value="lifo">ما يرد أخيراً يصرف أولاً (LIFO)</option>
                        <option value="weighted_average">المتوسط المرجح (Weighted Average)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* TAB 9: Accounting & E-Invoice */}
          {activeTab === 'accounting' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                  <h4 className="text-sm font-bold text-rose-400 mb-3">ربط الحسابات (Accounting Links)</h4>
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">حساب المخزون (Inventory Account)</label>
                    <input type="text" value={inventoryAccount} onChange={(e) => setInventoryAccount(e.target.value)} placeholder="مثال: 112001" className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">حساب المبيعات (Sales Account)</label>
                    <input type="text" value={salesAccount} onChange={(e) => setSalesAccount(e.target.value)} className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">حساب المشتريات (Purchase Account)</label>
                    <input type="text" value={purchaseAccount} onChange={(e) => setPurchaseAccount(e.target.value)} className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">حساب تكلفة البضاعة المباعة (COGS)</label>
                    <input type="text" value={cogsAccount} onChange={(e) => setCogsAccount(e.target.value)} className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">مركز التكلفة (Cost Center)</label>
                    <input type="text" value={costCenter} onChange={(e) => setCostCenter(e.target.value)} className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white" />
                  </div>
                </div>

                <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                  <h4 className="text-sm font-bold text-amber-400 mb-3">الفاتورة الإلكترونية (ZATCA / ETA)</h4>
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">كود GS1 (الباركود الدولي)</label>
                    <input type="text" value={gs1Code} onChange={(e) => setGs1Code(e.target.value)} className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">كود EGS / ETA (الضرائب المصرية)</label>
                    <input type="text" value={etaCode} onChange={(e) => setEtaCode(e.target.value)} className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">كود الزكاة والدخل (ZATCA - السعودية)</label>
                    <input type="text" value={zatcaCode} onChange={(e) => setZatcaCode(e.target.value)} className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">كود GTIN</label>
                    <input type="text" value={gtin} onChange={(e) => setGtin(e.target.value)} className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between">
            <span className="text-xs text-slate-500">
              * سيتم حفظ جميع أبعاد المنتج والربط بالمخازن تلقائياً
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save size={16} /> {loading ? 'جاري الحفظ...' : 'حفظ المنتج'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {quickAddType && (
        <QuickAddModal
          isOpen={true}
          onClose={() => setQuickAddType(null)}
          type={quickAddType}
          categories={categories}
          onSuccess={() => setQuickAddType(null)}
        />
      )}
    </div>
  );
};
