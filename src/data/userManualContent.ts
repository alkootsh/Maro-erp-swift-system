
export interface ManualContent {
  title: string;
  content: string;
}

export const manualData: Record<string, ManualContent> = {
  '/': { 
    title: 'لوحة التحكم', 
    content: '### ملخص الأداء\nاستعرض ملخص المبيعات والمشتريات وحالة المخزون بشكل سريع من هذه الشاشة.' 
  },
  '/pos': { 
    title: 'نقطة البيع', 
    content: '### عمليات البيع\nقم بإتمام عمليات البيع اليومية، مسح الباركود، وإصدار الفواتير.\n\n**نصائح:**\n- استخدم `F1` للمساعدة.\n- اضغط على `F5` للبحث السريع.' 
  },
  '/products': { 
    title: 'إدارة المنتجات', 
    content: '### إدارة المخزون\nأضف، عدل، أو احذف منتجاتك وتابع الأرصدة بدقة من خلال هذه الشاشة.' 
  },
};
