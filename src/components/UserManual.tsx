
import React from 'react';
import { X, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { manualData } from '../data/userManualContent';
import { useLocation } from 'react-router-dom';

interface UserManualProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManual: React.FC<UserManualProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const content = manualData[location.pathname] || { title: 'مساعدة', content: 'لا يوجد دليل لهذه الصفحة حالياً.' };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen size={24} className="text-blue-500" />
            {content.title}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="text-slate-300 leading-relaxed markdown-body">
          <ReactMarkdown>{content.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
