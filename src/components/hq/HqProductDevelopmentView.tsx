import { useMemo, useState } from "react";
import { ChevronRight, Clock, FlaskConical, Plus, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { NewProductRequest } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatBaseSpiritLabel } from "@/lib/base-spirit-options";
import {
  filterNprByStatus,
  formatNprPerBottle,
  hqNprDisplayStatus,
  kuraShortName,
  nprCounts,
  nprSearchMatch,
  type HqNprFilterId,
} from "@/lib/hq-product-development-display";
import { ProductRequestDetailDialog } from "@/components/ProductRequestDetailDialog";
import {
  HqBtn,
  HqBtnLink,
  HqOperatorCard,
  HqOperatorDataTable,
  HqOperatorFilterBar,
  HqOperatorFilterButton,
  HqOperatorKpiCard,
  HqOperatorKpiGrid,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorPill,
  HqOperatorSearchWrap,
  HqOperatorSrcChip,
} from "@/components/hq/HqOperatorUi";

type Props = {
  newProductRequests: NewProductRequest[];
  patchNewProductRequest: (id: string, patch: Partial<NewProductRequest>) => void;
};

const FILTER_OPTIONS: { key: HqNprFilterId; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "active", label: "With manufacturer" },
  { key: "proposed", label: "Proposals" },
  { key: "approved", label: "Approved" },
  { key: "closed", label: "Closed" },
];

export function HqProductDevelopmentView({
  newProductRequests,
  patchNewProductRequest,
}: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<HqNprFilterId>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => nprCounts(newProductRequests), [newProductRequests]);

  const filtered = useMemo(() => {
    const byStatus = filterNprByStatus(newProductRequests, filter);
    return byStatus.filter((n) => nprSearchMatch(n, search));
  }, [newProductRequests, filter, search]);

  const selected = useMemo(
    () => (selectedId ? newProductRequests.find((n) => n.id === selectedId) ?? null : null),
    [newProductRequests, selectedId],
  );

  const pipelineOpen = counts.draft + counts.active + counts.proposed;

  return (
    <HqOperatorPage className="space-y-6">
      <HqOperatorPageHeader
        title="Product development"
        description={
          <>
            Brief manufacturers on new SKUs before they enter the catalog. After approval, publish via{" "}
            <Link
              to="/inventory/add"
              className="hq-sec-link font-medium text-accent underline-offset-2 hover:underline"
            >
              {t("Add SKU")}
            </Link>{" "}
            or commission a batch from{" "}
            <Link
              to="/purchase-orders"
              className="hq-sec-link font-medium text-accent underline-offset-2 hover:underline"
            >
              {t("Production requests")}
            </Link>
            .
          </>
        }
        rawDescription
        actions={
          <HqBtnLink to="/product-development/new" variant="accent" size="sm">
            <Plus className="size-3.5" strokeWidth={1.75} />
            {t("New request")}
          </HqBtnLink>
        }
      />

      <HqOperatorKpiGrid>
        <HqOperatorKpiCard
          icon={FlaskConical}
          tone="ink"
          label="Open pipeline"
          value={String(pipelineOpen)}
          sub="draft through proposal"
        />
        <HqOperatorKpiCard
          icon={Clock}
          tone="amber"
          label="Awaiting manufacturer"
          value={String(counts.active)}
          sub="submitted or under review"
        />
        <HqOperatorKpiCard
          icon={Sparkles}
          tone="blue"
          label="Proposals to review"
          value={String(counts.proposed)}
          sub="HQ decision needed"
        />
        <HqOperatorKpiCard
          icon={FlaskConical}
          tone="green"
          label="Approved SKUs"
          value={String(counts.approved)}
          sub="ready for catalog or PO"
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

      <HqOperatorCard className="overflow-hidden p-0">
        <HqOperatorDataTable>
          <thead>
            <tr>
              <th>{t("Request")}</th>
              <th>{t("Product")}</th>
              <th>{t("Manufacturer")}</th>
              <th>{t("Spirit / ABV")}</th>
              <th>{t("Target launch")}</th>
              <th>{t("Proposed $/bottle")}</th>
              <th>{t("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <FlaskConical className="mx-auto size-7 text-muted-foreground/25" strokeWidth={1.5} />
                  <p className="mt-3 text-sm font-medium text-foreground">{t("No product requests match your filters")}</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {t("Create a brief for a manufacturer to evaluate feasibility and costing.")}
                  </p>
                  <HqBtn
                    variant="accent"
                    size="sm"
                    className="mt-4"
                    type="button"
                    onClick={() => navigate("/product-development/new")}
                  >
                    <Plus className="size-3.5" strokeWidth={1.75} />
                    {t("New request")}
                  </HqBtn>
                </td>
              </tr>
            ) : (
              filtered.map((npr) => {
                const pill = hqNprDisplayStatus(npr.status);
                return (
                  <tr
                    key={npr.id}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={() => setSelectedId(npr.id)}
                  >
                    <td className="font-mono text-xs font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {npr.id}
                        <ChevronRight className="size-3 text-muted-foreground" strokeWidth={1.75} />
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate font-medium">{npr.title}</td>
                    <td>
                      {npr.assignedManufacturer ? (
                        <HqOperatorSrcChip variant="kura">{kuraShortName(npr.assignedManufacturer)}</HqOperatorSrcChip>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="text-[13px] text-muted-foreground">
                      {formatBaseSpiritLabel(npr.specs.baseSpirit)} · {npr.specs.targetAbv}%
                    </td>
                    <td className="font-mono text-xs text-muted-foreground">{npr.specs.targetLaunchDate}</td>
                    <td className="font-mono text-xs">{formatNprPerBottle(npr)}</td>
                    <td>
                      <HqOperatorPill tone={pill.tone}>{t(pill.label)}</HqOperatorPill>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </HqOperatorDataTable>
      </HqOperatorCard>

      <ProductRequestDetailDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
        request={selected}
        onPatch={patchNewProductRequest}
      />
    </HqOperatorPage>
  );
}
