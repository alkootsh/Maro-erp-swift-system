/**
 * @file GuidedTour.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: GuidedTour.tsx.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  Compass, 
  RotateCcw,
  Lightbulb,
  BookOpen,
  Volume2,
  VolumeX,
  Keyboard,
  ShieldCheck,
  Package,
  Layers,
  HelpCircle
} from 'lucide-react';
import { getTourForRoute, TourStep, ScreenTourData } from '../data/guidedTourContent';

export type { TourStep };

const STORAGE_KEY = 'maro_completed_tours_v2';

export const GuidedTour: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const [completedPages, setCompletedPages] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Dynamically resolve tour data for CURRENT active screen
  const currentTourData: ScreenTourData = getTourForRoute(currentPath);
  const steps: TourStep[] = currentTourData.steps || [];

  // Speech synthesis for Arabic tour explanation
  const speakCurrentStep = useCallback((step: TourStep) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = `${step.title}. ${step.description}. ${step.tip ? 'نصيحة: ' + step.tip : ''}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Listen for global custom event to trigger tour for the active screen
  useEffect(() => {
    const handleOpenTourEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ path?: string }>;
      setCurrentStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener('maro:open-tour', handleOpenTourEvent);
    // Expose helper on window object for developer and components
    (window as any).openMaroScreenTour = () => {
      setCurrentStepIndex(0);
      setIsOpen(true);
    };

    return () => {
      window.removeEventListener('maro:open-tour', handleOpenTourEvent);
      delete (window as any).openMaroScreenTour;
    };
  }, []);

  // Keyboard shortcut F1 or Shift+F1 to open tour for current screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If F1 is pressed (prevent default help)
      if (e.key === 'F1') {
        e.preventDefault();
        setCurrentStepIndex(0);
        setIsOpen(prev => !prev);
      }
      if (isOpen) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          handleNext();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          handlePrev();
        } else if (e.key === 'Escape') {
          handleSkip();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, steps.length]);

  // Route change reset or auto-open check
  useEffect(() => {
    stopSpeaking();
    // Do not auto-force open aggressively, but close old modal if path changes
    setIsOpen(false);
    setCurrentStepIndex(0);
  }, [currentPath]);

  const markPageAsCompleted = (path: string) => {
    const updated = { ...completedPages, [path]: true };
    setCompletedPages(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save tour state to localStorage:', e);
    }
  };

  const handleNext = () => {
    stopSpeaking();
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    stopSpeaking();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    stopSpeaking();
    markPageAsCompleted(currentPath);
    setIsOpen(false);
  };

  const handleSkip = () => {
    stopSpeaking();
    markPageAsCompleted(currentPath);
    setIsOpen(false);
  };

  const handleManualStart = () => {
    setCurrentStepIndex(0);
    setIsOpen(true);
  };

  const currentStep = steps[currentStepIndex] || steps[0];

  return (
    <>
      {/* Floating Guided Tour Trigger Widget */}
      {!isOpen && (
        <div className="fixed bottom-20 left-6 z-40 flex items-center gap-2 group animate-in fade-in slide-in-from-bottom-3 duration-300">
          <button
            onClick={handleManualStart}
            id="btn-floating-screen-tour"
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-full shadow-xl shadow-blue-500/25 transition-all duration-200 hover:scale-105 flex items-center gap-2 text-xs font-bold border border-blue-400/40 backdrop-blur-md cursor-pointer"
            title={`جولة تعليمية تفصيلية لشاشة (${currentTourData.pageTitle}) - اضغط F1`}
          >
            <Compass size={18} className="animate-spin-slow group-hover:rotate-45 transition-transform text-blue-200" />
            <span className="font-bold">جولة تعليمية للشاشة</span>
            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded font-mono hidden sm:inline-block">F1</span>
          </button>
        </div>
      )}

      {/* Modal / Tour Spotlight Card */}
      {isOpen && currentStep && (
        <div 
          onClick={handleSkip}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200" 
          dir="rtl"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0f172a] border-2 border-blue-500/40 rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-2xl relative flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden text-right text-slate-100 ring-1 ring-blue-400/20"
          >
            {/* Background Glow Accent */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar Header */}
            <div className="flex items-start justify-between border-b border-slate-800/90 pb-3 mb-3 gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0 border border-blue-400/30">
                  <Compass size={20} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {currentTourData.pageCategory}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      شرح الشاشة الحالية
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-lg font-black text-white mt-1 leading-tight">
                    {currentTourData.pageTitle}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Voice Speaker Button */}
                <button
                  onClick={() => isSpeaking ? stopSpeaking() : speakCurrentStep(currentStep)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isSpeaking 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' 
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                  }`}
                  title={isSpeaking ? 'إيقاف النطق الصوتي' : 'استمع للشرح بالصوت العربي'}
                >
                  {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                <button
                  onClick={handleSkip}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
                  title="إغلاق الجولة"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable middle body content to prevent cutting off controls on mobile */}
            <div className="flex-1 overflow-y-auto my-2 space-y-3 pr-1 pl-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {/* Screen Overview Notice (on First Step) */}
              {currentStepIndex === 0 && currentTourData.overview && (
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 text-[11px] sm:text-xs text-slate-300 flex items-start gap-2.5">
                  <BookOpen size={15} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-blue-300 font-bold ml-1">الدور التشغيلي للشاشة:</strong>
                    {currentTourData.overview}
                  </p>
                </div>
              )}

              {/* Step Card Title & Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-mono text-[11px] font-bold">
                    {currentStepIndex + 1}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {currentStep.title}
                  </h3>
                </div>
                {currentStep.badge && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {currentStep.badge}
                  </span>
                )}
              </div>

              {/* Step Content */}
              <div className="space-y-3">
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed bg-slate-900/50 p-3 sm:p-3.5 rounded-2xl border border-slate-800">
                  {currentStep.description}
                </p>

                {/* Smart Tip */}
                {currentStep.tip && (
                  <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5 text-[11px] sm:text-xs text-amber-200">
                    <Lightbulb size={15} className="text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                    <p className="leading-relaxed">
                      <strong className="text-amber-300 font-bold ml-1">نصيحة ذكية:</strong>
                      {currentStep.tip}
                    </p>
                  </div>
                )}

                {/* Accounting & Inventory Impact Badges */}
                {(currentStep.accountingImpact || currentStep.inventoryImpact || currentStep.shortcut) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {currentStep.accountingImpact && (
                      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 flex items-start gap-2 text-[10px] sm:text-[11px] text-emerald-200">
                        <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-300 block font-bold">الأثر المحاسبي والمالي:</strong>
                          <span>{currentStep.accountingImpact}</span>
                        </div>
                      </div>
                    )}

                    {currentStep.inventoryImpact && (
                      <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-2.5 flex items-start gap-2 text-[10px] sm:text-[11px] text-cyan-200">
                        <Package size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-cyan-300 block font-bold">الأثر المخزني والتشغيلي:</strong>
                          <span>{currentStep.inventoryImpact}</span>
                        </div>
                      </div>
                    )}

                    {currentStep.shortcut && (
                      <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-2.5 flex items-center gap-2 text-[10px] sm:text-[11px] text-purple-200 sm:col-span-2">
                        <Keyboard size={14} className="text-purple-400 shrink-0" />
                        <div>
                          <strong className="text-purple-300 ml-1 font-bold">اختصار لوحة المفاتيح:</strong>
                          <code className="bg-purple-900/60 px-1.5 py-0.5 rounded font-mono text-[9px] text-purple-100 border border-purple-400/30">
                            {currentStep.shortcut}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step Dots & Progress Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 mt-2 shrink-0">
              <div className="flex items-center gap-1.5 order-2 sm:order-1">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      stopSpeaking();
                      setCurrentStepIndex(idx);
                    }}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentStepIndex
                        ? 'w-7 bg-gradient-to-r from-blue-500 to-indigo-500 ring-2 ring-blue-400/40'
                        : idx < currentStepIndex
                        ? 'w-2.5 bg-blue-400/60 hover:bg-blue-400'
                        : 'w-2.5 bg-slate-700 hover:bg-slate-600'
                    }`}
                    title={`انتقال للخطوة ${idx + 1}`}
                  />
                ))}
                <span className="text-xs font-semibold text-slate-400 mr-2">
                  الخطوة {currentStepIndex + 1} من {steps.length}
                </span>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center gap-2 order-1 sm:order-2 justify-end">
                <button
                  onClick={handleSkip}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  إغلاق
                </button>

                {currentStepIndex > 0 && (
                  <button
                    onClick={handlePrev}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors border border-slate-700"
                  >
                    <ChevronRight size={16} />
                    السابق
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] border border-blue-400/30"
                >
                  {currentStepIndex === steps.length - 1 ? (
                    <>
                      <CheckCircle2 size={16} />
                      إنهاء الجولة
                    </>
                  ) : (
                    <>
                      التالي
                      <ChevronLeft size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
