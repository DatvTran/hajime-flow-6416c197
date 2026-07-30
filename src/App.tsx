import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { HqOperatorLayout } from "@/components/hq/HqOperatorLayout";
import { RetailLayout } from "@/components/RetailLayout";
import { SalesRepLayout } from "@/components/SalesRepLayout";
import { DistributorLayout } from "@/components/DistributorLayout";
import { ManufacturerShellLayout } from "@/components/ManufacturerShellLayout";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RetailCartProvider } from "@/contexts/RetailCartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RequireAuth } from "@/components/RequireAuth";
import { InactivityWarningDialog } from "@/components/InactivityWarningDialog";
import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { RouteErrorOutlet } from "@/components/RouteErrorOutlet";
import { lazyWithChunkReload } from "@/lib/lazy-with-chunk-reload";

// Eagerly loaded (critical path)
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvite from "./pages/AcceptInvite";
import LicenseeApplicationPage from "./pages/LicenseeApplicationPage";
import NotFound from "./pages/NotFound";

// Lazy-loaded by route group for better chunking
const RoleHomeEntry = lazyWithChunkReload(() => import("./pages/RoleHomeEntry"));
const Inventory = lazyWithChunkReload(() => import("./pages/Inventory"));
const Orders = lazyWithChunkReload(() => import("./pages/Orders"));
const Accounts = lazyWithChunkReload(() => import("./pages/Accounts"));
const PurchaseOrders = lazyWithChunkReload(() => import("./pages/PurchaseOrders"));
const Manufacturer = lazyWithChunkReload(() => import("./pages/Manufacturer"));
const ManufacturerDashboardPage = lazyWithChunkReload(() => import("./pages/ManufacturerDashboardPage"));
const ManufacturerBrewBatchesPage = lazyWithChunkReload(() => import("./pages/ManufacturerBrewBatchesPage"));
const ManufacturerBottlingLinePage = lazyWithChunkReload(() => import("./pages/ManufacturerBottlingLinePage"));
const ManufacturerRawMaterialsPage = lazyWithChunkReload(() => import("./pages/ManufacturerRawMaterialsPage"));
const ManufacturerFinishedGoodsPage = lazyWithChunkReload(() => import("./pages/ManufacturerFinishedGoodsPage"));
const ManufacturerShipmentsPage = lazyWithChunkReload(() => import("./pages/ManufacturerShipmentsPage"));
const ManufacturerQualityControlPage = lazyWithChunkReload(() => import("./pages/ManufacturerQualityControlPage"));
const ManufacturerAnalyticsPage = lazyWithChunkReload(() => import("./pages/ManufacturerAnalyticsPage"));
const ManufacturerSupportPage = lazyWithChunkReload(() => import("./pages/ManufacturerSupportPage"));
const ManufacturerSpecSheetPage = lazyWithChunkReload(() => import("./pages/ManufacturerSpecSheetPage"));
const Shipments = lazyWithChunkReload(() => import("./pages/Shipments"));
const Reports = lazyWithChunkReload(() => import("./pages/Reports"));
const SettingsPage = lazyWithChunkReload(() => import("./pages/Settings"));
const CrmPage = lazyWithChunkReload(() => import("./pages/CrmPage"));
const AlertsHubPage = lazyWithChunkReload(() => import("./pages/AlertsHubPage"));
const MarketsPage = lazyWithChunkReload(() => import("./pages/MarketsPage"));
const GlobalMarketsPage = lazyWithChunkReload(() => import("./pages/GlobalMarketsPage"));
const HqDistributorPartnerPage = lazyWithChunkReload(() => import("./pages/HqDistributorPartnerPage"));

// Manufacturer routes
const ManufacturerMarketDemandPage = lazyWithChunkReload(() => import("./pages/ManufacturerMarketDemandPage"));
const ManufacturerProfilePage = lazyWithChunkReload(() => import("./pages/ManufacturerProfilePage"));
const ManufacturerProfilesListPage = lazyWithChunkReload(() => import("./pages/ManufacturerProfilesListPage"));
const HqAddSkuPage = lazyWithChunkReload(() => import("./pages/HqAddSkuPage"));
const HqEditSkuPage = lazyWithChunkReload(() => import("./pages/HqEditSkuPage"));
const HqDistributorOrderDetailPage = lazyWithChunkReload(() => import("./pages/HqDistributorOrderDetailPage"));
const HqAddDistributorPage = lazyWithChunkReload(() => import("./pages/HqAddDistributorPage"));
const HqManufacturerPartnerPage = lazyWithChunkReload(() => import("./pages/HqManufacturerPartnerPage"));
const HqManufacturerPartnerEditPage = lazyWithChunkReload(() => import("./pages/HqManufacturerPartnerEditPage"));
const HqAddManufacturerPage = lazyWithChunkReload(() => import("./pages/HqAddManufacturerPage"));
const ManufacturerProductRequestsPage = lazyWithChunkReload(() => import("./pages/ManufacturerProductRequestsPage"));
const FinancePaymentsPage = lazyWithChunkReload(() => import("./pages/FinancePaymentsPage"));
const IncentiveManagerPage = lazyWithChunkReload(() => import("./pages/IncentiveManagerPage"));
const HqIncentiveProgramEditPage = lazyWithChunkReload(() => import("./pages/HqIncentiveProgramEditPage"));
const HqIncentivePayoutSchedulePage = lazyWithChunkReload(() => import("./pages/HqIncentivePayoutSchedulePage"));
const ProductDevelopmentPage = lazyWithChunkReload(() => import("./pages/ProductDevelopmentPage"));
const HqNewProductRequestPage = lazyWithChunkReload(() => import("./pages/HqNewProductRequestPage"));
const HqProductRequestDetailPage = lazyWithChunkReload(() => import("./pages/HqProductRequestDetailPage"));
const HqNewProductionRequestPage = lazyWithChunkReload(() => import("./pages/HqNewProductionRequestPage"));

