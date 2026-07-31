import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const StockAlerts: React.FC = () => {
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [show, setShow] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const q = collection(db, 'products');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lowStock = products.filter((p: any) => p.quantity <= (p.reorderLevel || 5));
      setLowStockProducts(lowStock);
    }, (error) => {
        console.error("Firestore permission error in StockAlerts:", error);
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  if (!show || !isAuthenticated || lowStockProducts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-900 border border-red-500 p-4 rounded-xl shadow-2xl w-80">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-bold flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-400" />
          تنبيه مخزون منخفض
        </h4>
        <button onClick={() => setShow(false)} className="text-red-300 hover:text-white">
          <X size={16} />
        </button>
      </div>
      <div className="space-y-2">
        {lowStockProducts.map(p => (
          <div key={p.id} className="text-red-100 text-xs font-medium">
            {p.name}: {p.quantity} قطعة متبقية
          </div>
        ))}
      </div>
    </div>
  );
};
