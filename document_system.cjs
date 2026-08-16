
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src');

const modules = {
  'pages': 'واجهات وصفحات النظام (UI Pages)',
  'lib': 'المكتبات والمحركات الأساسية (Core Libraries)',
  'repositories': 'طبقة التعامل مع البيانات (Data Repositories)',
  'services': 'خدمات النظام (Services)',
  'components': 'المكونات القابلة لإعادة الاستخدام (Reusable Components)',
  'types': 'تعريفات الأنواع والبيانات (TypeScript Types)'
};

function getModuleDescription(filePath) {
  for (const [dir, desc] of Object.entries(modules)) {
    if (filePath.includes(path.sep + dir + path.sep)) {
      return desc;
    }
  }
  return 'ملف إضافي في النظام';
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.trim().startsWith('/**')) return; // Already documented

  const fileName = path.basename(filePath);
  const moduleDesc = getModuleDescription(filePath);
  
  const header = `/**
 * @file ${fileName}
 * @module ${moduleDesc}
 * @description ملف جزء من نظام MARO ERP. الوظيفة: ${fileName}.
 */
`;
  
  fs.writeFileSync(filePath, header + content);
  console.log(`Documented: ${fileName}`);
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else {
      processFile(fullPath);
    }
  });
}

walkDir(targetDir);
console.log('Documentation completed successfully.');
