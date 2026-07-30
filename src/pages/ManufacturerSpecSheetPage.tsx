import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ManufacturerSpecSheetView } from "@/components/manufacturer/ManufacturerSpecSheetView";
import { ManufacturerSkeleton } from "@/components/skeletons";
import { useAppData, useProductionStatuses, useProducts, usePurchaseOrders } from "@/contexts/AppDataContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { buildSpecSheetModel } from "@/lib/manufacturer-spec-sheet";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ManufacturerSpecSheetPage() {
  const { t } = useLanguage();
  const { poId } = useParams<{ poId: string }>();
  const navigate = useNavigate();
  const { loading } = useAppData();
  const { purchaseOrders, patchPurchaseOrder } = usePurchaseOrders();
  const { productionStatuses } = useProductionStatuses();
  const { products } = useProducts();
  const logAudit = useAuditLog();

  const po = useMemo(() => purchaseOrders.find((p) => p.id === poId), [purchaseOrders, poId]);
  const product = useMemo(() => products.find((p) => p.sku === po?.sku), [products, po]);

  const model = useMemo(
    () => (po ? buildSpecSheetModel(po, product, productionStatuses) : null),
    [po, product, productionStatuses],
  );

  if (loading) {
    return <ManufacturerSkeleton />;
  }

  if (!po || !model) {
    return (
      <div className="animate-enter space-y-3 py-10 text-center">
        <p className="text-sm text-muted-foreground">{t("This production request could not be found.")}</p>
        <Link to="/manufacturer/purchase-orders" className="dist-btn dist-btn-outline dist-btn-sm no-underline">
          {t("Back to production requests")}
        </Link>
      </div>
    );
  }

  return (
    <ManufacturerSpecSheetView
      model={model}
      onAcceptSchedule={async () => {
        const noteBlock = `[Accepted · scheduled for production · ${new Date().toISOString().slice(0, 10)}]`;
        const notes = po.notes?.trim() ? `${po.notes.trim()}\n\n${noteBlock}` : noteBlock;
        await patchPurchaseOrder(po.id, { notes });
        logAudit("spec_accept_schedule", po.id, { type: "purchase_order", id: po.id });
        toast.success(t("Batch scheduled"), {
          description: t("{{sku}} is queued on the brew floor.", { sku: po.sku }),
        });
        navigate("/manufacturer/brew-batches");
      }}
      onRequestChange={() => navigate("/manufacturer/purchase-orders")}
    />
  );
}
