import React from 'react';
import { Flame, Sparkles, Megaphone, Zap, Tag } from 'lucide-react';

interface KioskPromotionalTickerProps {
  tickerText?: string;
  storeName?: string;
}

export const KioskPromotionalTicker: React.FC<KioskPromotionalTickerProps> = ({
  tickerText,
  storeName = 'سوبرماركت مارو الذكي'
}) => {
  const defaultText = '🔥 عروض نهاية الأسبوع الكبرى: خصومات تصل إلى 50% على المواد الغذائية والأجهزة الإلكترونية! ⚡ نقاط مضاعفة 2X في برنامج ولاء العملاء VIP اليوم! 🛒 أسعارك محدثة لحظياً مع منظومة الكاشير والمخازن المركزية.';
  const displayText = tickerText || defaultText;

  return (
    <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-xl border-y border-amber-400/40 py-2.5 px-4 flex items-center gap-3 overflow-hidden select-none">
      <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-1 rounded-full text-xs font-black shrink-0 border border-white/20">
        <Flame size={15} className="text-amber-300 animate-pulse" />
        <span className="text-amber-200">عروض الساعة الحية:</span>
      </div>

      <div className="relative flex-1 overflow-hidden whitespace-nowrap">
        <div className="inline-block animate-marquee font-bold text-xs sm:text-sm tracking-wide text-amber-50">
          <span className="mx-4">{displayText}</span>
          <span className="mx-6 text-amber-300 font-mono">★★★</span>
          <span className="mx-4">{displayText}</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-lg text-[11px] font-black shrink-0 text-white">
        <Sparkles size={13} className="text-yellow-300" />
        <span>{storeName}</span>
      </div>
    </div>
  );
};
