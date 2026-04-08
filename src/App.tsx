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
import FinancePaymentsPage from "./pages/FinancePaymentsPage";

const queryClient = new QueryClient();

function AppDataShell() {
  const { user } = useAuth();
  console.log("[AppDataShell] user:", user?.email, "role:", user?.role);
  
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
    // Update debug indicator
    const indicator = document.getElementById('react-debug');
    if (indicator) {
      indicator.textContent = 'App mounted ✓';
    }
  }, []);
  
  return (
    <>
      {/* Visual confirmation App rendered */}
      <div style={{position:'fixed',top:20,left:0,background:'#00f',color:'#fff',padding:'4px 8px',fontSize:'12px',zIndex:99998}}>
        App component ✓
      </div>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppDataShell />}>
                <Route path="/" element={<RoleHomeEntry />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                <Route path="/manufacturer/market-demand" element={<ManufacturerMarketDemandPage />} />
                <Route path="/manufacturer/profile" element={<ManufacturerProfilePage />} />
                <Route path="/manufacturer" element={<Manufacturer />} />
                <Route path="/shipments" element={<Shipments />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/markets" element={<MarketsPage />} />
                <Route path="/alerts" element={<AlertsHubPage />} />
                <Route path="/distributor/backorders" element={<BackordersPage />} />
                <Route path="/retail/new-order" element={<RetailNewOrderPage />} />
                <Route path="/retail/orders/:orderId" element={<RetailOrderDetailPage />} />
                <Route path="/retail/orders" element={<RetailMyOrdersPage />} />
                <Route path="/retail/products" element={<Navigate to="/retail/new-order" replace />} />
                <Route path="/retail/reorder" element={<RetailReorderPage />} />
                <Route path="/retail/account" element={<RetailAccountPage />} />
                <Route path="/retail/support" element={<RetailSupportPage />} />
                <Route path="/sales/targets" element={<SalesTargetsPage />} />
                <Route path="/sales/:section" element={<SalesSectionPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/finance" element={<FinancePaymentsPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </>
  );
};

export default App;
