/**
 * @file AIAgentOverlay.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: AIAgentOverlay.tsx.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, Mic, Expand, Minimize2, Loader2, Settings, WifiOff } from 'lucide-react';
import { AIEngine, AIMessage, AIContext } from './AIEngine';
import { useAuth } from '../AuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { MaroEventBus } from '../../lib/eventBus';

export const AIAgentOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const profile = { role: 'admin', displayName: user?.displayName };
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting if empty
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'مرحباً بك في المساعد الذكي لمارو ERP! يمكنني تنفيذ الأوامر نيابة عنك. كيف يمكنني مساعدتك؟',
        timestamp: new Date().toISOString()
      }]);
    }

    // Subscribe to navigation intents
    const unsubNav = MaroEventBus.subscribe('NAVIGATE_INTENT', (event) => {
      navigate(event.payload.path as string);
      setIsOpen(false);
    });

    return () => {
      unsubNav();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isExpanded]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMsg = input.trim();
    setInput('');
    setIsProcessing(true);
    
    // Add user message to UI optimistically
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMsg,
      timestamp: new Date().toISOString()
    }]);

    const context: AIContext = {
      screen: location.pathname,
      user: profile || user,
      branch: 'Main', // get from profile later
      warehouse: 'Main',
      isOffline: !navigator.onLine
    };

    try {
      const response = await AIEngine.processMessage(userMsg, context);
      setMessages(prev => [...prev, response]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'عذراً، حدث خطأ أثناء المعالجة.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleOpen = () => setIsOpen(!isOpen);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  if (!isOpen) {
    return (
      <button 
        onClick={toggleOpen}
        className="fixed bottom-6 left-6 z-[90] w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 transition-transform border border-blue-400/30 group"
      >
        <Sparkles size={24} className="group-hover:animate-spin-slow" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0b0f1a]"></span>
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed z-[100] bg-[#151b2b]/95 backdrop-blur-xl border border-[#1e293b] shadow-2xl flex flex-col transition-all duration-300 overflow-hidden",
      isExpanded 
        ? "inset-4 md:inset-10 rounded-3xl" 
        : "bottom-6 left-6 w-[90vw] md:w-[400px] h-[600px] rounded-3xl"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1e293b] bg-gradient-to-r from-blue-900/20 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">MARO AI Agent</h3>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              {AIEngine.getActiveProvider() === 'local' ? 'وضع الأوفلاين (محلي)' : 'متصل بالشبكة السحابية'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleExpand} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            {isExpanded ? <Minimize2 size={18} /> : <Expand size={18} />}
          </button>
          <button onClick={toggleOpen} className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "mr-auto flex-row-reverse" : "ml-auto")}>
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs",
              msg.role === 'user' ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-blue-600/10 border-blue-500/30 text-blue-400"
            )}>
              {msg.role === 'user' ? 'U' : <Bot size={14} />}
            </div>
            <div className={cn(
              "p-3 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-[#1e293b] border border-[#334155] text-slate-200 rounded-tl-none"
            )}>
              <div className="markdown-body text-xs">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              {msg.isAction && (
                <div className="mt-2 p-2 bg-slate-900/50 rounded-lg border border-emerald-500/30 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                  <Sparkles size={12} />
                  تم تنفيذ إجراء في النظام
                </div>
              )}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-3 max-w-[85%] ml-auto">
             <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <Bot size={14} />
            </div>
            <div className="p-3 bg-[#1e293b] border border-[#334155] rounded-2xl rounded-tl-none text-slate-400 text-xs flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-blue-500" />
              جاري المعالجة...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#1e293b] bg-[#0f172a]/50">
        <div className="relative">
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="اسأل MARO AI أو اطلب تنفيذ إجراء..."
            className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pl-24 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
          />
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button className="p-2 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors">
              <Mic size={16} />
            </button>
            <button 
              onClick={handleSend}
              disabled={isProcessing || !input.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