// Distributor routes
const BackordersPage = lazyWithChunkReload(() => import("./pages/BackordersPage"));
const DistributorDepletionsPage = lazyWithChunkReload(() => import("./pages/DistributorDepletionsPage"));
const DistributorInventoryAdjustmentsPage = lazyWithChunkReload(() => import("./pages/DistributorInventoryAdjustmentsPage"));
const DistributorSellThroughPage = lazyWithChunkReload(() => import("./pages/DistributorSellThroughPage"));
const DistributorCrmPage = lazyWithChunkReload(() => import("./pages/DistributorCrmPage"));
const DistributorHomePage = lazyWithChunkReload(() => import("./pages/DistributorHomePage"));
const DistributorPartnerProgramPage = lazyWithChunkReload(() => import("./pages/DistributorPartnerProgramPage"));
const DistributorPickPackPage = lazyWithChunkReload(() => import("./pages/DistributorPickPackPage"));
const DistributorLogShipmentPage = lazyWithChunkReload(() => import("./pages/DistributorLogShipmentPage"));
const DistributorDeliverySchedulePage = lazyWithChunkReload(
  () => import("./pages/DistributorDeliverySchedulePage"),
);
const SalesRepCrmPage = lazyWithChunkReload(() => import("./pages/SalesRepCrmPage"));

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
const RetailCatalogPage = lazyWithChunkReload(() => import("./pages/RetailCatalogPage"));
const RetailBackbarPage = lazyWithChunkReload(() => import("./pages/RetailBackbarPage"));

const queryClient = new QueryClient();

function useManufacturerPortalShell(): boolean {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (!user) return false;
  if (user.role === "brand_operator" || user.role === "founder_admin") return false;
  if (user.role === "manufacturer") return true;
  return pathname === "/manufacturer" || pathname.startsWith("/manufacturer/");
}

function useDistributorPortalShell(): boolean {
  const { user } = useAuth();
  const { pathname } = useLocation();
  return user?.role === "distributor" || pathname === "/distributor" || pathname.startsWith("/distributor/");
}

function useHqOperatorPortalShell(): boolean {
  const { user } = useAuth();
  return user?.role === "brand_operator" || user?.role === "founder_admin";
}

function ManufacturerHome() {
  const { user } = useAuth();
  return user?.role === "manufacturer" ? <ManufacturerDashboardPage /> : <Manufacturer />;
}

