/**
 * @file trialLimitService.ts
 * @module الخدمات والإدارة (Services)
 * @description محرك حدود النسخة التجريبية (Trial Limits Engine) في MARO ERP.
 * يضمن تشغيل مستخدم تجريبي بحد أقصى:
 * - 10 أيام تجربة (10 Days Trial)
 * - 50 فاتورة مبيعات (50 Sales Invoices)
 * - 20 صنف ومعدة (20 Products)
 * عند تجاوز أي من هذه الحدود، يتم إغلاق العمليات وإظهار صفحة التفعيل فوراً.
 */

import { MaroSyncEngine } from '../lib/maroSyncEngine';

export interface TrialStatus {
  isTrial: boolean;
  isActivated: boolean;
  isExpired: boolean;
  daysUsed: number;
  daysRemaining: number;
  maxDays: number;
  invoicesCount: number;
  invoicesRemaining: number;
  maxInvoices: number;
  productsCount: number;
  productsRemaining: number;
  maxProducts: number;
  reason?: 'EXPIRED_DAYS' | 'EXPIRED_INVOICES' | 'EXPIRED_PRODUCTS' | 'ACTIVE_TRIAL' | 'PERMANENTLY_ACTIVATED';
  messageAr?: string;
}

const TRIAL_START_KEY = 'maro_trial_start_timestamp';
const LICENSE_ACTIVATED_KEY = 'maro_system_permanently_activated';

export const MAX_TRIAL_DAYS = 10;
export const MAX_TRIAL_INVOICES = 50;
export const MAX_TRIAL_PRODUCTS = 20;

