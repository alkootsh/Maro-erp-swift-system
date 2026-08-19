import React, { useState } from 'react';
import { FastPosView } from '../components/pos/FastPosView';
import { WholesaleInvoiceView } from '../components/wholesale/WholesaleInvoiceView';

export const POS: React.FC = () => {
  const [activeViewMode, setActiveViewMode] = useState<'POS' | 'WHOLESALE'>('POS');

  if (activeViewMode === 'WHOLESALE') {
    return <WholesaleInvoiceView onSwitchMode={(mode) => setActiveViewMode(mode)} />;
  }

  return <FastPosView onSwitchMode={(mode) => setActiveViewMode(mode)} />;
};

export default POS;
