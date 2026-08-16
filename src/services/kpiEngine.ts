/**
 * @file kpiEngine.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: kpiEngine.ts.
 */
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { KPI } from '../types/businessIntelligence';

export class KPIEngine {
  static async getKPIs(): Promise<KPI[]> {
    return MaroSyncEngine.getLocalCollection<KPI>('kpi_definitions');
  }

  static async updateKPIValue(kpiId: string, actual: number): Promise<void> {
    const kpi = MaroSyncEngine.getLocalDocument<KPI>('kpi_definitions', kpiId);
    if (kpi) {
      await MaroSyncEngine.saveDocument('kpi_values', {
        id: `kpi_val_${Date.now()}`,
        kpiId,
        actual,
        target: kpi.target,
        recorded_at: new Date()
      }, true);
    }
  }
}
