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
