import { Link, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HqOperatorPage, HqOperatorPageHeader } from "@/components/hq/HqOperatorUi";
import { EXPORT_SELLER, EXPORT_SKUS, VOLUME_TIERS } from "@/lib/export-commercial";
import {
  TRADE_APPROVAL_MATRIX,
  TRADE_COMMERCIAL_TERMS,
  TRADE_GUARDRAILS,
  TRADE_PRICING_CURRENCY,
  TRADE_STANDARD,
  TRADE_ORDER_FORMATS,
  TRADE_WATERFALL_STEPS,
  netAfterBroker,
  retailerMarginPct,
  wholesalerMarginPct,
} from "@/lib/hajime-trade-pricing";
import {
  EXPORT_CONNECT_URL,
  EXPORT_DO_NOT_IMPROVISE,
  EXPORT_FORMATS,
  EXPORT_PORTFOLIO,
  EXPORT_PRESS_TO_CONFIRM,
  EXPORT_BUYER_TERMS,
} from "@/lib/export-pack-copy";
import { SendTradePackDialog } from "@/components/SendTradePackDialog";
import { Button } from "@/components/ui/button";

function canHq(role: string | undefined) {
  return role === "brand_operator" || role === "founder_admin" || role === "operations";
}

export default function HqBrandKitPage() {
  const { user } = useAuth();
  const [packOpen, setPackOpen] = useState(false);
  const { hash } = useLocation();
  useEffect(() => {
    if (hash !== "#trade-pricing") return;
    document.getElementById("trade-pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);
  if (!user || !canHq(user.role)) return <Navigate to="/" replace />;

  return (
    <HqOperatorPage>
      <HqOperatorPageHeader
        title="Brand kit"
        description="Approved Hajime language for booth, press, and sell-in. Canada trade pricing (CAD) is internal. International FOB (USD) is separate. Public catalogs stay price-free."
        actions={
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to="/trade-pack">Public trade pack</Link>
            </Button>
            <Button type="button" size="sm" onClick={() => setPackOpen(true)}>
              Send trade pack
            </Button>
          </div>
        }
      />
      <SendTradePackDialog open={packOpen} onOpenChange={setPackOpen} includeTerms />

      <div className="space-y-6 text-[13px] leading-relaxed">
        <section id="trade-pricing" className="scroll-mt-20 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Canada trade pricing ({TRADE_PRICING_CURRENCY})</h2>
          <p className="mt-2 text-muted-foreground">
            Internal working policy for First Press Coffee Rhum and comparable Hajime trade accounts. Protect brand
            positioning and margin at each layer. Any discount must be tied to volume, payment terms, or strategic
            account value. Adjust by market, province, and account type as needed. Not international FOB.
          </p>

          <h3 className="mt-5 font-medium">1. Standard trade structure (per bottle)</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">Stage</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Price</th>
                  <th className="py-1.5 font-medium text-right">Margin / Profit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-1.5 pr-3">Manufacturer → Hajime</td>
                  <td className="py-1.5 pr-3 text-right font-mono font-semibold">
                    ${TRADE_STANDARD.landedPerBottle.toFixed(2)}
                  </td>
                  <td className="py-1.5 text-right">Hajime cost</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 pr-3">Hajime → Distributor</td>
                  <td className="py-1.5 pr-3 text-right font-mono font-semibold">
                    ${TRADE_STANDARD.sellInPerBottle.toFixed(2)}
                  </td>
                  <td className="py-1.5 text-right">
                    Hajime profit:{" "}
                    <span className="font-semibold">
                      $
                      {(TRADE_STANDARD.sellInPerBottle - TRADE_STANDARD.landedPerBottle).toFixed(2)}
                    </span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 pr-3">Distributor → Retailer</td>
                  <td className="py-1.5 pr-3 text-right font-mono font-semibold">
                    ${TRADE_STANDARD.wholesalerToRetailPerBottle.toFixed(2)}
                  </td>
                  <td className="py-1.5 text-right">
                    Distributor margin:{" "}
                    <span className="font-semibold">
                      {wholesalerMarginPct(
                        TRADE_STANDARD.wholesalerToRetailPerBottle,
                        TRADE_STANDARD.sellInPerBottle,
                      )}
                      %
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-3">Retailer → Consumer</td>
                  <td className="py-1.5 pr-3 text-right font-mono font-semibold">
                    ${TRADE_STANDARD.srpPerBottle.toFixed(2)}
                  </td>
                  <td className="py-1.5 text-right">
                    Retailer margin:{" "}
                    <span className="font-semibold">
                      {retailerMarginPct(
                        TRADE_STANDARD.srpPerBottle,
                        TRADE_STANDARD.wholesalerToRetailPerBottle,
                      )}
                      %
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-muted-foreground">
            Broker (when used): ${TRADE_STANDARD.brokerPerBottle.toFixed(2)} / bottle. Hajime net after broker: $
            {netAfterBroker(TRADE_STANDARD.sellInPerBottle, TRADE_STANDARD.brokerPerBottle).toFixed(2)} / bottle.
          </p>

          <h3 className="mt-5 font-medium">2. Margin guardrails</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Hajime minimum net after broker: ${TRADE_GUARDRAILS.hajimeNetAfterBrokerMin.toFixed(2)} to $
              {TRADE_GUARDRAILS.hajimeNetAfterBrokerWarn.toFixed(2)} / bottle
            </li>
            <li>
              Broker minimum recurring commission: ${TRADE_STANDARD.brokerRecurringMin.toFixed(2)} to $
              {TRADE_STANDARD.brokerRecurringMax.toFixed(2)} / bottle
            </li>
            <li>
              Distributor target margin: {TRADE_GUARDRAILS.wholesalerMarginTargetPct}% minimum
            </li>
            <li>Retailer target margin: {TRADE_GUARDRAILS.retailerMarginMinPct}%+ minimum</li>
          </ul>

          <h3 className="mt-5 font-medium">3. Order sizes</h3>
          <p className="mt-1 text-muted-foreground">
            Trial is 10 cases. Bulk is 50 cases. Bottle count follows the case pack for each format. Discounts are not
            automatic; they must be tied to confirmed volume, payment terms, or strategic placement value.
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">Format</th>
                  <th className="py-1.5 pr-3 font-medium">Bottles / case</th>
                  <th className="py-1.5 pr-3 font-medium">Trial order</th>
                  <th className="py-1.5 font-medium">Bulk order</th>
                </tr>
              </thead>
              <tbody>
                {TRADE_ORDER_FORMATS.map((fmt) => (
                  <tr key={fmt.id} className="border-b last:border-0">
                    <td className="py-1.5 pr-3">{fmt.label}</td>
                    <td className="py-1.5 pr-3 font-mono">{fmt.bottlesPerCase}</td>
                    <td className="py-1.5 pr-3">
                      {fmt.trialBottles.toLocaleString()} bottles — {fmt.trialCases} cases
                    </td>
                    <td className="py-1.5">
                      {fmt.bulkBottles.toLocaleString()} bottles — {fmt.bulkCases} cases
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-5 font-medium">4. Discount waterfall</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {TRADE_WATERFALL_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-2 text-muted-foreground">
            Preferred split: wholesaler absorbs the first portion, broker may reduce commission for strategic recurring
            volume, Hajime funds only the final portion when the account clearly advances distribution, prestige, or
            long-term revenue.
          </p>

          <h3 className="mt-5 font-medium">5. Approval matrix</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">Discount level</th>
                  <th className="py-1.5 pr-3 font-medium">Approval</th>
                  <th className="py-1.5 font-medium">Typical use</th>
                </tr>
              </thead>
              <tbody>
                {TRADE_APPROVAL_MATRIX.map((row) => (
                  <tr key={row.discount} className="border-b last:border-0">
                    <td className="py-1.5 pr-3">{row.discount}</td>
                    <td className="py-1.5 pr-3">{row.approval}</td>
                    <td className="py-1.5">{row.typicalUse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-5 font-medium">6. Commercial terms</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            {TRADE_COMMERCIAL_TERMS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Seller of record</h2>
          <p className="mt-2">
            {EXPORT_SELLER.legalName} · Head office: {EXPORT_SELLER.jurisdiction} · Production:{" "}
            {EXPORT_SELLER.productionBase}.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
            {EXPORT_BUYER_TERMS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <h3 className="mt-4 font-medium">USD receiving account</h3>
          <p className="mt-1 text-muted-foreground">
            {EXPORT_SELLER.bank.accountName} · {EXPORT_SELLER.bank.bankName} · {EXPORT_SELLER.bank.location}
          </p>
          <p className="text-muted-foreground">
            Account {EXPORT_SELLER.bank.accountNumber} · Bank {EXPORT_SELLER.bank.bankCode} · Branch{" "}
            {EXPORT_SELLER.bank.branchCode} · SWIFT {EXPORT_SELLER.bank.swift}
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Connect QR</h2>
          <p className="mt-2 text-muted-foreground">
            Live buyer form (not CRM conversion):{" "}
            <a className="text-accent underline" href={EXPORT_CONNECT_URL}>
              supply.drinkhajime.jp/connect?event=HK26
            </a>
          </p>
          <p className="mt-1">
            <Link className="text-accent underline" to="/connect-sign">
              Print 8×8 sign
            </Link>
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Portfolio — two expressions</h2>
          <p className="mt-2">Hajime means beginning. First Press explores depth. Yuzu Mint explores brightness.</p>
          <p className="mt-1 text-muted-foreground">{EXPORT_FORMATS}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {EXPORT_PORTFOLIO.map((p) => (
              <div key={p.name}>
                <h3 className="font-medium">{p.name}</h3>
                <p className="mt-1 text-muted-foreground">{p.summary}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">International FOB (USD) — 750 ml list bands</h2>
          <p className="mt-1 text-muted-foreground">Buyer-facing list FOB only. Do not put floors on sell sheets.</p>
          <ul className="mt-3 list-disc pl-5">
            {VOLUME_TIERS.map((t) => (
              <li key={t.id}>
                {t.label}: from {t.minCases750} cases of 750 ml at ${t.fob750} FOB / bottle.
              </li>
            ))}
          </ul>
          <p className="mt-2 text-muted-foreground">
            200 ml list ${EXPORT_SKUS.find((s) => s.size === "200 ml")?.listFobUsd} / bottle (volume tiers are not 1:1
            with 750 ml).
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">International FOB internals (USD, never share)</h2>
          <p className="text-muted-foreground">
            Working cost and floors for operator pricing only. Never print on quotation, PI, press, or the distributor
            portal.
          </p>
          <ul className="mt-3 list-disc pl-5">
            {EXPORT_SKUS.map((s) => (
              <li key={s.sku}>
                {s.product} {s.size}: list ${s.listFobUsd} · floor ${s.floorFobUsd} · working cost ${s.workingCostUsd}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Do not improvise</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            {EXPORT_DO_NOT_IMPROVISE.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Press contacts — still to confirm</h2>
          <p className="text-muted-foreground">{EXPORT_PRESS_TO_CONFIRM}</p>
        </section>
      </div>
    </HqOperatorPage>
  );
}
