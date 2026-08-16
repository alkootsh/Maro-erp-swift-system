/**
 * @file POSFunctionKeysSettings.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: POSFunctionKeysSettings.tsx.
 */
import React from 'react';
import { POSFunctionKeysManager } from '../components/POSFunctionKeysManager';

export const POSFunctionKeysSettings: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <POSFunctionKeysManager />
    </div>
  );
};

export default POSFunctionKeysSettings;
