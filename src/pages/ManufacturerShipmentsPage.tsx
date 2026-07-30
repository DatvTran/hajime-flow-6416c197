import { useMemo, useState } from "react";
import { ManufacturerShipmentsView } from "@/components/manufacturer/ManufacturerShipmentsView";
import {
  ManufacturerLogShipmentDialog,
  type LogShipmentPayload,
} from "@/components/manufacturer/ManufacturerLogShipmentDialog";
import {
  ManufacturerManifestDialog,
  type ManifestData,
} from "@/components/manufacturer/ManufacturerManifestDialog";
import { ManufacturerSkeleton } from "@/components/skeletons";
import {
  useAccounts,
  useAppData,
  useManufacturerFinishedGoods,
  usePurchaseOrders,
  useShipments,
} from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { TEAM_ROSTER } from "@/data/team-roster";
import {
  buildManufacturerShipments,
  defaultExpandedShipmentIds,
} from "@/lib/manufacturer-shipments";
import { resolveManufacturerAssignmentIdentity } from "@/lib/npr-manufacturer-scope";
import { createShipment } from "@/lib/api-v1-mutations";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const CASE_SIZE = 12;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

export default function ManufacturerShipmentsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { loading, data, refreshShipments } = useAppData();
  const { finishedGoods, deductFinishedGoods } = useManufacturerFinishedGoods();
  const { purchaseOrders } = usePurchaseOrders();
  const { accounts } = useAccounts();
  const { addShipment } = useShipments();
  const logAudit = useAuditLog();

  const [logOpen, setLogOpen] = useState(false);
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [manifestOpen, setManifestOpen] = useState(false);

  const teamMembers = data.teamMembers?.length ? data.teamMembers : TEAM_ROSTER;
  const identity = useMemo(
    () => resolveManufacturerAssignmentIdentity(user?.email, teamMembers, accounts),
    [user?.email, teamMembers, accounts],
  );
  const facilityOrigin = useMemo(() => {
    const label = [...identity.labels][0];
    return label || "Manufacturer facility";
  }, [identity]);

  const shipments = useMemo(
    () => buildManufacturerShipments(data.shipments, [...identity.labels]),
    [data.shipments, identity],
  );
  const defaultExpandedIds = useMemo(() => defaultExpandedShipmentIds(shipments), [shipments]);

  if (loading) {
    return <ManufacturerSkeleton />;
  }

  const handleLogShipment = async (payload: LogShipmentPayload) => {
    const { row, cases, destination, carrier } = payload;
    const bottles = cases * CASE_SIZE;
    const id = `SH-${Math.floor(1000 + Math.random() * 9000)}`;

    deductFinishedGoods({ sku: row.sku, cases });
    logAudit("shipment_log", id, { type: "shipment", id });

    const addLocalShipment = () =>
      addShipment({
        id,
        waybillNumber: id,
        origin: facilityOrigin,
        destination,
        destinationWarehouseName: destination,
        carrier,
        shipDate: todayIso(),
        eta: addDaysIso(5),
        actualDelivery: "",
        linkedOrder: row.poId ?? "",
        type: "outbound",
        status: "preparing",
        notes: `${cases} cs ${row.name} · ${row.lot}`,
        lineItems: [{ sku: row.sku, productName: row.name, quantity: bottles, cases, caseSize: CASE_SIZE }],
      });

    const po = row.poId ? purchaseOrders.find((p) => p.id === row.poId) : undefined;
    if (!po) {
      addLocalShipment();
      toast.success(t("Shipment dispatched"), {
        description: t("{{id}} · {{cases}} cs {{sku}} to {{dest}} (recorded locally)", {
          id,
          cases,
          sku: row.sku,
          dest: destination,
        }),
      });
      return;
    }

    try {
      await createShipment({
        order_type: "purchase_order",
        order_id: po.databaseId,
        po_number: po.id,
        carrier,
        from_location: facilityOrigin,
        to_location: destination,
        origin_port: facilityOrigin,
        waybill_number: id,
        tracking_number: id,
        status: "in-transit",
        ship_date: new Date().toISOString(),
        estimated_delivery_date: addDaysIso(5),
        total_bottles: bottles,
        items: [{ sku: row.sku, product_name: row.name, quantity: bottles }],
      });
      await refreshShipments();
      toast.success(t("Shipment dispatched"), {
        description: t("{{id}} · {{cases}} cs {{sku}} to {{dest}}", {
          id,
          cases,
          sku: row.sku,
          dest: destination,
        }),
      });
    } catch (err) {
      console.warn("[ManufacturerShipments] API create failed; recording locally:", err);
      addLocalShipment();
      toast.success(t("Shipment dispatched"), {
        description: t("{{id}} · {{cases}} cs {{sku}} to {{dest}} (recorded locally)", {
          id,
          cases,
          sku: row.sku,
          dest: destination,
        }),
      });
    }
  };

  const handleViewManifest = (id: string) => {
    logAudit("shipment_manifest_view", id, { type: "shipment", id });

    const raw = data.shipments.find((s) => (s.waybillNumber ?? s.id) === id);
    if (raw?.lineItems?.length) {
      setManifest({
        id,
        destination: raw.destinationWarehouseName ?? raw.destination,
        carrier: raw.carrier,
        shipDate: raw.shipDate,
        lines: raw.lineItems.map((li) => ({
          sku: li.sku,
          productName: li.productName ?? li.sku,
          cases: li.cases ?? Math.max(1, Math.round(li.quantity / (li.caseSize ?? CASE_SIZE))),
          bottles: li.quantity,
        })),
      });
      setManifestOpen(true);
      return;
    }

    const rowMatch = shipments.find((s) => s.id === id);
    if (rowMatch) {
      const m = /^(\d+)\s*cs\s*(.*)$/i.exec(rowMatch.items.trim());
      const cases = m ? Number(m[1]) : 0;
      const name = m ? m[2] : rowMatch.items;
      setManifest({
        id,
        destination: rowMatch.destination,
        carrier: rowMatch.carrier,
        shipDate: rowMatch.eta,
        lines: [{ sku: "—", productName: name, cases, bottles: cases * CASE_SIZE }],
      });
      setManifestOpen(true);
      return;
    }

    toast.error(t("No manifest available for this shipment."));
  };

  return (
    <>
      <ManufacturerShipmentsView
        shipments={shipments}
        defaultExpandedIds={defaultExpandedIds}
        onLogShipment={() => setLogOpen(true)}
        onViewManifest={handleViewManifest}
      />
      <ManufacturerLogShipmentDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        finishedGoods={finishedGoods}
        onSubmit={handleLogShipment}
      />
      <ManufacturerManifestDialog
        open={manifestOpen}
        onOpenChange={setManifestOpen}
        manifest={manifest}
      />
    </>
  );
}
