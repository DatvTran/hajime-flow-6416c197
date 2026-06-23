import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { HqDistributorPartnerManageView } from "@/components/hq/HqDistributorPartnerManageView";
import { useAppData } from "@/contexts/AppDataContext";
import { HQ_DISTRIBUTORS_DEMO_ROWS } from "@/lib/hq-distributors-demo";

export default function HqDistributorPartnerPage() {
  const { orgId = "" } = useParams<{ orgId: string }>();
  const { data } = useAppData();

  const orgName = useMemo(() => {
    const demo = HQ_DISTRIBUTORS_DEMO_ROWS.find((r) => r.orgId === orgId);
    if (demo) return demo.name;
    const fromOrder = data.salesOrders.find((o) => o.distributorOrgId === orgId)?.distributorOrgName;
    const fromAccount = data.accounts.find((a) => a.distributorOrgId === orgId)?.distributorOrgName;
    return fromOrder || fromAccount || undefined;
  }, [data, orgId]);

  if (!orgId) {
    return (
      <div className="p-6 text-[13px] text-muted-foreground">
        Missing partner id. Open a wholesaler from{" "}
        <Link to="/accounts" className="font-medium text-accent underline-offset-2 hover:underline">
          Distributors
        </Link>
        .
      </div>
    );
  }

  return <HqDistributorPartnerManageView orgId={orgId} orgName={orgName} />;
}
