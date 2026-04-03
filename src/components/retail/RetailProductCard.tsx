import { useEffect, useState } from "react";
import type { Product } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { availableBottlesForSku, stockAvailabilityLabel } from "@/lib/retail-inventory";
import type { InventoryItem } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Minus, Plus, ShoppingBag } from "lucide-react";

type Props = {
  product: Product;
  inventory: InventoryItem[];
  inCartCases: number;
  onAddToCart: (cases: number) => void;
  disabled?: boolean;
};

export function RetailProductCard({ product, inventory, inCartCases, onAddToCart, disabled }: Props) {
  const min = product.minOrderCases ?? 1;
  const [qty, setQty] = useState(() => Math.max(min, inCartCases || min));
  useEffect(() => {
    if (inCartCases > 0) setQty(inCartCases);
  }, [inCartCases]);
  const bottles = availableBottlesForSku(inventory, product.sku);
  const { label: availLabel, tone } = stockAvailabilityLabel(bottles, product.caseSize);
  const casePrice = product.wholesaleCasePrice ?? 0;
  const out = tone === "out" || disabled;

  const bump = (d: number) => setQty((q) => Math.max(min, q + d));

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
            <dt>Availability</dt>
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
