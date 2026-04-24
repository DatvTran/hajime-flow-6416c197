import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Globe, Package, Search, ShoppingCart, Truck, Users, Wine, Gift } from "lucide-react";

function SkeletonKpiCard() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
      <Skeleton className="mt-2 h-[10px] w-20 rounded" />
      <Skeleton className="mt-2 h-6 w-16 rounded" />
      <Skeleton className="mt-1 h-[10px] w-24 rounded" />
    </div>
  );
}

function SkeletonFeaturedCard() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/30 p-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-[10px] w-28 rounded" />
      <Skeleton className="mt-2 h-8 w-24 rounded" />
      <Skeleton className="mt-1 h-[10px] w-20 rounded" />
    </div>
  );
}

function SkeletonOrderItem() {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full shrink-0" />
      </div>
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
      <div className="flex flex-wrap gap-1.5 mt-3">
        <Skeleton className="h-7 w-16 rounded" />
        <Skeleton className="h-7 w-20 rounded" />
        <Skeleton className="h-7 w-14 rounded" />
      </div>
    </div>
  );
}

function SkeletonAlertItem() {
  return (
    <div className="mb-2 rounded-lg border border-border/50 bg-muted/10 p-2.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-3 w-14 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
    </div>
  );
}

function SkeletonTableRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-border/40 last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-2">
          <Skeleton className="h-3 w-[80%] rounded" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonChartCard({ title, height = 200 }: { title: string; height?: number }) {
  return (
    <Card className="card-elevated border-border/70 shadow-none">
      <CardHeader className="border-b border-border/50 p-5 pb-3">
        <CardTitle className="font-display text-sm">{title}</CardTitle>
        <Skeleton className="h-3 w-24 rounded" />
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="w-full rounded" style={{ height }} />
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-w-0 space-y-6">
      {/* Command bar skeleton */}
      <div className="rounded-xl border border-border/80 bg-card/40 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/5">
                <Wine className="h-5 w-5 text-foreground/30" aria-hidden />
              </div>
              <div>
                <p className="font-display text-sm font-semibold tracking-tight text-foreground/50">Hajime HQ</p>
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
            <Skeleton className="h-9 w-[160px] rounded-md" />
            <Skeleton className="h-9 w-[130px] rounded-md" />
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2 lg:max-w-xl lg:justify-end">
            <Skeleton className="h-9 w-full min-w-[200px] rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      </div>

      {/* Page title */}
      <div>
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="mt-2 h-4 w-96 rounded" />
      </div>

      {/* KPI strip skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="col-span-2">
          <SkeletonFeaturedCard />
        </div>
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>

      {/* Three column layout */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left */}
        <div className="space-y-6 xl:col-span-3">
          {/* Order approval queue */}
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="mt-2 h-3 w-full rounded" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-20 rounded-md" />
                ))}
              </div>
              <div className="space-y-3">
                <SkeletonOrderItem />
                <SkeletonOrderItem />
                <SkeletonOrderItem />
              </div>
            </CardContent>
          </Card>

          {/* Critical alerts */}
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="mt-2 h-3 w-full rounded" />
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <SkeletonAlertItem />
              <SkeletonAlertItem />
              <SkeletonAlertItem />
            </CardContent>
          </Card>

          {/* Production requests */}
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3">
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="mt-2 h-3 w-full rounded" />
            </CardHeader>
            <CardContent className="pt-0">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b text-left">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <th key={i} className="pb-1.5">
                        <Skeleton className="h-3 w-12 rounded" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <SkeletonTableRow cols={6} />
                  <SkeletonTableRow cols={6} />
                  <SkeletonTableRow cols={6} />
                  <SkeletonTableRow cols={6} />
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Replenishment */}
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3">
              <Skeleton className="h-5 w-28 rounded" />
              <Skeleton className="mt-2 h-3 w-full rounded" />
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border/50 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Center */}
        <div className="space-y-6 xl:col-span-6">
          {/* Global markets section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-6 w-36 rounded" />
                <Skeleton className="mt-1 h-3 w-64 rounded" />
              </div>
              <Skeleton className="h-3 w-16 rounded" />
            </div>

            {/* 4 KPI cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SkeletonKpiCard />
              <SkeletonKpiCard />
              <SkeletonKpiCard />
              <SkeletonKpiCard />
            </div>

            {/* Charts row */}
            <div className="grid gap-4 sm:grid-cols-5">
              <div className="sm:col-span-3">
                <SkeletonChartCard title="Revenue by region" height={200} />
              </div>
              <div className="sm:col-span-2">
                <SkeletonChartCard title="Region mix" height={200} />
              </div>
            </div>

            {/* Market detail table */}
            <Card className="card-elevated border-border/70 shadow-none">
              <CardHeader className="border-b border-border/50 p-5 pb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <Skeleton className="h-5 w-28 rounded" />
                  <Skeleton className="mt-1 h-3 w-40 rounded" />
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-10 rounded-md" />
                  ))}
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto pt-0">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <th key={i} className="pb-2">
                          <Skeleton className="h-3 w-16 rounded" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <SkeletonTableRow cols={6} />
                    <SkeletonTableRow cols={6} />
                    <SkeletonTableRow cols={6} />
                    <SkeletonTableRow cols={6} />
                    <SkeletonTableRow cols={6} />
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          {/* Sales velocity */}
          <SkeletonChartCard title="Sales velocity" height={240} />

          {/* Inventory by market */}
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="mt-1 h-3 w-48 rounded" />
            </CardHeader>
            <CardContent className="overflow-x-auto pt-0">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b text-left">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <th key={i} className="pb-2">
                        <Skeleton className="h-3 w-20 rounded" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <SkeletonTableRow cols={5} />
                  <SkeletonTableRow cols={5} />
                  <SkeletonTableRow cols={5} />
                  <SkeletonTableRow cols={5} />
                  <SkeletonTableRow cols={5} />
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Order trend */}
          <SkeletonChartCard title="Order trend" height={180} />
        </div>

        {/* Right */}
        <div className="space-y-6 xl:col-span-3">
          {/* Shipment tracker */}
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3 flex flex-row items-center justify-between space-y-0">
              <Skeleton className="h-5 w-28 rounded" />
              <Skeleton className="h-7 w-10 rounded" />
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mb-2 rounded-lg border border-border/50 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top accounts */}
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3">
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="mt-1 h-3 w-full rounded" />
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border/40 px-2.5 py-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24 rounded" />
                    <Skeleton className="h-4 w-8 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Manufacturer */}
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3 flex flex-row items-center justify-between space-y-0">
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-7 w-14 rounded" />
            </CardHeader>
            <CardContent className="grid gap-3 pt-0 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-lg border border-border/50 p-3 space-y-1.5">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
                <Skeleton className="h-3 w-full rounded" />
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-1.5">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
              </div>
            </CardContent>
          </Card>

          {/* Partner Incentives */}
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-muted-foreground/30" />
                <Skeleton className="h-5 w-28 rounded" />
              </div>
              <Skeleton className="h-7 w-14 rounded" />
            </CardHeader>
            <CardContent className="grid gap-3 pt-0 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-lg border border-border/50 p-3 space-y-1.5">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
                <Skeleton className="h-3 w-full rounded" />
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-1.5">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Skeleton className="mx-auto h-3 w-96 rounded" />
    </div>
  );
}
