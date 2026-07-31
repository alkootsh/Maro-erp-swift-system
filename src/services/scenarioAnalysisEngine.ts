import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { Scenario } from '../types/businessIntelligence';
import { SalesRepository } from '../repositories/salesRepository';
import { ProductRepository } from '../repositories/productRepository';

export class ScenarioAnalysisEngine {
    static async runWhatIf(scenario: Scenario): Promise<any> {
        const invoices = SalesRepository.getInvoices();
        const products = ProductRepository.getProducts();
        
        let projectedRevenue = 0;
        let projectedProfit = 0;

        // Apply scenario variables (e.g., price increase % or cost increase %)
        invoices.forEach(inv => {
            let invTotal = inv.grandTotal;
            
            if (scenario.variables.priceIncrease) {
                invTotal *= (1 + scenario.variables.priceIncrease / 100);
            }
            
            projectedRevenue += invTotal;
        });

        return {
            scenarioId: scenario.id,
            projectedRevenue,
            originalRevenue: invoices.reduce((a, b) => a + b.grandTotal, 0),
            createdAt: new Date()
        };
    }
}
