import { EXPORT_ORDER_SIZES, EXPORT_SKUS } from "@/lib/export-commercial";
import { cn } from "@/lib/utils";

type Sku = (typeof EXPORT_SKUS)[number];

/** FOB prices are quoted per order, not published on Expo materials. */
function rows(s: Sku): [string, string][] {
  const out: [string, string][] = [["Case pack", `${s.bottlesPerCase} bottles`]];
  if (s.size === "750 ml") {
    for (const o of EXPORT_ORDER_SIZES) {
      out.push([o.label, `${o.cases750} cases / ${o.cases750 * s.bottlesPerCase} bottles`]);
    }
  }
  if (s.guide) {
    out.push(["Suggested retail", `approx. US$${s.guide.retailUsd}`]);
    out.push(["Suggested trade / wholesale", `approx. US$${s.guide.wholesaleUsd}`]);
  }
  return out;
}

export function ExpoPriceCard({ sku, tone = "light" }: { sku: Sku; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  const name = sku.product.replace("Hajime ", "").replace(" Rhum Liqueur", "");
  return (
    <section className={cn("rounded-xl border p-5", dark ? "border-white/10" : "border-border bg-card")}>
      <h2
        className={cn(
          "m-0 text-[13px] font-semibold uppercase tracking-[0.14em]",
          dark ? "text-[hsl(40_88%_62%)]" : "text-foreground",
        )}
      >
        {name} — {sku.size.toUpperCase()}
      </h2>
      <dl className="mt-3 divide-y text-[13px] [&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-4 [&>div]:py-1.5">
        {rows(sku).map(([k, v]) => (
          <div key={k} className={dark ? "border-white/10" : "border-border/60"}>
            <dt className={dark ? "text-[hsl(35_14%_72%)]" : "text-muted-foreground"}>{k}</dt>
            <dd className="m-0 whitespace-nowrap text-right font-medium tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
