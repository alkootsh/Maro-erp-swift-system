import { SecurityEngine } from '../../lib/securityEngine';
import { ProductRepository } from '../../repositories/productRepository';
import { MaroEventBus } from '../../lib/eventBus';
import { toast } from 'react-hot-toast';

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
          p.name.includes(actionObj.payload.query) || 
          p.barcode?.includes(actionObj.payload.query)
        );
        return { success: true, results };
        
      case 'NAVIGATE':
        // Window location or react router (needs handling via event bus)
        MaroEventBus.publish('NAVIGATE_INTENT', actionObj.payload.path);
        return { success: true };

      default:
        return { success: false, message: 'Action not supported' };
    }
  }

  private static processLocalCommand(message: string, context: AIContext): AIMessage {
    const msgLower = message.toLowerCase();
    let response = "أنا أعمل في وضع الأوفلاين حالياً. يمكنني تنفيذ أوامر بسيطة مثل: 'فاتورة جديدة'، 'بحث عن منتج'.";
    
    if (msgLower.includes('فاتورة') || msgLower.includes('بيع')) {
      this.executeAction({ action: 'NAVIGATE', payload: { path: '/pos' } }, context);
      response = "تم فتح شاشة نقطة البيع.";
    } else if (msgLower.includes('منتجات') || msgLower.includes('مخزن')) {
      this.executeAction({ action: 'NAVIGATE', payload: { path: '/products' } }, context);
      response = "تم فتح شاشة المنتجات.";
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
