import { useEffect, useState } from "react";
import type { Product } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { availableBottlesForSku, stockAvailabilityLabel } from "@/lib/retail-inventory";
import type { InventoryItem } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";

type Presentation = "gallery" | "catalog";

type Props = {
  product: Product;
  inventory: InventoryItem[];
  inCartCases: number;
  onAddToCart: (cases: number) => void;
  disabled?: boolean;
  /** On-premise bottles for this venue (optional — drives low-shelf messaging). */
  shelfBottles?: number;
  shelfThresholdBottles?: number;
  /** `catalog` matches Hajime retail-store-app kit (horizontal bottle strip + denser controls). */
  presentation?: Presentation;
};

function bottleVariantClass(sku: string): string {
  const variants = [
    "bg-[linear-gradient(160deg,hsl(24_10%_14%),hsl(24_12%_10%))]",
    "bg-[linear-gradient(160deg,hsl(37_16%_96%),hsl(35_12%_90%))] ring-1 ring-[hsl(35_12%_84%)]",
    "bg-[linear-gradient(160deg,hsl(215_60%_22%),hsl(215_72%_30%))]",
    "bg-[linear-gradient(160deg,hsl(32_60%_35%),hsl(30_50%_28%))]",
    "bg-[linear-gradient(160deg,hsl(40_30%_88%),hsl(38_20%_80%))] ring-1 ring-[hsl(38_16%_76%)]",
    "bg-[linear-gradient(160deg,hsl(158_40%_22%),hsl(158_50%_16%))]",
  ];
  let h = 0;
  for (let i = 0; i < sku.length; i++) h += sku.charCodeAt(i);
  return variants[h % variants.length]!;
}

