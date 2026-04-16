import { lazy, Suspense } from "react";
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
import { InactivityWarningDialog } from "@/components/InactivityWarningDialog";
import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { Skeleton } from "@/components/ui/skeleton";

// Eagerly loaded (critical path)
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy-loaded by route group for better chunking
const RoleHomeEntry = lazy(() => import("./pages/RoleHomeEntry"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Orders = lazy(() => import("./pages/Orders"));
const Accounts = lazy(() => import("./pages/Accounts"));
const PurchaseOrders = lazy(() => import("./pages/PurchaseOrders"));
const Manufacturer = lazy(() => import("./pages/Manufacturer"));
const Shipments = lazy(() => import("./pages/Shipments"));
const Reports = lazy(() => import("./pages/Reports"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const AlertsHubPage = lazy(() => import("./pages/AlertsHubPage"));
const MarketsPage = lazy(() => import("./pages/MarketsPage"));

// Manufacturer routes
const ManufacturerMarketDemandPage = lazy(() => import("./pages/ManufacturerMarketDemandPage"));
const ManufacturerProfilePage = lazy(() => import("./pages/ManufacturerProfilePage"));
const ManufacturerProductRequestsPage = lazy(() => import("./pages/ManufacturerProductRequestsPage"));
const FinancePaymentsPage = lazy(() => import("./pages/FinancePaymentsPage"));
const IncentiveManagerPage = lazy(() => import("./pages/IncentiveManagerPage"));
const ProductDevelopmentPage = lazy(() => import("./pages/ProductDevelopmentPage"));

// Distributor routes
const BackordersPage = lazy(() => import("./pages/BackordersPage"));
const DistributorDepletionsPage = lazy(() => import("./pages/DistributorDepletionsPage"));
const DistributorInventoryAdjustmentsPage = lazy(() => import("./pages/DistributorInventoryAdjustmentsPage"));
const DistributorSellThroughPage = lazy(() => import("./pages/DistributorSellThroughPage"));
const NewWholesaleOrderPage = lazy(() => import("./pages/NewWholesaleOrderPage"));

// Sales routes
const SalesRepHomePage = lazy(() => import("./pages/SalesRepHomePage"));
const SalesSectionPage = lazy(() => import("./pages/SalesSectionPage"));
const SalesTargetsPage = lazy(() => import("./pages/SalesTargetsPage"));
const SalesOpportunitiesPage = lazy(() => import("./pages/SalesOpportunitiesPage"));
const SalesVisitNotesPage = lazy(() => import("./pages/SalesVisitNotesPage"));

// Retail routes
const RetailHomePage = lazy(() => import("./pages/RetailHomePage"));
const RetailNewOrderPage = lazy(() => import("./pages/RetailNewOrderPage"));
const RetailMyOrdersPage = lazy(() => import("./pages/RetailMyOrdersPage"));
const RetailOrderDetailPage = lazy(() => import("./pages/RetailOrderDetailPage"));
const RetailAccountPage = lazy(() => import("./pages/RetailAccountPage"));
const RetailSupportPage = lazy(() => import("./pages/RetailSupportPage"));
const RetailReorderPage = lazy(() => import("./pages/RetailReorderPage"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient();

function AppDataShell() {
  const { user } = useAuth();
  const { state, formattedTimeRemaining, stayActive } = useInactivityTimer();
  
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
      <InactivityWarningDialog
        isOpen={state === "warning"}
        timeRemaining={formattedTimeRemaining}
        onStayActive={stayActive}
      />
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
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppDataShell />}>
                  <Route path="/" element={<RoleHomeEntry />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/new-wholesale" element={<NewWholesaleOrderPage />} />
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
                  <Route path="/distributor/depletions" element={<DistributorDepletionsPage />} />
                  <Route path="/distributor/adjustments" element={<DistributorInventoryAdjustmentsPage />} />
                  <Route path="/distributor/sellthrough" element={<DistributorSellThroughPage />} />
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
