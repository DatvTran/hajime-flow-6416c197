import { Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HqOperatorPage, HqOperatorPageHeader } from "@/components/hq/HqOperatorUi";
import { EXPORT_SELLER, EXPORT_SKUS, VOLUME_TIERS } from "@/lib/export-commercial";
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
  if (!user || !canHq(user.role)) return <Navigate to="/" replace />;

  return (
    <HqOperatorPage>
      <HqOperatorPageHeader
        title="Brand kit"
        description="Approved Hajime language for booth, press, and sell-in. Public catalogs stay price-free. Media contacts marked confirm before external release."
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
          <h2 className="font-display text-lg">Shareable 750 ml list bands</h2>
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
          <h2 className="font-display text-lg">Internal economics (never share)</h2>
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
