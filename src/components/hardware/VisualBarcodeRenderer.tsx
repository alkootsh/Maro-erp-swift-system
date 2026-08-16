/**
 * @file VisualBarcodeRenderer.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: VisualBarcodeRenderer.tsx.
 */
import React from 'react';

interface VisualBarcodeRendererProps {
  value: string;
  format?: 'EAN13' | 'CODE128' | 'EAN8' | 'QR' | 'DATAMATRIX';
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

export const VisualBarcodeRenderer: React.FC<VisualBarcodeRendererProps> = ({
  value,
  format = 'CODE128',
  width = 160,
  height = 50,
  showText = true,
  className = ''
}) => {
  // Simple deterministic visual barcode generator for standard screen rendering and preview
  const generateBars = (code: string) => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = (hash << 5) - hash + code.charCodeAt(i);
      hash |= 0;
    }
    
    // Generate pattern of bar widths (1, 2, 3, 4px)
    const bars: { width: number; isBlack: boolean }[] = [];
    // Start guard
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 2, isBlack: false });
    bars.push({ width: 2, isBlack: true });

    let currentBlack = false;
    for (let i = 0; i < 28; i++) {
      const bit = Math.abs((hash >> (i % 31)) ^ (code.charCodeAt(i % code.length) * (i + 1))) % 4 + 1;
      bars.push({ width: bit, isBlack: currentBlack });
      currentBlack = !currentBlack;
    }

    // End guard
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 2, isBlack: false });
    bars.push({ width: 2, isBlack: true });

    return bars;
  };

  const bars = generateBars(value || '6223001234567');

  return (
    <div className={`flex flex-col items-center justify-center p-1 bg-white select-none ${className}`}>
      <div 
        className="flex items-stretch justify-center overflow-hidden bg-white px-1"
        style={{ height: `${height}px`, minWidth: `${width}px` }}
      >
        {bars.map((bar, idx) => (
          <div
            key={idx}
            style={{
              width: `${bar.width * 1.5}px`,
              backgroundColor: bar.isBlack ? '#000000' : '#ffffff'
            }}
          />
        ))}
      </div>
      {showText && (
        <span className="font-mono text-[11px] font-black tracking-widest text-black mt-0.5 dir-ltr">
          {value || '0000000000000'}
        </span>
      )}
    </div>
  );
};
