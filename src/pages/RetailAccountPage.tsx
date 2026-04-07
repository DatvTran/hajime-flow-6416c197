import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, useRetailAccountTradingName } from "@/contexts/AuthContext";
import { useAccounts, useAppData, useRetailerShelfStock } from "@/contexts/AppDataContext";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RetailAccountPage() {
  const { user } = useAuth();
  const tradingName = useRetailAccountTradingName();
  const { accounts } = useAccounts();
  const { data } = useAppData();
  const { shelf, setShelfBottles } = useRetailerShelfStock();
  const acc = useMemo(() => accounts.find((a) => a.tradingName === tradingName), [accounts, tradingName]);

  const accShelf = acc ? shelf[acc.id] ?? {} : {};
  const activeProducts = useMemo(() => data.products.filter((p) => p.status === "active"), [data.products]);
  const shelfTh = data.operationalSettings?.retailerStockThresholdBottles ?? 48;

  return (
    <div>
      <PageHeader title="Account" description="Venue profile, on-premise shelf counts (for reorder alerts), and wholesale terms." />

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
              {acc.pricingTier ? (
                <p>
                  <span className="text-muted-foreground">Pricing tier:</span>{" "}
                  <span className="capitalize">{acc.pricingTier}</span>
                </p>
              ) : null}
              {acc.portalLoginEmail ? (
                <p>
                  <span className="text-muted-foreground">Portal email on file:</span> {acc.portalLoginEmail}
                </p>
              ) : null}
            </>
          ) : null}
          <p className="text-xs text-muted-foreground">Billing and tax documents appear here after orders are invoiced.</p>
        </CardContent>
      </Card>

      {acc ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-display text-lg">On-premise shelf / back bar</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update bottle counts per SKU. When below {shelfTh} bottles, the network gets a low-stock alert so your rep and wholesaler can replenish.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeProducts.map((p) => {
              const v = accShelf[p.sku] ?? 0;
              return (
                <div key={p.sku} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{p.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`shelf-${p.sku}`} className="sr-only">
                      Bottles on shelf
                    </Label>
                    <Input
                      id={`shelf-${p.sku}`}
                      type="number"
                      min={0}
                      className="w-28 touch-manipulation tabular-nums"
                      value={v}
                      onChange={(e) => setShelfBottles(acc.id, p.sku, Math.max(0, parseInt(e.target.value, 10) || 0))}
                    />
                    <span className="text-xs text-muted-foreground">bottles</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