function AppDataShell() {
  const { user } = useAuth();
  const { state, formattedTimeRemaining, stayActive } = useInactivityTimer();
  const manufacturerPortal = useManufacturerPortalShell();
  const distributorPortal = useDistributorPortalShell();
  const hqOperatorPortal = useHqOperatorPortalShell();
  
  if (!user) {
    return null;
  }
  
  return (
    <AppDataProvider>
      {user?.role === "retail" ? (
        <RetailCartProvider>
          <RetailLayout />
        </RetailCartProvider>
      ) : user?.role === "sales_rep" || user?.role === "sales" ? (
        <SalesRepLayout />
      ) : hqOperatorPortal ? (
        <HqOperatorLayout />
      ) : manufacturerPortal ? (
        <ManufacturerShellLayout />
      ) : distributorPortal ? (
        <DistributorLayout />
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
          {/* Lazy routes suspend inside AppLayout / RetailLayout (Suspense around Outlet) so operator/distributor/sales sidebars stay mounted. */}
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/accept-invite" element={<AcceptInvite />} />
              <Route path="/licensee-application" element={<LicenseeApplicationPage />} />
              <Route element={<RequireAuth />}>
                <Route element={<RouteErrorOutlet />}>
                  <Route element={<AppDataShell />}>
                    <Route path="/" element={<RoleHomeEntry />} />
                    <Route path="/inventory/add" element={<HqAddSkuPage />} />
                    <Route path="/inventory/sku/:sku/edit" element={<HqEditSkuPage />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/orders/:orderId" element={<HqDistributorOrderDetailPage />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/partners/distributor/:orgId" element={<HqDistributorPartnerPage />} />
                    <Route path="/accounts/add" element={<HqAddDistributorPage />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/markets" element={<MarketsPage />} />
                    <Route path="/global-markets" element={<GlobalMarketsPage />} />
                    <Route path="/shipments" element={<Shipments />} />
                    <Route path="/production-requests/new" element={<HqNewProductionRequestPage />} />
                    <Route path="/production-requests" element={<PurchaseOrders />} />
                    <Route path="/purchase-orders/new" element={<HqNewProductionRequestPage />} />
                    <Route path="/purchase-orders" element={<PurchaseOrders />} />
                    <Route path="/product-development/new" element={<HqNewProductRequestPage />} />
                    <Route path="/product-development/:requestId" element={<HqProductRequestDetailPage />} />
                    <Route path="/product-development" element={<ProductDevelopmentPage />} />
                    <Route path="/manufacturer" element={<ManufacturerHome />} />
                    <Route path="/manufacturer/brew-batches" element={<ManufacturerBrewBatchesPage />} />
                    <Route path="/manufacturer/bottling-line" element={<ManufacturerBottlingLinePage />} />
                    <Route path="/manufacturer/materials" element={<ManufacturerRawMaterialsPage />} />
                    <Route path="/manufacturer/finished-goods" element={<ManufacturerFinishedGoodsPage />} />
                    <Route path="/manufacturer/quality" element={<ManufacturerQualityControlPage />} />
                    <Route path="/manufacturer/analytics" element={<ManufacturerAnalyticsPage />} />
                    <Route path="/manufacturer/support" element={<ManufacturerSupportPage />} />
                    <Route path="/manufacturer/market-demand" element={<ManufacturerMarketDemandPage />} />
                    <Route path="/manufacturer/profile" element={<ManufacturerProfilePage />} />
                    <Route path="/manufacturer/profiles/add" element={<HqAddManufacturerPage />} />
                    <Route path="/manufacturer/profiles/:manufacturerId/edit" element={<HqManufacturerPartnerEditPage />} />
                    <Route path="/manufacturer/profiles/:manufacturerId" element={<HqManufacturerPartnerPage />} />
                    <Route path="/manufacturer/profiles" element={<ManufacturerProfilesListPage />} />
                    <Route path="/manufacturer/purchase-orders/:poId/spec" element={<ManufacturerSpecSheetPage />} />
                    <Route path="/manufacturer/purchase-orders" element={<PurchaseOrders />} />
                    <Route path="/manufacturer/product-requests" element={<ManufacturerProductRequestsPage />} />
                    <Route path="/manufacturer/shipments" element={<ManufacturerShipmentsPage />} />
                    <Route path="/manufacturer/inventory" element={<Inventory />} />
                    <Route path="/manufacturer/alerts" element={<AlertsHubPage />} />
                    <Route path="/manufacturer/finance" element={<FinancePaymentsPage />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/alerts" element={<AlertsHubPage />} />
                    <Route path="/finance" element={<FinancePaymentsPage />} />
                    <Route path="/incentives/payouts" element={<HqIncentivePayoutSchedulePage />} />
                    <Route path="/incentives/:programId/edit" element={<HqIncentiveProgramEditPage />} />
                    <Route path="/incentives" element={<IncentiveManagerPage />} />
                    <Route path="/crm" element={<CrmPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    {/* Distributor namespaced routes */}
                    <Route path="/distributor" element={<DistributorHomePage />} />
                    <Route path="/distributor/inventory" element={<Inventory />} />
                    <Route path="/distributor/pick-pack" element={<DistributorPickPackPage />} />
                    <Route path="/distributor/log-shipment" element={<DistributorLogShipmentPage />} />
                    <Route path="/distributor/orders" element={<Orders />} />
                    <Route path="/distributor/accounts" element={<Accounts />} />
                    <Route path="/distributor/crm" element={<DistributorCrmPage />} />
                    <Route path="/distributor/purchase-orders" element={<PurchaseOrders />} />
                    <Route path="/distributor/shipments" element={<Shipments />} />
                    <Route path="/distributor/schedule" element={<DistributorDeliverySchedulePage />} />
                    <Route path="/distributor/backorders" element={<BackordersPage />} />
                    <Route path="/distributor/depletions" element={<DistributorDepletionsPage />} />
                    <Route path="/distributor/adjustments" element={<DistributorInventoryAdjustmentsPage />} />
                    <Route path="/distributor/sellthrough" element={<DistributorSellThroughPage />} />
                    <Route path="/distributor/alerts" element={<AlertsHubPage />} />
                    <Route path="/distributor/finance" element={<FinancePaymentsPage />} />
                    <Route path="/distributor/partner-program" element={<DistributorPartnerProgramPage />} />
                    <Route path="/distributor/reports" element={<Reports />} />
                    {/* Sales namespaced routes */}
                    <Route path="/sales" element={<SalesRepHomePage />} />
                    <Route path="/sales/crm" element={<SalesRepCrmPage />} />
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
                    <Route path="/retail/catalog" element={<RetailCatalogPage />} />
                    <Route path="/retail/backbar" element={<RetailBackbarPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
      </TooltipProvider>
        </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
