import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayISO } from "@/lib/sales-order-utils";
import { cn } from "@/lib/utils";

export type CartLineRow = { sku: string; name: string; cases: number; line: number };

type Props = {
  id?: string;
  lines: CartLineRow[];
  subtotal: number;
  notes: string;
  onNotesChange: (v: string) => void;
  deliveryDate: string;
  onDeliveryDateChange: (v: string) => void;
  poRef: string;
  onPoRefChange: (v: string) => void;
  onRemoveSku: (sku: string) => void;
  onSubmit: () => void;
  className?: string;
};

/** Order summary sidebar — retail-store-app `.cart-panel` */
export function RetailOrderCartPanel({
  id = "retail-cart",
  lines,
  subtotal,
  notes,
  onNotesChange,
  deliveryDate,
  onDeliveryDateChange,
  poRef,
  onPoRefChange,
  onRemoveSku,
  onSubmit,
  className,
}: Props) {
  const empty = lines.length === 0;

  return (
    <aside
      id={id}
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)] lg:sticky lg:top-6",
        className,
      )}
    >
      <h2 className="border-b border-border/50 pb-3 font-display text-[17px] font-medium tracking-[-0.01em] text-foreground">
        Order summary
      </h2>

      <div className="min-h-[72px] py-1">
        {empty ? (
          <p className="py-5 text-center text-[13px] text-muted-foreground">No items added yet</p>
        ) : (
          <ul>
            {lines.map((r) => (
              <li
                key={r.sku}
                className="flex items-start justify-between gap-2 border-b border-border/40 py-2.5 text-[13px] last:border-0"
              >
                <span className="min-w-0 leading-snug">
                  <span className="font-medium text-foreground">{r.name}</span>
                  <span className="text-muted-foreground"> × {r.cases} case{r.cases !== 1 ? "s" : ""}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="font-mono text-[13px] tabular-nums">${r.line.toLocaleString()}</span>
                  <button
                    type="button"
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => onRemoveSku(r.sku)}
                    aria-label={`Remove ${r.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-between border-t-2 border-border pt-3 text-[15px] font-bold text-foreground">
        <span>Total</span>
        <span className="font-mono tabular-nums">${subtotal.toLocaleString()}.00</span>
      </div>

      <Textarea
        className="notes-area mt-3 min-h-[80px] resize-none rounded-lg border-border bg-background text-[13px]"
        rows={3}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Notes for your rep — special requests, delivery instructions…"
      />

      <details className="group mt-4 border-t border-border/50 pt-4">
        <summary className="cursor-pointer text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Delivery details
        </summary>
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="req-del" className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Preferred delivery
            </Label>
            <Input
              id="req-del"
              type="date"
              min={todayISO()}
              value={deliveryDate}
              onChange={(e) => onDeliveryDateChange(e.target.value)}
              className="h-[38px] text-[13px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="po-ref" className="text-[11px] uppercase tracking-wide text-muted-foreground">
              PO / reference
            </Label>
            <Input
              id="po-ref"
              value={poRef}
              onChange={(e) => onPoRefChange(e.target.value)}
              placeholder="Optional"
              className="h-[38px] text-[13px]"
            />
          </div>
        </div>
      </details>

      <Button
        type="button"
        className="btn-accent mt-3 h-11 w-full text-sm font-medium bg-accent text-accent-foreground hover:bg-[hsl(32_78%_48%)] disabled:opacity-50"
        disabled={empty}
        onClick={onSubmit}
      >
        Place order
      </Button>
      <p className="mt-2 text-center font-mono text-[11px] text-muted-foreground">AWAITING HQ APPROVAL AFTER SUBMIT</p>
    </aside>
  );
}
