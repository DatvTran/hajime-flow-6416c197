/**
 * DistributorSellThroughPage
 * Sell-through velocity report by account, SKU, and period.
 * Shows actual depletion data vs orders.
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppData } from "@/contexts/AppDataContext";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Store,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

type PeriodFilter = "7d" | "30d" | "90d" | "all";

export default function DistributorSellThroughPage() {
  const { data } = useAppData();
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [groupBy, setGroupBy] = useState<"account" | "sku" | "time">("account");

  const filteredReports = useMemo(() => {
    if (period === "all") return data.depletionReports ?? [];
    const cutoffDays = period === "7d" ? 7 : period === "90d" ? 90 : period === "30d" ? 30 : 365;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - cutoffDays);
    return (data.depletionReports ?? []).filter(
      (r) => new Date(r.periodEnd) >= cutoff
    );
  }, [data.depletionReports, period]);

  const summaryStats = useMemo(() => {
    const totalSold = filteredReports.reduce((sum, r) => sum + r.bottlesSold, 0);
    const totalOnHand = filteredReports.reduce((sum, r) => sum + r.bottlesOnHandAtEnd, 0);
    const total = totalSold + totalOnHand;
    const sellThrough = total > 0 ? Math.round((totalSold / total) * 1000) / 10 : 0;
    const flaggedCount = filteredReports.filter((r) => r.flaggedForReplenishment).length;
    const uniqueAccounts = new Set(filteredReports.map((r) => r.accountId)).size;
    return { totalSold, totalOnHand, sellThrough, flaggedCount, uniqueAccounts };
  }, [filteredReports]);

  const byAccount = useMemo(() => {
    const map = new Map<
      string,
      { sold: number; onHand: number; reports: number; lastReport: string }
    >();
    for (const r of filteredReports) {
      const existing = map.get(r.accountId) || { sold: 0, onHand: 0, reports: 0, lastReport: "" };
      existing.sold += r.bottlesSold;
      existing.onHand += r.bottlesOnHandAtEnd;
      existing.reports += 1;
      if (r.periodEnd > existing.lastReport) existing.lastReport = r.periodEnd;
      map.set(r.accountId, existing);
    }
    return Array.from(map.entries()).map(([accountId, stats]) => {
      const acc = data.accounts.find((a) => a.id === accountId);
      const total = stats.sold + stats.onHand;
      return {
        accountId,
        accountName: acc?.tradingName || acc?.legalName || accountId,
        city: acc?.city || "—",
        ...stats,
        sellThrough: total > 0 ? Math.round((stats.sold / total) * 1000) / 10 : 0,
      };
    }).sort((a, b) => b.sold - a.sold);
  }, [filteredReports, data.accounts]);

  const bySku = useMemo(() => {
    const map = new Map<
      string,
      { sold: number; onHand: number; reports: number }
    >();
    for (const r of filteredReports) {
      const existing = map.get(r.sku) || { sold: 0, onHand: 0, reports: 0 };
      existing.sold += r.bottlesSold;
      existing.onHand += r.bottlesOnHandAtEnd;
      existing.reports += 1;
      map.set(r.sku, existing);
    }
    return Array.from(map.entries()).map(([sku, stats]) => {
      const product = data.products.find((p) => p.sku === sku);
      const total = stats.sold + stats.onHand;
      return {
        sku,
        productName: product?.name || sku,
        ...stats,
        sellThrough: total > 0 ? Math.round((stats.sold / total) * 1000) / 10 : 0,
      };
    }).sort((a, b) => b.sold - a.sold);
  }, [filteredReports, data.products]);

  const chartData = useMemo(() => {
    if (groupBy === "account") {
      return byAccount.slice(0, 10).map((a) => ({
        name: a.accountName.slice(0, 15),
        sold: a.sold,
        onHand: a.onHand,
      }));
    }
    if (groupBy === "sku") {
      return bySku.slice(0, 10).map((s) => ({
        name: s.sku,
        sold: s.sold,
        onHand: s.onHand,
      }));
    }
    // time grouping
    const byMonth = new Map<string, { sold: number; onHand: number }>();
    for (const r of filteredReports) {
      const month = r.periodEnd.slice(0, 7); // YYYY-MM
      const existing = byMonth.get(month) || { sold: 0, onHand: 0 };
      existing.sold += r.bottlesSold;
      existing.onHand += r.bottlesOnHandAtEnd;
      byMonth.set(month, existing);
    }
    return Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, stats]) => ({
        name: month,
        sold: stats.sold,
        onHand: stats.onHand,
      }));
  }, [byAccount, bySku, filteredReports, groupBy]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sell-Through Velocity"
        description="Actual depletion rates by account, SKU, and time period — reported by distributors."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="account">By Account</SelectItem>
            <SelectItem value="sku">By SKU</SelectItem>
            <SelectItem value="time">By Month</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button variant="outline" asChild>
          <Link to="/distributor/depletions">
            Report Depletions <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <CardTitle className="font-display text-sm font-medium">Bottles Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">
              {summaryStats.totalSold.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{period} period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="font-display text-sm font-medium">On Hand</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">
              {summaryStats.totalOnHand.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">at period end</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="font-display text-sm font-medium">Sell-Through</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">
              {summaryStats.sellThrough}%
            </p>
            <p className="text-xs text-muted-foreground">of total pool</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="font-display text-sm font-medium">Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">
              {summaryStats.uniqueAccounts}
            </p>
            <p className="text-xs text-muted-foreground">reported</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <TrendingDown className="h-4 w-4 text-amber-500" />
            <CardTitle className="font-display text-sm font-medium">Flagged</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">
              {summaryStats.flaggedCount}
            </p>
            <p className="text-xs text-muted-foreground">need replenishment</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Velocity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="sold" name="Sold" fill="hsl(var(--emerald-500, 16 185 129))" />
                  <Bar dataKey="onHand" name="On Hand" fill="hsl(var(--border))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">
              {groupBy === "account" ? "Top Accounts" : "Top SKUs"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-2">
              <div className="space-y-2">
                {(groupBy === "account" ? byAccount : bySku).slice(0, 20).map((item) => (
                  <div
                    key={groupBy === "account" ? (item as typeof byAccount[0]).accountId : (item as typeof bySku[0]).sku}
                    className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {groupBy === "account"
                          ? (item as typeof byAccount[0]).accountName
                          : (item as typeof bySku[0]).productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {groupBy === "account" ? (
                          <>
                            {(item as typeof byAccount[0]).city} · {(item as typeof byAccount[0]).reports} reports
                          </>
                        ) : (
                          (item as typeof bySku[0]).sku
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums font-medium">
                        {(groupBy === "account" ? (item as typeof byAccount[0]).sold : (item as typeof bySku[0]).sold).toLocaleString()} sold
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(groupBy === "account"
                          ? (item as typeof byAccount[0]).sellThrough
                          : (item as typeof bySku[0]).sellThrough
                        ).toFixed(1)}% sell-through
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
