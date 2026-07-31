const fs = require('fs');

const path = 'src/components/products/ProductFormModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Insert additional states
const additionalStates = `
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
  
  const [gs1Code, setGs1Code] = useState('');
  const [gtin, setGtin] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [zatcaCode, setZatcaCode] = useState('');
`;

content = content.replace('  // Rich Lists', additionalStates + '\n  // Rich Lists');

// Update useEffect(if editingProduct)
const updateEditingProduct = `
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
      setGtin(editingProduct.gtin || '');
      setHsCode(editingProduct.hsCode || '');
      setZatcaCode(editingProduct.zatcaCode || '');
`;
content = content.replace('      setAttachments(editingProduct.attachments || []);', '      setAttachments(editingProduct.attachments || []);\n' + updateEditingProduct);

// Update else (reset form)
const updateReset = `
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
      setGtin('');
      setHsCode('');
      setZatcaCode('');
`;
content = content.replace('      setAttachments([]);', '      setAttachments([]);\n' + updateReset);

// Update payload
const updatePayload = `
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
`;
content = content.replace('      openingBalance: Number(quantity) || 0,', '      openingBalance: Number(quantity) || 0,\n' + updatePayload);

fs.writeFileSync(path, content);
console.log('Update successful');
