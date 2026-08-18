/**
 * @file App.tsx
 * @module Core
 * @description نقطة الدخول الرئيسية (Main Entry Point) لبرنامج MARO ERP. يقوم بإدارة المسارات (Routing)، حالة المصادقة (Auth)، ومزودات التعلم.
 */
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './components/AuthProvider';
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
import { TreasuryBankDashboard } from './pages/accounting/treasury-banks/TreasuryBankDashboard';
import { POS } from './pages/POS';
import { Settings } from './pages/Settings';
import { InvoiceSettings } from './pages/InvoiceSettings';
import { POSFunctionKeysSettings } from './pages/POSFunctionKeysSettings';
import { POSLayoutDesigner } from './pages/settings/pos/POSLayoutDesigner';
import { PaymentMethodsSettings } from './pages/settings/PaymentMethodsSettings';
import { TickerControlPanel } from './pages/settings/TickerControlPanel';
import { Reports } from './pages/Reports';
import { ReportDesigner } from './pages/reports/ReportDesigner';
import { Manufacturing } from './pages/Manufacturing';
import { Users } from './pages/Users';
import { Inventory } from './pages/Inventory';
import { OpeningBalancesPage } from './pages/OpeningBalancesPage';
import { PriceAdjustmentPage } from './pages/PriceAdjustmentPage';
import { Returns } from './pages/Returns';
import { PurchaseReturns } from './pages/PurchaseReturns';
import { AlertSettings } from './pages/AlertSettings';
import { Reps } from './pages/Reps';
import { StockAlerts } from './components/StockAlerts';
import { DeveloperConsole } from './pages/DeveloperConsole';
import { RolePermissions } from './pages/RolePermissions';
import { SecurityAudit } from './pages/SecurityAudit';
import { LicenseActivation } from './pages/settings/LicenseActivation';
import { AndroidActivationSimulator } from './pages/settings/AndroidActivationSimulator';
import { DemoDataSeeder } from './services/demoDataSeeder';
import { FirstRunWizard } from './components/FirstRunWizard';
import { initBusinessIntelligence } from './services/biInitializer';
import { WhatsAppNotificationsCenter } from './pages/WhatsAppNotificationsCenter';
import { CustomerOrdersManager } from './pages/CustomerOrdersManager';
import { AssistantModulesHub } from './pages/AssistantModulesHub';
import { CustomerOrderPortalApp } from './pages/portal/CustomerOrderPortalApp';
import { AdvancedSalesManagement } from './pages/AdvancedSalesManagement';
import { NextGenEnterpriseSuite } from './pages/NextGenEnterpriseSuite';
import { SmartCashier } from './pages/SmartCashier';
import CashierSessionView from './pages/CashierSessionView';
import { AdaptiveERPHub } from './pages/AdaptiveERPHub';
import { WorkflowEngine } from './pages/WorkflowEngine';
import { DynamicFormsBuilder } from './pages/DynamicFormsBuilder';
import { AdvancedReportingBI } from './pages/AdvancedReportingBI';
import { CRMAndProjects } from './pages/CRMAndProjects';
import { AIAgents } from './pages/AIAgents';
import { DocumentManagement } from './pages/DocumentManagement';
import { ProductionMRP } from './pages/ProductionMRP';
import { HRAndPayroll } from './pages/HRAndPayroll';
import { AssetsAndFleet } from './pages/AssetsAndFleet';
import { EcommerceIntegrations } from './pages/EcommerceIntegrations';
import { ProcurementContracts } from './pages/ProcurementContracts';
import { BranchManagement } from './pages/BranchManagement';
import { ZatcaEInvoicing } from './pages/ZatcaEInvoicing';
import { POSModelsComparisonPage } from './pages/POSModelsComparisonPage';
import { WholesaleInvoicesPage } from './pages/WholesaleInvoicesPage';
import { DeveloperPartnerHub } from './pages/DeveloperPartnerHub';
import { SupportCenter } from './pages/SupportCenter';
import { TeamWorkflowHub } from './pages/TeamWorkflowHub';
import { SmartTransportShippingPage } from './pages/industries/SmartTransportShippingPage';
import { CeramicsSanitaryPage } from './pages/industries/CeramicsSanitaryPage';
import { FuelStationPage } from './pages/industries/FuelStationPage';

