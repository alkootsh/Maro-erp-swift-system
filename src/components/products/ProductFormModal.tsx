/**
 * @file ProductFormModal.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: ProductFormModal.tsx.
 */
// MARO ERP - Product Master Form Modal with Enterprise Validation Framework
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  X, 
  Plus, 
  Trash2, 
  Package, 
  Layers, 
  Barcode, 
  Building2, 
  DollarSign, 
  Calendar, 
  Image as ImageIcon,
  Tag
} from 'lucide-react';
import { ProductMaster, ProductUnit, ProductBarcode, WarehouseStockItem, ProductPriceListItem, ProductBatch, ProductImage, ProductAttachment, ProductCategory, ProductGroup, Brand, Manufacturer } from '../../types/productMaster';
import { ProductService } from '../../services/productService';
import { productMasterSchema, ProductMasterInput } from '../../lib/productValidation';
import { 
  FormProvider, 
  FormInput, 
  FormNumber, 
  FormSelect, 
  FormTextarea, 
  FormSwitch, 
  ValidationSummary, 
  LoadingButton 
} from '../common/form';
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

type TabType = 'general' | 'units' | 'barcodes' | 'warehouses' | 'pricelists' | 'batches' | 'media' | 'inventory_advanced' | 'accounting';

const FIELD_TAB_MAP: Record<string, { tabId: TabType; tabLabel: string; fieldLabel: string }> = {
  name: { tabId: 'general', tabLabel: 'البيانات الأساسية', fieldLabel: 'اسم المنتج' },
  sku: { tabId: 'general', tabLabel: 'البيانات الأساسية', fieldLabel: 'رمز المنتج (SKU)' },
  category: { tabId: 'general', tabLabel: 'البيانات الأساسية', fieldLabel: 'الفئة' },
  price: { tabId: 'general', tabLabel: 'البيانات الأساسية', fieldLabel: 'سعر البيع' },
  costPrice: { tabId: 'general', tabLabel: 'البيانات الأساسية', fieldLabel: 'سعر التكلفة' },
  quantity: { tabId: 'general', tabLabel: 'البيانات الأساسية', fieldLabel: 'الكمية' },
  reorderLevel: { tabId: 'general', tabLabel: 'البيانات الأساسية', fieldLabel: 'حد إعادة الطلب' },
  safetyStock: { tabId: 'inventory_advanced', tabLabel: 'المخزون والصلاحية', fieldLabel: 'مخزون الأمان' },
  leadTimeDays: { tabId: 'inventory_advanced', tabLabel: 'المخزون والصلاحية', fieldLabel: 'فترة التوريد' },
  maxStockLevel: { tabId: 'inventory_advanced', tabLabel: 'المخزون والصلاحية', fieldLabel: 'الحد الأقصى للمخزون' },
  wholesalePrice: { tabId: 'pricelists', tabLabel: 'قوائم الأسعار', fieldLabel: 'سعر الجملة' },
  distributorPrice: { tabId: 'pricelists', tabLabel: 'قوائم الأسعار', fieldLabel: 'سعر الموزع' },
  vipPrice: { tabId: 'pricelists', tabLabel: 'قوائم الأسعار', fieldLabel: 'سعر VIP' },
  maximumDiscountPercent: { tabId: 'pricelists', tabLabel: 'قوائم الأسعار', fieldLabel: 'نسبة الخصم القصوى' },
  minimumMarginPercent: { tabId: 'pricelists', tabLabel: 'قوائم الأسعار', fieldLabel: 'أقل نسبة هامش' },
  inventoryAccount: { tabId: 'accounting', tabLabel: 'الحسابات والفاتورة الإلكترونية', fieldLabel: 'حساب المخزون' },
  salesAccount: { tabId: 'accounting', tabLabel: 'الحسابات والفاتورة الإلكترونية', fieldLabel: 'حساب المبيعات' },
  purchaseAccount: { tabId: 'accounting', tabLabel: 'الحسابات والفاتورة الإلكترونية', fieldLabel: 'حساب المشتريات' },
  cogsAccount: { tabId: 'accounting', tabLabel: 'الحسابات والفاتورة الإلكترونية', fieldLabel: 'حساب تكلفة البضاعة' },
};

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  categories,
  groups,
  brands,
  manufacturers
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(false);

  // Arrays state
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [barcodes, setBarcodes] = useState<ProductBarcode[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStockItem[]>([]);
  const [priceLists, setPriceLists] = useState<ProductPriceListItem[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [attachments, setAttachments] = useState<ProductAttachment[]>([]);

  // Array inputs
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitSymbol, setNewUnitSymbol] = useState('');
  const [newUnitFactor, setNewUnitFactor] = useState(1);
  const [newUnitBarcode, setNewUnitBarcode] = useState('');

  const [newBarcodeCode, setNewBarcodeCode] = useState('');
  const [newBarcodeType, setNewBarcodeType] = useState<'EAN13' | 'UPC' | 'CODE128' | 'CUSTOM'>('EAN13');

  const [newWhName, setNewWhName] = useState('المخزن الرئيسي');
  const [newWhQty, setNewWhQty] = useState(0);

  const [newBatchNo, setNewBatchNo] = useState('');
  const [newBatchMfg, setNewBatchMfg] = useState('');
  const [newBatchExp, setNewBatchExp] = useState('');
  const [newBatchQty, setNewBatchQty] = useState(0);

  const [newImageUrl, setNewImageUrl] = useState('');

  const [quickAddType, setQuickAddType] = useState<'category' | 'group' | 'brand' | 'manufacturer' | null>(null);

  const methods = useForm<ProductMasterInput>({
    resolver: zodResolver(productMasterSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: categories[0]?.name || 'عام',
      categoryId: categories[0]?.id || '',
      price: 0,
      costPrice: 0,
      quantity: 0,
      reorderLevel: 5,
      isTaxable: true,
      status: 'active',
      description: '',
      groupId: '',
      brandId: '',
      manufacturerId: '',
      nameArabic: '',
      nameEnglish: '',
      shortName: '',
      countryOfOrigin: '',
      model: '',
      supplierId: '',
      preferredSupplierId: '',
      salesRepresentativeId: '',
      notes: '',
      mainGroupId: '',
      subGroupId: '',
      departmentId: '',
      season: '',
      productType: 'standard',
      safetyStock: 0,
      leadTimeDays: 0,
      stockPolicy: 'fifo',
      batchTracking: false,
      expiryTracking: false,
      serialNumberTracking: false,
      allowNegativeStock: false,
      maxStockLevel: 0,
      allowFraction: false,
      wholesalePrice: 0,
      distributorPrice: 0,
      vipPrice: 0,
      maximumDiscountPercent: 0,
      minimumMarginPercent: 0,
      taxIncluded: false,
      inventoryAccount: '',
      salesAccount: '',
      purchaseAccount: '',
      cogsAccount: '',
      vatAccount: '',
      costCenter: '',
      gs1Code: '',
      etaCode: '',
      gtin: '',
      hsCode: '',
      zatcaCode: '',
    }
  });

  useEffect(() => {
    if (editingProduct) {
      methods.reset({
        name: editingProduct.name || '',
        sku: editingProduct.sku || '',
        category: editingProduct.category || categories[0]?.name || 'عام',
        categoryId: editingProduct.categoryId || categories[0]?.id || '',
        price: editingProduct.price || 0,
        costPrice: editingProduct.costPrice || 0,
        quantity: editingProduct.quantity || 0,
        reorderLevel: editingProduct.reorderLevel ?? 5,
        isTaxable: editingProduct.isTaxable !== false,
        status: editingProduct.status || 'active',
        description: editingProduct.description || '',
        groupId: editingProduct.groupId || '',
        brandId: editingProduct.brandId || '',
        manufacturerId: editingProduct.manufacturerId || '',
        nameArabic: editingProduct.nameArabic || '',
        nameEnglish: editingProduct.nameEnglish || '',
        shortName: editingProduct.shortName || '',
        countryOfOrigin: editingProduct.countryOfOrigin || '',
        model: editingProduct.model || '',
        supplierId: editingProduct.supplierId || '',
        preferredSupplierId: editingProduct.preferredSupplierId || '',
        salesRepresentativeId: editingProduct.salesRepresentativeId || '',
        notes: editingProduct.notes || '',
        mainGroupId: editingProduct.mainGroupId || '',
        subGroupId: editingProduct.subGroupId || '',
        departmentId: editingProduct.departmentId || '',
        season: editingProduct.season || '',
        productType: editingProduct.productType || 'standard',
        safetyStock: editingProduct.safetyStock || 0,
        leadTimeDays: editingProduct.leadTimeDays || 0,
        stockPolicy: editingProduct.stockPolicy || 'fifo',
        batchTracking: editingProduct.batchTracking || false,
        expiryTracking: editingProduct.expiryTracking || false,
        serialNumberTracking: editingProduct.serialNumberTracking || false,
        allowNegativeStock: editingProduct.allowNegativeStock || false,
        maxStockLevel: editingProduct.maxStockLevel || 0,
        allowFraction: editingProduct.allowFraction || false,
        wholesalePrice: editingProduct.wholesalePrice || 0,
        distributorPrice: editingProduct.distributorPrice || 0,
        vipPrice: editingProduct.vipPrice || 0,
        maximumDiscountPercent: editingProduct.maximumDiscountPercent || 0,
        minimumMarginPercent: editingProduct.minimumMarginPercent || 0,
        taxIncluded: editingProduct.taxIncluded || false,
        inventoryAccount: editingProduct.inventoryAccount || '',
        salesAccount: editingProduct.salesAccount || '',
        purchaseAccount: editingProduct.purchaseAccount || '',
        cogsAccount: editingProduct.cogsAccount || '',
        vatAccount: editingProduct.vatAccount || '',
        costCenter: editingProduct.costCenter || '',
        gs1Code: editingProduct.gs1Code || '',
        etaCode: editingProduct.etaCode || '',
        gtin: editingProduct.gtin || '',
        hsCode: editingProduct.hsCode || '',
        zatcaCode: editingProduct.zatcaCode || '',
      });

      setUnits(editingProduct.units || []);
      setBarcodes(editingProduct.barcodes || []);
      setWarehouseStocks(editingProduct.warehouseStocks || []);
      setPriceLists(editingProduct.priceLists || []);
      setBatches(editingProduct.batches || []);
      setImages(editingProduct.images || []);
      setAttachments(editingProduct.attachments || []);
    } else {
      methods.reset({
        name: '',
        sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
        category: categories[0]?.name || 'عام',
        categoryId: categories[0]?.id || '',
        price: 0,
        costPrice: 0,
        quantity: 0,
        reorderLevel: 5,
        isTaxable: true,
        status: 'active',
        description: '',
        groupId: '',
        brandId: '',
        manufacturerId: '',
        nameArabic: '',
        nameEnglish: '',
        shortName: '',
        countryOfOrigin: '',
        model: '',
        supplierId: '',
        preferredSupplierId: '',
        salesRepresentativeId: '',
        notes: '',
        mainGroupId: '',
        subGroupId: '',
        departmentId: '',
        season: '',
        productType: 'standard',
        safetyStock: 0,
        leadTimeDays: 0,
        stockPolicy: 'fifo',
        batchTracking: false,
        expiryTracking: false,
        serialNumberTracking: false,
        allowNegativeStock: false,
        maxStockLevel: 0,
        allowFraction: false,
        wholesalePrice: 0,
        distributorPrice: 0,
        vipPrice: 0,
        maximumDiscountPercent: 0,
        minimumMarginPercent: 0,
        taxIncluded: false,
        inventoryAccount: '',
        salesAccount: '',
        purchaseAccount: '',
        cogsAccount: '',
        vatAccount: '',
        costCenter: '',
        gs1Code: '',
        etaCode: '',
        gtin: '',
        hsCode: '',
        zatcaCode: '',
      });

      setUnits([{ id: 'unit-1', name: 'قطعة', symbol: 'قطعة', factor: 1, isBaseUnit: true }]);
      setBarcodes([]);
      setWarehouseStocks([{ warehouseId: 'wh-main', warehouseName: 'المخزن الرئيسي', quantity: 0 }]);
      setPriceLists([
        { priceListId: 'pl-retail', priceListName: 'قطاعي', price: 0 },
        { priceListId: 'pl-wholesale', priceListName: 'جملة', price: 0 }
      ]);
      setBatches([]);
      setImages([]);
      setAttachments([]);
    }
  }, [editingProduct, isOpen, categories, methods]);

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

  // Validation Error Handler: Auto switch to error tab & focus field
  const handleFormError = (errors: any) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const targetMap = FIELD_TAB_MAP[firstKey];
      if (targetMap) {
        setActiveTab(targetMap.tabId);
      } else {
        setActiveTab('general');
      }

      setTimeout(() => {
        const el = document.getElementById(firstKey);
        if (el) {
          el.focus();
        }
      }, 100);

      toast.error('يرجى تصحيح الأخطاء المشار إليها باللون الأحمر');
    }
  };

  const handleSelectErrorField = (fieldName: string, tabId?: string) => {
    if (tabId) {
      setActiveTab(tabId as TabType);
    }
    setTimeout(() => {
      const el = document.getElementById(fieldName);
      if (el) {
        el.focus();
      }
    }, 100);
  };

  // Save Flow Submission
  const handleSaveProduct = async (data: ProductMasterInput) => {
    setLoading(true);

    const selCategory = categories.find(c => c.id === data.categoryId || c.name === data.category)?.name || data.category || 'عام';
    const selGroup = groups.find(g => g.id === data.groupId)?.name;
    const selBrand = brands.find(b => b.id === data.brandId)?.name;
    const selMfr = manufacturers.find(m => m.id === data.manufacturerId)?.name;

    const payload: Omit<ProductMaster, 'id' | 'createdAt' | 'updatedAt'> = {
      name: data.name,
      sku: data.sku,
      category: selCategory,
      price: data.price,
      costPrice: data.costPrice,
      quantity: data.quantity,
      reorderLevel: data.reorderLevel,
      isTaxable: data.isTaxable,
      status: data.status,
      description: data.description || '',
      categoryId: data.categoryId,
      groupId: data.groupId,
      groupName: selGroup,
      brandId: data.brandId,
      brandName: selBrand,
      manufacturerId: data.manufacturerId,
      manufacturerName: selMfr,
      nameArabic: data.nameArabic,
      nameEnglish: data.nameEnglish,
      shortName: data.shortName,
      countryOfOrigin: data.countryOfOrigin,
      model: data.model,
      supplierId: data.supplierId,
      preferredSupplierId: data.preferredSupplierId,
      salesRepresentativeId: data.salesRepresentativeId,
      notes: data.notes,
      mainGroupId: data.mainGroupId,
      subGroupId: data.subGroupId,
      departmentId: data.departmentId,
      season: data.season,
      productType: data.productType,
      safetyStock: data.safetyStock,
      leadTimeDays: data.leadTimeDays,
      stockPolicy: data.stockPolicy,
      batchTracking: data.batchTracking,
      expiryTracking: data.expiryTracking,
      serialNumberTracking: data.serialNumberTracking,
      allowNegativeStock: data.allowNegativeStock,
      maxStockLevel: data.maxStockLevel,
      allowFraction: data.allowFraction,
      wholesalePrice: data.wholesalePrice,
      distributorPrice: data.distributorPrice,
      vipPrice: data.vipPrice,
      maximumDiscountPercent: data.maximumDiscountPercent,
      minimumMarginPercent: data.minimumMarginPercent,
      taxIncluded: data.taxIncluded,
      inventoryAccount: data.inventoryAccount,
      salesAccount: data.salesAccount,
      purchaseAccount: data.purchaseAccount,
      cogsAccount: data.cogsAccount,
      vatAccount: data.vatAccount,
      costCenter: data.costCenter,
      gs1Code: data.gs1Code,
      etaCode: data.etaCode,
      gtin: data.gtin,
      hsCode: data.hsCode,
      zatcaCode: data.zatcaCode,
      units,
      barcodes,
      warehouseStocks,
      priceLists,
      batches,
      images,
      attachments,
      openingBalance: Number(data.quantity) || 0,
    };

    try {
      if (editingProduct?.id) {
        await ProductService.updateProduct(editingProduct.id, payload);
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        await ProductService.createProduct(payload);
        toast.success('تم إنشاء المنتج بنجاح وتوثيقه بالقاعدة وسجل التدقيق');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ المنتج');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = categories.map(c => ({ value: c.name, label: c.name }));
  const groupOptions = groups.map(g => ({ value: g.id, label: g.name }));
  const brandOptions = brands.map(b => ({ value: b.id, label: b.name }));
  const manufacturerOptions = manufacturers.map(m => ({ value: m.id, label: m.name }));

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
          <button onClick={onClose} type="button" className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1e293b]">
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

        {/* Form Body using FormProvider */}
        <FormProvider
          methods={methods}
          onSubmit={handleSaveProduct}
          onError={handleFormError}
          className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-between"
        >
          <div className="space-y-6">
            <ValidationSummary
              errors={methods.formState.errors}
              fieldTabMap={FIELD_TAB_MAP}
              onSelectError={handleSelectErrorField}
            />

            {/* TAB 1: General Info */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="name"
                    label="اسم المنتج *"
                    placeholder="مثل: شاشة سامسونج 27 بوصة"
                    requiredAsterisk
                    tooltip="اسم المنتج الرئيسي الذي يظهر في الفواتير والتقارير"
                  />

                  <FormInput
                    name="sku"
                    label="رمز المنتج (SKU / الكود) *"
                    placeholder="مثال: SKU-10023"
                    requiredAsterisk
                    tooltip="رمز التعريف الفريد للمنتج"
                  />

                  <FormSelect
                    name="category"
                    label="الفئة الرئيسية *"
                    options={categoryOptions}
                    requiredAsterisk
                  />

                  <FormNumber
                    name="price"
                    label="سعر البيع الافتراضي (EGP) *"
                    requiredAsterisk
                    tooltip="سعر البيع النهائي للعميل شامل أو غير شامل الضريبة"
                  />

                  <FormNumber
                    name="costPrice"
                    label="سعر التكلفة *"
                    requiredAsterisk
                    tooltip="تكلفة الشراء الأصلية للمنتج لحساب الأرباح الإجمالية"
                  />

                  <FormNumber
                    name="quantity"
                    label="الكمية الافتتاحية الحالية *"
                    requiredAsterisk
                  />

                  <FormNumber
                    name="reorderLevel"
                    label="حد إعادة الطلب (الإنذار)"
                    tooltip="ينبهك النظام عندما يقل المخزون عن هذا الحد"
                  />

                  <FormSelect
                    name="status"
                    label="حالة المنتج"
                    options={[
                      { value: 'active', label: 'نشط (Active)' },
                      { value: 'draft', label: 'مسودة (Draft)' },
                      { value: 'archived', label: 'مؤرشف (Archived)' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput name="nameArabic" label="الاسم العربي التفصيلي" placeholder="اسم إضافي بلغة أخرى" />
                  <FormInput name="nameEnglish" label="English Name" placeholder="Detailed English Name" />
                  <FormInput name="shortName" label="الاسم المختصر (للطابعة الحرارية)" placeholder="اسم مختصر لكارت الصنف" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormSelect name="groupId" label="المجموعة الفرعية" options={groupOptions} placeholder="اختر المجموعة" />
                  <FormSelect name="brandId" label="العلامة التجارية (Brand)" options={brandOptions} placeholder="اختر الماركة" />
                  <FormSelect name="manufacturerId" label="المصنّع (Manufacturer)" options={manufacturerOptions} placeholder="اختر المصنع" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput name="countryOfOrigin" label="بلد المنشأ" placeholder="مثل: مصر، الصين، ألمانيا" />
                  <FormInput name="model" label="الموديل / رقم الطراز" placeholder="مثل: 2026-X1" />
                </div>

                <FormSwitch
                  name="isTaxable"
                  label="منتج خاضع لضريبة القيمة المضافة (14% VAT)"
                  description="يؤثر على حسابات الفاتورة الضريبية ZATCA / ETA"
                />

                <FormTextarea name="description" label="وصف المنتج التفصيلي" placeholder="وصف كامل للمنتج والمواصفات الفنية..." rows={2} />
                <FormTextarea name="notes" label="ملاحظات إدارية داخلية" placeholder="ملاحظات تظهر للمشتروات والمخازن فقط..." rows={2} />
              </div>
            )}

            {/* TAB 2: Advanced Inventory */}
            {activeTab === 'inventory_advanced' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                    <h4 className="text-sm font-bold text-emerald-400 mb-3">سياسات المخزون والتتبع</h4>
                    <FormSwitch name="batchTracking" label="تتبع التشغيلات (Batches)" />
                    <FormSwitch name="expiryTracking" label="تتبع تاريخ الصلاحية" />
                    <FormSwitch name="serialNumberTracking" label="تتبع الأرقام التسلسلية (Serials)" />
                    <FormSwitch name="allowNegativeStock" label="السماح بالسحب بالسالب" />
                    <FormSwitch name="allowFraction" label="السماح بالكسور (Fractions)" />
                  </div>

                  <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] md:col-span-2">
                    <h4 className="text-sm font-bold text-blue-400 mb-3">مستويات الأمان والمخزون</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormNumber name="safetyStock" label="مخزون الأمان (Safety Stock)" />
                      <FormNumber name="leadTimeDays" label="فترة التوريد بالأيام (Lead Time)" />
                      <FormNumber name="maxStockLevel" label="الحد الأقصى للمخزون" />
                      <FormSelect
                        name="stockPolicy"
                        label="سياسة الصرف (Stock Policy)"
                        options={[
                          { value: 'fifo', label: 'ما يرد أولاً يصرف أولاً (FIFO)' },
                          { value: 'lifo', label: 'ما يرد أخيراً يصرف أولاً (LIFO)' },
                          { value: 'weighted_average', label: 'المتوسط المرجح (Weighted Average)' },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Units */}
            {activeTab === 'units' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">إضافة وحدة قياس جديدة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                      placeholder="اسم الوحدة (كرتونة، علبة)"
                      className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newUnitSymbol}
                      onChange={(e) => setNewUnitSymbol(e.target.value)}
                      placeholder="الرمز (Ctn, Box)"
                      className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                    <input
                      type="number"
                      value={newUnitFactor}
                      onChange={(e) => setNewUnitFactor(Number(e.target.value))}
                      placeholder="معامل التحويل للوحدة الأساسية"
                      className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                    <button type="button" onClick={handleAddUnit} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 rounded-lg flex items-center justify-center gap-1">
                      <Plus size={14} /> إضافة وحدة
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {units.map((unit) => (
                    <div key={unit.id} className="flex items-center justify-between bg-[#0b0f17] p-3 rounded-xl border border-[#1e293b]">
                      <div>
                        <span className="text-sm font-bold text-white">{unit.name} ({unit.symbol})</span>
                        <span className="text-xs text-slate-400 block">
                          {unit.isBaseUnit ? 'الوحدة الأساسية (Factor = 1)' : `تحتوي على ${unit.factor} من الوحدة الأساسية`}
                        </span>
                      </div>
                      {!unit.isBaseUnit && (
                        <button type="button" onClick={() => handleRemoveUnit(unit.id)} className="text-red-400 hover:text-red-300 p-2">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Barcodes */}
            {activeTab === 'barcodes' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">إضافة باركود جديد للمنتج</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBarcodeCode}
                      onChange={(e) => setNewBarcodeCode(e.target.value)}
                      placeholder="اكتب رمز الباركود أو امسحه بالعارض"
                      className="flex-1 bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                    <select
                      value={newBarcodeType}
                      onChange={(e) => setNewBarcodeType(e.target.value as any)}
                      className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    >
                      <option value="EAN13">EAN-13 (دولي)</option>
                      <option value="UPC">UPC</option>
                      <option value="CODE128">Code 128</option>
                      <option value="CUSTOM">مخصص (Custom)</option>
                    </select>
                    <button type="button" onClick={handleAddBarcode} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 rounded-lg flex items-center gap-1">
                      <Plus size={14} /> إضافة باركود
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {barcodes.map((bc) => (
                    <div key={bc.id} className="flex items-center justify-between bg-[#0b0f17] p-3 rounded-xl border border-[#1e293b]">
                      <div>
                        <span className="text-sm font-mono font-bold text-blue-400">{bc.code}</span>
                        <span className="text-[11px] text-slate-500 block">{bc.type} {bc.isPrimary ? '• باركود رئيسي' : ''}</span>
                      </div>
                      <button type="button" onClick={() => setBarcodes(barcodes.filter(b => b.id !== bc.id))} className="text-red-400 hover:text-red-300">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: Warehouses */}
            {activeTab === 'warehouses' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">توزيع المخزون على الفرع أو المخازن</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newWhName}
                      onChange={(e) => setNewWhName(e.target.value)}
                      placeholder="اسم المخزن"
                      className="flex-1 bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                    <input
                      type="number"
                      value={newWhQty}
                      onChange={(e) => setNewWhQty(Number(e.target.value))}
                      placeholder="الكمية المتوفرة"
                      className="w-32 bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                    <button type="button" onClick={handleAddWarehouseStock} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 rounded-lg flex items-center gap-1">
                      <Plus size={14} /> إضافة مخزن
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {warehouseStocks.map((ws, index) => (
                    <div key={index} className="flex items-center justify-between bg-[#0b0f17] p-3 rounded-xl border border-[#1e293b]">
                      <span className="text-sm font-bold text-white">{ws.warehouseName}</span>
                      <span className="text-sm font-bold text-emerald-400">{ws.quantity} قطعة</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: Price Lists */}
            {activeTab === 'pricelists' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormNumber name="wholesalePrice" label="سعر الجملة (Wholesale)" />
                  <FormNumber name="distributorPrice" label="سعر الموزعين (Distributor)" />
                  <FormNumber name="vipPrice" label="سعر كبار العملاء (VIP)" />
                  <FormNumber name="maximumDiscountPercent" label="أقصى نسبة خصم مسموحة (%)" />
                  <FormNumber name="minimumMarginPercent" label="أقل نسبة هامش ربح (%)" />
                  <FormSwitch name="taxIncluded" label="السعر شامل ضريبة القيمة المضافة" />
                </div>
              </div>
            )}

            {/* TAB 7: Batches */}
            {activeTab === 'batches' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">إضافة تشغيلة / وجبة جديدة (Batch)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={newBatchNo}
                      onChange={(e) => setNewBatchNo(e.target.value)}
                      placeholder="رقم الوجبة/التشغيلة"
                      className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                    <input
                      type="date"
                      value={newBatchMfg}
                      onChange={(e) => setNewBatchMfg(e.target.value)}
                      className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                    <input
                      type="date"
                      value={newBatchExp}
                      onChange={(e) => setNewBatchExp(e.target.value)}
                      className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                    <input
                      type="number"
                      value={newBatchQty}
                      onChange={(e) => setNewBatchQty(Number(e.target.value))}
                      placeholder="الكمية"
                      className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <button type="button" onClick={handleAddBatch} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1">
                    <Plus size={14} /> إضافة التشغيلة
                  </button>
                </div>

                <div className="space-y-2">
                  {batches.map((batch) => (
                    <div key={batch.id} className="flex items-center justify-between bg-[#0b0f17] p-3 rounded-xl border border-[#1e293b]">
                      <div>
                        <span className="text-sm font-bold text-amber-400">الوجبة: {batch.batchNumber}</span>
                        <span className="text-xs text-slate-400 block">تاريخ الانتهاء: {batch.expiryDate || 'غير محدد'}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{batch.quantity} قطعة</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 8: Media */}
            {activeTab === 'media' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">رابط الصورة التوضيحية للمنتج</h4>
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

            {/* TAB 9: Accounting & E-Invoice */}
            {activeTab === 'accounting' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                    <h4 className="text-sm font-bold text-rose-400 mb-3">ربط الحسابات (Accounting Links)</h4>
                    <FormInput name="inventoryAccount" label="حساب المخزون (Inventory Account)" placeholder="مثل: 112001" />
                    <FormInput name="salesAccount" label="حساب المبيعات (Sales Account)" placeholder="مثل: 411001" />
                    <FormInput name="purchaseAccount" label="حساب المشتريات (Purchase Account)" placeholder="مثل: 511001" />
                    <FormInput name="cogsAccount" label="حساب تكلفة البضاعة المباعة (COGS)" placeholder="مثل: 512001" />
                    <FormInput name="costCenter" label="مركز التكلفة (Cost Center)" placeholder="مثل: CC-01" />
                  </div>

                  <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                    <h4 className="text-sm font-bold text-amber-400 mb-3">الفاتورة الإلكترونية (ZATCA / ETA)</h4>
                    <FormInput name="gs1Code" label="كود GS1 (الباركود الدولي)" />
                    <FormInput name="etaCode" label="كود EGS / ETA (الضرائب المصرية)" />
                    <FormInput name="zatcaCode" label="كود الزكاة والدخل (ZATCA - السعودية)" />
                    <FormInput name="gtin" label="كود GTIN" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between">
            <span className="text-xs text-slate-500">
              * يتم توثيق وحفظ كارت المنتج وسجل التدقيق فور النقر على حفظ
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <LoadingButton loading={loading} loadingText="جاري الحفظ...">
                حفظ المنتج
              </LoadingButton>
            </div>
          </div>
        </FormProvider>
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
