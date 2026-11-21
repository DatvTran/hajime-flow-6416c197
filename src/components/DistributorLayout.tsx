import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppData } from "@/contexts/AppDataContext";
import { distributorChromeOrgLabel } from "@/lib/distributor-accounts";
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

  const orgLabel = useMemo(
    () => distributorChromeOrgLabel(pathname, data.accounts, user),
    [data.accounts, pathname, user],
  );

  const { page } = distributorRouteChrome(pathname, search);

  return (
    <div className="distributor-shell flex h-svh max-h-svh flex-col overflow-hidden overscroll-none bg-background text-foreground lg:grid lg:grid-cols-[256px_1fr]">
      <DistributorSidebar key={language} className="hidden lg:flex" />

      <div className="main flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="topbar glass-header z-40 flex h-14 shrink-0 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] lg:hidden">
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
          <Link
            to="/distributor/shipments"
            className="dist-btn dist-btn-accent dist-btn-sm shrink-0 touch-manipulation no-underline"
            aria-label={t("Log shipment")}
          >
            <Truck className="size-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">{t("Log shipment")}</span>
          </Link>
        </header>

        <header className="topbar glass-header z-30 hidden h-[54px] shrink-0 items-center justify-between gap-4 px-8 lg:flex">
          <div className="crumbs text-[13px] text-muted-foreground">
            {orgLabel} › <strong className="font-medium text-foreground">{t(page)}</strong>
          </div>
          <div className="topbar-right flex items-center gap-2.5">
            <Link to="/distributor/pick-pack" className="dist-btn dist-btn-outline dist-btn-sm no-underline">
              {t("Start pick & pack")}
            </Link>
            <Link to="/distributor/shipments" className="dist-btn dist-btn-accent no-underline">
              <Truck className="size-3.5" strokeWidth={1.75} />
              {t("Log shipment")}
            </Link>
          </div>
        </header>

        <div className="crumbs shrink-0 border-b border-border/40 px-4 py-2.5 text-[13px] text-muted-foreground lg:hidden">
          {orgLabel} › <strong className="font-medium text-foreground">{t(page)}</strong>
        </div>

        <main
          ref={mainScrollRef}
          id="pg"
          data-distributor-scroll
          className="scrollbar-thin min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain touch-pan-y px-4 pb-[max(5rem,env(safe-area-inset-bottom))] pt-5 sm:px-5 sm:pt-6 lg:px-[30px] lg:pb-[80px] lg:pt-[30px]"
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
