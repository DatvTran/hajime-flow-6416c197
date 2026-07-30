import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export type ManifestLine = {
  sku: string;
  productName: string;
  cases: number;
  bottles: number;
};

export type ManifestData = {
  id: string;
  destination: string;
  carrier: string;
  shipDate: string;
  lines: ManifestLine[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manifest: ManifestData | null;
};

export function ManufacturerManifestDialog({ open, onOpenChange, manifest }: Props) {
  const { t } = useLanguage();

  const totalCases = manifest?.lines.reduce((s, l) => s + l.cases, 0) ?? 0;
  const totalBottles = manifest?.lines.reduce((s, l) => s + l.bottles, 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t("Packing manifest")}</DialogTitle>
          <DialogDescription>
            {manifest ? `${manifest.id} · ${manifest.destination}` : null}
          </DialogDescription>
        </DialogHeader>

        {manifest ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {t("Carrier")}
                </div>
                <div className="font-medium">{manifest.carrier}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {t("Ship date")}
                </div>
                <div className="font-medium">{manifest.shipDate || "—"}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {t("Tracking")}
                </div>
                <div className="font-mono font-medium">{manifest.id}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {t("Destination")}
                </div>
                <div className="font-medium">{manifest.destination}</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-[13px]">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium text-muted-foreground">{t("SKU")}</th>
                    <th className="px-3 py-2 font-medium text-muted-foreground">{t("Product")}</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t("Cases")}</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t("Bottles")}</th>
                  </tr>
                </thead>
                <tbody>
                  {manifest.lines.map((line, i) => (
                    <tr key={`${line.sku}-${i}`} className="border-t border-border/60">
                      <td className="px-3 py-2 font-mono text-xs">{line.sku}</td>
                      <td className="px-3 py-2">{line.productName}</td>
                      <td className="px-3 py-2 text-right font-mono">{line.cases}</td>
                      <td className="px-3 py-2 text-right font-mono">{line.bottles.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-muted/30 font-semibold">
                    <td className="px-3 py-2" colSpan={2}>
                      {t("Total")}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{totalCases}</td>
                    <td className="px-3 py-2 text-right font-mono">{totalBottles.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("No manifest available for this shipment.")}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Close")}
          </Button>
          <Button onClick={() => window.print()} disabled={!manifest}>
            {t("Print")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
