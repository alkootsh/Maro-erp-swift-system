/**
 * @file digitalSignageEngine.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: digitalSignageEngine.ts.
 */
// MARO ERP - Digital Signage & Price Checker Media Advertising Engine
// Master Enterprise Digital Signage & Media Advertising Protocol v4.0

import { PriceCheckerMediaAd, KioskDigitalSignageSettings } from '../types/digitalSignageAds';
import { MaroSyncEngine } from '../lib/maroSyncEngine';

const STORAGE_KEY_ADS = 'maro_erp_kiosk_media_ads_v4';
const STORAGE_KEY_SETTINGS = 'maro_erp_kiosk_signage_settings_v4';

const DEFAULT_SETTINGS: KioskDigitalSignageSettings = {
  id: 'settings_default',
  storeNameAr: 'سوبرماركت ومول مارو التجاري الذكي',
  kioskNameAr: 'كشك استعلام الأسعار والشاشات الرقمية #01',
  idleTimeoutSeconds: 12,
  mediaPlayMode: 'CYCLE_ALL',
  allowVideoSound: false,
  videoSoundVolumePercent: 50,
  showTickerBar: true,
  tickerTextAr: '🔥 عروض وتخفيضات نهاية الأسبوع حتى 50% على جميع الأغذية الطازجة والأجهزة الكهربائية! 🛒 خصم إضافي 10% لحاملي بطاقة ولاء مارو الذهبية VIP! ⚡ أسعارنا محدثة لحظياً مع منظومة الكاشير والمخازن.',
  welcomeMessageAr: 'مرحباً بكم في متجرنا! مرر باركود أي صنف للاستعلام عن السعر والعروض',
  enableCustomerFeedback: true,
  themeStyle: 'AMBER_WARM',
  autoTransitionOnScan: true,
  productPromoResumeDelaySeconds: 15,
  updatedAt: new Date().toISOString()
};

// Realistic, High-Quality Stock Videos & Images for Retail / Supermarket / Electronics / Gourmet
const INITIAL_MEDIA_ADS: PriceCheckerMediaAd[] = [
  {
    id: 'ad_vid_1',
    titleAr: 'فيديو ترويجي: البن والقهوة الإيطالية الفاخرة',
    titleEn: 'Premium Artisan Coffee Roasting Promo',
    type: 'VIDEO',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-falling-in-slow-motion-41865-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=60',
    displayDurationSeconds: 15,
    videoDurationSeconds: 14,
    badgeTextAr: 'قهوة طازجة 100% ☕',
    badgeColor: 'bg-amber-600',
    headlineAr: 'عش تجربة القهوة الإيطالية الأصلية مع تشكيلة نستله ودولتشي غوستو',
    subHeadlineAr: 'خصم خاص 20% على جميع عبوات القهوة المختصة عند شراء عبوتين فأكثر',
    ctaTextAr: 'مرر الباركود للاستعلام عن السعر المخفض • ممر 2 قسم المشروبات',
    qrCodeLink: 'https://maro-erp.com/offers/coffee-fest',
    priceCallout: {
      originalPrice: 240,
      promoPrice: 192,
      currency: 'ج.م',
      unitAr: 'برطمان 200 جم'
    },
    targetCategory: 'المشروبات والأغذية المحفوظة',
    targetProductId: 'prod_pda_1',
    isActive: true,
    displayOrder: 1,
    soundEnabledByDefault: false,
    layoutStyle: 'FULLSCREEN',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T07:00:00Z'
  },
  {
    id: 'ad_img_2',
    titleAr: 'إعلان مصور: مهرجان الخضار والفواكه الطازجة',
    titleEn: 'Fresh Organic Farm Produce Harvest',
    type: 'IMAGE_SLIDE',
    mediaUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1200&auto=format&fit=crop&q=80',
    displayDurationSeconds: 8,
    badgeTextAr: 'طازج من المزرعة يومياً 🥗',
    badgeColor: 'bg-emerald-600',
    headlineAr: 'مهرجان الخضروات والفواكه العضوية الطازجة 100%',
    subHeadlineAr: 'أفضل جودة مختارة بعناية لأجود الأنواع بأسعار جملة التجزئة',
    ctaTextAr: 'متوفر الآن في قسم الأغذية الطازجة • وزن وطباعة فورية للباركود',
    qrCodeLink: 'https://maro-erp.com/offers/fresh-produce',
    priceCallout: {
      promoPrice: 28.5,
      currency: 'ج.م',
      unitAr: 'كيلوجرام'
    },
    targetCategory: 'خضار وفواكه طازجة',
    isActive: true,
    displayOrder: 2,
    soundEnabledByDefault: false,
    layoutStyle: 'SPLIT_SIDEBAR',
    createdAt: '2026-08-02T08:00:00Z',
    updatedAt: '2026-08-14T07:00:00Z'
  },
  {
    id: 'ad_vid_3',
    titleAr: 'فيديو ترويجي: مخبوزات وكرواسون شيدر طازج من الفرن',
    titleEn: 'Fresh Oven Croissant & Bakery Promo',
    type: 'VIDEO',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-preparing-bread-dough-43093-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=60',
    displayDurationSeconds: 12,
    videoDurationSeconds: 10,
    badgeTextAr: 'طازج من الفرن الساخن 🥐',
    badgeColor: 'bg-orange-600',
    headlineAr: 'تشكيلة المخبوزات والحلويات الفرنسية المخبوزة طازجة على مدار الساعة',
    subHeadlineAr: 'اشترِ 3 قطع كرواسون بالزبدة الفاخرة واحصل على الرابعة مجاناً!',
    ctaTextAr: 'قسم المخبز والحلويات في الطابق الأول • عروض يومية',
    qrCodeLink: 'https://maro-erp.com/bakery',
    priceCallout: {
      originalPrice: 45,
      promoPrice: 32,
      currency: 'ج.م',
      unitAr: 'للقطعة'
    },
    targetCategory: 'مخبوزات وحلويات',
    isActive: true,
    displayOrder: 3,
    soundEnabledByDefault: false,
    layoutStyle: 'FULLSCREEN',
    createdAt: '2026-08-03T08:00:00Z',
    updatedAt: '2026-08-14T07:00:00Z'
  },
  {
    id: 'ad_img_4',
    titleAr: 'إعلان مصور: شاشات سمارت وإلكترونيات سامسونج وجيل الذكاء الاصطناعي',
    titleEn: 'Smart Electronics & Home Appliances Sale',
    type: 'IMAGE_SLIDE',
    mediaUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=1200&auto=format&fit=crop&q=80',
    displayDurationSeconds: 9,
    badgeTextAr: 'ضمان سنتين معتمد ⚡',
    badgeColor: 'bg-blue-600',
    headlineAr: 'عروض الأجهزة المنزلية والشاشات الذكية 4K Ultra HD',
    subHeadlineAr: 'تقسيط مباشر بدون فوائد حتى 12 شهراً لحاملي بطاقات البنك الأهلي ومصر',
    ctaTextAr: 'معرض الأجهزة الإلكترونية • جناح A • تجربة حية للشاشات',
    qrCodeLink: 'https://maro-erp.com/electronics',
    priceCallout: {
      originalPrice: 16500,
      promoPrice: 13999,
      currency: 'ج.م',
      unitAr: 'شاشة 55 بوصة'
    },
    targetCategory: 'إلكترونيات وأجهزة منزلية',
    isActive: true,
    displayOrder: 4,
    soundEnabledByDefault: false,
    layoutStyle: 'FULLSCREEN',
    createdAt: '2026-08-04T08:00:00Z',
    updatedAt: '2026-08-14T07:00:00Z'
  },
  {
    id: 'ad_vid_5',
    titleAr: 'فيديو ترويجي: قسم العطور الفرنسية والتجميل والعناية الشخصية',
    titleEn: 'Luxury Perfume & Cosmetics Showcase',
    type: 'VIDEO',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-dropper-dripping-oil-into-a-bottle-43372-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=60',
    displayDurationSeconds: 12,
    videoDurationSeconds: 11,
    badgeTextAr: 'عطور أصلية 100% ✨',
    badgeColor: 'bg-purple-600',
    headlineAr: 'أرقى العطور العالمية ومنتجات العناية بالبشرة ومستحضرات التجميل',
    subHeadlineAr: 'عينات مجانية وهدايا قيمة مع كل عملية شراء بقيمة 500 ج.م',
    ctaTextAr: 'ركن الجمال والعناية • ممر 6 • فحص بشرة مجاني',
    qrCodeLink: 'https://maro-erp.com/beauty',
    priceCallout: {
      originalPrice: 850,
      promoPrice: 680,
      currency: 'ج.م',
      unitAr: 'زجاجة 100 مل'
    },
    targetCategory: 'عطور ومستحضرات تجميل',
    isActive: true,
    displayOrder: 5,
    soundEnabledByDefault: false,
    layoutStyle: 'SPLIT_SIDEBAR',
    createdAt: '2026-08-05T08:00:00Z',
    updatedAt: '2026-08-14T07:00:00Z'
  }
];

