import { useEffect, useMemo, useState } from "react";
import type { FinishedGoodsRow } from "@/lib/manufacturer-finished-goods";
import { availableCasesForSku } from "@/lib/manufacturer-finished-goods";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

const DESTINATIONS = [
  "Hajime HQ · Tokyo DC",
  "Hajime HQ · Toronto Main",
  "Hajime HQ · Milan Depot",
] as const;

const CARRIERS = ["Nippon Freight", "Nippon Express", "DHL Global"] as const;

export type LogShipmentPayload = {
  row: FinishedGoodsRow;
  cases: number;
  destination: string;
  carrier: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finishedGoods: FinishedGoodsRow[];
  onSubmit: (payload: LogShipmentPayload) => void;
};

export function ManufacturerLogShipmentDialog({ open, onOpenChange, finishedGoods, onSubmit }: Props) {
  const { t } = useLanguage();

  const shippable = useMemo(
    () => finishedGoods.filter((r) => r.cases - r.reserved > 0),
    [finishedGoods],
  );

  const keyFor = (r: FinishedGoodsRow) => `${r.sku}__${r.lot}`;

  const [selectedKey, setSelectedKey] = useState<string>("");
  const [cases, setCases] = useState<string>("");
  const [destination, setDestination] = useState<string>(DESTINATIONS[0]);
  const [carrier, setCarrier] = useState<string>(CARRIERS[0]);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => shippable.find((r) => keyFor(r) === selectedKey) ?? null,
    [shippable, selectedKey],
  );

  const maxCases = selected ? selected.cases - selected.reserved : 0;

  useEffect(() => {
    if (!open) return;
    const first = shippable[0];
    setSelectedKey(first ? keyFor(first) : "");
    setCases(first ? String(first.cases - first.reserved) : "");
    setDestination(DESTINATIONS[0]);
    setCarrier(CARRIERS[0]);
    setError(null);
  }, [open, shippable]);

  useEffect(() => {
    if (selected) setCases(String(selected.cases - selected.reserved));
  }, [selected]);

  const submit = () => {
    if (!selected) {
      setError(t("Select a finished-goods lot to ship."));
      return;
    }
    const n = Number(cases);
    if (!Number.isFinite(n) || n <= 0) {
      setError(t("Enter a valid case count."));
      return;
    }
    const available = availableCasesForSku(finishedGoods, selected.sku);
    if (n > available) {
      setError(t("Only {{n}} cs available for this SKU.", { n: available }));
      return;
    }
    onSubmit({ row: selected, cases: n, destination, carrier });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t("Log new shipment")}</DialogTitle>
          <DialogDescription>
            {t("Pick a finished-goods lot and destination. Cases are deducted from finished goods on dispatch.")}
          </DialogDescription>
        </DialogHeader>

        {shippable.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("No finished goods available to ship. Complete a bottling run first.")}
          </p>
        ) : (
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>{t("Finished-goods lot")}</Label>
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select a lot")} />
                </SelectTrigger>
                <SelectContent>
                  {shippable.map((r) => (
                    <SelectItem key={keyFor(r)} value={keyFor(r)}>
                      {r.name} · {r.lot} · {r.cases - r.reserved} cs avail
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ship-cases">{t("Cases")}</Label>
              <Input
                id="ship-cases"
                type="number"
                min={1}
                max={maxCases}
                value={cases}
                onChange={(e) => {
                  setCases(e.target.value);
                  if (error) setError(null);
                }}
              />
              {selected ? (
                <p className="text-[11px] text-muted-foreground">
                  {t("{{n}} cs available", { n: maxCases })} · {selected.sku}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>{t("Destination")}</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DESTINATIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("Carrier")}</Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARRIERS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error ? <p className="text-[13px] font-medium text-destructive">{error}</p> : null}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button onClick={submit} disabled={shippable.length === 0}>
            {t("Dispatch shipment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
