import React from 'react';
import { X, BookOpen, Compass, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { manualData } from '../data/userManualContent';
import { getTourForRoute } from '../data/guidedTourContent';
import { useLocation } from 'react-router-dom';

interface UserManualProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManual: React.FC<UserManualProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const screenTour = getTourForRoute(location.pathname);
  
  const content = manualData[location.pathname] || { 
    title: screenTour.pageTitle || 'دليل استخدام الشاشة', 
    content: `### ${screenTour.pageTitle}\n\n**التصنيف:** ${screenTour.pageCategory}\n\n${screenTour.overview}\n\n### أهم محتويات الشاشة:\n` +
      screenTour.steps.map((s, i) => `${i + 1}. **${s.title}**: ${s.description}`).join('\n\n')
  };

  if (!isOpen) return null;

  const handleStartTour = () => {
    onClose();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('maro:open-tour'));
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-[#0f172a] border border-blue-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-slate-200">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen size={22} className="text-blue-400" />
            {content.title}
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="text-slate-300 text-sm leading-relaxed max-h-[60vh] overflow-y-auto pl-2 mb-4 space-y-3">
          <div className="markdown-body">
            <ReactMarkdown>{content.content}</ReactMarkdown>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleStartTour}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
          >
            <Compass size={16} />
            <span>ابدأ الجولة الإرشادية التفاعلية للشاشة</span>
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
