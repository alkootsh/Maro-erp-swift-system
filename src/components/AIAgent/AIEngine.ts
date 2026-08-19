/**
 * @file AIEngine.ts
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: AIEngine.ts.
 */
import { SecurityEngine } from '../../lib/securityEngine';
import { ProductRepository } from '../../repositories/productRepository';
import { MaroEventBus } from '../../lib/eventBus';
import { toast } from 'react-hot-toast';
import { DEFAULT_KNOWLEDGE_ARTICLES } from '../../services/smartSupportEngine';
import { BehaviorAnalyticsEngine } from '../../services/behaviorKnowledgeEngine';

export interface AIProvider {
  id: 'gemini' | 'openai' | 'claude' | 'ollama' | 'local';
  name: string;
  isAvailable: boolean;
}

export interface AIContext {
  screen: string;
  user: any;
  branch: string;
  warehouse: string;
  isOffline: boolean;
  selectedEntityId?: string; // like customer id or product id on screen
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isAction?: boolean;
  actionResult?: any;
}

export class AIEngine {
  private static providers: AIProvider[] = [
    { id: 'gemini', name: 'Google Gemini', isAvailable: true },
    { id: 'openai', name: 'OpenAI GPT-4', isAvailable: false },
    { id: 'claude', name: 'Anthropic Claude', isAvailable: false },
    { id: 'ollama', name: 'Local Ollama', isAvailable: false },
    { id: 'local', name: 'Offline Engine', isAvailable: true },
  ];

  private static activeProviderId: string = 'gemini';
  private static conversationHistory: AIMessage[] = [];

  public static getProviders() {
    return this.providers;
  }

  public static setActiveProvider(id: string) {
    this.activeProviderId = id;
  }

  public static getActiveProvider() {
    return this.activeProviderId;
  }

  public static getHistory() {
    return this.conversationHistory;
  }

  public static clearHistory() {
    this.conversationHistory = [];
  }

  public static async processMessage(
    message: string, 
    context: AIContext
  ): Promise<AIMessage> {
    const userMsg: AIMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    this.conversationHistory.push(userMsg);

    try {
      // Offline fallback handling
      if (context.isOffline || this.activeProviderId === 'local') {
        return this.processLocalCommand(message, context);
      }

      // Prepare context string
      const systemContext = `
You are MARO AI, an advanced, highly capable ERP Agent embedded inside MARO Business Platform.
Current Context:
- Screen: ${context.screen}
- User: ${context.user?.email} (Role: ${context.user?.role})
- Offline Mode: ${context.isOffline}

You can execute ERP operations by outputting ONLY a JSON block if you intend to take an action. 
Valid actions:
1. {"action": "CREATE_INVOICE", "payload": {"total": 0}}
2. {"action": "SEARCH_PRODUCT", "payload": {"query": "..."}}
3. {"action": "NAVIGATE", "payload": {"path": "..."}}

If you just want to talk, output regular text. Do not wrap regular text in JSON.
`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this.conversationHistory.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
          context: systemContext
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      let assistantMsgContent = data.text || '';
      let isAction = false;
      let actionResult = null;

      // Check if it's a JSON action
      try {
        if (assistantMsgContent.trim().startsWith('{') && assistantMsgContent.trim().endsWith('}')) {
          const actionObj = JSON.parse(assistantMsgContent);
          if (actionObj.action) {
            isAction = true;
            actionResult = await this.executeAction(actionObj, context);
            assistantMsgContent = `تم تنفيذ الإجراء: ${actionObj.action}`;
          }
        }
      } catch (e) {
        // Not a JSON action, just regular text
      }

      const assistantMsg: AIMessage = {
        role: 'assistant',
        content: assistantMsgContent,
        timestamp: new Date().toISOString(),
        isAction,
        actionResult
      };

      this.conversationHistory.push(assistantMsg);
      return assistantMsg;

    } catch (error) {
      console.error('AIEngine Error:', error);
      // Fallback to local
      return this.processLocalCommand(message, context);
    }
  }

