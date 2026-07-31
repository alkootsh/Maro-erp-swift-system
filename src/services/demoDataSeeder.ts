// MARO ERP - Enterprise Demo Data Seeder & First Run Manager
import { MaroSyncEngine } from '../lib/maroSyncEngine';

export class DemoDataSeeder {
  static isFirstRun(): boolean {
    const hasRun = localStorage.getItem('maro_erp_first_run_completed');
    const products = MaroSyncEngine.getLocalCollection('products');
    return !hasRun && products.length === 0;
  }

  static markFirstRunCompleted() {
    localStorage.setItem('maro_erp_first_run_completed', 'true');
  }

  static async generateDemoData(onProgress?: (progress: number, status: string) => void): Promise<void> {
    if (onProgress) onProgress(10, 'جري إعداد الشركات والفروع والمستودعات...');

    // 1. Companies & Branches & Warehouses
    const companies = [
      { id: 'comp_main', code: 'MARO-01', name: 'الشركة المصرية الدولية للتجارة والتوزيع (مارو)', taxNumber: '300-400-500', currency: 'EGP', status: 'active' },
      { id: 'comp_retail', code: 'MARO-02', name: 'مارو للتوبريد والتجارة السريعة', taxNumber: '300-400-501', currency: 'EGP', status: 'active' },
    ];
    MaroSyncEngine.setLocalCollection('companies', companies);

    const branches = [
      { id: 'br_hq', code: 'BR-01', name: 'المركز الرئيسي - القاهرة', companyId: 'comp_main', address: 'شارع الهرم، الجيزة، مصر', phone: '0233445566' },
      { id: 'br_alex', code: 'BR-02', name: 'فرع الإسكندرية', companyId: 'comp_main', address: 'طريق الكورنيش، سموحة، الإسكندرية', phone: '0355667788' },
      { id: 'br_tanta', code: 'BR-03', name: 'فرع طنطا', companyId: 'comp_main', address: 'شارع الجلاء، طنطا', phone: '0403344556' },
      { id: 'br_mansoura', code: 'BR-04', name: 'فرع المنصورة', companyId: 'comp_main', address: 'شارع الجمهورية، المنصورة', phone: '0502233445' },
    ];
    MaroSyncEngine.setLocalCollection('branches', branches);

    const warehouses = [
      { id: 'wh_main', code: 'WH-01', name: 'المستودع الرئيسي - الجيزة', branchId: 'br_hq', manager: 'محمود أحمد' },
      { id: 'wh_retail', code: 'WH-02', name: 'مستودع المعرض والبيع المباشر', branchId: 'br_hq', manager: 'خالد إبراهيم' },
      { id: 'wh_alex', code: 'WH-03', name: 'مستودع إسكندرية', branchId: 'br_alex', manager: 'سامح حسن' },
      { id: 'wh_returns', code: 'WH-04', name: 'مستودع المرتجعات والتالف', branchId: 'br_hq', manager: 'أحمد فؤاد' },
    ];
    MaroSyncEngine.setLocalCollection('warehouses', warehouses);

    if (onProgress) onProgress(30, 'جري توليد التصنيفات والماركات ووحدات القياس...');

    // 2. Categories, Brands, Units
    const categories = [
      { id: 'cat_food', name: 'مواد غذائية', code: 'CAT-01', description: 'أغذية ومعلبات وبقوليات' },
      { id: 'cat_beV', name: 'مشروبات وعصائر', code: 'CAT-02', description: 'مشروبات غازية وعصائر طبيعية' },
      { id: 'cat_dairy', name: 'ألبان وأجبان', code: 'CAT-03', description: 'منتجات ألبان طازجة ومعلبة' },
      { id: 'cat_elec', name: 'إلكترونيات وأجهزة', code: 'CAT-04', description: 'أجهزة منزلية وإلكترونية' },
      { id: 'cat_clean', name: 'منظفات وعناية شخصية', code: 'CAT-05', description: 'منتجات تنظيف منزلية وعناية' },
    ];
    MaroSyncEngine.setLocalCollection('product_categories', categories);

    const brands = [
      { id: 'brd_juhayna', name: 'جهينة - Juhayna', code: 'BRD-01' },
      { id: 'brd_pepsi', name: 'بيبسي - Pepsi', code: 'BRD-02' },
      { id: 'brd_domty', name: 'دومتي - Domty', code: 'BRD-03' },
      { id: 'brd_almarai', name: 'المراعي - Almarai', code: 'BRD-04' },
      { id: 'brd_nestle', name: 'نستله - Nestlé', code: 'BRD-05' },
      { id: 'brd_ariel', name: 'إريال - Ariel', code: 'BRD-06' },
      { id: 'brd_samsung', name: 'سامسونج - Samsung', code: 'BRD-07' },
    ];
    MaroSyncEngine.setLocalCollection('brands', brands);

    const units = [
      { id: 'un_piece', name: 'قطعة', symbol: 'pcs', factor: 1 },
      { id: 'un_box', name: 'علبة', symbol: 'box', factor: 12 },
      { id: 'un_carton', name: 'كرتونة', symbol: 'ctn', factor: 24 },
      { id: 'un_kg', name: 'كيلوجرام', symbol: 'kg', factor: 1 },
    ];
    MaroSyncEngine.setLocalCollection('units', units);

    if (onProgress) onProgress(50, 'جري توليد قاعدة المنتجات والاصناف بالباركود الدولي (EAN13)...');

    // 3. Products (Generate ~100 realistic rich products with EAN13 barcodes)
    const productNames = [
      { ar: 'حليب جهينة كامل الدسم 1 لتر', en: 'Juhayna Full Cream Milk 1L', cat: 'cat_dairy', brand: 'brd_juhayna', price: 45, cost: 38 },
      { ar: 'زبادي جهينة طبيعي 105 جرام', en: 'Juhayna Natural Yogurt 105g', cat: 'cat_dairy', brand: 'brd_juhayna', price: 8, cost: 6 },
      { ar: 'جبنة دومتي تتراباك 500 جرام', en: 'Domty Feta Cheese 500g', cat: 'cat_dairy', brand: 'brd_domty', price: 35, cost: 28 },
      { ar: 'بيبسي كانز 330 مل', en: 'Pepsi Can 330ml', cat: 'cat_beV', brand: 'brd_pepsi', price: 15, cost: 11 },
      { ar: 'مرطبانات نسباك قهوة سريعة الذوبان 200ج', en: 'Nescafé Gold 200g', cat: 'cat_food', brand: 'brd_nestle', price: 220, cost: 185 },
      { ar: 'مسحوق غسيل إريال اتوماتيك 2.5 كجم', en: 'Ariel Automatic Powder 2.5kg', cat: 'cat_clean', brand: 'brd_ariel', price: 180, cost: 145 },
      { ar: 'شاشة سامسونج سمارت 43 بوصة', en: 'Samsung Smart LED TV 43 Inch', cat: 'cat_elec', brand: 'brd_samsung', price: 12500, cost: 10800 },
      { ar: 'عصير جهينة جوافة 1 لتر', en: 'Juhayna Guava Juice 1L', cat: 'cat_beV', brand: 'brd_juhayna', price: 32, cost: 25 },
      { ar: 'جبنة مثلثات دومتي 8 قطع', en: 'Domty Triangles 8 Portions', cat: 'cat_dairy', brand: 'brd_domty', price: 14, cost: 10 },
      { ar: 'مياه معدنية نستله 1.5 لتر', en: 'Nestle Natural Water 1.5L', cat: 'cat_beV', brand: 'brd_nestle', price: 10, cost: 7 },
    ];

    const generatedProducts = [];
    for (let i = 1; i <= 250; i++) {
      const template = productNames[(i - 1) % productNames.length];
      const barcodeNum = `6221234${String(i).padStart(6, '0')}`;
      generatedProducts.push({
        id: `prod_${i}`,
        name: `${template.ar} #${i}`,
        sku: `SKU-PROD-${1000 + i}`,
        barcodes: [barcodeNum],
        price: template.price + (i % 15),
        costPrice: template.cost + (i % 10),
        quantity: 50 + (i * 7) % 350,
        category: template.cat,
        brand: template.brand,
        unit: 'قطعة',
        reorderLevel: 10,
        isTaxable: true,
        status: 'active',
        warehouseStocks: [
          { warehouseId: 'wh_main', quantity: 30 + (i * 5) % 200 },
          { warehouseId: 'wh_retail', quantity: 20 + (i * 2) % 150 }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    MaroSyncEngine.setLocalCollection('products', generatedProducts);

    if (onProgress) onProgress(70, 'جري توليد العملاء والموردين ومندوبي المبيعات...');

    // 4. Customers
    const customers = [
      { id: 'cust_1', code: 'CUST-001', name: 'سوبرماركت النور والبركة', phone: '01011223344', address: 'مصر الجديدة، القاهرة', creditLimit: 50000, balance: 12500, type: 'credit' },
      { id: 'cust_2', code: 'CUST-002', name: 'هايبر ماركت الفيروز', phone: '01122334455', address: 'المهندسين، الجيزة', creditLimit: 100000, balance: 42000, type: 'credit' },
      { id: 'cust_3', code: 'CUST-003', name: 'سوبرماركت الأوائل', phone: '01233445566', address: 'سموحة، الإسكندرية', creditLimit: 25000, balance: 0, type: 'cash' },
      { id: 'cust_4', code: 'CUST-004', name: 'شركة الاستثمار الحديث للتجارة', phone: '01099887766', address: 'القرية الذكية، الجيزة', creditLimit: 200000, balance: 85000, type: 'credit' },
    ];
    // Generate 50 customers total
    for (let i = 5; i <= 50; i++) {
      customers.push({
        id: `cust_${i}`,
        code: `CUST-${String(i).padStart(3, '0')}`,
        name: `العميل التجاري المعتمد رقم ${i}`,
        phone: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
        address: `شارع الملك فهد، مدينة نصر، القاهرة`,
        creditLimit: 30000,
        balance: i % 3 === 0 ? 5000 : 0,
        type: i % 2 === 0 ? 'credit' : 'cash'
      });
    }
    MaroSyncEngine.setLocalCollection('customers', customers);

    // 5. Suppliers
    const suppliers = [
      { id: 'sup_1', code: 'SUP-001', name: 'شركة جهينة للصناعات الغذائية', phone: '0238331234', address: 'السادس من أكتوبر، الجيزة', taxNumber: '400-500-600', balance: 150000 },
      { id: 'sup_2', code: 'SUP-002', name: 'شركة بيبسي كولا مصر', phone: '0227339999', address: 'المعادي، القاهرة', taxNumber: '400-500-601', balance: 88000 },
      { id: 'sup_3', code: 'SUP-003', name: 'مجموعة الصناعات الغذائية (دومتي)', phone: '0226998877', address: 'مدينة نصر، القاهرة', taxNumber: '400-500-602', balance: 45000 },
    ];
    for (let i = 4; i <= 30; i++) {
      suppliers.push({
        id: `sup_${i}`,
        code: `SUP-${String(i).padStart(3, '0')}`,
        name: `المورد المعتمد للتجارة والتوريدات رقم ${i}`,
        phone: `012${Math.floor(10000000 + Math.random() * 90000000)}`,
        address: 'المنطقة الصناعية، العاشر من رمضان',
        taxNumber: `500-600-${i}`,
        balance: 12000
      });
    }
    MaroSyncEngine.setLocalCollection('suppliers', suppliers);

    if (onProgress) onProgress(90, 'جري إنشاء المستخدمين وحسابات الدليل المحاسبي والفواتير...');

    // 6. Users & Security Roles
    const users = [
      { id: 'usr_admin', username: 'admin', fullName: 'مدير النظام العام (Administrator)', role: 'Administrator', email: 'admin@maro-erp.com', isActive: true },
      { id: 'usr_manager', username: 'manager', fullName: 'مدير الفرع المالي', role: 'Manager', email: 'manager@maro-erp.com', isActive: true },
      { id: 'usr_cashier', username: 'cashier', fullName: 'كاشير نقطة البيع الأساسية', role: 'Cashier', email: 'cashier@maro-erp.com', isActive: true },
      { id: 'usr_accountant', username: 'accountant', fullName: 'محاسب عام الشركة', role: 'Accountant', email: 'accountant@maro-erp.com', isActive: true },
      { id: 'usr_dev', username: 'developer', fullName: 'مهندس مطور النظام (Developer)', role: 'Developer', email: 'dev@maro-erp.com', isActive: true },
    ];
    MaroSyncEngine.setLocalCollection('users', users);

    // 7. Initial Sales and Invoices
    const salesInvoices = [
      {
        id: 'inv_1001',
        invoiceNumber: 'INV-2026-1001',
        date: new Date().toISOString(),
        customerName: 'سوبرماركت النور والبركة',
        items: [
          { productId: 'prod_1', name: 'حليب جهينة كامل الدسم 1 لتر #1', quantity: 10, price: 45, total: 450 }
        ],
        subtotal: 450,
        vatAmount: 63,
        discount: 0,
        total: 513,
        paymentType: 'cash',
        status: 'completed',
        cashier: 'كاشير نقطة البيع الأساسية'
      },
      {
        id: 'inv_1002',
        invoiceNumber: 'INV-2026-1002',
        date: new Date().toISOString(),
        customerName: 'هايبر ماركت الفيروز',
        items: [
          { productId: 'prod_4', name: 'بيبسي كانز 330 مل #4', quantity: 50, price: 15, total: 750 }
        ],
        subtotal: 750,
        vatAmount: 105,
        discount: 20,
        total: 835,
        paymentType: 'credit',
        status: 'completed',
        cashier: 'كاشير نقطة البيع الأساسية'
      }
    ];
    MaroSyncEngine.setLocalCollection('sales_invoices', salesInvoices);

    // 8. Accounting Chart of Accounts
    const accounts = [
      { id: 'acc_101', code: '1010', name: 'النقدية بالخزينة الرئيسية', type: 'asset', balance: 250000 },
      { id: 'acc_102', code: '1020', name: 'البنك الأهلي المصري - حساب الجاري', type: 'asset', balance: 1450000 },
      { id: 'acc_103', code: '1030', name: 'العملاء (مدينون)', type: 'asset', balance: 350000 },
      { id: 'acc_104', code: '1040', name: 'مخزون البضاعة العام', type: 'asset', balance: 850000 },
      { id: 'acc_201', code: '2010', name: 'الموردون (دائنون)', type: 'liability', balance: 280000 },
      { id: 'acc_301', code: '3010', name: 'رأس المال الأساسي', type: 'equity', balance: 2000000 },
      { id: 'acc_401', code: '4010', name: 'إيرادات المبيعات العامة', type: 'revenue', balance: 4500000 },
      { id: 'acc_501', code: '5010', name: 'تكلفة البضاعة المباعة', type: 'expense', balance: 3100000 },
    ];
    MaroSyncEngine.setLocalCollection('chart_of_accounts', accounts);

    this.markFirstRunCompleted();
    if (onProgress) onProgress(100, 'تم اكتمال إنشاء البيئة التجريبية بنجاح تام!');
  }

  static resetDemoData() {
    localStorage.removeItem('maro_erp_first_run_completed');
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith('maro_erp_db_')) {
        localStorage.removeItem(k);
      }
    });
    window.location.reload();
  }
}
