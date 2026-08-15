# منصة مارو للأعمال - MARO Business Platform (ERP) v4.0

منصة تخطيط موارد المؤسسات والأعمال التجارية المتقدمة (ERP) ذات التصميم العربي المتطور، المبنية على معمارية Clean Architecture و DDD و Offline-First والمتوافقة مع متطلبات الفوترة الإلكترونية (ZATCA / ETA).

---

## 🚀 دليل التشغيل السريع (Quick Start)

### 1. المتطلبات الأساسية
- Node.js >= 20.x
- npm >= 9.x
- PostgreSQL >= 15.x

### 2. التثبيت والتشغيل المحلي
```bash
# تثبيت الحزم
npm install

# توليد مخطط قاعدة البيانات
npm run db:push

# تشغيل بيئة التطوير المحلية
npm run dev
```

### 3. تشغيل الاختبارات الشاملة (Test Suites)
```bash
# تشغيل كافة اختبارات التحقق والـ FAT والـ Pilot
npm test
```

### 4. البناء الإنتاجي (Production Build)
```bash
npm run build
npm run start
```

---

## 🔒 الأمان وإدارة الجلسات
- **المصادقة**: دعم التحقق عبر بيانات الاعتماد المعتمدة، أكواد PIN للكاشير، وبطاقات الهوية للموظفين.
- **عزل الشركات والفروع (Multi-Tenancy)**: عزل تام على مستوى الاستعلامات وقاعدة البيانات لمنع تسريب البيانات بين المستأجرين (IDOR / BOLA Prevention).
- **التخزين الآمن**: محول تخزين ذكي (`safeStorage`) متوافق مع بيئة الويب والخوادم (Node.js/SSR) مع حماية تامة ضد `ReferenceError: localStorage is not defined`.
- **منع التكرار (Idempotency)**: حماية تامة لترقيم الفواتير والعمليات المتكررة عبر `Idempotency-Key`.

---

## 💾 النسخ الاحتياطي والاستعادة (Backup & Recovery)

### أخذ نسخة احتياطية من قاعدة البيانات:
```bash
pg_dump -U postgres -d maro_erp -F c -b -v -f ./backups/maro_erp_$(date +%Y%m%d_%H%M%S).backup
```

### استعادة قاعدة البيانات:
```bash
pg_restore -U postgres -d maro_erp -v ./backups/maro_erp_TARGET.backup
```