export class DigitalSignageEngine {
  static getAds(): PriceCheckerMediaAd[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ADS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (_) {}
    this.saveAds(INITIAL_MEDIA_ADS);
    return INITIAL_MEDIA_ADS;
  }

  static getActiveAds(): PriceCheckerMediaAd[] {
    return this.getAds()
      .filter(ad => ad.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static saveAds(ads: PriceCheckerMediaAd[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(ads));
    } catch (_) {}
  }

  static saveAd(ad: PriceCheckerMediaAd): void {
    const ads = this.getAds();
    const idx = ads.findIndex(a => a.id === ad.id);
    if (idx >= 0) {
      ads[idx] = { ...ad, updatedAt: new Date().toISOString() };
    } else {
      ads.push({ ...ad, updatedAt: new Date().toISOString() });
    }
    this.saveAds(ads);

    // Sync with offline engine
    MaroSyncEngine.saveDocument('digital_signage_ads', ad, idx < 0);
  }

  static deleteAd(id: string): void {
    const ads = this.getAds().filter(a => a.id !== id);
    this.saveAds(ads);

    MaroSyncEngine.deleteDocument('digital_signage_ads', id);
  }

  static toggleAdStatus(id: string): void {
    const ads = this.getAds();
    const ad = ads.find(a => a.id === id);
    if (ad) {
      ad.isActive = !ad.isActive;
      ad.updatedAt = new Date().toISOString();
      this.saveAds(ads);
      MaroSyncEngine.saveDocument('digital_signage_ads', ad, false);
    }
  }

  static getSettings(): KioskDigitalSignageSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (_) {}
    this.saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: KioskDigitalSignageSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (_) {}

    MaroSyncEngine.saveDocument('kiosk_signage_settings', settings, false);
  }

  static resetToDefaultPresets(): void {
    this.saveAds(INITIAL_MEDIA_ADS);
    this.saveSettings(DEFAULT_SETTINGS);
  }
}
