/**
 * @file digitalSignageAds.ts
 * @module تعريفات الأنواع والبيانات (TypeScript Types)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: digitalSignageAds.ts.
 */
// MARO ERP - Digital Signage & Price Checker Media Hub Types
// Master Enterprise Digital Signage & Media Advertising Protocol v4.0

export type MediaType = 'VIDEO' | 'IMAGE_SLIDE' | 'HTML5_BANNER' | 'PRODUCT_SPOTLIGHT';
export type AdLayoutStyle = 'FULLSCREEN' | 'SPLIT_SIDEBAR' | 'BANNER_BOTTOM' | 'PICTURE_IN_PICTURE';

export interface PriceCheckerMediaAd {
  id: string;
  titleAr: string;
  titleEn?: string;
  type: MediaType;
  mediaUrl: string; // Video MP4/WebM URL or Image URL
  posterUrl?: string; // Poster thumbnail for video
  displayDurationSeconds: number; // For images/banners (e.g. 6-12s)
  videoDurationSeconds?: number;
  badgeTextAr?: string; // e.g. "خصم 30% فوري", "عرض خاص", "طازج يومياً", "جديد 2026"
  badgeColor?: string; // Tailwind color class or hex
  headlineAr: string;
  subHeadlineAr?: string;
  ctaTextAr?: string; // e.g. "متوفر الآن في قسم الأغذية الطازجة", "امسح الباركود للاستعلام"
  qrCodeLink?: string; // URL for scanning app offer / coupon
  priceCallout?: {
    originalPrice?: number;
    promoPrice: number;
    currency: string;
    unitAr?: string;
  };
  targetCategory?: string; // e.g. "مشروبات", "إلكترونيات", "ألبان وأجبان"
  targetProductId?: string; // Links directly to a specific product
  isActive: boolean;
  displayOrder: number;
  validFrom?: string;
  validUntil?: string;
  soundEnabledByDefault: boolean;
  layoutStyle: AdLayoutStyle;
  createdAt: string;
  updatedAt: string;
}

export interface KioskDigitalSignageSettings {
  id: string;
  storeNameAr: string;
  kioskNameAr: string;
  idleTimeoutSeconds: number; // Seconds of inactivity before triggering video ads
  mediaPlayMode: 'CYCLE_ALL' | 'VIDEO_ONLY' | 'IMAGE_SLIDESHOW' | 'SPLIT_INFO_MEDIA';
  allowVideoSound: boolean;
  videoSoundVolumePercent: number;
  showTickerBar: boolean;
  tickerTextAr: string;
  welcomeMessageAr: string;
  enableCustomerFeedback: boolean;
  themeStyle: 'DARK_LUXURY' | 'AMBER_WARM' | 'EMERALD_FRESH' | 'OCEAN_BLUE';
  autoTransitionOnScan: boolean;
  productPromoResumeDelaySeconds: number;
  updatedAt: string;
}
