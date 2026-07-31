const fs = require('fs');

const path = 'src/components/products/ProductFormModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const advancedInventoryTab = `
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
`;

const accountingTab = `
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
`;

content = content.replace('          {/* Footer Action Buttons */}', advancedInventoryTab + '\n' + accountingTab + '\n          {/* Footer Action Buttons */}');

// Also, the state 'etaCode' wasn't defined in the first script, let's fix it by adding it
const etaState = `
  const [gs1Code, setGs1Code] = useState('');
  const [etaCode, setEtaCode] = useState('');
`;
content = content.replace("const [gs1Code, setGs1Code] = useState('');", etaState);
content = content.replace("setGs1Code(editingProduct.gs1Code || '');", "setGs1Code(editingProduct.gs1Code || '');\n      setEtaCode(editingProduct.etaCode || '');");
content = content.replace("setGs1Code('');", "setGs1Code('');\n      setEtaCode('');");
content = content.replace("gs1Code,", "gs1Code,\n      etaCode,");

fs.writeFileSync(path, content);
console.log('Tabs appended');
