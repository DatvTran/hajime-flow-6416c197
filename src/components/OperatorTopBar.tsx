import { Link, useLocation } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { alertsPathForRole, operatorRouteChrome } from "@/lib/operator-chrome";
import { cn } from "@/lib/utils";

export function OperatorTopBar() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  const { section, page } = operatorRouteChrome(pathname);
  const alertsHref = alertsPathForRole(user.role);

  return (
    <header
      className={cn(
        "glass-header sticky top-0 z-30 grid h-14 shrink-0 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] sm:px-7",
        isMobile ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_minmax(12rem,360px)_minmax(0,1fr)]",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {isMobile ? (
          <>
            <SidebarTrigger className="h-10 w-10 min-h-10 min-w-10 shrink-0 touch-manipulation rounded-lg transition-colors hover:bg-muted [&_svg]:size-5" />
            <span className="hajime-mark truncate text-sm font-medium tracking-wide text-foreground/80">Hajime</span>
          </>
        ) : (
          <div className="truncate text-[13px] text-muted-foreground">
            {t(section)} › <strong className="font-medium text-foreground">{t(page)}</strong>
          </div>
        )}
      </div>

      {!isMobile ? (
        <div className="flex h-8 w-full max-w-[360px] items-center gap-2 justify-self-center rounded-lg border border-border/70 bg-muted/45 px-2.5">
          <Search className="size-[13px] shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
          <input
            type="search"
            name="operator-search"
            placeholder={t("Search…")}
            className="min-w-0 flex-1 bg-transparent font-body text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
            autoComplete="off"
          />
        </div>
      ) : null}

      <div className={cn("flex justify-end", !isMobile && "justify-self-end")}>
        <Link
          to={alertsHref}
          className="relative flex size-[34px] shrink-0 touch-manipulation items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t("Alerts")}
        >
          <Bell className="size-[15px]" strokeWidth={1.75} />
        </Link>
      </div>
    </header>
  );
}
