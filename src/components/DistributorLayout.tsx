import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppData } from "@/contexts/AppDataContext";
import { distributorRouteChrome } from "@/lib/distributor-chrome";
import { DistributorSidebar } from "@/components/distributor/DistributorSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { OperatorOutletFallback } from "@/components/OperatorOutletFallback";
import { Truck, Menu } from "lucide-react";

export function DistributorLayout() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { pathname, search, hash } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);
  const prevPathRef = useRef(pathname);
  const { data } = useAppData();

  useEffect(() => {
    window.scrollTo(0, 0);
    const prev = history.scrollRestoration;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = prev;
    };
  }, []);

  useEffect(() => {
    const main = mainScrollRef.current;
    if (!main) return;
    const pathChanged = prevPathRef.current !== pathname;
    prevPathRef.current = pathname;
    if (pathname === "/distributor" || pathname === "/distributor/") {
      if (hash) return;
      if (pathChanged) main.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    if (pathChanged) main.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);

  const orgLabel = useMemo(() => {
    if (!user) return "Distributor";
    const distAccount = data.accounts.find(
      (a) => a.type === "distributor" && String(a.managedByDistributorUserId ?? "") === String(user.id),
    );
    if (distAccount?.tradingName) return distAccount.tradingName;
    return "Empire Wines";
  }, [data.accounts, user]);

  const { page } = distributorRouteChrome(pathname, search);

  return (
    <div className="distributor-shell flex min-h-svh flex-col bg-background text-foreground lg:grid lg:h-svh lg:grid-cols-[256px_1fr] lg:overflow-hidden">
      <DistributorSidebar key={language} className="hidden lg:flex" />

      <div className="main flex min-h-0 min-w-0 flex-1 flex-col lg:h-svh lg:overflow-hidden">
        <header className="topbar glass-header sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="shrink-0 touch-manipulation" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[256px] max-w-[85vw] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
              <DistributorSidebar
                key={language}
                className="h-full w-full border-0"
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="crumbs min-w-0 flex-1 truncate font-display text-sm font-medium text-foreground/80">{orgLabel}</div>
          <Button size="sm" className="btn-accent h-8 shrink-0 bg-accent px-3 text-accent-foreground hover:bg-[hsl(32_78%_48%)]" asChild>
            <Link to="/distributor/shipments">
              <Truck className="mr-1 size-4" strokeWidth={1.75} />
              {t("Log shipment")}
            </Link>
          </Button>
        </header>

        <header className="topbar glass-header sticky top-0 z-30 hidden h-[54px] shrink-0 items-center justify-between gap-4 px-8 lg:flex">
          <div className="crumbs text-[13px] text-muted-foreground">
            {orgLabel} › <strong className="font-medium text-foreground">{t(page)}</strong>
          </div>
          <div className="topbar-right flex items-center gap-2.5">
            <Button variant="outline" size="sm" className="btn-outline btn-sm h-[30px] text-xs" asChild>
              <Link to="/distributor/pick-pack">{t("Start pick & pack")}</Link>
            </Button>
            <Button size="sm" className="btn-accent h-9 gap-1 bg-accent px-4 text-accent-foreground hover:bg-[hsl(32_78%_48%)]" asChild>
              <Link to="/distributor/shipments">
                <Truck className="size-4" strokeWidth={1.75} />
                {t("Log shipment")}
              </Link>
            </Button>
          </div>
        </header>

        <div className="crumbs shrink-0 border-b border-border/40 px-4 py-2.5 text-[13px] text-muted-foreground lg:hidden">
          {orgLabel} › <strong className="font-medium text-foreground">{t(page)}</strong>
        </div>

        <main
          ref={mainScrollRef}
          id="pg"
          data-distributor-scroll
          className="scrollbar-thin flex-1 overflow-y-auto px-[30px] pb-20 pt-[30px] lg:pb-[80px]"
        >
          <div className="pw mx-auto max-w-[1260px]">
            <Suspense fallback={<OperatorOutletFallback />}>
              <Outlet key={language} />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