// Vertical Commercial Industry Modules
import { IndustryModulesHub } from './pages/IndustryModulesHub';
import { FashionFootwearPage } from './pages/industries/FashionFootwearPage';
import { ElectronicsRepairPage } from './pages/industries/ElectronicsRepairPage';
import { FoodSupermarketPage } from './pages/industries/FoodSupermarketPage';
import { RestaurantCafePage } from './pages/industries/RestaurantCafePage';
import { PharmacyPage } from './pages/industries/PharmacyPage';
import { AutoPartsPage } from './pages/industries/AutoPartsPage';
import { AutoShowroomPage } from './pages/industries/AutoShowroomPage';
import { AgriExportPage } from './pages/industries/AgriExportPage';
import { CarWashPage } from './pages/industries/CarWashPage';
import { EducationCenterPage } from './pages/industries/EducationCenterPage';
import { MedicalClinicPage } from './pages/industries/MedicalClinicPage';
import { SalonBarberPage } from './pages/industries/SalonBarberPage';
import { GymFitnessPage } from './pages/industries/GymFitnessPage';
import { NurseryPreschoolPage } from './pages/industries/NurseryPreschoolPage';
import { ParkingGaragePage } from './pages/industries/ParkingGaragePage';
import { TourismTravelPage } from './pages/industries/TourismTravelPage';
import { ImportExportPage } from './pages/industries/ImportExportPage';
import { SmartQueuePage } from './pages/industries/SmartQueuePage';
import { PriceCheckerHandheldPage } from './pages/industries/PriceCheckerHandheldPage';
import { HardwareThermalBarcodeHub } from './pages/HardwareThermalBarcodeHub';

import { FirstRunActivationWizard } from './components/licensing/FirstRunActivationWizard';
import { useAuth } from './components/AuthProvider';

