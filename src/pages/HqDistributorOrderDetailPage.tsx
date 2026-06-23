import { Link, Navigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccounts, useSalesOrders } from "@/contexts/AppDataContext";
import { HqDistributorOrderDetailView } from "@/components/hq/HqDistributorOrderDetailView";
import { filterWholesaleOrdersForHq, isHqOperatorRole } from "@/lib/hq-order-scope";
import { mergeHqWholesaleOrdersForDisplay } from "@/lib/hq-orders-demo";

export default function HqDistributorOrderDetailPage() {
  const { orderId = "" } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { salesOrders, patchSalesOrder } = useSalesOrders();
  const { accounts } = useAccounts();

  const order = useMemo(() => {
    const merged = mergeHqWholesaleOrdersForDisplay(salesOrders, accounts);
    const orders = filterWholesaleOrdersForHq(merged.orders, merged.accounts);
    const decoded = decodeURIComponent(orderId);
    return orders.find((o) => o.id === decoded || o.orderNumber === decoded);
  }, [salesOrders, accounts, orderId]);

  if (!user || !isHqOperatorRole(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (!order) {
    return (
      <div className="p-6 text-[13px] text-muted-foreground">
        Order not found. Return to{" "}
        <Link to="/orders" className="font-medium text-accent underline-offset-2 hover:underline">
          {t("Distributor orders")}
        </Link>
        .
      </div>
    );
  }

  return (
    <HqDistributorOrderDetailView
      order={order}
      onApprove={() => void patchSalesOrder(order.id, { status: "confirmed" })}
    />
  );
}
