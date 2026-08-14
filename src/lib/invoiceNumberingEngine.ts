// MARO ERP - Non-Repeating Daily Sequential Invoice Numbering Engine
import { MaroSyncEngine } from './maroSyncEngine';

export interface InvoiceSequenceConfig {
  prefix: string; // e.g. 'INV' or 'POS'
  includeBranch: boolean;
  branchCode: string; // e.g. 'MAIN' or 'BR01'
  dateFormat: 'YYYYMMDD' | 'YYYYMM' | 'YYMMDD';
  digitLength: number; // e.g. 4 -> 0001
  resetDaily: boolean;
  separator: string; // e.g. '-'
}

const DEFAULT_CONFIG: Record<string, InvoiceSequenceConfig> = {
  POS: { prefix: 'POS', includeBranch: true, branchCode: 'BR01', dateFormat: 'YYYYMMDD', digitLength: 4, resetDaily: true, separator: '-' },
  INV: { prefix: 'INV', includeBranch: true, branchCode: 'MAIN', dateFormat: 'YYYYMMDD', digitLength: 4, resetDaily: true, separator: '-' },
  PUR: { prefix: 'PUR', includeBranch: false, branchCode: 'WH01', dateFormat: 'YYYYMMDD', digitLength: 4, resetDaily: true, separator: '-' },
  RET: { prefix: 'RET', includeBranch: false, branchCode: 'BR01', dateFormat: 'YYYYMMDD', digitLength: 4, resetDaily: true, separator: '-' }
};

export class InvoiceNumberingEngine {
  private static getTodayDateString(format: 'YYYYMMDD' | 'YYYYMM' | 'YYMMDD' = 'YYYYMMDD'): string {
    const now = new Date();
    const yyyy = now.getFullYear().toString();
    const yy = yyyy.slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    if (format === 'YYMMDD') return `${yy}${mm}${dd}`;
    if (format === 'YYYYMM') return `${yyyy}${mm}`;
    return `${yyyy}${mm}${dd}`;
  }

  /**
   * Generates a non-repeating daily sequential invoice number
   * Format: PREFIX-BRANCH-YYYYMMDD-SEQUENCE (e.g. POS-BR01-20260813-0001)
   */
  public static generateDailySequentialInvoiceNumber(
    docType: 'POS' | 'INV' | 'PUR' | 'RET',
    customBranch?: string
  ): string {
    const config = DEFAULT_CONFIG[docType] || DEFAULT_CONFIG.POS;
    const branch = customBranch || config.branchCode;
    const dateStr = this.getTodayDateString(config.dateFormat);

    // Storage key for today's sequence counter
    const counterKey = `maro_seq_${docType}_${branch}_${dateStr}`;
    
    // Read current counter from localStorage or sync engine
    const rawCounter = localStorage.getItem(counterKey);
    let nextSeq = rawCounter ? parseInt(rawCounter, 10) + 1 : 1;

    // Save updated sequence counter
    localStorage.setItem(counterKey, String(nextSeq));

    // Also persist counter record in MaroSyncEngine for cross-terminal sync
    MaroSyncEngine.saveDocument('invoice_sequences', {
      id: counterKey,
      docType,
      branch,
      dateStr,
      lastSequence: nextSeq,
      updatedAt: new Date().toISOString()
    }, false);

    // Pad sequence number to desired digit length (e.g., 0001)
    const seqPadded = String(nextSeq).padStart(config.digitLength, '0');

    // Build invoice number string
    const parts: string[] = [config.prefix];
    if (config.includeBranch && branch) {
      parts.push(branch);
    }
    parts.push(dateStr);
    parts.push(seqPadded);

    return parts.join(config.separator);
  }

  /**
   * Peek at what the next invoice number will be without incrementing
   */
  public static peekNextInvoiceNumber(docType: 'POS' | 'INV' | 'PUR' | 'RET', customBranch?: string): string {
    const config = DEFAULT_CONFIG[docType] || DEFAULT_CONFIG.POS;
    const branch = customBranch || config.branchCode;
    const dateStr = this.getTodayDateString(config.dateFormat);

    const counterKey = `maro_seq_${docType}_${branch}_${dateStr}`;
    const rawCounter = localStorage.getItem(counterKey);
    const nextSeq = rawCounter ? parseInt(rawCounter, 10) + 1 : 1;
    const seqPadded = String(nextSeq).padStart(config.digitLength, '0');

    const parts: string[] = [config.prefix];
    if (config.includeBranch && branch) {
      parts.push(branch);
    }
    parts.push(dateStr);
    parts.push(seqPadded);

    return parts.join(config.separator);
  }
}