function AppContent() {
  const { serverLicense, loading, checkServerLicense } = useAuth();
  const [showFirstRun, setShowFirstRun] = useState(() => DemoDataSeeder.isFirstRun());

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#070b13]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="text-xs text-slate-400 font-sans font-bold" dir="rtl">جاري التحقق من أمن السيرفر والترخيص...</span>
        </div>
      </div>
    );
  }

  // If there is no valid license on the server, show the FirstRunActivationWizard with instant activation callback
  if (!serverLicense || !serverLicense.valid) {
    return (
      <FirstRunActivationWizard 
        onActivated={async () => {
          await checkServerLicense();
        }} 
      />
    );
  }

  return (
    <>
      <StockAlerts />
      {showFirstRun && (
        <FirstRunWizard 
          onComplete={() => {
            DemoDataSeeder.markFirstRunCompleted();
            setShowFirstRun(false);
          }} 
        />
      )}
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Standalone Public Customer B2B Ordering Portal (Direct Customer Access) */}
          <Route path="/portal/order" element={<CustomerOrderPortalApp />} />
          <Route path="/b2b-store" element={<CustomerOrderPortalApp />} />
          <Route path="/catalog" element={<CustomerOrderPortalApp />} />

          <Route element={<ProtectedRoute />}>
            {/* Standalone Fullscreen Android Activation Simulator without main sidebar & headers */}
            <Route path="/android-activation-standalone" element={<AndroidActivationSimulator />} />

            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/pos-models" element={<POSModelsComparisonPage />} />
              <Route path="/wholesale-invoices" element={<WholesaleInvoicesPage />} />
              
              {/* B2B Customer Orders & Web Store Management */}
              <Route path="/b2b-portal" element={<WholesaleInvoicesPage />} />
              <Route path="/customer-orders" element={<WholesaleInvoicesPage />} />
              
              {/* Core Commercial Industry Modules */}
              <Route path="/industries/hub" element={<IndustryModulesHub />} />
              <Route path="/industries/fashion" element={<FashionFootwearPage />} />
              <Route path="/industries/maintenance" element={<ElectronicsRepairPage />} />
              <Route path="/industries/food-retail" element={<FoodSupermarketPage />} />
              <Route path="/industries/restaurants" element={<RestaurantCafePage />} />
              <Route path="/industries/pharmacy" element={<PharmacyPage />} />
              <Route path="/industries/auto-parts" element={<AutoPartsPage />} />
              <Route path="/industries/auto-showroom" element={<AutoShowroomPage />} />
              <Route path="/industries/agri-export" element={<AgriExportPage />} />
              <Route path="/industries/car-wash" element={<CarWashPage />} />
              <Route path="/industries/education" element={<EducationCenterPage />} />
              <Route path="/industries/clinics" element={<MedicalClinicPage />} />
              <Route path="/industries/salon-barber" element={<SalonBarberPage />} />
              <Route path="/industries/gym-fitness" element={<GymFitnessPage />} />
              <Route path="/industries/nursery" element={<NurseryPreschoolPage />} />
              <Route path="/industries/parking-garage" element={<ParkingGaragePage />} />
              <Route path="/industries/tourism-travel" element={<TourismTravelPage />} />
              <Route path="/industries/import-export" element={<ImportExportPage />} />
              <Route path="/industries/queue-system" element={<SmartQueuePage />} />
              <Route path="/industries/price-checker" element={<PriceCheckerHandheldPage />} />
              <Route path="/industries/transport-shipping" element={<SmartTransportShippingPage />} />
              <Route path="/industries/ceramics-sanitary" element={<CeramicsSanitaryPage />} />
              <Route path="/industries/fuel-station" element={<FuelStationPage />} />
              <Route path="/price-checker" element={<PriceCheckerHandheldPage />} />
              <Route path="/handheld-pda" element={<PriceCheckerHandheldPage />} />
              <Route path="/hardware-thermal-barcode" element={<HardwareThermalBarcodeHub />} />
              <Route path="/thermal-printers" element={<HardwareThermalBarcodeHub />} />
              <Route path="/barcode-designer" element={<HardwareThermalBarcodeHub />} />
              <Route path="/barcode-scales" element={<HardwareThermalBarcodeHub />} />

              {/* Core Supply Chain, Inventory & Sales */}
              <Route path="/products" element={<Products />} />
              <Route path="/price-adjustments" element={<PriceAdjustmentPage />} />
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/opening-balances" element={<OpeningBalancesPage />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/advanced-sales" element={<AdvancedSalesManagement />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/purchase-returns" element={<PurchaseReturns />} />
              <Route path="/manufacturing" element={<Manufacturing />} />
              <Route path="/bills" element={<Bills />} />
              
              {/* General Accounting Core & Financial Reports */}
              <Route path="/accounting/treasury-banks" element={<TreasuryBankDashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/designer" element={<ReportDesigner />} />
              <Route path="/next-gen-suite" element={<NextGenEnterpriseSuite />} />
              <Route path="/smart-cashier" element={<SmartCashier />} />
              <Route path="/cashier-sessions" element={<CashierSessionView />} />
              <Route path="/sessions" element={<CashierSessionView />} />
              <Route path="/adaptive-erp" element={<AdaptiveERPHub />} />
              <Route path="/workflow-engine" element={<WorkflowEngine />} />
              <Route path="/dynamic-forms" element={<DynamicFormsBuilder />} />
              <Route path="/advanced-reporting" element={<AdvancedReportingBI />} />
              <Route path="/crm-projects" element={<CRMAndProjects />} />
              <Route path="/ai-agents" element={<AIAgents />} />
              <Route path="/documents-ocr" element={<DocumentManagement />} />
              <Route path="/production-mrp" element={<ProductionMRP />} />
              <Route path="/hr-payroll" element={<HRAndPayroll />} />
              <Route path="/assets-fleet" element={<AssetsAndFleet />} />
              <Route path="/ecommerce" element={<EcommerceIntegrations />} />
              <Route path="/procurement" element={<ProcurementContracts />} />
              <Route path="/branches" element={<BranchManagement />} />
              <Route path="/zatca" element={<ZatcaEInvoicing />} />
              <Route path="/assistant-modules" element={<AssistantModulesHub />} />
              
              {/* Administration, Security & Developer Console */}
              <Route path="/users" element={<Users />} />
              <Route path="/alerts" element={<AlertSettings />} />
              <Route path="/notifications/whatsapp" element={<WhatsAppNotificationsCenter />} />
              <Route path="/whatsapp" element={<WhatsAppNotificationsCenter />} />
              <Route path="/reps" element={<Reps />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/invoices" element={<InvoiceSettings />} />
              <Route path="/settings/pos/function-keys" element={<POSFunctionKeysSettings />} />
              <Route path="/settings/pos/layout" element={<POSLayoutDesigner />} />
              <Route path="/settings/payment-methods" element={<PaymentMethodsSettings />} />
              <Route path="/settings/ticker" element={<TickerControlPanel />} />
              <Route path="/settings/security/roles" element={<RolePermissions />} />
              <Route path="/settings/security/audit" element={<SecurityAudit />} />
              <Route path="/settings/license" element={<LicenseActivation />} />
              <Route path="/settings/license/android" element={<AndroidActivationSimulator />} />
              <Route path="/settings/android-activation" element={<AndroidActivationSimulator />} />
              <Route path="/developer/console" element={<DeveloperConsole />} />
              <Route path="/developer/hub" element={<DeveloperPartnerHub />} />
              <Route path="/support/center" element={<SupportCenter />} />
              <Route path="/team/workflow" element={<TeamWorkflowHub />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  useEffect(() => {
    initBusinessIntelligence();
  }, []);

  return (
    <AuthProvider>
      <LearningModeProvider>
        <Toaster position="top-left" toastOptions={{ duration: 4000 }} />
        <AppContent />
      </LearningModeProvider>
    </AuthProvider>
  );
}
