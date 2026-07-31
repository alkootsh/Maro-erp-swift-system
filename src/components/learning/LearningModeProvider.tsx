import React, { createContext, useContext, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface LearningModeContextType {
  isLearningModeEnabled: boolean;
  toggleLearningMode: () => void;
  showLearningWidget: boolean;
  setShowLearningWidget: (show: boolean) => void;
}

const LearningModeContext = createContext<LearningModeContextType>({
  isLearningModeEnabled: false,
  toggleLearningMode: () => {},
  showLearningWidget: false,
  setShowLearningWidget: () => {},
});

export const useLearningMode = () => useContext(LearningModeContext);

export const LearningModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLearningModeEnabled, setIsLearningModeEnabled] = useState(false);
  const [showLearningWidget, setShowLearningWidget] = useState(false);

  const toggleLearningMode = () => {
    setIsLearningModeEnabled(prev => !prev);
    if (!isLearningModeEnabled) {
      setShowLearningWidget(true);
    } else {
      setShowLearningWidget(false);
    }
  };

  return (
    <LearningModeContext.Provider 
      value={{ 
        isLearningModeEnabled, 
        toggleLearningMode,
        showLearningWidget,
        setShowLearningWidget
      }}
    >
      <div className={isLearningModeEnabled ? "learning-mode-active" : ""}>
        {children}
      </div>

      {isLearningModeEnabled && showLearningWidget && createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-emerald-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-4 shadow-2xl flex items-start gap-4 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <BookOpen size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-emerald-400 font-bold text-sm mb-1">وضع التعلم الذكي مفعل</h3>
              <p className="text-emerald-100/70 text-xs leading-relaxed">
                مرر الماوس فوق أي عنصر أو زر في الشاشة لعرض شرح تفصيلي له، أفضل الممارسات، والأخطاء الشائعة، مع إمكانية مشاهدة فيديوهات توضيحية.
              </p>
              <div className="mt-3 flex gap-2">
                <button 
                  onClick={() => setShowLearningWidget(false)}
                  className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                  إخفاء هذه الرسالة
                </button>
                <button 
                  onClick={toggleLearningMode}
                  className="bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                  إيقاف وضع التعلم
                </button>
              </div>
            </div>
            <button 
              onClick={() => setShowLearningWidget(false)}
              className="text-emerald-400/50 hover:text-emerald-400"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      , document.body)}
    </LearningModeContext.Provider>
  );
};
