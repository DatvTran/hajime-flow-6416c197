import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { manufacturerRouteChrome } from "@/lib/manufacturer-chrome";
import { ManufacturerSidebar } from "@/components/manufacturer/ManufacturerSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { OperatorOutletFallback } from "@/components/OperatorOutletFallback";
import { FileText, Menu } from "lucide-react";

export function ManufacturerShellLayout() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { pathname } = useLocation();
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
    if (pathChanged) main.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  const orgLabel = useMemo(() => {
    if (!user) return "Kuramoto Brewing";
    const email = user.email?.toLowerCase() ?? "";
    const mfgAccount = data.accounts.find(
      (a) =>
        (a.type === "manufacturer" || a.type === "producer") &&
        (a.email?.toLowerCase() === email || a.portalLoginEmail?.toLowerCase() === email),
    );
    if (mfgAccount?.tradingName) return mfgAccount.tradingName;
    return "Kuramoto Brewing";
  }, [data.accounts, user]);

  const { page } = manufacturerRouteChrome(pathname);

  return (
    <div className="manufacturer-shell flex min-h-svh flex-col bg-background text-foreground lg:grid lg:h-svh lg:grid-cols-[256px_1fr] lg:overflow-hidden">
      <ManufacturerSidebar key={language} className="hidden lg:flex" />

      <div className="main flex min-h-0 min-w-0 flex-1 flex-col lg:h-svh lg:overflow-hidden">
        <header className="topbar glass-header sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="shrink-0 touch-manipulation" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[256px] max-w-[85vw] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
              <ManufacturerSidebar
                key={language}
                className="h-full w-full border-0"
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="crumbs min-w-0 flex-1 truncate font-display text-sm font-medium text-foreground/80">{orgLabel}</div>
          <Link to="/manufacturer/purchase-orders" className="dist-btn dist-btn-accent dist-btn-sm shrink-0 no-underline">
            <FileText className="size-3.5" strokeWidth={1.75} />
            {t("Production requests")}
          </Link>
        </header>

        <header className="topbar glass-header sticky top-0 z-30 hidden h-[54px] shrink-0 items-center justify-between gap-4 px-8 lg:flex">
          <div className="crumbs text-[13px] text-muted-foreground">
            {orgLabel} › <strong className="font-medium text-foreground">{t(page)}</strong>
          </div>
          <div className="topbar-right flex items-center gap-2.5">
            <Link to="/manufacturer/brew-batches" className="dist-btn dist-btn-outline dist-btn-sm no-underline">
              {t("View brew floor")}
            </Link>
            <Link to="/manufacturer/purchase-orders" className="dist-btn dist-btn-accent no-underline">
              <FileText className="size-3.5" strokeWidth={1.75} />
              {t("Production requests")}
            </Link>
          </div>
        </header>

        <div className="crumbs shrink-0 border-b border-border/40 px-4 py-2.5 text-[13px] text-muted-foreground lg:hidden">
          {orgLabel} › <strong className="font-medium text-foreground">{t(page)}</strong>
        </div>

        <main
          ref={mainScrollRef}
          id="pg"
          data-manufacturer-scroll
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