  private static async executeAction(actionObj: any, context: AIContext) {
    // RBAC Check via SecurityEngine
    const userRole = context.user?.role || 'cashier'; // Default to lowest
    
    switch (actionObj.action) {
      case 'CREATE_INVOICE':
        if (userRole !== 'admin' && userRole !== 'cashier') {
          throw new Error('غير مصرح لك بإنشاء فواتير');
        }
        MaroEventBus.publish('CREATE_NEW_INVOICE_INTENT', actionObj.payload);
        return { success: true, message: 'تم فتح شاشة الفاتورة الجديدة' };

      case 'SEARCH_PRODUCT':
        const products = await ProductRepository.getProducts();
        const results = products.filter(p => 
          p.name.includes(actionObj.payload?.query || '') || 
          p.barcode?.includes(actionObj.payload?.query || '')
        );
        return { success: true, results };

      case 'CREATE_WORK_ORDER':
        MaroEventBus.publish('NAVIGATE_INTENT', { path: '/manufacturing' });
        return { success: true, message: 'تم فتح شاشة إدارة التصنيع والإنتاج لإصدار أمر تشغيل جديد' };

      case 'RUN_FINANCIAL_HEALTH_CHECK':
        MaroEventBus.publish('NAVIGATE_INTENT', { path: '/reports' });
        return { success: true, message: 'تم فتح التحليلات المالية ومؤشرات الأداء المالي' };

      case 'STOCK_ANOMALY_CHECK':
        MaroEventBus.publish('NAVIGATE_INTENT', { path: '/inventory' });
        return { success: true, message: 'تم الانتقال لمركز حركة المخزون وتتبع الأرصدة' };
        
      case 'NAVIGATE':
        // Window location or react router (needs handling via event bus)
        MaroEventBus.publish('NAVIGATE_INTENT', { path: actionObj.payload?.path || actionObj.payload });
        return { success: true };

      default:
        return { success: false, message: 'Action not supported' };
    }
  }

