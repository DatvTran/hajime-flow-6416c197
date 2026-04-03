import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, useRetailAccountTradingName } from "@/contexts/AuthContext";
import { useAccounts } from "@/contexts/AppDataContext";
import { useMemo } from "react";

export default function RetailAccountPage() {
  const { user } = useAuth();
  const tradingName = useRetailAccountTradingName();
  const { accounts } = useAccounts();
  const acc = useMemo(() => accounts.find((a) => a.tradingName === tradingName), [accounts, tradingName]);

  return (
    <div>
      <PageHeader title="Account" description="Your venue profile on Hajime wholesale." />

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">{tradingName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">Signed in as:</span> {user.displayName}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {user.email}
          </p>
          {acc ? (
            <>
              <p>
                <span className="text-muted-foreground">City:</span> {acc.city}, {acc.country}
              </p>
              <p>
                <span className="text-muted-foreground">Payment terms:</span> {acc.paymentTerms}
              </p>
              <p>
                <span className="text-muted-foreground">Your rep:</span> {acc.salesOwner}
              </p>
            </>
          ) : null}
          <p className="text-xs text-muted-foreground">Billing and tax documents appear here after orders are invoiced.</p>
        </CardContent>
      </Card>
    </div>
  );
}
