import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts, usePurchaseOrders } from "@/contexts/AppDataContext";
import { HqManufacturersView } from "@/components/hq/HqManufacturersView";
import {
  mergeHqManufacturerAccountsForDisplay,
  mergeHqManufacturerPurchaseOrdersForDisplay,
} from "@/lib/hq-manufacturers-demo";
import { isHqOperatorRole } from "@/lib/hq-order-scope";

export default function ManufacturerProfilesListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { accounts } = useAccounts();
  const { purchaseOrders } = usePurchaseOrders();

  const displayAccounts = useMemo(
    () => mergeHqManufacturerAccountsForDisplay(accounts),
    [accounts],
  );
  const displayOrders = useMemo(
    () => mergeHqManufacturerPurchaseOrdersForDisplay(purchaseOrders),
    [purchaseOrders],
  );

  if (user?.role === "manufacturer") {
    return <Navigate to="/manufacturer/profile" replace />;
  }

  if (!user || !isHqOperatorRole(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <HqManufacturersView
      accounts={displayAccounts}
      purchaseOrders={displayOrders}
      onAddManufacturer={() => navigate("/manufacturer/profiles/add")}
    />
  );
}