  private static processLocalCommand(message: string, context: AIContext): AIMessage {
    const msgLower = message.toLowerCase().trim();
    let response = "أنا مساعد مارو الذكي للمؤسسات (MARO Enterprise Copilot). استفسر عن أي عملية في النظام، البيع، الميزان، الحسابات، أو التصفير وسأجيبك فوراً بدقة وافية.";

    // 1. Check knowledge articles first for exact or semantic matches
    const matchedArticle = DEFAULT_KNOWLEDGE_ARTICLES.find(article => {
      const inTitle = article.titleArabic.toLowerCase().includes(msgLower) || article.title.toLowerCase().includes(msgLower);
      const inSymptoms = article.symptoms.some(s => msgLower.includes(s.toLowerCase()) || s.toLowerCase().includes(msgLower));
      const inTags = article.tags.some(t => msgLower.includes(t.toLowerCase()));
      return inTitle || inSymptoms || inTags;
    });

    if (matchedArticle) {
      response = `### 💡 ${matchedArticle.titleArabic}\n\n${matchedArticle.solutionArabic}\n\n` +
        `**خطوات التشخيص والحل التفاعلي:**\n` +
        matchedArticle.diagnosticSteps.map(s => `${s.step}. **${s.title}**: ${s.instruction}`).join('\n') +
        `\n\n📌 **حلول بديلة:**\n` +
        matchedArticle.alternativeSolutions.map(alt => `- ${alt}`).join('\n');

      // Check if we should trigger an action automatically
      if (matchedArticle.module === 'POS') {
        if (msgLower.includes('ميزان') || msgLower.includes('مسطرة')) {
          this.executeAction({ action: 'NAVIGATE', payload: { path: '/pos' } }, context);
        }
      } else if (matchedArticle.module === 'ACCOUNTING') {
        this.executeAction({ action: 'NAVIGATE', payload: { path: '/reports' } }, context);
      } else if (matchedArticle.module === 'SECURITY_LICENSING') {
        this.executeAction({ action: 'NAVIGATE', payload: { path: '/settings' } }, context);
      }
    } else if (msgLower.includes('برد') || msgLower.includes('كحة') || msgLower.includes('ضغط') || msgLower.includes('صيدل') || msgLower.includes('مريض') || msgLower.includes('علاج') || msgLower.includes('دواء')) {
      if (msgLower.includes('ضغط') || msgLower.includes('هايبرتنشن')) {
        response = `### 🩺 توجيه الوكيل الصيدلاني السريري (Clinical Triage):\n\n**حالة المريض:** نزلة برد / احتقان لمريض يعاني من **ارتفاع ضغط الدم (Hypertension)**.\n\n#### ⚠️ محاذير أمان حاسمة (Contraindications):\n- **ممنوع تماماً:** أدوية البرد المركبة (مثل Congestal, Cold-Free, 123, Flumox, Comtrex) لاحتوائها على **Pseudoephedrine / Phenylephrine**، حيث تسبب انقباض الأوعية الدموية وارتفاعاً حاداً ومفاجئاً في ضغط الدم.\n\n#### 💊 البروتوكول العلاجي الآمن من مخزون الصيدلية:\n1. **بانادول أزرق 500 مجم (Panadol Blue)**: قرص كل 8 ساعات بعد الأكل (باراسيتامول نقي آمن للضغط).\n2. **تلفاست 120 مجم (Telfast 120mg)**: قرص واحد يومياً مساءً لإزالة الرشح والعطس.\n3. **بخاخ ماء بحر طبيعي فزيومير (Physiomer)**: بخة في كل فتحة أنف 3 مرات يومياً لإزالة الاحتقان طبيعياً.\n4. **أقراص استحلاب ستربسلز (Strepsils)**: قرص كل 4 ساعات لتلطيف الحلق.\n\n👉 يمكنك فتح موديول **وكيل الذكاء الاصطناعي الصيدلاني** لتحويل الأدوية مباشرة لسلة الكاشير (POS).`;
      } else if (msgLower.includes('بلغم') || msgLower.includes('كحة')) {
        response = `### 🩺 توجيه الوكيل الصيدلاني السريري (Clinical Triage):\n\n**الأسئلة السريرية الواجب توجيهها للمريض للوصول للوصف الدقيق:**\n1. هل الكحة جافة (Dry) أم رطبة مصحوبة ببلغم ومخاط (Productive)؟\n2. هل المريض يعاني من ربو، سكري، أو قرحة معدة؟\n3. هل توجد حرارة مرتفعة (> 38.5) أو ضيق في التنفس؟\n\n#### 💊 التوصية الدوائية الفورية:\n- **في حال كحة ببلغم:** كيس فوار **أسيتيل سيستايين 600 مجم (Acetylcysteine)** مرتين يومياً + شراب ميكوسولفان (Mucosolvan).\n- **في حال كحة جافة مهيجة:** شراب **نوتوسيل (Notussil)** أو إكسير برونشيكم أعشاب طبيعية (Bronchicum).`;
      } else {
        response = `### 🩺 بروتوكول التوجيه الصيدلاني السريري:\nعند استقبال مريض يشتكي من أعراض مرضية، يبدأ الوكيل بتوجيهك بأسئلة الفحص الأولي:\n1. **الفئة والعمر:** طفل / بالغ / سيدة حامل أو مرضع / مسن.\n2. **الأمراض المزمنة:** هل يعاني من ضغط دم، سكري، ربو، أو قرحة معدة؟\n3. **نوع الأعراض ومدتها:** استبعاد موانع الاستعمال وتحديد العلاج الآمن OTC مع الجرعات.`;
      }
    } else if (msgLower.includes('فاتورة') || msgLower.includes('بيع') || msgLower.includes('كاشير')) {
      this.executeAction({ action: 'NAVIGATE', payload: { path: '/pos' } }, context);
      response = "تم فتح شاشة نقطة البيع السريعة (POS). يمكنك البدء بإصدار الفواتير أو استخدام زر المسطرة (Space) لأصناف الميزان.";
    } else if (msgLower.includes('تصنيع') || msgLower.includes('تشغيل') || msgLower.includes('إنتاج') || msgLower.includes('bom')) {
      this.executeAction({ action: 'NAVIGATE', payload: { path: '/manufacturing' } }, context);
      response = "تم فتح وحدة إدارة التصنيع وأوامر التشغيل (MRP & Production).";
    } else if (msgLower.includes('تقرير') || msgLower.includes('أرباح') || msgLower.includes('مالية') || msgLower.includes('مبيعات')) {
      this.executeAction({ action: 'NAVIGATE', payload: { path: '/reports' } }, context);
      response = "تم فتح مركز التقارير والتحليلات المالية الشاملة.";
    } else if (msgLower.includes('مصمم') || msgLower.includes('تصميم تقرير')) {
      this.executeAction({ action: 'NAVIGATE', payload: { path: '/reports/designer' } }, context);
      response = "تم فتح مصمم التقارير المتقدم بالسحب والإفلات.";
    } else if (msgLower.includes('منتجات') || msgLower.includes('مخزن') || msgLower.includes('أصناف')) {
      this.executeAction({ action: 'NAVIGATE', payload: { path: '/products' } }, context);
      response = "تم فتح شاشة إدارة المنتجات وقائمة الأصناف.";
    } else if (msgLower.includes('نسخ') || msgLower.includes('تصفير') || msgLower.includes('إعدادات')) {
      this.executeAction({ action: 'NAVIGATE', payload: { path: '/settings' } }, context);
      response = "تم الانتقال لشاشة إعدادات النظام للتحكم في النسخ الاحتياطي، الجدولة، وتصفير البيانات.";
    }

    const assistantMsg: AIMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    };
    this.conversationHistory.push(assistantMsg);
    return assistantMsg;
  }
}
