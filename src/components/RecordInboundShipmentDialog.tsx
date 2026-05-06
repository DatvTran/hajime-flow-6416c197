import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { createShipment } from "@/lib/api-v1-mutations";
import { toast } from "@/components/ui/sonner";
import type { PurchaseOrder } from "@/data/mockData";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function RecordInboundShipmentDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { data, refreshShipments } = useAppData();
  const [poKey, setPoKey] = useState<string>("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [fromLocation, setFromLocation] = useState("");
  const [shipDepartedAt, setShipDepartedAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [originPort, setOriginPort] = useState("");
  const [waybillNumber, setWaybillNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [busy, setBusy] = useState(false);

  const warehouses = useMemo(
    () => (data.warehouses ?? []).filter((w) => w.isActive !== false).sort((a, b) => a.sortOrder - b.sortOrder),
    [data.warehouses],
  );

  const purchaseOrdersEligible = useMemo(() => {
    const pos = data.purchaseOrders ?? [];
    return pos.filter((p) => p.databaseId != null && Number.isFinite(p.databaseId));
  }, [data.purchaseOrders]);

  const selectedPo = useMemo((): PurchaseOrder | undefined => {
    if (!poKey) return undefined;
    return purchaseOrdersEligible.find((p) => String(p.databaseId) === poKey || p.id === poKey);
  }, [purchaseOrdersEligible, poKey]);

  const defaultShipFrom =
    data.operationalSettings?.manufacturerName?.trim() ||
    user?.displayName?.trim() ||
    "Manufacturer facility";

  const resetForm = () => {
    setCarrier("");
    setTracking("");
    setPoKey("");
    setWarehouseId("");
    setFromLocation("");
    setOriginPort("");
    setWaybillNumber("");
    setShipDepartedAt(toDatetimeLocalValue(new Date()));
  };

  const submit = async () => {
    const wid = warehouseId.trim();
    if (!wid) {
      toast.error("Choose a receiving warehouse");
      return;
    }
    if (!selectedPo?.databaseId) {
      toast.error("Choose a synced production purchase order");
      return;
    }
    const depart = shipDepartedAt.trim();
    if (!depart) {
      toast.error("Shipping departure date and time are required");
      return;
    }
    const departedDate = new Date(depart);
    if (Number.isNaN(departedDate.getTime())) {
      toast.error("Invalid shipping timestamp");
      return;
    }
    const port = originPort.trim();
    if (!port) {
      toast.error("Port as shown on the waybill is required");
      return;
    }
    const waybill = waybillNumber.trim();
    if (!waybill) {
      toast.error("Waybill number is required");
      return;
    }
    const car = carrier.trim();
    if (!car) {
      toast.error("Carrier / forwarder is required");
      return;
    }

    setBusy(true);
    try {
      const origin = fromLocation.trim() || defaultShipFrom;
      await createShipment({
        order_type: "purchase_order",
        order_id: selectedPo.databaseId,
        po_number: selectedPo.id,
        destination_warehouse_id: wid,
        from_location: origin,
        ship_date: departedDate.toISOString(),
        origin_port: port,
        waybill_number: waybill,
        carrier: car,
        tracking_number: tracking.trim() || undefined,
        shipment_number: `IN-${Date.now()}`,
      });
      await refreshShipments();
      toast.success("Inbound shipment recorded", {
        description: `${selectedPo.id} → ${warehouses.find((w) => w.id === wid)?.name ?? "warehouse"}`,
      });
      onOpenChange(false);
      resetForm();
    } catch (e) {
      toast.error("Could not save shipment", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetForm();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Record inbound shipment</DialogTitle>
          <DialogDescription>
            Production PO → receiving warehouse. Either Brand HQ or the manufacturer may enter this; everyone sees one
            shared shipment so both sides know where the stock is routed. Departure time, carrier, port (as on the
            waybill), and waybill number are required by the API.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Purchase order (production)</Label>
            <Select value={poKey || undefined} onValueChange={(v) => setPoKey(v)}>
              <SelectTrigger className="touch-manipulation">
                <SelectValue placeholder="Select PO…" />
              </SelectTrigger>
              <SelectContent>
                {purchaseOrdersEligible.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No API-synced POs with database IDs.</div>
                ) : (
                  purchaseOrdersEligible.map((p) => (
                    <SelectItem key={String(p.databaseId)} value={String(p.databaseId)}>
                      {p.id} · {p.sku !== "—" ? p.sku : "SKU TBD"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Receiving warehouse</Label>
            <Select value={warehouseId || undefined} onValueChange={(v) => setWarehouseId(v)}>
              <SelectTrigger className="touch-manipulation">
                <SelectValue placeholder="Choose warehouse…" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="in-ship-at">Shipping departure (date &amp; time)</Label>
            <Input
              id="in-ship-at"
              type="datetime-local"
              value={shipDepartedAt}
              onChange={(e) => setShipDepartedAt(e.target.value)}
              className="touch-manipulation"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="in-port">Port (as on waybill)</Label>
            <Input
              id="in-port"
              value={originPort}
              onChange={(e) => setOriginPort(e.target.value)}
              placeholder="e.g. Yokohama, JP — POL"
              className="touch-manipulation"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="in-waybill">Waybill number</Label>
            <Input
              id="in-waybill"
              value={waybillNumber}
              onChange={(e) => setWaybillNumber(e.target.value)}
              placeholder="Ocean / air waybill or house B/L"
              className="touch-manipulation"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="in-from">Ship-from (facility / origin)</Label>
            <Input
              id="in-from"
              value={fromLocation}
              placeholder={defaultShipFrom}
              onChange={(e) => setFromLocation(e.target.value)}
              className="touch-manipulation"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="in-carrier">Carrier / forwarder</Label>
              <Input
                id="in-carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="Required"
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="in-track">Tracking / container ref (optional)</Label>
              <Input
                id="in-track"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="Optional"
                className="touch-manipulation"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="touch-manipulation" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className="touch-manipulation" disabled={busy} onClick={() => void submit()}>
            {busy ? "Saving…" : "Save shipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
