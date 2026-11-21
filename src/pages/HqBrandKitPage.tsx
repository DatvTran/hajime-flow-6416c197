import { Link, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HqOperatorPage, HqOperatorPageHeader } from "@/components/hq/HqOperatorUi";
import { EXPO_PRICED_SKUS, EXPORT_SELLER, EXPORT_SKUS } from "@/lib/export-commercial";
import { ExpoPriceCard } from "@/components/export/ExpoPriceCard";
import {
  TRADE_APPROVAL_MATRIX_USD,
  TRADE_CAD_PER_USD,
  TRADE_COMMERCIAL_TERMS_USD,
  TRADE_GUARDRAILS_USD,
  TRADE_STANDARD_USD,
  TRADE_ORDER_FORMATS,
  TRADE_WATERFALL_STEPS,
  cadToUsd,
  netAfterBroker,
  retailerMarginPct,
  usdMoney,
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
        description="Approved Hajime language for booth, press, and sell-in. Trade and FOB figures on this page are USD. Public catalogs stay price-free."
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
          <h2 className="font-display text-lg">Trade pricing (USD)</h2>
          <p className="mt-2 text-muted-foreground">
            Internal working policy for First Press Coffee Rhum and comparable Hajime trade accounts, shown in USD
            (converted from Canada CAD at {TRADE_CAD_PER_USD.toFixed(4)} CAD per USD so C$93 SRP = US$67). Protect brand
            positioning and margin at each layer. Any discount must be tied to volume, payment terms, or strategic
            account value. Adjust by market and account type as needed. Not international FOB.
          </p>

          <h3 className="mt-5 font-medium">1. Standard trade structure (per bottle)</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">Stage</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Price (USD)</th>
                  <th className="py-1.5 font-medium text-right">Margin / Profit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-1.5 pr-3">Manufacturer → Hajime</td>
                  <td className="py-1.5 pr-3 text-right font-mono font-semibold">
                    {usdMoney(TRADE_STANDARD_USD.landedPerBottle)}
                  </td>
                  <td className="py-1.5 text-right">Hajime cost</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 pr-3">Hajime → Distributor</td>
                  <td className="py-1.5 pr-3 text-right font-mono font-semibold">
                    {usdMoney(TRADE_STANDARD_USD.sellInPerBottle)}
                  </td>
                  <td className="py-1.5 text-right">
                    Hajime profit:{" "}
                    <span className="font-semibold">
                      {usdMoney(TRADE_STANDARD_USD.sellInPerBottle - TRADE_STANDARD_USD.landedPerBottle)}
                    </span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 pr-3">Distributor → Retailer</td>
                  <td className="py-1.5 pr-3 text-right font-mono font-semibold">
                    {usdMoney(TRADE_STANDARD_USD.wholesalerToRetailPerBottle)}
                  </td>
                  <td className="py-1.5 text-right">
                    Distributor margin:{" "}
                    <span className="font-semibold">
                      {wholesalerMarginPct(
                        TRADE_STANDARD_USD.wholesalerToRetailPerBottle,
                        TRADE_STANDARD_USD.sellInPerBottle,
                      )}
                      %
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-3">Retailer → Consumer</td>
                  <td className="py-1.5 pr-3 text-right font-mono font-semibold">
                    {usdMoney(TRADE_STANDARD_USD.srpPerBottle)}
                  </td>
                  <td className="py-1.5 text-right">
                    Retailer margin:{" "}
                    <span className="font-semibold">
                      {retailerMarginPct(
                        TRADE_STANDARD_USD.srpPerBottle,
                        TRADE_STANDARD_USD.wholesalerToRetailPerBottle,
                      )}
                      %
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-muted-foreground">
            Broker (when used): {usdMoney(TRADE_STANDARD_USD.brokerPerBottle)} / bottle. Hajime net after broker:{" "}
            {usdMoney(
              netAfterBroker(TRADE_STANDARD_USD.sellInPerBottle, TRADE_STANDARD_USD.brokerPerBottle),
            )}{" "}
            / bottle.
          </p>

          <h3 className="mt-5 font-medium">2. Margin guardrails</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Hajime minimum net after broker: {usdMoney(TRADE_GUARDRAILS_USD.hajimeNetAfterBrokerMin)} to{" "}
              {usdMoney(TRADE_GUARDRAILS_USD.hajimeNetAfterBrokerWarn)} / bottle
            </li>
            <li>
              Broker minimum recurring commission: {usdMoney(TRADE_STANDARD_USD.brokerRecurringMin)} to{" "}
              {usdMoney(TRADE_STANDARD_USD.brokerRecurringMax)} / bottle
            </li>
            <li>
              Distributor target margin: {TRADE_GUARDRAILS_USD.wholesalerMarginTargetPct}% minimum
            </li>
            <li>Retailer target margin: {TRADE_GUARDRAILS_USD.retailerMarginMinPct}%+ minimum</li>
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
                {TRADE_APPROVAL_MATRIX_USD.map((row) => (
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
            {TRADE_COMMERCIAL_TERMS_USD.map((t) => (
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

        <section className="space-y-3">
          <div>
            <h2 className="font-display text-lg">Expo price cards (USD)</h2>
            <p className="mt-1 text-muted-foreground">Exactly what buyers see on the trade pack. FOB is quoted per order; do not add FOB, cost or floors.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {EXPO_PRICED_SKUS.map((s) => (
              <ExpoPriceCard key={s.sku} sku={s} />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">International FOB internals (USD, never share)</h2>
          <p className="text-muted-foreground">
            Working cost, floors, landed cost and Canadian MSRP for operator pricing only. Never print on quotation, PI,
            press, or the distributor portal.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {EXPORT_SKUS.map((s) => (
              <li key={s.sku}>
                {s.product} {s.size}: list {usdMoney(s.listFobUsd)} · floor {usdMoney(s.floorFobUsd)} · working cost{" "}
                {usdMoney(s.workingCostUsd)}
                {s.guide
                  ? ` · landed ~${usdMoney(Number(s.guide.landedUsd))} · wholesale ~${usdMoney(Number(s.guide.wholesaleUsd))} · retail ~${usdMoney(Number(s.guide.retailUsd))} · Canada MSRP ${usdMoney(cadToUsd(Number(s.guide.canadaMsrpCad)))}`
                  : " · price guide not set"}
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
