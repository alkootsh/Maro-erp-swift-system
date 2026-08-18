/**
 * @file ProductFormModal.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: ProductFormModal.tsx - Full Screen Product Master Form
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
  Tag,
  Minus,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  ListFilter,
  ShoppingCart,
  Store,
  Boxes,
  Zap
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
import { MaroSyncEngine } from '../../lib/maroSyncEngine';
import { playSystemChime } from '../../lib/utils';
import { AlertTriangle } from 'lucide-react';

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

const PREDEFINED_UNITS = [
  'قطعة',
  'علبة',
  'كرتونة',
  'طرد',
  'كيس',
  'زجاجة',
  'متر',
  'كيلوجرام',
  'جرام',
  'لتر',
  'ملليلتر',
  'طن',
  'بالته',
  'شريط',
  'أمبول',
  'درزن',
  'صندوق',
  'رول'
];

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

  // Default transaction units state
  const [defaultPurchaseUnitId, setDefaultPurchaseUnitId] = useState<string>('');
  const [defaultRetailUnitId, setDefaultRetailUnitId] = useState<string>('');
  const [defaultWholesaleUnitId, setDefaultWholesaleUnitId] = useState<string>('');

  // New Unit Form States
  const [selectedPresetUnit, setSelectedPresetUnit] = useState<string>('علبة');
  const [customUnitName, setCustomUnitName] = useState<string>('');
  const [newUnitSymbol, setNewUnitSymbol] = useState<string>('');
  const [newUnitFactor, setNewUnitFactor] = useState<number>(10);
  const [newUnitLevel, setNewUnitLevel] = useState<'smallest' | 'medium' | 'largest'>('medium');
  const [newUnitBarcode, setNewUnitBarcode] = useState<string>('');
  const [newUnitSalePrice, setNewUnitSalePrice] = useState<number>(0);
  const [newUnitPurchasePrice, setNewUnitPurchasePrice] = useState<number>(0);

  // Per-unit extra barcode inputs map
  const [unitExtraBarcodeInputs, setUnitExtraBarcodeInputs] = useState<Record<string, string>>({});

  // Other Array inputs
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

  const [hasPlayedWarning, setHasPlayedWarning] = useState(false);

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

  const currentName = methods.watch('name');
  const currentSku = methods.watch('sku');

  const allProducts = MaroSyncEngine.getLocalCollection<ProductMaster>('products');
  const duplicateProduct = currentName?.trim()
    ? allProducts.find(p => (p.name.trim().toLowerCase() === currentName.trim().toLowerCase() || (currentSku && p.sku === currentSku)) && p.id !== editingProduct?.id)
    : null;

  useEffect(() => {
    if (duplicateProduct) {
      if (!hasPlayedWarning) {
        playSystemChime('warning');
        setHasPlayedWarning(true);
      }
    } else {
      setHasPlayedWarning(false);
    }
  }, [duplicateProduct, hasPlayedWarning]);

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

      const loadedUnits = editingProduct.units && editingProduct.units.length > 0 
        ? editingProduct.units 
        : [{ 
            id: 'unit-smallest', 
            name: 'قطعة', 
            symbol: 'قطعة', 
            factor: 1, 
            isBaseUnit: true, 
            unitLevel: 'smallest' as const,
            barcode: editingProduct.barcode || '',
            additionalBarcodes: [],
            salePrice: editingProduct.price || 0,
            purchasePrice: editingProduct.costPrice || 0
          }];

      setUnits(loadedUnits);
      setDefaultPurchaseUnitId(editingProduct.defaultPurchaseUnitId || loadedUnits[0]?.id || '');
      setDefaultRetailUnitId(editingProduct.defaultRetailUnitId || loadedUnits[0]?.id || '');
      setDefaultWholesaleUnitId(editingProduct.defaultWholesaleUnitId || loadedUnits[1]?.id || loadedUnits[0]?.id || '');

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

      const defaultSmallest: ProductUnit = { 
        id: `unit-${Date.now()}-sm`, 
        name: 'قطعة', 
        symbol: 'قطعة', 
        factor: 1, 
        isBaseUnit: true, 
        unitLevel: 'smallest',
        additionalBarcodes: [],
        salePrice: 0,
        purchasePrice: 0
      };

      setUnits([defaultSmallest]);
      setDefaultPurchaseUnitId(defaultSmallest.id);
      setDefaultRetailUnitId(defaultSmallest.id);
      setDefaultWholesaleUnitId(defaultSmallest.id);

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

  // Global keyboard navigation: Enter key moves to next field
  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
        e.preventDefault();
        const form = target.closest('form');
        if (!form) return;
        const elements = Array.from(
          form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
            'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
          )
        );
        const index = elements.indexOf(target as any);
        if (index > -1 && index < elements.length - 1) {
          elements[index + 1].focus();
        }
      }
    }
  };

  // Handlers for Units
  const handleAddUnit = () => {
    const finalName = selectedPresetUnit === '__custom__' ? customUnitName.trim() : selectedPresetUnit;
    if (!finalName) {
      toast.error('يرجى اختيار أو كتابة اسم الوحدة');
      return;
    }

    const isFirst = units.length === 0;
    const unitId = `unit-${Date.now()}`;
    const newUnit: ProductUnit = {
      id: unitId,
      name: finalName,
      symbol: newUnitSymbol.trim() || finalName, // Symbol is OPTIONAL!
      factor: isFirst ? 1 : (Number(newUnitFactor) || 1),
      isBaseUnit: isFirst,
      unitLevel: isFirst ? 'smallest' : newUnitLevel,
      barcode: newUnitBarcode.trim(),
      additionalBarcodes: [],
      salePrice: Number(newUnitSalePrice) || 0,
      purchasePrice: Number(newUnitPurchasePrice) || 0
    };

    const updatedUnits = [...units, newUnit];
    setUnits(updatedUnits);

    if (!defaultPurchaseUnitId) setDefaultPurchaseUnitId(unitId);
    if (!defaultRetailUnitId) setDefaultRetailUnitId(unitId);
    if (!defaultWholesaleUnitId) setDefaultWholesaleUnitId(unitId);

    // Reset inputs
    setSelectedPresetUnit('كرتونة');
    setCustomUnitName('');
    setNewUnitSymbol('');
    setNewUnitFactor(24);
    setNewUnitLevel('largest');
    setNewUnitBarcode('');
    setNewUnitSalePrice(0);
    setNewUnitPurchasePrice(0);
    toast.success(`تمت إضافة وحدة (${finalName}) بنجاح`);
  };

  const handleRemoveUnit = (id: string) => {
    setUnits(units.filter(u => u.id !== id));
    if (defaultPurchaseUnitId === id) setDefaultPurchaseUnitId(units[0]?.id || '');
    if (defaultRetailUnitId === id) setDefaultRetailUnitId(units[0]?.id || '');
    if (defaultWholesaleUnitId === id) setDefaultWholesaleUnitId(units[0]?.id || '');
  };

  const handleUpdateUnitPrimaryBarcode = (unitId: string, barcodeStr: string) => {
    setUnits(units.map(u => u.id === unitId ? { ...u, barcode: barcodeStr } : u));
  };

  const handleAddExtraBarcodeToUnit = (unitId: string) => {
    const codeToAdd = (unitExtraBarcodeInputs[unitId] || '').trim();
    if (!codeToAdd) return;

    setUnits(units.map(u => {
      if (u.id === unitId) {
        const existing = u.additionalBarcodes || [];
        if (existing.includes(codeToAdd) || u.barcode === codeToAdd) {
          toast.error('هذا الباركود مضاف بالفعل لهذه الوحدة');
          return u;
        }
        return {
          ...u,
          additionalBarcodes: [...existing, codeToAdd]
        };
      }
      return u;
    }));

    setUnitExtraBarcodeInputs({ ...unitExtraBarcodeInputs, [unitId]: '' });
    toast.success('تمت إضافة الباركود الإضافي للوحدة');
  };

  const handleRemoveExtraBarcodeFromUnit = (unitId: string, barcodeStr: string) => {
    setUnits(units.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          additionalBarcodes: (u.additionalBarcodes || []).filter(b => b !== barcodeStr)
        };
      }
      return u;
    }));
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
      openingBalance: data.openingBalance || 0,
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
      defaultPurchaseUnitId,
      defaultRetailUnitId,
      defaultWholesaleUnitId,

      barcodes,
      warehouseStocks,
      priceLists,
      batches,
      images,
      attachments,
      needsCompletion: false
    };

    try {
      if (editingProduct) {
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
    <div className="fixed inset-0 z-50 bg-[#0b0f17] flex flex-col w-screen h-screen overflow-hidden p-0 m-0">
      <div className="bg-[#151b2b] w-full h-full flex flex-col overflow-hidden">
        {/* Full-Screen Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-[#1e293b] bg-[#0b0f17] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
              <Package size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">
                {editingProduct ? `تعديل المنتج: ${editingProduct.name}` : 'إضافة منتج جديد (Product Master)'}
              </h3>
              <p className="text-xs text-slate-400">سجل البيانات الشامل للصنف، وحدات القياس (صغرى - متوسطة - كبرى)، والبار كودات المتعددة</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            type="button" 
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#1e293b] transition-colors cursor-pointer"
            title="إغلاق (Esc)"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1 px-8 bg-[#0b0f17] border-b border-[#1e293b] overflow-x-auto text-xs font-bold no-scrollbar shrink-0">
          {[
            { id: 'general', label: 'البيانات الأساسية', icon: Package },
            { id: 'units', label: 'الوحدات والتعبئة (صغرى - متوسطة - كبرى)', icon: Boxes },
            { id: 'barcodes', label: 'الباركودات المتعددة', icon: Barcode },
            { id: 'inventory_advanced', label: 'المخزون والصلاحية', icon: Layers },
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
                className={`py-3.5 px-5 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400 bg-blue-500/10 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Body with Keyboard Navigation Handler */}
        <FormProvider
          methods={methods}
          onSubmit={handleSaveProduct}
          onError={handleFormError}
          className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col justify-between"
        >
          <div className="space-y-6" onKeyDown={handleFormKeyDown}>
            <ValidationSummary
              errors={methods.formState.errors}
              fieldTabMap={FIELD_TAB_MAP}
              onSelectError={handleSelectErrorField}
            />

            {/* TAB 1: General Info */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-in fade-in max-w-7xl mx-auto">
                {/* DYNAMIC DUPLICATE PRODUCT WARNING */}
                {duplicateProduct && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 animate-pulse text-amber-300">
                    <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <p className="font-black text-[11px]">⚠️ تنبيه: اسم المنتج أو الـ SKU مسجل مسبقاً!</p>
                      <p className="text-[10px] text-amber-400/90 leading-relaxed">
                        يوجد منتج مسجل بالفعل يحمل هذا الاسم أو الرمز: <span className="font-black underline text-white">{duplicateProduct.name}</span> (SKU: {duplicateProduct.sku}).
                        يُفضل استخدام اسم/SKU فريد لتفادي تداخل المخزون والأرصدة.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="name"
                    label="اسم المنتج الرئيسي *"
                    placeholder="مثل: شاشة سامسونج 27 بوصة Smart"
                    requiredAsterisk
                    tooltip="اسم المنتج الرئيسي الذي يظهر في الفواتير والتقارير"
                  />
                  <FormInput
                    name="sku"
                    label="رمز المنتج (SKU / Barcode) *"
                    placeholder="رمز فريد للمنتج"
                    requiredAsterisk
                    tooltip="رمز الصنف لتتبع المخزون والبار كود"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput name="nameArabic" label="الاسم بالعربية" placeholder="اسم المنتج باللغة العربية" />
                  <FormInput name="nameEnglish" label="الاسم بالإنجليزية (English Name)" placeholder="Product English Name" />
                  <FormInput name="shortName" label="الاسم المختصر (للطابعة الحرارية والـ POS)" placeholder="اسم مختصر جداً" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormSelect
                    name="category"
                    label="الفئة الرئيسية *"
                    options={categoryOptions}
                    requiredAsterisk
                    onAddClick={() => setQuickAddType('category')}
                  />

                  <FormNumber
                    name="price"
                    label="سعر البيع الأساسي *"
                    requiredAsterisk
                    showStepper={true}
                    min={0}
                  />

                  <FormNumber
                    name="costPrice"
                    label="سعر التكلفة *"
                    requiredAsterisk
                    showStepper={true}
                    min={0}
                  />

                  <FormNumber
                    name="quantity"
                    label="الكمية الافتتاحية الحالية *"
                    requiredAsterisk
                    showStepper={true}
                    min={0}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormNumber
                    name="reorderLevel"
                    label="حد إعادة الطلب (الإنذار)"
                    tooltip="ينبهك النظام عندما يقل المخزون عن هذا الحد"
                    showStepper={true}
                    min={0}
                  />

                  <FormSelect
                    name="status"
                    label="حالة المنتج"
                    options={[
                      { value: 'active', label: 'نشط (متاح للبيع والمشتريات)' },
                      { value: 'draft', label: 'مسودة (تحت المراجعة)' },
                      { value: 'archived', label: 'مؤرشف (غير متاح)' },
                    ]}
                  />

                  <FormSelect
                    name="productType"
                    label="نوع المنتج"
                    options={[
                      { value: 'standard', label: 'قياسي (مخزني)' },
                      { value: 'service', label: 'خدمة (غير مخزني)' },
                      { value: 'combo', label: 'مجمّع (Combo / Kit)' },
                      { value: 'raw_material', label: 'خامة تصنيع (Raw Material)' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormSelect 
                    name="groupId" 
                    label="المجموعة الفرعية" 
                    options={groupOptions} 
                    placeholder="اختر المجموعة" 
                    onAddClick={() => setQuickAddType('group')}
                  />
                  <FormSelect 
                    name="brandId" 
                    label="العلامة التجارية (Brand)" 
                    options={brandOptions} 
                    placeholder="اختر الماركة" 
                    onAddClick={() => setQuickAddType('brand')}
                  />
                  <FormSelect 
                    name="manufacturerId" 
                    label="المصنّع (Manufacturer)" 
                    options={manufacturerOptions} 
                    placeholder="اختر المصنع" 
                    onAddClick={() => setQuickAddType('manufacturer')}
                  />
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

            {/* TAB 2: Units & Packaging (Hierarchical Units: Smallest, Medium, Largest) */}
            {activeTab === 'units' && (
              <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
                
                {/* Section A: Default Transaction Units Configuration */}
                <div className="bg-[#0b0f17] p-5 rounded-2xl border border-blue-500/30 space-y-4 shadow-lg">
                  <div className="flex items-center gap-2 text-blue-400 font-black text-sm">
                    <Zap size={18} />
                    <h4>تحديد وحدات التعامل المعتمدة للصنف (الشراء والبيع بالجملة والتجزئة)</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <ShoppingCart size={14} className="text-emerald-400" />
                        وحدة الشراء الافتراضية
                      </label>
                      <select
                        value={defaultPurchaseUnitId}
                        onChange={(e) => setDefaultPurchaseUnitId(e.target.value)}
                        className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.unitLevel === 'smallest' ? 'الوحدة الصغرى' : u.unitLevel === 'medium' ? 'الوحدة المتوسطة' : 'الوحدة الكبرى'})
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-slate-400 mt-1 block">الوحدة الافتراضية في أومر وفواتير الشراء</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Store size={14} className="text-blue-400" />
                        وحدة بيع التجزئة الافتراضية
                      </label>
                      <select
                        value={defaultRetailUnitId}
                        onChange={(e) => setDefaultRetailUnitId(e.target.value)}
                        className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.unitLevel === 'smallest' ? 'الوحدة الصغرى' : u.unitLevel === 'medium' ? 'الوحدة المتوسطة' : 'الوحدة الكبرى'})
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-slate-400 mt-1 block">الوحدة الافتراضية في شاشة الـ POS ومبيعات التجزئة</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Boxes size={14} className="text-purple-400" />
                        وحدة بيع الجملة الافتراضية
                      </label>
                      <select
                        value={defaultWholesaleUnitId}
                        onChange={(e) => setDefaultWholesaleUnitId(e.target.value)}
                        className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.unitLevel === 'smallest' ? 'الوحدة الصغرى' : u.unitLevel === 'medium' ? 'الوحدة المتوسطة' : 'الوحدة الكبرى'})
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-slate-400 mt-1 block">الوحدة الافتراضية وفواتير بيع الجملة</span>
                    </div>
                  </div>
                </div>

                {/* Section B: Add Unit Form */}
                <div className="bg-[#0b0f17] p-5 rounded-2xl border border-[#1e293b] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-200 flex items-center gap-2">
                      <Plus size={16} className="text-blue-400" />
                      إضافة وحدة قياس جديدة للصنف
                    </h4>
                    <span className="text-xs text-slate-400">اختر الوحدة من الجدول أو أضف وحدة جديدة مخصصة</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Preset Unit Select */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">اسم الوحدة (جدول محدد مسبقاً)</label>
                      <select
                        value={selectedPresetUnit}
                        onChange={(e) => setSelectedPresetUnit(e.target.value)}
                        className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        {PREDEFINED_UNITS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                        <option value="__custom__">+ إضافة اسم وحدة مخصص...</option>
                      </select>
                    </div>

                    {/* Custom Unit Name Input if selected */}
                    {selectedPresetUnit === '__custom__' && (
                      <div>
                        <label className="block text-xs font-bold text-amber-400 mb-1">اسم الوحدة المخصص</label>
                        <input
                          type="text"
                          value={customUnitName}
                          onChange={(e) => setCustomUnitName(e.target.value)}
                          placeholder="اكتب اسم الوحدة..."
                          className="w-full bg-[#151b2b] border border-amber-500/50 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Unit Level */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">المستوى الهيكلي للوحدة</label>
                      <select
                        value={newUnitLevel}
                        onChange={(e) => setNewUnitLevel(e.target.value as any)}
                        className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                      >
                        <option value="smallest">وحدة صغرى (أساسية = 1)</option>
                        <option value="medium">وحدة متوسطة (علبة / شريط)</option>
                        <option value="largest">وحدة كبرى (كرتونة / طرد / بالته)</option>
                      </select>
                    </div>

                    {/* Optional Symbol */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">رمز الوحدة (اختياري)</label>
                      <input
                        type="text"
                        value={newUnitSymbol}
                        onChange={(e) => setNewUnitSymbol(e.target.value)}
                        placeholder="مثل: Pcs, Ctn (اختياري)"
                        className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    {/* Conversion Factor with Stepper buttons */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">معامل التحويل للوحدة الصغرى</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setNewUnitFactor(Math.max(1, newUnitFactor - 1))}
                          className="p-2.5 bg-[#1e293b] hover:bg-slate-700 text-slate-200 rounded-xl"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={newUnitFactor}
                          onChange={(e) => setNewUnitFactor(Number(e.target.value))}
                          placeholder="مثلاً 10 أو 24"
                          className="w-full text-center bg-[#151b2b] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setNewUnitFactor(newUnitFactor + 1)}
                          className="p-2.5 bg-[#1e293b] hover:bg-slate-700 text-slate-200 rounded-xl"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Primary Barcode for Unit */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">الباركود الأساسي للوحدة</label>
                      <input
                        type="text"
                        value={newUnitBarcode}
                        onChange={(e) => setNewUnitBarcode(e.target.value)}
                        placeholder="باركود الوحدة الرئيسي..."
                        className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white font-mono"
                      />
                    </div>

                    {/* Unit Sale Price */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">سعر بيع الوحدة</label>
                      <input
                        type="number"
                        value={newUnitSalePrice}
                        onChange={(e) => setNewUnitSalePrice(Number(e.target.value))}
                        placeholder="سعر البيع..."
                        className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>

                    {/* Unit Purchase Price */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">سعر شراء الوحدة</label>
                      <input
                        type="number"
                        value={newUnitPurchasePrice}
                        onChange={(e) => setNewUnitPurchasePrice(Number(e.target.value))}
                        placeholder="سعر الشراء..."
                        className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      type="button" 
                      onClick={handleAddUnit} 
                      className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-md"
                    >
                      <Plus size={16} /> إضافة هذه الوحدة للصنف
                    </button>
                  </div>
                </div>

                {/* Section C: List of Defined Units Hierarchy */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-200 flex items-center justify-between">
                    <span>جدول تسلسل وحدات الصنف والباركودات المخصصة ({units.length})</span>
                    <span className="text-xs text-slate-400 font-normal">يمكنك تحديد باركودات متعددة لكل وحدة</span>
                  </h4>

                  <div className="grid grid-cols-1 gap-3">
                    {units.map((unit) => {
                      const levelLabel = unit.unitLevel === 'smallest' || unit.isBaseUnit
                        ? 'الوحدة الصغرى (الأساسية)'
                        : unit.unitLevel === 'medium'
                        ? 'الوحدة المتوسطة'
                        : 'الوحدة الكبرى';

                      const levelBadgeColor = unit.unitLevel === 'smallest' || unit.isBaseUnit
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : unit.unitLevel === 'medium'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-purple-500/20 text-purple-400 border-purple-500/30';

                      return (
                        <div key={unit.id} className="bg-[#0b0f17] p-4 rounded-2xl border border-[#1e293b] space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${levelBadgeColor}`}>
                                {levelLabel}
                              </span>
                              <h5 className="text-base font-black text-white">{unit.name}</h5>
                              {unit.symbol && (
                                <span className="text-xs text-slate-400 font-mono">({unit.symbol})</span>
                              )}
                              <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                                {unit.isBaseUnit ? 'معامل التحويل = 1' : `تحتوي على ${unit.factor} من الوحدة الصغرى`}
                              </span>
                            </div>

                            {!unit.isBaseUnit && (
                              <button
                                type="button"
                                onClick={() => handleRemoveUnit(unit.id)}
                                className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                title="حذف الوحدة"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>

                          {/* Primary Barcode & Prices Row */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-[#1e293b]">
                            <div>
                              <span className="text-[11px] font-bold text-slate-400 block mb-1">الباركود الأساسي للوحدة</span>
                              <input
                                type="text"
                                value={unit.barcode || ''}
                                onChange={(e) => handleUpdateUnitPrimaryBarcode(unit.id, e.target.value)}
                                placeholder="أدخل أو امسح الباركود..."
                                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-blue-400 font-mono font-bold"
                              />
                            </div>

                            <div>
                              <span className="text-[11px] font-bold text-slate-400 block mb-1">سعر البيع للوحدة</span>
                              <div className="text-xs font-bold text-emerald-400 bg-[#151b2b] border border-[#1e293b] rounded-lg px-2.5 py-1.5">
                                {unit.salePrice ? `${unit.salePrice} ج.م` : 'حسب التسعير العام'}
                              </div>
                            </div>

                            <div>
                              <span className="text-[11px] font-bold text-slate-400 block mb-1">سعر الشراء للوحدة</span>
                              <div className="text-xs font-bold text-slate-300 bg-[#151b2b] border border-[#1e293b] rounded-lg px-2.5 py-1.5">
                                {unit.purchasePrice ? `${unit.purchasePrice} ج.م` : 'حسب تكلفة الصنف'}
                              </div>
                            </div>
                          </div>

                          {/* Additional Multiple Barcodes Per Unit */}
                          <div className="pt-2">
                            <span className="text-[11px] font-bold text-slate-300 block mb-1.5">الباركودات الإضافية / المتعددة لهذه الوحدة:</span>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {unit.additionalBarcodes && unit.additionalBarcodes.length > 0 ? (
                                unit.additionalBarcodes.map((bc) => (
                                  <span key={bc} className="inline-flex items-center gap-1.5 bg-[#151b2b] border border-[#334155] px-2.5 py-1 rounded-lg text-xs font-mono text-slate-200">
                                    <Barcode size={12} className="text-blue-400" />
                                    {bc}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveExtraBarcodeFromUnit(unit.id, bc)}
                                      className="text-red-400 hover:text-red-300 ml-1 cursor-pointer"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-slate-500 italic">لا توجد باركودات إضافية مضافة</span>
                              )}
                            </div>

                            {/* Add Additional Barcode Inline Input */}
                            <div className="flex items-center gap-2 max-w-md">
                              <input
                                type="text"
                                value={unitExtraBarcodeInputs[unit.id] || ''}
                                onChange={(e) => setUnitExtraBarcodeInputs({ ...unitExtraBarcodeInputs, [unit.id]: e.target.value })}
                                placeholder="إضافة باركود إضافي للوحدة..."
                                className="flex-1 bg-[#151b2b] border border-[#1e293b] rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddExtraBarcodeToUnit(unit.id)}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                              >
                                + إضافة باركود
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Additional General Barcodes */}
            {activeTab === 'barcodes' && (
              <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
                <div className="bg-[#0b0f17] p-5 rounded-2xl border border-[#1e293b] space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">إضافة باركود إضافي آخر للمنتج (عام)</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBarcodeCode}
                      onChange={(e) => setNewBarcodeCode(e.target.value)}
                      placeholder="اكتب رمز الباركود أو امسحه قارئ الباركود..."
                      className="flex-1 bg-[#151b2b] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                    <select
                      value={newBarcodeType}
                      onChange={(e) => setNewBarcodeType(e.target.value as any)}
                      className="bg-[#151b2b] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="EAN13">EAN-13 (دولي)</option>
                      <option value="UPC">UPC</option>
                      <option value="CODE128">Code 128</option>
                      <option value="CUSTOM">مخصص (Custom)</option>
                    </select>
                    <button type="button" onClick={handleAddBarcode} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 rounded-xl flex items-center gap-1.5 cursor-pointer">
                      <Plus size={14} /> إضافة
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {barcodes.map((bc) => (
                    <div key={bc.id} className="flex items-center justify-between bg-[#0b0f17] p-3.5 rounded-xl border border-[#1e293b]">
                      <div>
                        <span className="text-sm font-mono font-bold text-blue-400">{bc.code}</span>
                        <span className="text-[11px] text-slate-500 block">{bc.type} {bc.isPrimary ? '• باركود رئيسي' : ''}</span>
                      </div>
                      <button type="button" onClick={() => setBarcodes(barcodes.filter(b => b.id !== bc.id))} className="text-red-400 hover:text-red-300 p-1 cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Advanced Inventory */}
            {activeTab === 'inventory_advanced' && (
              <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
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
                      <FormNumber name="safetyStock" label="مخزون الأمان (Safety Stock)" showStepper={true} min={0} />
                      <FormNumber name="leadTimeDays" label="فترة التوريد بالأيام (Lead Time)" showStepper={true} min={0} />
                      <FormNumber name="maxStockLevel" label="الحد الأقصى للمخزون" showStepper={true} min={0} />
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

            {/* TAB 5: Warehouses */}
            {activeTab === 'warehouses' && (
              <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
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
                    <button type="button" onClick={handleAddWarehouseStock} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 rounded-lg flex items-center gap-1 cursor-pointer">
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
              <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormNumber name="wholesalePrice" label="سعر الجملة (Wholesale)" showStepper={true} min={0} />
                  <FormNumber name="distributorPrice" label="سعر الموزعين (Distributor)" showStepper={true} min={0} />
                  <FormNumber name="vipPrice" label="سعر كبار العملاء (VIP)" showStepper={true} min={0} />
                  <FormNumber name="maximumDiscountPercent" label="أقصى نسبة خصم مسموحة (%)" showStepper={true} min={0} max={100} />
                  <FormNumber name="minimumMarginPercent" label="أقل نسبة هامش ربح (%)" showStepper={true} min={0} max={100} />
                  <FormSwitch name="taxIncluded" label="السعر شامل ضريبة القيمة المضافة" />
                </div>
              </div>
            )}

            {/* TAB 7: Batches */}
            {activeTab === 'batches' && (
              <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
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
                  <button type="button" onClick={handleAddBatch} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer">
                    <Plus size={14} /> إضافة التشغيلة
                  </button>
                </div>

                <div className="space-y-2">
                  {batches.map((batch) => (
                    <div key={batch.id} className="flex items-center justify-between bg-[#0b0f17] p-3 rounded-xl border border-[#1e293b]">
                      <div>
                        <span className="text-sm font-bold text-white">تشغيلة: {batch.batchNumber}</span>
                        <span className="text-xs text-slate-400 block">انتهاء الصلاحية: {batch.expiryDate || 'غير محدد'}</span>
                      </div>
                      <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg">
                        {batch.quantity} قطعة
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 8: Media */}
            {activeTab === 'media' && (
              <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
                <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">رابط صورة المنتج</h4>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 bg-[#151b2b] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                    />
                    <button type="button" onClick={handleAddImage} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 rounded-lg flex items-center gap-1 cursor-pointer">
                      <Plus size={14} /> إضافة الصورة
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {images.map((img) => (
                    <div key={img.id} className="bg-[#0b0f17] p-2 rounded-xl border border-[#1e293b] relative group">
                      <img src={img.url} alt="Product" className="w-full h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter(i => i.id !== img.id))}
                        className="absolute top-3 right-3 bg-red-600/80 hover:bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 9: Accounting & e-Invoice */}
            {activeTab === 'accounting' && (
              <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
                <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-4">
                  <h4 className="text-sm font-bold text-emerald-400">ربط شجرة الحسابات العامة (GL Accounts)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput name="inventoryAccount" label="حساب المخزون (Inventory Account)" placeholder="مثال: 120101" />
                    <FormInput name="salesAccount" label="حساب المبيعات (Sales Revenue)" placeholder="مثال: 410101" />
                    <FormInput name="purchaseAccount" label="حساب المشتريات (Purchases Account)" placeholder="مثال: 510101" />
                    <FormInput name="cogsAccount" label="حساب تكلفة المبيعات (COGS Account)" placeholder="مثال: 520101" />
                  </div>
                </div>

                <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b] space-y-4">
                  <h4 className="text-sm font-bold text-blue-400">أكواد الفاتورة الإلكترونية (ZATCA / ETA)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput name="gs1Code" label="كود GS1 الدولية" placeholder="مثال: 6281000123456" />
                    <FormInput name="etaCode" label="كود الفاتورة المصرية ETA (EGS)" placeholder="مثال: EG-11111111-..." />
                    <FormInput name="hsCode" label="الرمز الجمركي (HS Code)" placeholder="مثال: 8471.30.00" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Full Screen Fixed Action Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-[#1e293b] bg-[#0b0f17] -mx-8 -mb-8 px-8 py-4 shrink-0 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-[#1e293b] hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              إلغاء التغييرات
            </button>

            <div className="flex items-center gap-3">
              <LoadingButton
                type="submit"
                loading={loading}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-colors"
              >
                <CheckCircle2 size={16} />
                {editingProduct ? 'حفظ التعديلات' : 'اعتماد وتسجيل المنتج'}
              </LoadingButton>
            </div>
          </div>
        </FormProvider>
      </div>

      {/* Quick Add Sub-Modal for Category/Group/Brand/Manufacturer */}
      {quickAddType && (
        <QuickAddModal
          type={quickAddType}
          isOpen={true}
          onClose={() => setQuickAddType(null)}
          categories={categories}
          onSuccess={() => {
            setQuickAddType(null);
          }}
        />
      )}
    </div>
  );
};
