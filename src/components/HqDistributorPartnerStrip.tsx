import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Truck } from "lucide-react";
import { getDistributorOrganizations, type DistributorOrganizationRow } from "@/lib/api-v1-mutations";
import { HQ_DISTRIBUTOR_DEMO_ORGANIZATIONS } from "@/lib/hq-distributors-demo";
import { partnerPathForOrg } from "@/lib/hq-distributor-orgs";
import { useLanguage } from "@/contexts/LanguageContext";
import { HqOperatorCard, HqOperatorCardHead } from "@/components/hq/HqOperatorUi";

type Props = {
  title?: string;
  description?: string;
};

export function HqDistributorPartnerStrip({
  title = "Wholesaler partners",
  description = "Open a distributor to see retail sell-through, field reps, and store revenue in their network.",
}: Props) {
  const { t } = useLanguage();
  const [orgs, setOrgs] = useState<DistributorOrganizationRow[]>(HQ_DISTRIBUTOR_DEMO_ORGANIZATIONS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getDistributorOrganizations();
        const live = res.data ?? [];
        if (!cancelled) {
          if (live.length > 0) {
            const seen = new Set(live.map((o) => o.id));
            const extras = HQ_DISTRIBUTOR_DEMO_ORGANIZATIONS.filter((o) => !seen.has(o.id));
            setOrgs([...live, ...extras]);
          } else {
            setOrgs(HQ_DISTRIBUTOR_DEMO_ORGANIZATIONS);
          }
        }
      } catch {
        if (!cancelled) setOrgs(HQ_DISTRIBUTOR_DEMO_ORGANIZATIONS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (orgs.length === 0) return null;

  return (
    <HqOperatorCard className="mb-6 border-dashed">
      <HqOperatorCardHead
        title={title}
        subtitle={description}
        actions={
          <Link to="/accounts?view=sales" className="hq-btn hq-btn-outline hq-btn-sm no-underline">
            {t("View all")}
          </Link>
        }
      />
      <ul className="grid gap-2 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
        {orgs.map((org) => (
          <li key={org.id}>
            <Link
              to={partnerPathForOrg(org.id)}
              className="flex items-center gap-3 rounded-[10px] border border-border/60 bg-background px-4 py-3 text-[13px] transition-[box-shadow,transform] hover:-translate-y-px hover:shadow-[var(--shadow-lifted)] no-underline"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-[hsl(158_56%_36%/0.1)] text-[hsl(158_56%_30%)]">
                <Truck className="size-[17px]" strokeWidth={1.75} />
              </div>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{org.name}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            </Link>
          </li>
        ))}
      </ul>
    </HqOperatorCard>
  );
}
