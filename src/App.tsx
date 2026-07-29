import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseProvider } from './components/FirebaseProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Warehouses } from './pages/Warehouses';
import { Customers } from './pages/Customers';
import { Suppliers } from './pages/Suppliers';
import { Invoices } from './pages/Invoices';
import { Bills } from './pages/Bills';
import { Transactions } from './pages/Transactions';
import { AIAssistant } from './pages/AIAssistant';
import { POS } from './pages/POS';
import { Settings } from './pages/Settings';
import { InvoiceSettings } from './pages/InvoiceSettings';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { Inventory } from './pages/Inventory';
import { Returns } from './pages/Returns';
import { AlertSettings } from './pages/AlertSettings';
import { Reps } from './pages/Reps';

export default function App() {
  return (
    <FirebaseProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/products" element={<Products />} />
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/users" element={<Users />} />
              <Route path="/alerts" element={<AlertSettings />} />
              <Route path="/reps" element={<Reps />} />
              <Route path="/ai" element={<AIAssistant />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/invoices" element={<InvoiceSettings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </FirebaseProvider>
  );
}
