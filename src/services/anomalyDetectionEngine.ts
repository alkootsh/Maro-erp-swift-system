/**
 * @file anomalyDetectionEngine.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: anomalyDetectionEngine.ts.
 */
import { SalesRepository } from '../repositories/salesRepository';
import { SalesInvoice } from '../types/sprint8';
import { RootCauseAnalysis } from '../types/businessIntelligence';

export class AnomalyDetectionEngine {
    static detectAnomalies() {
        const invoices: SalesInvoice[] = SalesRepository.getInvoices();
        
        if (invoices.length === 0) return [];
        
        // Simple Anomaly: Invoice total significantly higher than average
        const totals = invoices.map(inv => inv.grandTotal);
        const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
        const stdDev = Math.sqrt(totals.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / totals.length);
        
        const anomalies = invoices.filter(inv => inv.grandTotal > avg + (3 * stdDev));
        
        return anomalies.map(inv => ({
            id: `anom_${inv.id}`,
            message: `قيمة فاتورة غير طبيعية: ${inv.grandTotal}. متوسط المبيعات: ${avg.toFixed(2)}`,
            severity: 'high',
            rootCause: {
                id: `rc_${inv.id}`,
                insightId: `anom_${inv.id}`,
                whatHappened: 'ارتفاع حاد في قيمة الفاتورة',
                whyItHappened: 'قيمة الفاتورة تتجاوز 3 انحرافات معيارية عن المتوسط',
                responsibleEntityId: inv.branchId,
                impactFinancial: inv.grandTotal,
                confidence: 0.9,
                createdAt: new Date()
            } as RootCauseAnalysis
        }));
    }
}
