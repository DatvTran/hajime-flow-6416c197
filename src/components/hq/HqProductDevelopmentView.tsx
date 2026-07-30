import { useMemo, useState } from "react";
import { AlertTriangle, Check, FileText, FlaskConical, Plus } from "lucide-react";
import type { NewProductRequest } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  filterNprByStatus,
  nprCounts,
  nprSearchMatch,
  type HqNprFilterId,
} from "@/lib/hq-product-development-display";
import { HqProductDevelopmentCard } from "@/components/hq/HqProductDevelopmentCard";
import {
  HqBtnLink,
  HqOperatorFilterBar,
  HqOperatorFilterButton,
  HqOperatorKpiCard,
  HqOperatorKpiGrid,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorSearchWrap,
} from "@/components/hq/HqOperatorUi";

type Props = {
  newProductRequests: NewProductRequest[];
  onPatch: (id: string, patch: Partial<NewProductRequest>) => void | Promise<unknown>;
  onNudge?: (id: string) => void | Promise<unknown>;
};

const FILTER_OPTIONS: { key: HqNprFilterId; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Concept" },
  { key: "active", label: "Feasibility review" },
  { key: "proposed", label: "Proposal" },
  { key: "approved", label: "Approved" },
  { key: "closed", label: "Closed" },
];

export function HqProductDevelopmentView({ newProductRequests, onPatch, onNudge }: Props) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<HqNprFilterId>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => nprCounts(newProductRequests), [newProductRequests]);

  const filtered = useMemo(() => {
    const byStatus = filterNprByStatus(newProductRequests, filter);
    return byStatus
      .filter((n) => nprSearchMatch(n, search))
      .sort((a, b) => {
        const priority = (s: NewProductRequest["status"]) => {
          if (s === "proposed") return 0;
          if (s === "draft") return 1;
          if (s === "under_review" || s === "submitted") return 2;
          if (s === "approved") return 3;
          return 4;
        };
        const diff = priority(a.status) - priority(b.status);
        if (diff !== 0) return diff;
        return (
          new Date(b.proposalReceivedAt ?? b.submittedAt ?? b.requestedAt).getTime() -
          new Date(a.proposalReceivedAt ?? a.submittedAt ?? a.requestedAt).getTime()
        );
      });
  }, [newProductRequests, filter, search]);

  const inDevelopment = counts.draft + counts.active + counts.proposed + counts.approved;
  const awaitingFeasibility = newProductRequests.filter((n) => n.status === "submitted").length;

  return (
    <HqOperatorPage className="space-y-6">
      <HqOperatorPageHeader
        title="Product Development"
        description="Define what new alcohol concept should exist — spirit, ABV, flavor, packaging — and send it to a manufacturer for feasibility. This is not a reorder; once approved, use Production requests to brew inventory."
        actions={
          <>
            <HqBtnLink to="/product-development/new" variant="accent" size="sm">
              <Plus className="size-3.5" strokeWidth={1.75} />
              {t("New concept")}
            </HqBtnLink>
          </>
        }
      />

      <HqOperatorKpiGrid>
        <HqOperatorKpiCard
          icon={FlaskConical}
          tone="blue"
          label="In development"
          value={String(inDevelopment)}
          sub="concepts in the pipeline"
        />
        <HqOperatorKpiCard
          icon={AlertTriangle}
          tone="amber"
          label="Awaiting feasibility"
          value={String(awaitingFeasibility || counts.active)}
          sub="sent to manufacturer"
        />
        <HqOperatorKpiCard
          icon={FileText}
          tone="blue"
          label="Proposals to review"
          value={String(counts.proposed)}
          sub="manufacturer responded"
        />
        <HqOperatorKpiCard
          icon={Check}
          tone="green"
          label="Approved for production"
          value={String(counts.approved)}
          sub="moving to brewing"
        />
      </HqOperatorKpiGrid>

      <HqOperatorFilterBar className="flex-wrap">
        {FILTER_OPTIONS.map((f) => (
          <HqOperatorFilterButton key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {t(f.label)} ({counts[f.key]})
          </HqOperatorFilterButton>
        ))}
        <HqOperatorSearchWrap
          value={search}
          onChange={setSearch}
          placeholder="Search request, product, or manufacturer…"
        />
      </HqOperatorFilterBar>

      {filtered.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-border px-10 py-10 text-center text-muted-foreground">
          <FlaskConical className="mx-auto size-7 opacity-25" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-foreground">{t("No products in development")}</p>
          <p className="mt-1 text-[13px]">
            {t("Start a new alcohol concept and send it to a manufacturer for feasibility.")}
          </p>
          <HqBtnLink to="/product-development/new" variant="accent" size="sm" className="mt-4">
            <Plus className="size-3.5" strokeWidth={1.75} />
            {t("New concept")}
          </HqBtnLink>
        </div>
      ) : (
        <div>
          {filtered.map((npr, index) => (
            <HqProductDevelopmentCard
              key={npr.id}
              request={npr}
              defaultOpen={index === 0}
              onPatch={onPatch}
              onNudge={onNudge}
            />
          ))}
        </div>
      )}
    </HqOperatorPage>
  );
}
