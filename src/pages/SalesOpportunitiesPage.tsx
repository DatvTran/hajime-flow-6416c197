import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAccounts, useSalesOrders } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  TrendingUp, 
  TrendingDown, 
  UserX, 
  Target, 
  ArrowRight,
  Store,
  Calendar,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";

interface Opportunity {
  id: string;
  type: "dormant" | "velocity_drop" | "prospect" | "reorder";
  account: string;
  accountId: string;
  priority: "high" | "medium" | "low";
  value: number;
  lastOrderDays: number;
  reason: string;
  suggestedAction: string;
}

export default function SalesOpportunitiesPage() {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { salesOrders } = useSalesOrders();
  const [filter, setFilter] = useState<"all" | "dormant" | "velocity_drop" | "reorder">("all");

  const repName = useMemo(() => {
    return resolveSalesRepLabelForSession(user?.email, user?.displayName);
  }, [user]);

  const opportunities = useMemo((): Opportunity[] => {
    const ops: Opportunity[] = [];
    
    // Get rep's accounts
    const repAccounts = accounts.filter(a => 
      a.salesOwner === repName && 
      ["retail", "bar", "restaurant", "hotel"].includes(a.type)
    );

    for (const account of repAccounts) {
      const accountOrders = salesOrders.filter(o => 
        o.account === account.tradingName && 
        o.status !== "cancelled"
      ).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

      const lastOrder = accountOrders[0];
      const lastOrderDate = lastOrder ? new Date(lastOrder.orderDate) : null;
      const daysSinceOrder = lastOrderDate 
        ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const totalRevenue = accountOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0);

      // Dormant account (no orders in 60+ days)
      if (daysSinceOrder > 60 && accountOrders.length > 0) {
        ops.push({
          id: `dormant-${account.id}`,
          type: "dormant",
          account: account.tradingName || account.name,
          accountId: account.id,
          priority: totalRevenue > 5000 ? "high" : "medium",
          value: totalRevenue,
          lastOrderDays: daysSinceOrder,
          reason: `No orders in ${daysSinceOrder} days`,
          suggestedAction: "Call to check stock levels and reorder",
        });
      }

      // Velocity drop (orders used to be frequent, now sparse)
      if (accountOrders.length >= 3 && daysSinceOrder > 40) {
        const avgGap = daysSinceOrder / accountOrders.length;
        if (daysSinceOrder > avgGap * 1.5) {
          ops.push({
            id: `velocity-${account.id}`,
            type: "velocity_drop",
            account: account.tradingName || account.name,
            accountId: account.id,
            priority: "medium",
            value: totalRevenue,
            lastOrderDays: daysSinceOrder,
            reason: `Ordering pattern slowed (was every ~${Math.floor(avgGap)} days)`,
            suggestedAction: "Visit to discuss menu/promotions",
          });
        }
      }

      // Reorder opportunity (based on estimated sell-through)
      if (lastOrder && daysSinceOrder > 30 && daysSinceOrder < 60) {
        const estimatedConsumption = (lastOrder.totalBottles || 0) / 30 * daysSinceOrder;
        if (estimatedConsumption >= (lastOrder.totalBottles || 0) * 0.8) {
          ops.push({
            id: `reorder-${account.id}`,
            type: "reorder",
            account: account.tradingName || account.name,
            accountId: account.id,
            priority: "high",
            value: lastOrder.totalValue || 0,
            lastOrderDays: daysSinceOrder,
            reason: "Estimated stock running low",
            suggestedAction: "Proactive reorder call",
          });
        }
      }

      // New prospect (no orders yet)
      if (accountOrders.length === 0 && account.status === "active") {
        ops.push({
          id: `prospect-${account.id}`,
          type: "prospect",
          account: account.tradingName || account.name,
          accountId: account.id,
          priority: "medium",
          value: 0,
          lastOrderDays: 999,
          reason: "New account - no orders yet",
          suggestedAction: "Schedule tasting/setup visit",
        });
      }
    }

    return ops.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }, [accounts, salesOrders, repName]);

  const filteredOpportunities = useMemo(() => {
    if (filter === "all") return opportunities;
    return opportunities.filter(o => o.type === filter);
  }, [opportunities, filter]);

  const stats = useMemo(() => {
    return {
      total: opportunities.length,
      highPriority: opportunities.filter(o => o.priority === "high").length,
      potentialValue: opportunities.reduce((sum, o) => sum + o.value, 0),
      dormant: opportunities.filter(o => o.type === "dormant").length,
    };
  }, [opportunities]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "dormant": return <UserX className="h-4 w-4" />;
      case "velocity_drop": return <TrendingDown className="h-4 w-4" />;
      case "reorder": return <TrendingUp className="h-4 w-4" />;
      case "prospect": return <Target className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "dormant": return "Dormant";
      case "velocity_drop": return "Velocity Drop";
      case "reorder": return "Reorder Ready";
      case "prospect": return "Prospect";
      default: return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunities"
        description="Prioritized accounts needing attention — dormant, velocity drops, and reorder signals."
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Opportunities</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-3xl font-bold text-red-600">{stats.highPriority}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Potential Value</p>
                <p className="text-3xl font-bold">${stats.potentialValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dormant</p>
                <p className="text-3xl font-bold text-amber-600">{stats.dormant}</p>
              </div>
              <UserX className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "dormant", "velocity_drop", "reorder"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : getTypeLabel(f)}
          </Button>
        ))}
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {filteredOpportunities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No opportunities found</p>
              <p className="text-muted-foreground">
                Your accounts are all active. Check back later for new opportunities.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOpportunities.map((opp) => (
            <Card key={opp.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(opp.type)}
                      <span className="font-semibold text-lg">{opp.account}</span>
                      <Badge variant="outline" className={getPriorityColor(opp.priority)}>
                        {opp.priority}
                      </Badge>
                      <Badge variant="secondary">{getTypeLabel(opp.type)}</Badge>
                    </div>
                    
                    <p className="text-muted-foreground">{opp.reason}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Last order: {opp.lastOrderDays === 999 ? "Never" : `${opp.lastOrderDays} days ago`}
                      </span>
                      {opp.value > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Historical value: ${opp.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    <div className="bg-muted p-3 rounded-lg text-sm">
                      <span className="font-medium">Suggested action: </span>
                      {opp.suggestedAction}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button asChild size="sm">
                      <Link to={`/accounts?id=${opp.accountId}`}>
                        View Account
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/orders?account=${opp.account}`}>
                        Order History
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
