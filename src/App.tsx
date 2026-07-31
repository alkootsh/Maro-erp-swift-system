import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseProvider } from './components/FirebaseProvider';
import { LearningModeProvider } from './components/learning/LearningModeProvider';
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
import { POS } from './pages/POS';
import { Settings } from './pages/Settings';
import { InvoiceSettings } from './pages/InvoiceSettings';
import { POSFunctionKeysSettings } from './pages/POSFunctionKeysSettings';
import { POSLayoutDesigner } from './pages/settings/pos/POSLayoutDesigner';
import { Reports } from './pages/Reports';
import { ReportDesigner } from './pages/reports/ReportDesigner';
import { Users } from './pages/Users';
import { Inventory } from './pages/Inventory';
import { Returns } from './pages/Returns';
import { AlertSettings } from './pages/AlertSettings';
import { Reps } from './pages/Reps';
import { StockAlerts } from './components/StockAlerts';
import { DeveloperConsole } from './pages/DeveloperConsole';
import { RolePermissions } from './pages/RolePermissions';
import { SecurityAudit } from './pages/SecurityAudit';

export default function App() {
  return (
    <FirebaseProvider>
      <LearningModeProvider>
      <StockAlerts />
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
              <Route path="/reports/designer" element={<ReportDesigner />} />
              <Route path="/users" element={<Users />} />
              <Route path="/alerts" element={<AlertSettings />} />
              <Route path="/reps" element={<Reps />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/invoices" element={<InvoiceSettings />} />
              <Route path="/settings/pos/function-keys" element={<POSFunctionKeysSettings />} />
              <Route path="/settings/pos/layout" element={<POSLayoutDesigner />} />
              <Route path="/settings/security/roles" element={<RolePermissions />} />
              <Route path="/settings/security/audit" element={<SecurityAudit />} />
              <Route path="/developer/console" element={<DeveloperConsole />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
          </LearningModeProvider>
    </FirebaseProvider>
  );
}
