/**
 * @file accountingService.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: accountingService.ts.
 */
import { MaroSyncEngine } from '../../lib/maroSyncEngine';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  reference?: string;
  description: string;
  status: string;
  createdAt: string;
  lines: JournalLine[];
}

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

const ACCOUNT_COLLECTION = 'chart_of_accounts';
const JOURNAL_COLLECTION = 'journal_entries';

export class AccountingService {
  static getChartOfAccounts(): Account[] {
    return MaroSyncEngine.getLocalCollection<Account>(ACCOUNT_COLLECTION);
  }

  static getJournalEntries(): JournalEntry[] {
    return MaroSyncEngine.getLocalCollection<JournalEntry>(JOURNAL_COLLECTION);
  }

  static async postJournalEntry(
    reference: string,
    description: string,
    lines: { accountCode: string; debit: number; credit: number }[]
  ): Promise<JournalEntry> {
    const response = await fetch('/api/erp/finance/journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference, description, lines }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to post journal entry');
    }

    const data = await response.json();
    
    // We expect the server to update the database, which will then trigger sync.
    // For immediate UI update, we could also optimistically insert here, but
    // relying on the server response is safer for GL entries.
    return data;
  }
}
