import { cn } from "@/lib/utils";

export function bottleVariantClass(sku: string): string {
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

type Props = {
  sku: string;
  size?: "card" | "row";
  className?: string;
};

/** Bottle silhouette — retail-store-app `.bottle-thumb` */
export function RetailBottleThumb({ sku, size = "card", className }: Props) {
  const isRow = size === "row";
  return (
    <div
      className={cn(
        "relative shrink-0 rounded-md",
        isRow ? "h-[66px] w-10 rounded-[5px_5px_8px_8px]" : "h-20 w-12 rounded-[6px_6px_10px_10px]",
        bottleVariantClass(sku),
        className,
      )}
      aria-hidden
    >
      <div className="absolute left-1/2 top-0 h-[11px] w-[13px] -translate-x-1/2 rounded-sm bg-[hsl(35_14%_80%)]" />
    </div>
  );
}
