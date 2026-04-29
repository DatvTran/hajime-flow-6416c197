import { Suspense } from "react";
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
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RequireAuth } from "@/components/RequireAuth";
import { InactivityWarningDialog } from "@/components/InactivityWarningDialog";
import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteErrorOutlet } from "@/components/RouteErrorOutlet";
import { lazyWithChunkReload } from "@/lib/lazy-with-chunk-reload";

// Eagerly loaded (critical path)
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy-loaded by route group for better chunking
const RoleHomeEntry = lazyWithChunkReload(() => import("./pages/RoleHomeEntry"));
const Inventory = lazyWithChunkReload(() => import("./pages/Inventory"));
const Orders = lazyWithChunkReload(() => import("./pages/Orders"));
const Accounts = lazyWithChunkReload(() => import("./pages/Accounts"));
const PurchaseOrders = lazyWithChunkReload(() => import("./pages/PurchaseOrders"));
const Manufacturer = lazyWithChunkReload(() => import("./pages/Manufacturer"));
const Shipments = lazyWithChunkReload(() => import("./pages/Shipments"));
const Reports = lazyWithChunkReload(() => import("./pages/Reports"));
const SettingsPage = lazyWithChunkReload(() => import("./pages/Settings"));
const AlertsHubPage = lazyWithChunkReload(() => import("./pages/AlertsHubPage"));
const MarketsPage = lazyWithChunkReload(() => import("./pages/MarketsPage"));
const GlobalMarketsPage = lazyWithChunkReload(() => import("./pages/GlobalMarketsPage"));

// Manufacturer routes
const ManufacturerMarketDemandPage = lazyWithChunkReload(() => import("./pages/ManufacturerMarketDemandPage"));
const ManufacturerProfilePage = lazyWithChunkReload(() => import("./pages/ManufacturerProfilePage"));
const ManufacturerProductRequestsPage = lazyWithChunkReload(() => import("./pages/ManufacturerProductRequestsPage"));
const FinancePaymentsPage = lazyWithChunkReload(() => import("./pages/FinancePaymentsPage"));
const IncentiveManagerPage = lazyWithChunkReload(() => import("./pages/IncentiveManagerPage"));
const ProductDevelopmentPage = lazyWithChunkReload(() => import("./pages/ProductDevelopmentPage"));

// Distributor routes
const BackordersPage = lazyWithChunkReload(() => import("./pages/BackordersPage"));
const DistributorDepletionsPage = lazyWithChunkReload(() => import("./pages/DistributorDepletionsPage"));
const DistributorInventoryAdjustmentsPage = lazyWithChunkReload(() => import("./pages/DistributorInventoryAdjustmentsPage"));
const DistributorSellThroughPage = lazyWithChunkReload(() => import("./pages/DistributorSellThroughPage"));
const NewWholesaleOrderPage = lazyWithChunkReload(() => import("./pages/NewWholesaleOrderPage"));

// Sales routes
const SalesRepHomePage = lazyWithChunkReload(() => import("./pages/SalesRepHomePage"));
// SalesSectionPage removed — functionality covered by SalesOpportunitiesPage + SalesVisitNotesPage
const SalesTargetsPage = lazyWithChunkReload(() => import("./pages/SalesTargetsPage"));
const SalesOpportunitiesPage = lazyWithChunkReload(() => import("./pages/SalesOpportunitiesPage"));
const SalesVisitNotesPage = lazyWithChunkReload(() => import("./pages/SalesVisitNotesPage"));

// Retail routes
const RetailHomePage = lazyWithChunkReload(() => import("./pages/RetailHomePage"));
const RetailNewOrderPage = lazyWithChunkReload(() => import("./pages/RetailNewOrderPage"));
const RetailMyOrdersPage = lazyWithChunkReload(() => import("./pages/RetailMyOrdersPage"));
const RetailOrderDetailPage = lazyWithChunkReload(() => import("./pages/RetailOrderDetailPage"));
const RetailAccountPage = lazyWithChunkReload(() => import("./pages/RetailAccountPage"));
const RetailSupportPage = lazyWithChunkReload(() => import("./pages/RetailSupportPage"));
const RetailReorderPage = lazyWithChunkReload(() => import("./pages/RetailReorderPage"));

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
        <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<RequireAuth />}>
                <Route element={<RouteErrorOutlet />}>
                  <Route element={<AppDataShell />}>
                  <Route path="/" element={<RoleHomeEntry />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/new-wholesale" element={<NewWholesaleOrderPage />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/markets" element={<MarketsPage />} />
                  <Route path="/global-markets" element={<GlobalMarketsPage />} />
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
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
        </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
