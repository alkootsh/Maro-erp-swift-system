/**
 * @file posKeyRepository.ts
 * @module طبقة التعامل مع البيانات (Data Repositories)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: posKeyRepository.ts.
 */
// MARO ERP - Sprint 8.1 POS Function Key Repository

import { FunctionKey, POSKeyMapping, POSFunctionKeyConfig } from '../types/posKeys';
import { MaroSyncEngine } from '../lib/maroSyncEngine';

const STORAGE_KEY = 'maro_pos_function_keys';

export const DEFAULT_KEY_MAPPINGS: POSKeyMapping = {
  F1: 'NEW_INVOICE',
  F2: 'CUSTOMER_SEARCH',
  F3: 'MANUAL_BARCODE',
  F4: 'CHANGE_QTY',
  F5: 'DISCOUNT_PERCENT',
  F6: 'HOLD_INVOICE',
  F7: 'PAYMENT_CASH',
  F8: 'PAYMENT_CARD',
  F9: 'PAYMENT_SPLIT',
  F10: 'CLOSE_SHIFT',
  F11: 'CALCULATOR',
  F12: 'DELETE_INVOICE',
};

export class POSKeyRepository {
  /**
   * Get the current POS function key mappings (from local cache / MARO Sync)
   */
  public static getKeyMappings(): POSKeyMapping {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_KEY_MAPPINGS, ...parsed };
        }
      }

      // Check MARO Sync Engine
      const syncItems = MaroSyncEngine.getLocalCollection<POSFunctionKeyConfig>('pos_function_keys');
      if (syncItems && syncItems.length > 0 && syncItems[0].mappings) {
        return { ...DEFAULT_KEY_MAPPINGS, ...syncItems[0].mappings };
      }
    } catch (e) {
      console.warn('Failed to load POS function keys from cache, using defaults', e);
    }

    return { ...DEFAULT_KEY_MAPPINGS };
  }

  /**
   * Save configured function key mappings to localStorage, MARO Sync Engine, and PostgreSQL backend queue
   */
  public static saveKeyMappings(mappings: POSKeyMapping, updatedBy = 'Administrator'): POSKeyMapping {
    const updatedMappings = { ...DEFAULT_KEY_MAPPINGS, ...mappings };
    
    // Save to Local Cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMappings));

    // Save & Queue via MARO Sync Engine
    const configDoc: POSFunctionKeyConfig = {
      id: 'default',
      terminalId: 'global',
      mappings: updatedMappings,
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    MaroSyncEngine.saveDocument('pos_function_keys', configDoc, true);

    return updatedMappings;
  }

  /**
   * Reset function key mappings back to system defaults
   */
  public static resetToDefaults(updatedBy = 'Administrator'): POSKeyMapping {
    return this.saveKeyMappings(DEFAULT_KEY_MAPPINGS, updatedBy);
  }
}
