import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { RetailLayout } from "@/components/RetailLayout";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RetailCartProvider } from "@/contexts/RetailCartContext";
import { RequireAuth } from "@/components/RequireAuth";
import RoleHomeEntry from "./pages/RoleHomeEntry";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Accounts from "./pages/Accounts";
import PurchaseOrders from "./pages/PurchaseOrders";
import Manufacturer from "./pages/Manufacturer";
import Shipments from "./pages/Shipments";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AlertsHubPage from "./pages/AlertsHubPage";
import MarketsPage from "./pages/MarketsPage";
import ManufacturerMarketDemandPage from "./pages/ManufacturerMarketDemandPage";
import ManufacturerProfilePage from "./pages/ManufacturerProfilePage";
import BackordersPage from "./pages/BackordersPage";
import RetailReorderPage from "./pages/RetailReorderPage";
import RetailAccountPage from "./pages/RetailAccountPage";
import RetailSupportPage from "./pages/RetailSupportPage";
import RetailNewOrderPage from "./pages/RetailNewOrderPage";
import RetailMyOrdersPage from "./pages/RetailMyOrdersPage";
import RetailOrderDetailPage from "./pages/RetailOrderDetailPage";
import SalesSectionPage from "./pages/SalesSectionPage";
import SalesTargetsPage from "./pages/SalesTargetsPage";
import SalesRepHomePage from "./pages/SalesRepHomePage";
import FinancePaymentsPage from "./pages/FinancePaymentsPage";

const queryClient = new QueryClient();

// Debug wrapper component
function DebugWrapper({ step, children }: { step: string; children: React.ReactNode }) {
  useEffect(() => {
    console.log(`[Debug] ${step} mounted`);
    const el = document.getElementById('debug-step');
    if (el) el.textContent = step;
  }, [step]);
  return <>{children}</>;
}

function AppDataShell() {
  const { user } = useAuth();
  console.log("[AppDataShell] user:", user?.email, "role:", user?.role);
  
  // Update debug indicator
  const debugEl = document.getElementById('debug-step');
  if (debugEl) {
    debugEl.textContent = `AppDataShell: user=${user?.email ?? 'null'}`;
  }
  
  if (!user) {
    return (
      <div style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        background: '#1a1a2e', color: '#fff', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui', zIndex: 99999 
      }}>
        <div>
          <div style={{ fontSize: '20px' }}>⏳ Waiting for auth...</div>
          <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '10px' }}>
            user: {user?.email ?? 'null'}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <AppDataProvider>
      {user?.role === "retail" ? (
        <RetailCartProvider>
          <RetailLayout />
        </RetailCartProvider>
      ) : (
        <AppLayout />
      )}
    </AppDataProvider>
  );
}

const App = () => {
  console.log("[App] Component executing");
  
  useEffect(() => {
    console.log("[App] useEffect running");
    const indicator = document.getElementById('react-debug');
    if (indicator) {
      indicator.textContent = 'App mounted ✓';
    }
  }, []);
  
  return (
    <>
      {/* Debug indicators */}
      <div style={{position:'fixed',top:0,left:0,background:'#0f0',color:'#000',padding:'4px 8px',fontSize:'12px',zIndex:99999,fontFamily:'monospace'}}>
        React OK
      </div>
      <div style={{position:'fixed',top:20,left:0,background:'#00f',color:'#fff',padding:'4px 8px',fontSize:'12px',zIndex:99998}}>
        App component ✓
      </div>
      
      <div style={{position:'fixed',top:40,left:0,background:'#f90',color:'#000',padding:'4px 8px',fontSize:'12px',zIndex:99997,fontFamily:'monospace'}} id="debug-step">
        Starting...
      </div>
      
      <QueryClientProvider client={queryClient}>
        <DebugWrapper step="QueryClientProvider">
        <AuthProvider>
          <DebugWrapper step="AuthProvider">
          <TooltipProvider>
            <DebugWrapper step="TooltipProvider">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <DebugWrapper step="BrowserRouter">
              <Routes>
                <Route path="/login" element={<DebugWrapper step="Login route"><Login /></DebugWrapper>} />
                <Route element={<DebugWrapper step="RequireAuth"><RequireAuth /></DebugWrapper>}>
                  <Route element={<DebugWrapper step="AppDataShell"><AppDataShell /></DebugWrapper>}>
                    <Route path="/" element={<DebugWrapper step="Dashboard"><RoleHomeEntry /></DebugWrapper>} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/markets" element={<MarketsPage />} />
                    <Route path="/shipments" element={<Shipments />} />
                    <Route path="/purchase-orders" element={<PurchaseOrders />} />
                    <Route path="/manufacturer" element={<Manufacturer />} />
                    <Route path="/manufacturer/*" element={<Manufacturer />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/alerts" element={<AlertsHubPage />} />
                    <Route path="/finance" element={<FinancePaymentsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    {/* Distributor namespaced routes */}
                    <Route path="/distributor" element={<DebugWrapper step="Distributor Dashboard"><RoleHomeEntry /></DebugWrapper>} />
                    <Route path="/distributor/inventory" element={<Inventory />} />
                    <Route path="/distributor/orders" element={<Orders />} />
                    <Route path="/distributor/accounts" element={<Accounts />} />
                    <Route path="/distributor/purchase-orders" element={<PurchaseOrders />} />
                    <Route path="/distributor/shipments" element={<Shipments />} />
                    <Route path="/distributor/backorders" element={<BackordersPage />} />
                    <Route path="/distributor/alerts" element={<AlertsHubPage />} />
                    <Route path="/distributor/finance" element={<FinancePaymentsPage />} />
                    <Route path="/distributor/reports" element={<Reports />} />
                    {/* Sales namespaced routes */}
                    <Route path="/sales" element={<DebugWrapper step="Sales Dashboard"><SalesRepHomePage /></DebugWrapper>} />
                    <Route path="/sales/accounts" element={<Accounts />} />
                    <Route path="/sales/orders" element={<Orders />} />
                    <Route path="/sales/opportunities" element={<SalesSectionPage />} />
                    <Route path="/sales/visits" element={<SalesSectionPage />} />
                    <Route path="/sales/targets" element={<SalesTargetsPage />} />
                    <Route path="/sales/reports" element={<Reports />} />
                    <Route path="/sales/alerts" element={<AlertsHubPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Route>
              </Routes>
              </DebugWrapper>
            </BrowserRouter>
            </DebugWrapper>
          </TooltipProvider>
          </DebugWrapper>
        </AuthProvider>
        </DebugWrapper>
      </QueryClientProvider>
    </>
  );
};

export default App;
