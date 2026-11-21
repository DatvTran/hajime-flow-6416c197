import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { DeliveryMonthStrip } from "@/components/expo/DeliveryMonthStrip";
import { createExportOrder, getFirstPressCapacity, type FirstPressCapacityMonth } from "@/lib/api-v1";
import { leadStarterLines, type ExpoLeadDetail } from "@/lib/expo-leads";
import { firstPressMl, litresLabel, monthLabel } from "@/lib/first-press-capacity";
import { skuMeta } from "@/lib/export-commercial";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: ExpoLeadDetail;
};

export function OpenExportFileDialog({ open, onOpenChange, lead }: Props) {
  const navigate = useNavigate();
  const [months, setMonths] = useState<FirstPressCapacityMonth[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [month, setMonth] = useState("");
  const [saving, setSaving] = useState(false);

  const lines = useMemo(() => leadStarterLines(lead.bottleFormat), [lead.bottleFormat]);
  const quoteMl = firstPressMl(lines);
  const picked = months?.find((m) => m.deliveryMonth === month) ?? null;

  useEffect(() => {
    if (!open) return;
    let live = true;
    setMonth("");
    setMonths(null);
    setLoadError(false);
    getFirstPressCapacity()
      .then((r) => live && setMonths(r.data))
      .catch(() => {
        if (!live) return;
        setMonths([]);
        setLoadError(true);
      });
    return () => {
      live = false;
    };
  }, [open]);

  async function submit() {
    setSaving(true);
    try {
      const res = await createExportOrder({
        expoLeadId: lead.displayId,
        buyerName: lead.fullName,
        buyerCompany: lead.companyName || lead.fullName,
        buyerEmail: lead.businessEmail,
        territory: lead.countryMarket || undefined,
        destinationCountry: lead.countryMarket || undefined,
        ...(month ? { requestedMonth: month } : {}),
      });
      if (res.existing) {
        toast.message(`This lead already has ${res.data.displayId}.`);
      } else {
        toast.success("Export file opened", {
          description: `${res.data.displayId}: the products they picked, 40 cases${
            month ? `, delivery ${monthLabel(month)}` : ""
          }. Adjust cases on the order.`,
        });
      }
      onOpenChange(false);
      navigate(`/export-orders/${res.data.displayId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open file");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Open export file</DialogTitle>
          <DialogDescription>
            Starts a quotation-stage order for {lead.companyName || lead.fullName}. Adjust cases on the order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Starting order</p>
            <ul className="mt-1 space-y-0.5 text-muted-foreground">
              {lines.map((l) => (
                <li key={l.sku}>
                  {l.cases} cases · First Press {skuMeta(l.sku)?.size ?? l.sku}
                </li>
              ))}
            </ul>
            <p className="mt-1 tabular-nums text-muted-foreground">{litresLabel(quoteMl)} of First Press</p>
          </div>

          <div>
            <p className="text-sm font-medium">Delivery month</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Optional. Litres are checked again when the PO acceptance is confirmed.
            </p>
            {months === null ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading capacity
              </p>
            ) : loadError ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Capacity couldn't be loaded. You can open the file now and pick the month on the order.
              </p>
            ) : (
              <DeliveryMonthStrip months={months} value={month} onChange={setMonth} quoteMl={quoteMl} />
            )}
            {picked && quoteMl > picked.leftMl ? (
              <p className="mt-2 text-sm text-[hsl(30_80%_28%)]" aria-live="polite">
                {monthLabel(picked.deliveryMonth)} has {picked.leftLitres.toLocaleString("en-US")} L left. Pick a later
                month or reduce the cases on the order before the PO acceptance goes out.
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void submit()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Open export file
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