export function RetailProductCard({
  product,
  inventory,
  inCartCases,
  onAddToCart,
  disabled,
  shelfBottles,
  shelfThresholdBottles = 48,
  presentation = "gallery",
}: Props) {
  const min = product.minOrderCases ?? 1;
  const [qty, setQty] = useState(() => Math.max(min, inCartCases || min));
  useEffect(() => {
    if (inCartCases > 0) setQty(inCartCases);
  }, [inCartCases]);
  const bottles = availableBottlesForSku(inventory, product.sku);
  const { label: availLabel, tone } = stockAvailabilityLabel(bottles, product.caseSize);
  const casePrice = product.wholesaleCasePrice ?? 0;
  const perBottle = product.caseSize > 0 ? casePrice / product.caseSize : 0;
  const out = tone === "out" || disabled;

  const bump = (d: number) => setQty((q) => Math.max(min, q + d));

  const shelfLow = shelfBottles !== undefined && shelfBottles < shelfThresholdBottles;
  const depPct =
    shelfBottles !== undefined
      ? Math.min(100, Math.round((shelfBottles / Math.max(shelfThresholdBottles * 2, 1)) * 100))
      : 0;
  const depTone =
    shelfBottles === undefined
      ? ""
      : shelfLow
        ? "bg-[hsl(0_68%_48%)]"
        : depPct < 45
          ? "bg-[hsl(38_90%_50%)]"
          : "bg-[hsl(158_56%_36%)]";

  if (presentation === "catalog") {
    return (
      <article
        className={cn(
          "flex flex-col rounded-[14px] border border-border/60 bg-card p-[18px] shadow-[var(--shadow-soft)] transition-[box-shadow,transform] duration-250 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lifted)]",
          out && "opacity-75",
        )}
      >
        <div className="mb-3.5 flex gap-3.5">
          <div className="relative h-20 w-12 shrink-0 overflow-hidden rounded-[6px_6px_10px_10px]">
            <div className={cn("absolute inset-0", bottleVariantClass(product.sku))} />
            <div className="absolute left-1/2 top-0 h-[11px] w-[13px] -translate-x-1/2 rounded-[2px] bg-[hsl(35_14%_80%)]" />
            {product.imageUrl ? (
              <img src={product.imageUrl} alt="" className="relative z-[1] h-full w-full object-cover opacity-35 mix-blend-overlay" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">{product.sku}</p>
            <h3 className="font-display text-[17px] font-medium leading-tight tracking-[-0.01em]">{product.name}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {product.shortDescription ?? `${product.size} · ${product.caseSize} bottles per case`}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {shelfLow ? (
                <span className="rounded-full border border-[hsl(38_90%_50%/0.25)] bg-[hsl(38_90%_50%/0.1)] px-2 py-0.5 text-[10px] font-medium text-[hsl(30_80%_30%)]">
                  Low stock
                </span>
              ) : null}
              {tone === "low" ? (
                <span className="rounded-full border border-[hsl(40_88%_42%/0.25)] bg-[hsl(40_88%_42%/0.1)] px-2 py-0.5 text-[10px] font-medium text-[hsl(40_88%_30%)]">
                  DC tight
                </span>
              ) : null}
              {inCartCases > 0 ? (
                <span className="rounded-full border border-[hsl(158_56%_36%/0.2)] bg-[hsl(158_56%_36%/0.08)] px-2 py-0.5 text-[10px] font-medium text-[hsl(158_56%_26%)]">
                  In order
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {shelfBottles !== undefined ? (
          <>
            <div className="mb-2 h-1 overflow-hidden rounded-full bg-border">
              <div className={cn("h-full rounded-full transition-all", depTone)} style={{ width: `${depPct}%` }} />
            </div>
            <p className="mb-2.5 text-[11px] text-muted-foreground">
              {shelfBottles} bottles on shelf
              {shelfLow ? " · reorder soon" : ""}
            </p>
          </>
        ) : (
          <div className="mb-2 h-2" />
        )}

        <div className="mb-2.5 flex items-baseline justify-between gap-2">
          <div>
            <span className="font-display text-xl font-semibold tabular-nums tracking-[-0.01em]">
              ${perBottle > 0 ? perBottle.toFixed(2) : "—"}
            </span>
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">/ bottle</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Avail.{" "}
            <strong className={cn("font-semibold", tone === "ok" && "text-[hsl(158_56%_28%)]")}>{availLabel}</strong>
          </p>
        </div>

        <div className="mb-2.5 flex items-center gap-2">
          <button
            type="button"
            className="flex size-7 shrink-0 touch-manipulation items-center justify-center rounded-md border border-border bg-background text-sm transition-colors hover:bg-muted disabled:opacity-40"
            disabled={out || qty <= min}
            onClick={() => bump(-1)}
            aria-label="Decrease cases"
          >
            −
          </button>
          <span className="min-w-[26px] text-center font-mono text-sm font-medium tabular-nums">{qty}</span>
          <button
            type="button"
            className="flex size-7 shrink-0 touch-manipulation items-center justify-center rounded-md border border-border bg-background text-sm transition-colors hover:bg-muted disabled:opacity-40"
            disabled={out}
            onClick={() => bump(1)}
            aria-label="Increase cases"
          >
            +
          </button>
          <span className="ml-auto text-[11px] text-muted-foreground">
            = {qty * product.caseSize} bottles ({qty} case{qty !== 1 ? "s" : ""})
          </span>
        </div>

        <button
          type="button"
          disabled={out}
          onClick={() => onAddToCart(qty)}
          className={cn(
            "flex h-[34px] w-full touch-manipulation items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium transition-[background,transform] duration-150 active:scale-[0.98]",
            inCartCases > 0
              ? "border border-[hsl(158_56%_36%/0.25)] bg-[hsl(158_56%_36%/0.1)] text-[hsl(158_56%_28%)] hover:bg-[hsl(158_56%_36%/0.14)]"
              : "bg-accent text-accent-foreground hover:bg-[hsl(32_78%_48%)]",
          )}
        >
          {inCartCases > 0 ? (
            <>
              <Check className="size-3" strokeWidth={2} />
              In current order
            </>
          ) : (
            <>
              <ShoppingBag className="size-3.5" />
              Add to order
            </>
          )}
        </button>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md",
        out && "opacity-75",
      )}
    >
      <div className="relative aspect-square bg-muted">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-4xl text-muted-foreground/40">H</div>
        )}
        {inCartCases > 0 ? (
          <span className="absolute right-3 top-3 rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
            {inCartCases} in cart
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-semibold leading-snug">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.shortDescription ?? "Premium wholesale listing."}</p>
        <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between gap-2">
            <dt>Format</dt>
            <dd className="font-medium text-foreground">{product.size}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Case pack</dt>
            <dd className="font-medium text-foreground">{product.caseSize} bottles</dd>
          </div>
          {product.abv ? (
            <div className="flex justify-between gap-2">
              <dt>ABV</dt>
              <dd className="font-medium text-foreground">{product.abv}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-2">
            <dt>DC supply</dt>
            <dd
              className={cn(
                "font-medium",
                tone === "ok" && "text-emerald-700 dark:text-emerald-400",
                tone === "low" && "text-amber-700 dark:text-amber-400",
                tone === "out" && "text-destructive",
              )}
            >
              {availLabel}
            </dd>
          </div>
          {shelfBottles !== undefined ? (
            <div className="flex justify-between gap-2">
              <dt>Your shelf</dt>
              <dd
                className={cn(
                  "font-medium",
                  shelfBottles < shelfThresholdBottles
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-emerald-700 dark:text-emerald-400",
                )}
              >
                {shelfBottles} bt
                {shelfBottles < shelfThresholdBottles ? " · reorder" : ""}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-2">
            <dt>Minimum order</dt>
            <dd className="font-medium text-foreground">
              {min} case{min !== 1 ? "s" : ""}
            </dd>
          </div>
          {casePrice > 0 ? (
            <div className="flex justify-between gap-2 border-t border-border/60 pt-2">
              <dt>Est. case</dt>
              <dd className="font-medium text-foreground">${casePrice.toLocaleString()} CAD</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border bg-muted/40 py-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 touch-manipulation"
            disabled={out || qty <= min}
            onClick={() => bump(-1)}
            aria-label="Decrease cases"
          >
            <Minus className="h-5 w-5" />
          </Button>
          <span className="min-w-[3rem] text-center font-display text-xl font-semibold tabular-nums">{qty}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 touch-manipulation"
            disabled={out}
            onClick={() => bump(1)}
            aria-label="Increase cases"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <Button
          type="button"
          className="mt-3 h-12 w-full touch-manipulation gap-2 text-base"
          disabled={out}
          onClick={() => onAddToCart(qty)}
        >
          <ShoppingBag className="h-4 w-4" />
          Add to cart
        </Button>
      </div>
    </article>
  );
}
