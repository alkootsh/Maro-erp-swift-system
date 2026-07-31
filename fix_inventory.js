const fs = require('fs');
let c = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

c = c.replace(/import \{ LayoutTemplate, formatCurrency \} from '\.\.\/lib\/utils';/, "import { LayoutTemplate, formatCurrency } from '../lib/utils';\nimport { SmartTooltip } from '../components/learning/SmartTooltip';");

const target = '<button onClick={() => {';
const replacement = `<SmartTooltip id="add-product" title="إضافة منتج جديد" description="استخدم هذا الزر لتعريف منتج جديد في النظام. يمكنك إدخال البيانات الأساسية، الوحدات، الأسعار، وربط المنتج بالمخازن المختلفة." bestPractice="تأكد من إدخال الباركود وكود المنتج بشكل صحيح لتسهيل عملية البيع." commonMistakes="عدم ربط المنتج بحسابات المبيعات والمخزون يؤدي إلى أخطاء في التقارير المالية." videoUrl="https://youtube.com"><button onClick={() => {`;

c = c.replace(target, replacement);
c = c.replace(/منتج جديد\n          <\/button>/, 'منتج جديد\n          </button></SmartTooltip>');

fs.writeFileSync('src/pages/Inventory.tsx', c);
