import { Suspense, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Bell, Factory, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { hqRouteChrome } from "@/lib/hq-chrome";
import { HqOperatorSidebar } from "@/components/hq/HqOperatorSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { OperatorOutletFallback } from "@/components/OperatorOutletFallback";
import { Menu } from "lucide-react";

export function HqOperatorLayout() {
  const { language, t } = useLanguage();
  const { pathname, search } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);
  const prevPathRef = useRef(pathname);

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
  }, [pathname, search]);

  const { page } = hqRouteChrome(pathname, search);

  return (
    <div className="hq-operator-shell flex min-h-svh flex-col bg-background text-foreground lg:grid lg:h-svh lg:grid-cols-[258px_1fr] lg:overflow-hidden">
      <HqOperatorSidebar key={language} className="hidden lg:flex" />

      <div className="main flex min-h-0 min-w-0 flex-1 flex-col lg:h-svh lg:overflow-hidden">
        <header className="topbar glass-header sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="shrink-0 touch-manipulation" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[258px] max-w-[85vw] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
              <HqOperatorSidebar key={language} className="h-full w-full border-0" onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="crumbs min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
            HQ › <strong className="font-medium text-foreground">{t(page)}</strong>
          </div>
          <Link to="/production-requests" className="hq-btn hq-btn-accent hq-btn-sm shrink-0 no-underline" aria-label={t("Production")}>
            <Factory className="size-3.5" strokeWidth={1.75} />
            <span className="hidden min-[400px]:inline">{t("Production")}</span>
          </Link>
        </header>

        <header className="topbar glass-header sticky top-0 z-30 hidden h-[54px] shrink-0 items-center gap-3.5 px-8 lg:flex">
          <div className="crumbs text-[13px] text-muted-foreground">
            HQ › <strong className="font-medium text-foreground">{t(page)}</strong>
          </div>
          <div className="topbar-right ml-auto flex items-center gap-2.5">
            <button type="button" className="hq-icon-btn" aria-label={t("Search")}>
              <Search className="size-4" strokeWidth={1.75} />
            </button>
            <Link to="/alerts" className="hq-icon-btn relative no-underline" aria-label={t("Alerts")}>
              <Bell className="size-4" strokeWidth={1.75} />
              <span className="absolute right-[9px] top-2 size-1.5 rounded-full border border-background bg-[hsl(0_68%_48%)]" />
            </Link>
            <Link to="/production-requests" className="hq-btn hq-btn-accent no-underline">
              <Factory className="size-3.5" strokeWidth={1.75} />
              {t("Production requests")}
            </Link>
          </div>
        </header>

        <main
          ref={mainScrollRef}
          id="pg"
          className="scrollbar-thin min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-20 pt-5 sm:px-6 lg:px-10 lg:pb-[80px] lg:pt-[30px]"
        >
          <div className="pw mx-auto max-w-[1320px]">
            <Suspense fallback={<OperatorOutletFallback />}>
              <Outlet key={language} />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
