import { HajimeLogo } from "@/components/HajimeLogo";
import {
  EXPORT_BUYER_TERMS,
  EXPORT_CONNECT_URL,
  EXPORT_FORMATS,
  EXPORT_PORTFOLIO,
  EXPORT_PRESS_TO_CONFIRM,
} from "@/lib/export-pack-copy";
import { EXPORT_SELLER, VOLUME_TIERS } from "@/lib/export-commercial";

export default function TradePackPage() {
  return (
    <div className="min-h-svh bg-[hsl(24_12%_8%)] px-6 py-12 text-[hsl(40_20%_97%)]">
      <div className="mx-auto max-w-2xl">
        <HajimeLogo variant="dark" className="mb-6 h-10 w-10" />
        <p className="text-[11px] uppercase tracking-[0.16em] text-[hsl(40_88%_62%)]">Hajime Ltd. · Hong Kong</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Trade pack</h1>
        <p className="mt-3 text-[14px] text-[hsl(35_14%_78%)]">
          Sell-in materials for distributors and on-premise partners. Buyer-facing list FOB only. {EXPORT_FORMATS}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {EXPORT_PORTFOLIO.map((p) => (
            <section key={p.name} className="rounded-xl border border-white/10 p-5">
              <h2 className="font-display text-xl">{p.name.replace(" Liqueur", "")}</h2>
              <p className="mt-2 text-[13px] text-[hsl(35_14%_78%)]">{p.summary}</p>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-xl border border-white/10 p-5 text-[13px]">
          <h2 className="font-display text-lg">750 ml list bands (FOB / bottle)</h2>
          <ul className="mt-3 list-disc pl-5 text-[hsl(35_14%_78%)]">
            {VOLUME_TIERS.map((t) => (
              <li key={t.id}>
                {t.label}: from {t.minCases750} cases at ${t.fob750}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[hsl(35_14%_78%)]">200 ml list $18 / bottle. Working cost and floors are not published here.</p>
        </section>

        <section className="mt-6 rounded-xl border border-white/10 p-5 text-[13px]">
          <h2 className="font-display text-lg">Connect</h2>
          <p className="mt-2">
            <a className="text-[hsl(40_88%_62%)] underline" href={EXPORT_CONNECT_URL}>
              {EXPORT_CONNECT_URL}
            </a>
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-white/10 p-5 text-[13px]">
          <h2 className="font-display text-lg">Distributor terms</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[hsl(35_14%_78%)]">
            {EXPORT_BUYER_TERMS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-3 text-[hsl(35_14%_78%)]">{EXPORT_SELLER.incotermNote}</p>
        </section>

        <section className="mt-6 rounded-xl border border-white/10 p-5 text-[13px]">
          <h2 className="font-display text-lg">Press</h2>
          <p className="mt-2 text-[hsl(35_14%_78%)]">{EXPORT_PRESS_TO_CONFIRM}</p>
        </section>
      </div>
    </div>
  );
}
