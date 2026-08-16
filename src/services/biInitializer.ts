/**
 * @file biInitializer.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: biInitializer.ts.
 */
import { MaroEventBus } from '../lib/eventBus';
import { BusinessHealthEngine } from './businessHealthEngine';
import { BIRepository } from '../repositories/biRepository';
import { AIRecommendationEngine } from './aiRecommendationEngine';

export const initBusinessIntelligence = () => {
  const biRepo = new BIRepository();

  // Recalculate on key events
  const handleRecalculation = async () => {
    const health = await BusinessHealthEngine.calculateBusinessHealth('default-company');
    await biRepo.saveBusinessHealth(health);
    await MaroEventBus.publish('BusinessHealthCalculated', health as any);
    
    // Also run AI recommendations
    const recommendations = await AIRecommendationEngine.generateRecommendations();
    console.log('[AUDIT] AIRecommendationsGenerated:', { count: recommendations.length });
    
    console.log('[AUDIT] BusinessHealthRecalculated:', { score: health.score });
  };

  MaroEventBus.subscribe('InvoiceCreated', handleRecalculation);
  MaroEventBus.subscribe('InventoryMoved', handleRecalculation);
  
  console.log('[System] Business Intelligence Engine initialized.');
};
