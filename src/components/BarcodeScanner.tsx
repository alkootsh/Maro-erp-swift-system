/**
 * @file BarcodeScanner.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: BarcodeScanner.tsx.
 */
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 } },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        onScan(decodedText);
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        onClose();
      },
      (error) => {
        // console.warn(error);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <h3 className="font-black text-xl text-white tracking-tight">مسح الباركود</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-8">
          <div id="reader" className="overflow-hidden rounded-2xl border-2 border-blue-600/20 bg-black"></div>
          <p className="mt-6 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">قم بتوجيه الكاميرا نحو الباركود</p>
        </div>
      </div>
    </div>
  );
};
