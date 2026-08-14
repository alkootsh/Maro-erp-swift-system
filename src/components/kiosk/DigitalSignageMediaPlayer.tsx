import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Flame, 
  Tag, 
  Barcode, 
  QrCode, 
  ExternalLink,
  Layers,
  Settings,
  ShoppingBag,
  Tv
} from 'lucide-react';
import { PriceCheckerMediaAd, KioskDigitalSignageSettings } from '../../types/digitalSignageAds';
import { DigitalSignageEngine } from '../../services/digitalSignageEngine';
import { formatCurrency, cn } from '../../lib/utils';

interface DigitalSignageMediaPlayerProps {
  onScanPromptClick?: () => void;
  onOpenAdManager?: () => void;
  isFullscreenSignage?: boolean;
  onToggleFullscreen?: () => void;
  customAdList?: PriceCheckerMediaAd[];
  spotlightProductId?: string;
}

export const DigitalSignageMediaPlayer: React.FC<DigitalSignageMediaPlayerProps> = ({
  onScanPromptClick,
  onOpenAdManager,
  isFullscreenSignage = false,
  onToggleFullscreen,
  customAdList,
  spotlightProductId
}) => {
  const [ads, setAds] = useState<PriceCheckerMediaAd[]>([]);
  const [settings, setSettings] = useState<KioskDigitalSignageSettings>(DigitalSignageEngine.getSettings());
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [videoError, setVideoError] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadedAds = customAdList && customAdList.length > 0 
      ? customAdList 
      : DigitalSignageEngine.getActiveAds();
    setAds(loadedAds);
    setSettings(DigitalSignageEngine.getSettings());

    if (spotlightProductId) {
      const targetIdx = loadedAds.findIndex(a => a.targetProductId === spotlightProductId);
      if (targetIdx >= 0) {
        setCurrentIndex(targetIdx);
      }
    }
  }, [customAdList, spotlightProductId]);

  const currentAd: PriceCheckerMediaAd | undefined = ads[currentIndex] || ads[0];

  // Slide advancement logic
  const handleNextSlide = () => {
    if (ads.length === 0) return;
    setVideoError(false);
    setProgressPercent(0);
    setCurrentIndex(prev => (prev + 1) % ads.length);
  };

  const handlePrevSlide = () => {
    if (ads.length === 0) return;
    setVideoError(false);
    setProgressPercent(0);
    setCurrentIndex(prev => (prev - 1 + ads.length) % ads.length);
  };

  // Timer logic for images & video duration tracking
  useEffect(() => {
    if (!currentAd || !isPlaying) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    const durationSeconds = currentAd.type === 'VIDEO'
      ? (currentAd.videoDurationSeconds || 12)
      : (currentAd.displayDurationSeconds || 8);

    const totalMs = durationSeconds * 1000;
    const intervalMs = 100;
    let elapsedMs = 0;

    progressIntervalRef.current = setInterval(() => {
      elapsedMs += intervalMs;
      const pct = Math.min(100, (elapsedMs / totalMs) * 100);
      setProgressPercent(pct);
    }, intervalMs);

    timerRef.current = setTimeout(() => {
      handleNextSlide();
    }, totalMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, currentAd, isPlaying, ads.length]);

  // Handle HTML5 video playback
  useEffect(() => {
    if (currentAd?.type === 'VIDEO' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback: mute and play
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(() => setVideoError(true));
        }
      });
    }
  }, [currentIndex, currentAd, isMuted]);

  if (!currentAd) {
    return (
      <div className="w-full h-80 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
        <p>لا توجد إعلانات نشطة حالياً</p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative rounded-3xl overflow-hidden border-2 shadow-2xl transition-all select-none group flex flex-col justify-between",
        isFullscreenSignage 
          ? "fixed inset-0 z-50 rounded-none border-0 bg-black h-screen w-screen"
          : "bg-slate-950 border-amber-500/40 min-h-[460px] lg:min-h-[540px]"
      )}
    >
      {/* Background Media Container (Video or Image) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black flex items-center justify-center">
        {currentAd.type === 'VIDEO' && !videoError ? (
          <video
            ref={videoRef}
            src={currentAd.mediaUrl}
            poster={currentAd.posterUrl}
            playsInline
            autoPlay
            loop
            muted={isMuted}
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <img
            src={currentAd.mediaUrl}
            alt={currentAd.headlineAr}
            className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
            onError={(e) => {
              // Fallback to high-res retail placeholder if user image link fails
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80';
            }}
          />
        )}

        {/* Ambient Dark Gradient Overlays for High Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/50 pointer-events-none" />
      </div>

      {/* Top Controls & Status Bar */}
      <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {currentAd.badgeTextAr && (
            <span className={cn(
              "px-3.5 py-1.5 rounded-full text-white text-xs sm:text-sm font-black shadow-lg flex items-center gap-1.5 animate-pulse",
              currentAd.badgeColor || "bg-amber-600"
            )}>
              <Flame size={15} />
              <span>{currentAd.badgeTextAr}</span>
            </span>
          )}

          <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-slate-200 border border-white/10 rounded-full text-[11px] font-mono font-bold">
            {currentAd.type === 'VIDEO' ? '🎬 فيديو عالي الدقة HD' : '🖼️ عرض صور ترويجي'}
          </span>

          {currentAd.targetCategory && (
            <span className="px-3 py-1 bg-blue-500/20 backdrop-blur-md text-blue-300 border border-blue-500/30 rounded-full text-[11px] font-bold">
              {currentAd.targetCategory}
            </span>
          )}
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-2">
          {currentAd.type === 'VIDEO' && (
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "p-2.5 rounded-xl backdrop-blur-md transition-all text-white border",
                !isMuted 
                  ? "bg-emerald-600/80 border-emerald-400 text-white shadow-lg shadow-emerald-600/30" 
                  : "bg-black/60 border-white/20 hover:bg-black/80"
              )}
              title={isMuted ? "تشغيل صوت الفيديو" : "كتم الصوت"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 transition-all"
            title={isPlaying ? "إيقاف مؤقت" : "متابعة العرض"}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 transition-all"
              title={isFullscreenSignage ? "الخروج من ملء الشاشة" : "عرض ملء الشاشة (Signage TV Mode)"}
            >
              {isFullscreenSignage ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}

          {onOpenAdManager && (
            <button
              type="button"
              onClick={onOpenAdManager}
              className="p-2.5 rounded-xl bg-amber-600/80 hover:bg-amber-500 backdrop-blur-md text-white border border-amber-400/40 transition-all shadow-lg shadow-amber-600/20"
              title="إدارة الإعلانات والفيديوهات"
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Center Interactive Scan Trigger Cue */}
      <div className="relative z-10 px-6 my-auto text-center space-y-4">
        <button
          type="button"
          onClick={onScanPromptClick}
          className="mx-auto inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-2xl shadow-amber-500/40 border border-amber-300 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Barcode size={24} className="animate-bounce" />
          <span>امسح باركود أي صنف الآن للاستعلام عن السعر والعروض</span>
          <Sparkles size={20} className="text-white" />
        </button>
      </div>

      {/* Bottom Ad Card & Offer Highlights */}
      <div className="relative z-10 p-6 sm:p-8 space-y-4">
        
        {/* Main Promo Details */}
        <div className="bg-[#0b111e]/85 backdrop-blur-xl border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
              {currentAd.headlineAr}
            </h2>
            {currentAd.subHeadlineAr && (
              <p className="text-sm sm:text-base text-amber-200/90 font-medium">
                {currentAd.subHeadlineAr}
              </p>
            )}
            {currentAd.ctaTextAr && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-bold pt-1">
                <Tag size={15} className="text-amber-400" />
                <span>{currentAd.ctaTextAr}</span>
              </div>
            )}
          </div>

          {/* Price Callout or QR Offer Box */}
          <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 md:border-r border-white/10 pt-4 md:pt-0 md:pr-6">
            {currentAd.priceCallout && (
              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-bold block">سعر العرض الحصري:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                    {formatCurrency(currentAd.priceCallout.promoPrice)}
                  </span>
                  {currentAd.priceCallout.originalPrice && (
                    <span className="text-sm text-slate-400 line-through font-mono">
                      {formatCurrency(currentAd.priceCallout.originalPrice)}
                    </span>
                  )}
                </div>
                {currentAd.priceCallout.unitAr && (
                  <span className="text-[10px] text-amber-300 font-mono">/{currentAd.priceCallout.unitAr}</span>
                )}
              </div>
            )}

            {currentAd.qrCodeLink && (
              <div className="p-2 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center shrink-0">
                <QrCode size={48} className="text-slate-900" />
                <span className="text-[9px] font-black text-slate-900 mt-0.5">امسح للكوبون</span>
              </div>
            )}
          </div>
        </div>

        {/* Carousel Slide Indicators & Navigation Bar */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevSlide}
              className="p-2 rounded-xl bg-black/60 hover:bg-black/90 text-slate-200 border border-white/10 transition-all hover:scale-105"
              title="الإعلان السابق"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              className="p-2 rounded-xl bg-black/60 hover:bg-black/90 text-slate-200 border border-white/10 transition-all hover:scale-105"
              title="الإعلان التالي"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2">
            {ads.map((ad, idx) => (
              <button
                key={ad.id}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setProgressPercent(0);
                }}
                className={cn(
                  "h-2 rounded-full transition-all",
                  idx === currentIndex 
                    ? "w-8 bg-amber-500 shadow-md shadow-amber-500/50" 
                    : "w-2 bg-white/30 hover:bg-white/60"
                )}
                title={ad.titleAr}
              />
            ))}
          </div>

          {/* Time Progress Bar */}
          <div className="w-28 sm:w-40 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
