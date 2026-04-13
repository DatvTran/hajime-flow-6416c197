import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import RetailHomePage from "./pages/RetailHomePage";
import SalesSectionPage from "./pages/SalesSectionPage";
import SalesTargetsPage from "./pages/SalesTargetsPage";
import SalesRepHomePage from "./pages/SalesRepHomePage";
import SalesOpportunitiesPage from "./pages/SalesOpportunitiesPage";
import SalesVisitNotesPage from "./pages/SalesVisitNotesPage";
import FinancePaymentsPage from "./pages/FinancePaymentsPage";
import IncentiveManagerPage from "./pages/IncentiveManagerPage";
import ProductDevelopmentPage from "./pages/ProductDevelopmentPage";
import ManufacturerProductRequestsPage from "./pages/ManufacturerProductRequestsPage";

const queryClient = new QueryClient();

function AppDataShell() {
  const { user } = useAuth();
  
  if (!user) {
    return null;
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
  return (
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
                  <Route path="/markets" element={<MarketsPage />} />
                  <Route path="/shipments" element={<Shipments />} />
                  <Route path="/purchase-orders" element={<PurchaseOrders />} />
                  <Route path="/product-development" element={<ProductDevelopmentPage />} />
                  <Route path="/manufacturer" element={<Manufacturer />} />
                  <Route path="/manufacturer/market-demand" element={<ManufacturerMarketDemandPage />} />
                  <Route path="/manufacturer/profile" element={<ManufacturerProfilePage />} />
                  <Route path="/manufacturer/purchase-orders" element={<PurchaseOrders />} />
                  <Route path="/manufacturer/product-requests" element={<ManufacturerProductRequestsPage />} />
                  <Route path="/manufacturer/shipments" element={<Shipments />} />
                  <Route path="/manufacturer/inventory" element={<Inventory />} />
                  <Route path="/manufacturer/alerts" element={<AlertsHubPage />} />
                  <Route path="/manufacturer/finance" element={<FinancePaymentsPage />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/alerts" element={<AlertsHubPage />} />
                  <Route path="/finance" element={<FinancePaymentsPage />} />
                  <Route path="/incentives" element={<IncentiveManagerPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  {/* Distributor namespaced routes */}
                  <Route path="/distributor" element={<RoleHomeEntry />} />
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
                  <Route path="/sales" element={<SalesRepHomePage />} />
                  <Route path="/sales/accounts" element={<Accounts />} />
                  <Route path="/sales/orders" element={<Orders />} />
                  <Route path="/sales/opportunities" element={<SalesOpportunitiesPage />} />
                  <Route path="/sales/visits" element={<SalesVisitNotesPage />} />
                  <Route path="/sales/targets" element={<SalesTargetsPage />} />
                  <Route path="/sales/reports" element={<Reports />} />
                  <Route path="/sales/alerts" element={<AlertsHubPage />} />
                  {/* Retail namespaced routes */}
                  <Route path="/retail" element={<RetailHomePage />} />
                  <Route path="/retail/new-order" element={<RetailNewOrderPage />} />
                  <Route path="/retail/orders" element={<RetailMyOrdersPage />} />
                  <Route path="/retail/orders/:orderId" element={<RetailOrderDetailPage />} />
                  <Route path="/retail/account" element={<RetailAccountPage />} />
                  <Route path="/retail/support" element={<RetailSupportPage />} />
                  <Route path="/retail/reorder" element={<RetailReorderPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
