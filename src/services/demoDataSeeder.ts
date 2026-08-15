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

  static async generateDemoData(
    businessSize: 'small' | 'enterprise' = 'enterprise',
    sector: 'ceramics' | 'food' | 'electronics' | 'all' = 'all',
    onProgress?: (progress: number, status: string) => void
  ): Promise<void> {
    
    // Save selections for UI customization
    localStorage.setItem('maro_business_size', businessSize);
    localStorage.setItem('maro_business_industry', sector);

    if (onProgress) onProgress(10, 'جاري تهيئة الهيكل الإداري والمستودعات حسب حجم النشاط...');

    // 1. Companies & Branches & Warehouses depending on businessSize
    let companies = [];
    let branches = [];
    let warehouses = [];

    if (businessSize === 'small') {
      companies = [
        { 
          id: 'comp_main', 
          code: 'MARO-MINI', 
          name: 'محل الفارس للتجارة والتجزئة البسيطة', 
          taxNumber: '111-222-333', 
          currency: 'EGP', 
          status: 'active' 
        }
      ];
      branches = [
        { 
          id: 'br_hq', 
          code: 'BR-MINI', 
          name: 'معرض البيع المباشر الوحيد', 
          companyId: 'comp_main', 
          address: 'شارع التسعين، التجمع الخامس، القاهرة', 
          phone: '01012345678' 
        }
      ];
      warehouses = [
        { 
          id: 'wh_main', 
          code: 'WH-MINI', 
          name: 'مخزن المعرض الملحق', 
          branchId: 'br_hq', 
          manager: 'صاحب المحل' 
        }
      ];
    } else {
      // Enterprise
      companies = [
        { id: 'comp_main', code: 'MARO-01', name: 'مجموعة مارو القابضة للاستيراد والتوزيع والتصنيع', taxNumber: '300-400-500', currency: 'EGP', status: 'active' },
        { id: 'comp_retail', code: 'MARO-02', name: 'مارو للتوبريد والتجارة السريعة والسلاسل', taxNumber: '300-400-501', currency: 'EGP', status: 'active' },
      ];
      branches = [
        { id: 'br_hq', code: 'BR-01', name: 'المركز الرئيسي والإدارة العامة - القاهرة', companyId: 'comp_main', address: 'أبراج نايل سيتي، كورنيش النيل، القاهرة', phone: '0233445566' },
        { id: 'br_alex', code: 'BR-02', name: 'فرع الإقليم الشمالي - الإسكندرية', companyId: 'comp_main', address: 'طريق الكورنيش، سموحة، الإسكندرية', phone: '0355667788' },
        { id: 'br_tanta', code: 'BR-03', name: 'فرع دلتا النيل - طنطا', companyId: 'comp_main', address: 'شارع الجلاء، طنطا', phone: '0403344556' },
      ];
      warehouses = [
        { id: 'wh_main', code: 'WH-01', name: 'المستودع اللوجستي المركزي - أكتوبر', branchId: 'br_hq', manager: 'المهندس محمود أحمد' },
        { id: 'wh_retail', code: 'WH-02', name: 'مستودع المعرض والبيع السريع الداخلي', branchId: 'br_hq', manager: 'الأستاذ خالد إبراهيم' },
        { id: 'wh_alex', code: 'WH-03', name: 'مستودع إقليم الإسكندرية الفرعي', branchId: 'br_alex', manager: 'سامح حسن' },
        { id: 'wh_returns', code: 'WH-04', name: 'مستودع المرتجعات والتالف وفحص الجودة', branchId: 'br_hq', manager: 'أحمد فؤاد' },
      ];
    }

    MaroSyncEngine.setLocalCollection('companies', companies);
    MaroSyncEngine.setLocalCollection('branches', branches);
    MaroSyncEngine.setLocalCollection('warehouses', warehouses);

    if (onProgress) onProgress(30, 'جاري بناء تصنيفات الأقسام وتوحيد ماركات الإنتاج المعتمدة...');

    // 2. Categories, Brands, Units depending on selected sector
    let categories = [];
    let brands = [];
    let units = [
      { id: 'un_piece', name: 'قطعة', symbol: 'pcs', factor: 1 }
    ];

    if (sector === 'ceramics' || sector === 'all') {
      categories.push(
        { id: 'cat_ceramics', name: 'سيراميك وبورسلين أرضيات جدران', code: 'CAT-CER', description: 'بلاط السيراميك والبورسلين والجرانيت للأرضيات والأسطح' },
        { id: 'cat_sanitary', name: 'أدوات صحية ومستلزمات سباكة', code: 'CAT-SAN', description: 'خلاطات مياه، مغاسل، أحواض، كبائن دش ومستلزماتها' }
      );
      brands.push(
        { id: 'brd_cleopatra', name: 'سيراميكا كليوباترا - Cleopatra', code: 'BRD-CLEO' },
        { id: 'brd_royal', name: 'سيراميكا رويال - Royal', code: 'BRD-ROY' },
        { id: 'brd_duravit', name: 'ديورافيت ألماني - Duravit', code: 'BRD-DUR' },
        { id: 'brd_grohe', name: 'جروهي ألماني - Grohe', code: 'BRD-GRO' }
      );
      units.push(
        { id: 'un_m2', name: 'متر مربع (م²)', symbol: 'm2', factor: 1 },
        { id: 'un_box', name: 'كرتونة كاملة', symbol: 'box', factor: 1 }
      );
    }

    if (sector === 'food' || sector === 'all') {
      categories.push(
        { id: 'cat_dairy', name: 'ألبان وأجبان ومنتجات طازجة', code: 'CAT-DAIRY', description: 'منتجات ألبان طازجة، أجبان معلبة وتتراباك' },
        { id: 'cat_beverages', name: 'عصائر ومشروبات ومياه معدنية', code: 'CAT-BEV', description: 'مشروبات غازية ومياه وعصائر طبيعية' },
        { id: 'cat_grocery', name: 'مواد بقالة ومواد جافة المعلبات', code: 'CAT-GROC', description: 'بقوليات، معلبات، زيوت، دقيق، أرز' }
      );
      brands.push(
        { id: 'brd_juhayna', name: 'جهينة - Juhayna', code: 'BRD-JUH' },
        { id: 'brd_almarai', name: 'المراعي - Almarai', code: 'BRD-MAR' },
        { id: 'brd_domty', name: 'دومتي للأجبان - Domty', code: 'BRD-DOM' },
        { id: 'brd_pepsi', name: 'بيبسي كولا - Pepsi', code: 'BRD-PEP' }
      );
      units.push(
        { id: 'un_pack', name: 'علبة / عبوة', symbol: 'pack', factor: 1 },
        { id: 'un_carton', name: 'كرتونة تجميعية', symbol: 'ctn', factor: 12 },
        { id: 'un_kg', name: 'كيلوجرام دقيق وأرز', symbol: 'kg', factor: 1 }
      );
    }

    if (sector === 'electronics' || sector === 'all') {
      categories.push(
        { id: 'cat_screens', name: 'شاشات سمارت وتلفزيونات وأجهزة عرض', code: 'CAT-SCR', description: 'شاشات ذكية LED، UHD، OLED وملحقاتها' },
        { id: 'cat_home_appl', name: 'أجهزة منزلية كبيرة وكهربائيات', code: 'CAT-APPL', description: 'ثلاجات، غسالات، بوتاجازات، تكييفات هواء' },
        { id: 'cat_accessories', name: 'إلكترونيات وأجهزة صغيرة وهواتف', code: 'CAT-ACC', description: 'هواتف ذكية، شواحن، كابلات، مصابيح توفير' }
      );
      brands.push(
        { id: 'brd_samsung', name: 'سامسونج كوريا - Samsung', code: 'BRD-SAM' },
        { id: 'brd_lg', name: 'ال جي إلكترونيكس - LG', code: 'BRD-LG' },
        { id: 'brd_toshiba', name: 'توشيبا العربي - Toshiba', code: 'BRD-TOS' },
        { id: 'brd_sharp', name: 'شارب يابان - Sharp', code: 'BRD-SHP' }
      );
      units.push(
        { id: 'un_set', name: 'طقم كامل', symbol: 'set', factor: 1 }
      );
    }

    MaroSyncEngine.setLocalCollection('product_categories', categories);
    MaroSyncEngine.setLocalCollection('brands', brands);
    MaroSyncEngine.setLocalCollection('units', units);

    if (onProgress) onProgress(60, 'جاري توليد المنتجات والأصناف التخصصية حسب القطاع وحجم النشاط...');

    // 3. Products Generator based on Sector
    const generatedProducts = [];
    const countToGenerate = businessSize === 'small' ? 15 : 60;

    let index = 1;

    // A. Seed Ceramics data if selected
    if (sector === 'ceramics' || sector === 'all') {
      const ceramicTemplates = [
        { name: 'سيراميك كليوباترا أرضيات ليزر رويال بيج 60×60 سم', sku: 'CER-6060-ROYAL', price: 195, cost: 155, tileSize: '60×60', grade: 'فرز أول ممتاز', m2PerBox: 1.44, pcsPerBox: 4, lotNumber: 'TONE-A450', category: 'cat_ceramics', brand: 'brd_cleopatra' },
        { name: 'بورسلين مستورد سوبر جلوسي أبيض كلكتا 120×60 سم', sku: 'POR-1260-CALA', price: 440, cost: 360, tileSize: '120×60', grade: 'فرز أول ممتاز', m2PerBox: 1.44, pcsPerBox: 2, lotNumber: 'TONE-B12', category: 'cat_ceramics', brand: 'brd_cleopatra' },
        { name: 'سيراميك الجوهرة جدران كلاسيك كريمي 30×60 سم', sku: 'CER-3060-JAWH', price: 150, cost: 110, tileSize: '30×60', grade: 'فرز ثاني', m2PerBox: 1.62, pcsPerBox: 9, lotNumber: 'TONE-C104', category: 'cat_ceramics', brand: 'brd_royal' },
        { name: 'سيراميك رويال أرضيات باركيه خشبي بني 40×40 سم', sku: 'CER-4040-PARQ', price: 135, cost: 100, tileSize: '40×40', grade: 'فرز ثالث', m2PerBox: 1.60, pcsPerBox: 10, lotNumber: 'TONE-D50', category: 'cat_ceramics', brand: 'brd_royal' },
        { name: 'خلاط مغسلة جروهي يورو سمارت ألماني كروم أصلي', sku: 'SAN-GROHE-EU', price: 1450, cost: 1150, grade: 'فرز أول ممتاز', series: 'Eurosmart Series', category: 'cat_sanitary', brand: 'brd_grohe' },
        { name: 'حوض ديورافيت معلق بالعامود كامل بالمسامير سفيدو', sku: 'SAN-DURA-SEV', price: 1980, cost: 1600, grade: 'فرز أول ممتاز', series: 'Sevedo Series', category: 'cat_sanitary', brand: 'brd_duravit' },
        { name: 'خلاط دش هانز جروهي دفن كروم لامع فاخر شطاف', sku: 'SAN-HANS-SHW', price: 2850, cost: 2300, grade: 'فرز أول ممتاز', series: 'Logis Series', category: 'cat_sanitary', brand: 'brd_grohe' }
      ];

      for (let i = 0; i < Math.min(countToGenerate, ceramicTemplates.length * 3); i++) {
        const temp = ceramicTemplates[i % ceramicTemplates.length];
        const uniqueId = `prod_cer_${index}`;
        const isSanitary = temp.category === 'cat_sanitary';
        
        generatedProducts.push({
          id: uniqueId,
          name: `${temp.name} ${i > 6 ? '#' + (Math.floor(i / 7) + 1) : ''}`,
          sku: `${temp.sku}-${index}`,
          barcodes: [`6221000${String(index).padStart(6, '0')}`],
          price: temp.price,
          costPrice: temp.cost,
          quantity: businessSize === 'small' ? 30 : 150,
          category: temp.category,
          brand: temp.brand,
          unit: isSanitary ? 'قطعة' : 'متر مربع (م²)',
          tileSize: temp.tileSize,
          grade: temp.grade,
          m2PerBox: temp.m2PerBox,
          pcsPerBox: temp.pcsPerBox,
          lotNumber: temp.lotNumber || 'N/A',
          series: (temp as any).series || 'N/A',
          reorderLevel: 5,
          isTaxable: true,
          status: 'active',
          warehouseStocks: [
            { warehouseId: 'wh_main', quantity: businessSize === 'small' ? 30 : 100 }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        index++;
      }
    }

    // B. Seed Food data if selected
    if (sector === 'food' || sector === 'all') {
      const foodTemplates = [
        { name: 'حليب جهينة كامل الدسم عبوة 1 لتر', sku: 'FOD-MILK-JUH', price: 46, cost: 39, category: 'cat_dairy', brand: 'brd_juhayna' },
        { name: 'زبادي المراعي طبيعي طازج 105 جرام', sku: 'FOD-YOG-ALM', price: 9, cost: 7, category: 'cat_dairy', brand: 'brd_almarai' },
        { name: 'جبنة دومتي فيتا تتراباك عبوة 500 جرام', sku: 'FOD-CHZ-DOM', price: 38, cost: 30, category: 'cat_dairy', brand: 'brd_domty' },
        { name: 'بيبسي كولا كانز عبوة معدنية 330 مل', sku: 'FOD-PEPSI-CAN', price: 15, cost: 11, category: 'cat_beverages', brand: 'brd_pepsi' },
        { name: 'عصير جهينة بيور برتقال طبيعي 1 لتر', sku: 'FOD-JUICE-JUH', price: 35, cost: 28, category: 'cat_beverages', brand: 'brd_juhayna' },
        { name: 'زيت عافية ذرة نقي زجاجة 1.6 لتر', sku: 'FOD-OIL-AFIA', price: 165, cost: 135, category: 'cat_grocery', brand: 'brd_almarai' },
        { name: 'أرز الضحى فاخر مغلف وزن 1 كجم مصري', sku: 'FOD-RICE-DOH', price: 38, cost: 31, category: 'cat_grocery', brand: 'brd_almarai' }
      ];

      for (let i = 0; i < Math.min(countToGenerate, foodTemplates.length * 3); i++) {
        const temp = foodTemplates[i % foodTemplates.length];
        const uniqueId = `prod_fod_${index}`;
        
        generatedProducts.push({
          id: uniqueId,
          name: `${temp.name} ${i > 6 ? '#' + (Math.floor(i / 7) + 1) : ''}`,
          sku: `${temp.sku}-${index}`,
          barcodes: [`6222000${String(index).padStart(6, '0')}`],
          price: temp.price,
          costPrice: temp.cost,
          quantity: businessSize === 'small' ? 80 : 400,
          category: temp.category,
          brand: temp.brand,
          unit: temp.sku.includes('MILK') || temp.sku.includes('JUICE') || temp.sku.includes('PEPSI') ? 'علبة / عبوة' : 'قطعة',
          reorderLevel: 15,
          isTaxable: true,
          status: 'active',
          warehouseStocks: [
            { warehouseId: 'wh_main', quantity: businessSize === 'small' ? 80 : 250 }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        index++;
      }
    }

    // C. Seed Electronics data if selected
    if (sector === 'electronics' || sector === 'all') {
      const elecTemplates = [
        { name: 'شاشة سامسونج سمارت 43 بوصة UHD 4K رسيفر مدمج', sku: 'ELC-TV-SAM43', price: 13500, cost: 11800, category: 'cat_screens', brand: 'brd_samsung', serialRequired: true, warrantyMonths: 24 },
        { name: 'تلفزيون ال جي سمارت 55 بوصة OLED نانوسيل سينما', sku: 'ELC-TV-LG55', price: 24500, cost: 21500, category: 'cat_screens', brand: 'brd_lg', serialRequired: true, warrantyMonths: 36 },
        { name: 'ثلاجة شارب ديجيتال نوفروست 450 لتر أسود زجاج', sku: 'ELC-REF-SHP45', price: 34000, cost: 30000, category: 'cat_home_appl', brand: 'brd_sharp', serialRequired: true, warrantyMonths: 60 },
        { name: 'غسالة توشيبا فوق اتوماتيك 10 كيلو سيلفر متطورة', sku: 'ELC-WSH-TOS10', price: 16800, cost: 14500, category: 'cat_home_appl', brand: 'brd_toshiba', serialRequired: true, warrantyMonths: 12 },
        { name: 'تكييف كاريير بارد ساخن اوبتيماكس 1.5 حصان هواء', sku: 'ELC-AC-CAR15', price: 21000, cost: 18500, category: 'cat_home_appl', brand: 'brd_toshiba', serialRequired: true, warrantyMonths: 60 },
        { name: 'شاحن سامسونج سريع بقوة 25 وات بدون سلك تايب سي', sku: 'ELC-CHG-SAM25', price: 450, cost: 320, category: 'cat_accessories', brand: 'brd_samsung', serialRequired: false, warrantyMonths: 6 }
      ];

      for (let i = 0; i < Math.min(countToGenerate, elecTemplates.length * 3); i++) {
        const temp = elecTemplates[i % elecTemplates.length];
        const uniqueId = `prod_elc_${index}`;
        
        generatedProducts.push({
          id: uniqueId,
          name: `${temp.name} ${i > 5 ? '#' + (Math.floor(i / 6) + 1) : ''}`,
          sku: `${temp.sku}-${index}`,
          barcodes: [`6223000${String(index).padStart(6, '0')}`],
          price: temp.price,
          costPrice: temp.cost,
          quantity: businessSize === 'small' ? 10 : 50,
          category: temp.category,
          brand: temp.brand,
          unit: 'قطعة',
          serialRequired: temp.serialRequired,
          warrantyMonths: temp.warrantyMonths,
          reorderLevel: 2,
          isTaxable: true,
          status: 'active',
          warehouseStocks: [
            { warehouseId: 'wh_main', quantity: businessSize === 'small' ? 10 : 30 }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        index++;
      }
    }

    MaroSyncEngine.setLocalCollection('products', generatedProducts);

    if (onProgress) onProgress(80, 'جاري تهيئة قاعدة بيانات الموردين والشركاء التجاريين للمنظومة...');

    // 4. Customers & Suppliers (Scaled to business size)
    const customers = [];
    const suppliers = [];

    const custLimit = businessSize === 'small' ? 3 : 15;
    const supLimit = businessSize === 'small' ? 2 : 10;

    // Standard Customers
    const primaryCustomers = [
      { id: 'cust_1', code: 'CUST-001', name: 'المقاولون العرب للتطوير الإنشائي', phone: '01011223344', address: 'مصر الجديدة، القاهرة', creditLimit: 500000, balance: 125000, type: 'credit' },
      { id: 'cust_2', code: 'CUST-002', name: 'مجموعة النيل للتوريدات والهايبرات', phone: '01122334455', address: 'المهندسين، الجيزة', creditLimit: 200000, balance: 42000, type: 'credit' },
      { id: 'cust_3', code: 'CUST-003', name: 'العميل النقدي السريع المعرض', phone: '01233445566', address: 'سموحة، الإسكندرية', creditLimit: 0, balance: 0, type: 'cash' },
      { id: 'cust_4', code: 'CUST-004', name: 'أبراج النجم الساطع السكنية للتطوير', phone: '01099887766', address: 'القرية الذكية، الجيزة', creditLimit: 800000, balance: 350000, type: 'credit' }
    ];

    for (let i = 0; i < custLimit; i++) {
      const template = primaryCustomers[i % primaryCustomers.length];
      customers.push({
        id: `cust_${i+1}`,
        code: `CUST-${String(i+1).padStart(3, '0')}`,
        name: i < primaryCustomers.length ? template.name : `العميل التجاري المعتمد رقم ${i+1}`,
        phone: i < primaryCustomers.length ? template.phone : `010${Math.floor(10000000 + Math.random() * 90000000)}`,
        address: i < primaryCustomers.length ? template.address : `شارع التسعين، التجمع الخامس، القاهرة`,
        creditLimit: businessSize === 'small' ? 10000 : (template.creditLimit || 50000),
        balance: businessSize === 'small' ? 0 : (template.balance || 0),
        type: i % 2 === 0 ? 'credit' : 'cash'
      });
    }
    MaroSyncEngine.setLocalCollection('customers', customers);

    // Standard Suppliers
    const primarySuppliers = [
      { id: 'sup_1', code: 'SUP-001', name: 'مجموعة شركات كليوباترا جروب للتصنيع', phone: '0238331234', address: 'المنطقة الصناعية، 6 أكتوبر', taxNumber: '400-500-600', balance: 180000 },
      { id: 'sup_2', code: 'SUP-002', name: 'الشركة المصرية الألمانية للأدوات الصحية (ديورافيت)', phone: '0227339999', address: 'المعادي، القاهرة', taxNumber: '400-500-601', balance: 145000 },
      { id: 'sup_3', code: 'SUP-003', name: 'شركة جهينة للصناعات الغذائية الكبرى', phone: '0226998877', address: 'المنطقة اللوجستية، العبور', taxNumber: '400-500-602', balance: 75000 },
      { id: 'sup_4', code: 'SUP-004', name: 'العربي جروب للأجهزة المنزلية والإلكترونيات', phone: '0228330000', address: 'المنطقة الصناعية بقويسنا، المنوفية', taxNumber: '400-500-603', balance: 320000 }
    ];

    for (let i = 0; i < supLimit; i++) {
      const template = primarySuppliers[i % primarySuppliers.length];
      suppliers.push({
        id: `sup_${i+1}`,
        code: `SUP-${String(i+1).padStart(3, '0')}`,
        name: i < primarySuppliers.length ? template.name : `مجموعة توريد معتمدة للتصنيع رقم ${i+1}`,
        phone: i < primarySuppliers.length ? template.phone : `012${Math.floor(10000000 + Math.random() * 90000000)}`,
        address: 'المنطقة الصناعية الأولى، العاشر من رمضان',
        taxNumber: `500-600-${i+1}`,
        balance: businessSize === 'small' ? 5000 : (template.balance || 25000)
      });
    }
    MaroSyncEngine.setLocalCollection('suppliers', suppliers);

    if (onProgress) onProgress(95, 'جاري معالجة القيود المحاسبية الافتتاحية وإطلاق النظام...');

    // 5. Users & Security Roles
    const users = [
      { id: 'usr_admin', username: 'admin', fullName: 'مدير النظام العام (Administrator)', role: 'Administrator', email: 'admin@maro-erp.com', isActive: true },
      { id: 'usr_cashier', username: 'cashier', fullName: 'كاشير المعرض الرئيسي', role: 'Cashier', email: 'cashier@maro-erp.com', isActive: true },
      { id: 'usr_dev', username: 'developer', fullName: 'مهندس مطور النظام (Developer)', role: 'Developer', email: 'dev@maro-erp.com', isActive: true },
    ];
    MaroSyncEngine.setLocalCollection('users', users);

    // 6. Invoices depending on seeded products
    const salesInvoices = [];
    if (generatedProducts.length > 0) {
      const firstProd = generatedProducts[0];
      const secondProd = generatedProducts[1] || firstProd;

      salesInvoices.push({
        id: 'inv_1001',
        invoiceNumber: 'INV-2026-1001',
        date: new Date().toISOString(),
        customerName: customers[0]?.name || 'عميل تجريبي عام',
        items: [
          { productId: firstProd.id, name: firstProd.name, quantity: 5, price: firstProd.price, total: firstProd.price * 5 }
        ],
        subtotal: firstProd.price * 5,
        vatAmount: +(firstProd.price * 5 * 0.14).toFixed(2),
        discount: 0,
        total: +(firstProd.price * 5 * 1.14).toFixed(2),
        paymentType: 'cash',
        status: 'completed',
        cashier: 'كاشير المعرض الرئيسي'
      });

      salesInvoices.push({
        id: 'inv_1002',
        invoiceNumber: 'INV-2026-1002',
        date: new Date().toISOString(),
        customerName: customers[1]?.name || 'عميل تجريبي عام',
        items: [
          { productId: secondProd.id, name: secondProd.name, quantity: 12, price: secondProd.price, total: secondProd.price * 12 }
        ],
        subtotal: secondProd.price * 12,
        vatAmount: +(secondProd.price * 12 * 0.14).toFixed(2),
        discount: 25,
        total: +((secondProd.price * 12 * 1.14) - 25).toFixed(2),
        paymentType: 'credit',
        status: 'completed',
        cashier: 'كاشير المعرض الرئيسي'
      });
    }
    MaroSyncEngine.setLocalCollection('sales_invoices', salesInvoices);

    // 7. Accounting Chart of Accounts
    const accounts = [
      { id: 'acc_101', code: '1010', name: 'النقدية بالخزينة الرئيسية', type: 'asset', balance: businessSize === 'small' ? 50000 : 250000 },
      { id: 'acc_102', code: '1020', name: 'البنك الأهلي المصري - جاري الأعمال', type: 'asset', balance: businessSize === 'small' ? 120000 : 1450000 },
      { id: 'acc_103', code: '1030', name: 'العملاء المدينون للمعرض', type: 'asset', balance: businessSize === 'small' ? 10000 : 350000 },
      { id: 'acc_104', code: '1040', name: 'مخزون السلع العام بالمستودعات', type: 'asset', balance: businessSize === 'small' ? 90000 : 850000 },
      { id: 'acc_201', code: '2010', name: 'الموردون الدائنون للمنظومة', type: 'liability', balance: businessSize === 'small' ? 15000 : 280000 },
      { id: 'acc_301', code: '3010', name: 'رأس المال المودع للتشغيل', type: 'equity', balance: businessSize === 'small' ? 250000 : 2000000 },
      { id: 'acc_401', code: '4010', name: 'إيرادات المبيعات العامة والأرباح', type: 'revenue', balance: businessSize === 'small' ? 45000 : 4500000 },
      { id: 'acc_501', code: '5010', name: 'تكلفة المبيعات والمشتريات المباعة', type: 'expense', balance: businessSize === 'small' ? 31000 : 3100000 },
    ];
    MaroSyncEngine.setLocalCollection('chart_of_accounts', accounts);

    // Activate selected industry module automatically in IndustryModuleEngine
    if (sector !== 'all') {
      const activeModules = MaroSyncEngine.getLocalCollection('active_industry_modules') || [];
      const mId = sector === 'ceramics' ? 'CERAMICS_SANITARY' : sector === 'food' ? 'FOOD_RETAIL' : 'ELECTRONICS_STORE';
      if (!activeModules.some((id: string) => id === mId)) {
        activeModules.push(mId);
        MaroSyncEngine.setLocalCollection('active_industry_modules', activeModules);
      }
    }

    this.markFirstRunCompleted();
    if (onProgress) onProgress(100, 'تمت تهيئة وإطلاق النظام بنجاح تام وفق رغبتك!');
  }

  static async seedAccountingDataset(): Promise<void> {
    return this.generateDemoData('enterprise', 'all');
  }

  static resetDemoData() {
    localStorage.removeItem('maro_erp_first_run_completed');
    localStorage.removeItem('maro_business_size');
    localStorage.removeItem('maro_business_industry');
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith('maro_erp_db_')) {
        localStorage.removeItem(k);
      }
    });
    window.location.reload();
  }
}
