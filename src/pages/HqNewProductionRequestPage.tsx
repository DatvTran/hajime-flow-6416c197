import { useCallback, useMemo } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNewProductRequests, usePurchaseOrders } from "@/contexts/AppDataContext";
import { isHqOperatorRole } from "@/lib/hq-order-scope";
import { HqNewProductionRequestView } from "@/components/hq/HqNewProductionRequestView";
import { toast } from "@/components/ui/sonner";
import type { PurchaseOrder } from "@/data/mockData";

export default function HqNewProductionRequestPage() {
  const { user } = useAuth();
  const { purchaseOrders, addPurchaseOrder } = usePurchaseOrders();
  const { patchNewProductRequest } = useNewProductRequests();
  const [searchParams] = useSearchParams();

  const prefill = useMemo(
    () => ({
      sku: searchParams.get("sku") ?? undefined,
      quantity: searchParams.get("qty") ?? searchParams.get("quantity") ?? undefined,
    }),
    [searchParams],
  );

  const linkedNprId = searchParams.get("npr");

  const handleCreate = useCallback(
    async (po: PurchaseOrder) => {
      const res = await addPurchaseOrder(po);
      if (res.success && linkedNprId) {
        await patchNewProductRequest(linkedNprId, { productionPoId: po.id });
        toast.success("Production PO created", {
          description: `${po.id} linked to ${linkedNprId}`,
        });
      }
      return res;
    },
    [addPurchaseOrder, patchNewProductRequest, linkedNprId],
  );

  if (!user || !isHqOperatorRole(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <HqNewProductionRequestView
      existing={purchaseOrders}
      onCreate={handleCreate}
      prefill={prefill}
      userRole={user.role}
    />
  );
}