export class TrialLimitService {
  /**
   * إرجاع تاريخ بدء الفترة التجريبية أو إنشاؤه عند التشغيل الأول
   */
  public static getTrialStartDate(): number {
    const existing = localStorage.getItem(TRIAL_START_KEY);
    if (existing) {
      const parsed = parseInt(existing, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    const now = Date.now();
    localStorage.setItem(TRIAL_START_KEY, now.toString());
    return now;
  }

  /**
   * التحقق مما إذا تم تفعيل النظام بشكل دائم بترخيص معتمد
   */
  public static isSystemActivated(): boolean {
    if (localStorage.getItem(LICENSE_ACTIVATED_KEY) === 'true') {
      return true;
    }

    // Check cached valid enterprise license payload
    try {
      const cachedLic = localStorage.getItem('maro_erp_license_cache');
      if (cachedLic) {
        const parsed = JSON.parse(cachedLic);
        if (parsed && parsed.valid && parsed.plan && parsed.plan !== 'TRIAL' && parsed.status === 'ACTIVE') {
          return true;
        }
      }
    } catch {}

    return false;
  }

  /**
   * حساب عدد الفواتير التي تم إنشاؤها في قاعدة البيانات المحلية
   */
  public static getInvoicesCount(): number {
    try {
      const invoices = MaroSyncEngine.getLocalCollection<any>('invoices') || [];
      return invoices.length;
    } catch {
      return 0;
    }
  }

  /**
   * حساب عدد المنتجات والأصناف المضافة في قاعدة البيانات
   */
  public static getProductsCount(): number {
    try {
      const products = MaroSyncEngine.getLocalCollection<any>('products') || [];
      return products.length;
    } catch {
      return 0;
    }
  }

  /**
   * فحص حالة النسخة التجريبية والتأكد من عدم تجاوز أي شرط
   */
  public static getTrialStatus(): TrialStatus {
    const activated = this.isSystemActivated();
    if (activated) {
      return {
        isTrial: false,
        isActivated: true,
        isExpired: false,
        daysUsed: 0,
        daysRemaining: 9999,
        maxDays: MAX_TRIAL_DAYS,
        invoicesCount: this.getInvoicesCount(),
        invoicesRemaining: 9999,
        maxInvoices: MAX_TRIAL_INVOICES,
        productsCount: this.getProductsCount(),
        productsRemaining: 9999,
        maxProducts: MAX_TRIAL_PRODUCTS,
        reason: 'PERMANENTLY_ACTIVATED',
        messageAr: 'المنظومة مفعلة بترخيص رسمي معتمد'
      };
    }

    const startMs = this.getTrialStartDate();
    const elapsedMs = Date.now() - startMs;
    const daysUsed = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, MAX_TRIAL_DAYS - daysUsed);

    const invoicesCount = this.getInvoicesCount();
    const invoicesRemaining = Math.max(0, MAX_TRIAL_INVOICES - invoicesCount);

    const productsCount = this.getProductsCount();
    const productsRemaining = Math.max(0, MAX_TRIAL_PRODUCTS - productsCount);

    let isExpired = false;
    let reason: TrialStatus['reason'] = 'ACTIVE_TRIAL';
    let messageAr = `الفترة التجريبية نشطة (متبقي ${daysRemaining} يوم / ${invoicesRemaining} فاتورة / ${productsRemaining} صنف)`;

    if (daysUsed >= MAX_TRIAL_DAYS) {
      isExpired = true;
      reason = 'EXPIRED_DAYS';
      messageAr = `انتهت الفترة التجريبية المحددة بـ ${MAX_TRIAL_DAYS} أيام. يرجى تفعيل ترخيص النظام للمتابعة.`;
    } else if (invoicesCount >= MAX_TRIAL_INVOICES) {
      isExpired = true;
      reason = 'EXPIRED_INVOICES';
      messageAr = `تم الوصول للحد الأقصى للفواتير التجريبية (${MAX_TRIAL_INVOICES} فاتورة). يرجى تفعيل ترخيص النظام للمتابعة.`;
    } else if (productsCount >= MAX_TRIAL_PRODUCTS) {
      isExpired = true;
      reason = 'EXPIRED_PRODUCTS';
      messageAr = `تم الوصول للحد الأقصى للأصناف التجريبية (${MAX_TRIAL_PRODUCTS} صنف). يرجى تفعيل ترخيص النظام للمتابعة.`;
    }

    return {
      isTrial: true,
      isActivated: false,
      isExpired,
      daysUsed,
      daysRemaining,
      maxDays: MAX_TRIAL_DAYS,
      invoicesCount,
      invoicesRemaining,
      maxInvoices: MAX_TRIAL_INVOICES,
      productsCount,
      productsRemaining,
      maxProducts: MAX_TRIAL_PRODUCTS,
      reason,
      messageAr
    };
  }

  /**
   * فحص إمكانية إنشاء فاتورة جديدة
   */
  public static canCreateInvoice(): { allowed: boolean; messageAr?: string } {
    const status = this.getTrialStatus();
    if (!status.isTrial) return { allowed: true };
    if (status.isExpired) return { allowed: false, messageAr: status.messageAr };
    if (status.invoicesCount >= MAX_TRIAL_INVOICES) {
      return { 
        allowed: false, 
        messageAr: `عفواً، لقد وصلت للحد الأقصى المسموح به في الفترة التجريبية وهو ${MAX_TRIAL_INVOICES} فاتورة. يرجى تفعيل النظام.`
      };
    }
    return { allowed: true };
  }

  /**
   * فحص إمكانية إضافة صنف جديد
   */
  public static canCreateProduct(): { allowed: boolean; messageAr?: string } {
    const status = this.getTrialStatus();
    if (!status.isTrial) return { allowed: true };
    if (status.isExpired) return { allowed: false, messageAr: status.messageAr };
    if (status.productsCount >= MAX_TRIAL_PRODUCTS) {
      return { 
        allowed: false, 
        messageAr: `عفواً، لقد وصلت للحد الأقصى المسموح به في الفترة التجريبية وهو ${MAX_TRIAL_PRODUCTS} صنف. يرجى تفعيل النظام.`
      };
    }
    return { allowed: true };
  }

  /**
   * تعيين حالة النظام كمفعل رسمياً
   */
  public static markAsPermanentlyActivated(): void {
    localStorage.setItem(LICENSE_ACTIVATED_KEY, 'true');
  }
}
