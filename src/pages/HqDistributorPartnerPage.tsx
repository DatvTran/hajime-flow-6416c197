import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { HqDistributorPartnerManageView } from "@/components/hq/HqDistributorPartnerManageView";
import { useAppData } from "@/contexts/AppDataContext";

export default function HqDistributorPartnerPage() {
  const { orgId = "" } = useParams<{ orgId: string }>();
  const { data } = useAppData();

  const orgName = useMemo(() => {
    const fromOrder = data.salesOrders.find((o) => o.distributorOrgId === orgId)?.distributorOrgName;
    const fromAccount = data.accounts.find((a) => a.distributorOrgId === orgId)?.distributorOrgName;
    const byId = data.accounts.find((a) => a.id === orgId);
    return fromOrder || fromAccount || byId?.tradingName || byId?.legalName || undefined;
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
