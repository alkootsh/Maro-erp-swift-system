import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Check, PlayCircle, FileText, BrainCircuit, ExternalLink, Lightbulb, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface SmartTooltipProps {
  id: string;
  title: string;
  description: string;
  bestPractice?: string;
  commonMistakes?: string;
  videoUrl?: string;
  docUrl?: string;
  children: React.ReactNode;
}

export const SmartTooltip: React.FC<SmartTooltipProps> = ({
  id,
  title,
  description,
  bestPractice,
  commonMistakes,
  videoUrl,
  docUrl,
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        // Calculate position - simple positioning for now
        setPosition({
          top: rect.bottom + window.scrollY + 10,
          left: rect.left + window.scrollX + (rect.width / 2)
        });
        setIsVisible(true);
      }
    }, 500); // 500ms delay to prevent accidental hovers
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Add small delay before hiding to allow moving mouse to tooltip
    setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  return (
    <div 
      className="inline-block relative" 
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && createPortal(
        <div 
          className="fixed z-[9999] w-80 bg-[#151b2b] border border-[#1e293b] rounded-xl shadow-2xl p-4 text-right animate-in fade-in slide-in-from-top-2 pointer-events-auto"
          style={{ 
            top: `${position.top}px`, 
            left: `${position.left}px`,
            transform: 'translateX(-50%)'
          }}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#151b2b] border-t border-l border-[#1e293b] rotate-45"></div>
          
          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2 border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Lightbulb size={16} />
                </div>
                <h4 className="font-bold text-white text-sm">{title}</h4>
              </div>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              {description}
            </p>

            {bestPractice && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                  <Check size={14} />
                  <span className="text-[10px] uppercase tracking-wider">أفضل الممارسات (Best Practice)</span>
                </div>
                <p className="text-[11px] text-emerald-200/70">{bestPractice}</p>
              </div>
            )}

            {commonMistakes && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold mb-1">
                  <AlertTriangle size={14} />
                  <span className="text-[10px] uppercase tracking-wider">أخطاء شائعة (Common Mistakes)</span>
                </div>
                <p className="text-[11px] text-rose-200/70">{commonMistakes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-[#1e293b]">
              <button className="flex items-center justify-center gap-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded-lg py-1.5 text-xs font-bold transition-colors">
                <BrainCircuit size={12} className="text-purple-400" />
                شرح AI
              </button>
              {videoUrl && (
                <button className="flex items-center justify-center gap-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded-lg py-1.5 text-xs font-bold transition-colors">
                  <PlayCircle size={12} className="text-blue-400" />
                  شرح فيديو
                </button>
              )}
              {docUrl && (
                <button className="flex items-center justify-center gap-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded-lg py-1.5 text-xs font-bold transition-colors">
                  <FileText size={12} className="text-amber-400" />
                  دليل الاستخدام
                </button>
              )}
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};
