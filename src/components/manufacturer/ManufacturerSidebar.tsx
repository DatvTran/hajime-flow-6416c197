/**
 * Sidebar chrome from Hajime Design System manufacturer-app.html
 * (.side, .logo-row, .perf-pill, Production / Supply / Quality nav)
 */
import { memo, useId, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts, useAppData, usePurchaseOrders } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelect } from "@/components/LanguageSelect";
import { isSidebarNavItemActive, navPathEndFlag } from "@/lib/sidebar-nav-active";
import { cn } from "@/lib/utils";
import { HajimeLogo } from "@/components/HajimeLogo";
import { TEAM_ROSTER } from "@/data/team-roster";
import { buildManufacturerShipments } from "@/lib/manufacturer-shipments";
import { resolveManufacturerAssignmentIdentity } from "@/lib/npr-manufacturer-scope";
import { filterPosForManufacturerUser } from "@/lib/po-manufacturer-scope";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  FileText,
  FlaskConical,
  HelpCircle,
  Home,
  LogOut,
  Package,
  Truck,
  Wine,
} from "lucide-react";

function userInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badgeTone?: "red" | "amber" | "green" | "gold";
  staticBadge?: number;
};

const productionItems: NavItem[] = [
  { to: "/manufacturer", label: "Dashboard", icon: Home },
  { to: "/manufacturer/purchase-orders", label: "Production requests", icon: FileText, badgeTone: "red" },
  { to: "/manufacturer/brew-batches", label: "Brew batches", icon: FlaskConical, badgeTone: "gold", staticBadge: 4 },
  { to: "/manufacturer/bottling-line", label: "Bottling line", icon: Wine, badgeTone: "amber", staticBadge: 3 },
];

const supplyItems: NavItem[] = [
  { to: "/manufacturer/materials", label: "Raw materials", icon: Package },
  { to: "/manufacturer/finished-goods", label: "Finished goods", icon: Boxes },
  { to: "/manufacturer/shipments", label: "Shipments to HQ", icon: Truck, badgeTone: "green" },
];

const qualityItems: NavItem[] = [
  { to: "/manufacturer/quality", label: "Quality control", icon: ClipboardCheck },
  { to: "/manufacturer/analytics", label: "Analytics & reports", icon: BarChart3 },
  { to: "/manufacturer/support", label: "Support", icon: HelpCircle },
];

const ALL_MFG_NAV_URLS = [...productionItems, ...supplyItems, ...qualityItems].map((i) => i.to);

const navItemBase =
  "navitem flex items-center gap-[9px] rounded-md px-2.5 py-2 text-[13px] text-[hsl(var(--sidebar-foreground)/0.68)] transition-[background,color] duration-[140ms] hover:bg-sidebar-accent hover:text-[hsl(35_14%_90%)]";
const navItemActive =
  "bg-sidebar-accent font-medium text-sidebar-primary text-[hsl(35_14%_90%)]";

const badgeStyles = {
  red: "nb nb-red bg-[hsl(0_68%_48%/0.14)] text-[hsl(0_68%_42%)]",
  amber: "nb nb-amber bg-[hsl(38_90%_50%/0.14)] text-[hsl(30_80%_34%)]",
  green: "nb nb-green bg-[hsl(158_56%_36%/0.15)] text-[hsl(158_56%_32%)]",
  gold: "nb nb-gold bg-[hsl(40_88%_42%/0.18)] text-[hsl(40_88%_42%)]",
} as const;

function ManufacturerPerfPill() {
  const gradId = useId().replace(/:/g, "");
  const pct = 85;
  const r = 18;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="px-2.5 pt-3.5">
      <div className="perf-pill mx-2.5 mt-0 flex items-center gap-3 rounded-xl border border-[hsl(40_88%_42%/0.22)] bg-gradient-to-br from-[hsl(40_88%_42%/0.1)] to-[hsl(40_60%_50%/0.06)] px-3.5 py-3">
        <div className="p-ring relative size-11 shrink-0">
          <svg viewBox="0 0 44 44" className="size-11 -rotate-90" aria-hidden>
            <circle cx="22" cy="22" r={r} stroke="hsl(35 12% 20%)" strokeWidth="4" fill="none" />
            <circle
              cx="22"
              cy="22"
              r={r}
              stroke={`url(#mfgPerfGrad-${gradId})`}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`}
            />
            <defs>
              <linearGradient id={`mfgPerfGrad-${gradId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(40,88%,42%)" />
                <stop offset="100%" stopColor="hsl(32,78%,58%)" />
              </linearGradient>
            </defs>
          </svg>
          <span className="p-ring-lbl absolute inset-0 flex items-center justify-center font-mono text-[10px] font-semibold text-[hsl(40_80%_62%)]">
            {pct}%
          </span>
        </div>
        <div className="p-info min-w-0">
          <div className="pt text-[12px] font-semibold text-[hsl(40_80%_60%)]">Quality 98.6%</div>
          <div className="ps mt-px text-[11px] text-[hsl(35_12%_42%)]">42 batches · 41 passed</div>
        </div>
      </div>
    </div>
  );
}

type NavSectionProps = {
  label: string;
  items: NavItem[];
  sectionClassName?: string;
  openPoCount: number;
  shipmentCount: number;
  onNavigate?: () => void;
};

function NavSection({
  label,
  items,
  sectionClassName,
  openPoCount,
  shipmentCount,
  onNavigate,
}: NavSectionProps) {
  const location = useLocation();
  const { t } = useLanguage();

  const badgeFor = (item: NavItem): number | undefined => {
    if (item.staticBadge != null) return item.staticBadge;
    if (item.to === "/manufacturer/purchase-orders" && openPoCount > 0) return openPoCount;
    if (item.to === "/manufacturer/shipments" && shipmentCount > 0) return shipmentCount;
    return undefined;
  };

  return (
    <nav className={cn("nav-section flex flex-col gap-0.5 px-2.5 pb-1.5", sectionClassName)} aria-label={t(label)}>
      <div className="nav-label px-2 pb-1.5 pt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--sidebar-foreground)/0.32)]">
        {t(label)}
      </div>
      {items.map((item) => {
        const end = navPathEndFlag(item.to, ALL_MFG_NAV_URLS);
        let active = isSidebarNavItemActive(item.to, location.pathname, location.search, end);

        if (item.to === "/manufacturer" && !item.staticBadge) {
          active = location.pathname === "/manufacturer" || location.pathname === "/manufacturer/";
        }

        const badge = badgeFor(item);

        return (
          <Link
            key={item.label + item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(navItemBase, "touch-manipulation", active && navItemActive)}
          >
            <item.icon className="size-[15px] shrink-0" strokeWidth={1.75} />
            <span className="flex-1">{t(item.label)}</span>
            {badge != null && badge > 0 && item.badgeTone ? (
              <span
                className={cn(
                  "ml-auto rounded-full px-1.5 py-px font-mono text-[10px] font-semibold",
                  badgeStyles[item.badgeTone],
                )}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export type ManufacturerSidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

export const ManufacturerSidebar = memo(function ManufacturerSidebar({
  onNavigate,
  className,
}: ManufacturerSidebarProps) {
  const { signOut, user } = useAuth();
  const { t } = useLanguage();
  const { data } = useAppData();
  const { purchaseOrders } = usePurchaseOrders();
  const { accounts } = useAccounts();

  const teamMembers = data.teamMembers?.length ? data.teamMembers : TEAM_ROSTER;
  const identity = useMemo(
    () => resolveManufacturerAssignmentIdentity(user?.email, teamMembers, accounts),
    [user?.email, teamMembers, accounts],
  );

  const orgLabel = useMemo(() => {
    const fromPartner = [...identity.labels][0];
    if (fromPartner) return fromPartner;
    if (!user) return "Manufacturer";
    const email = user.email?.toLowerCase() ?? "";
    const mfgAccount = data.accounts.find(
      (a) =>
        (a.type === "manufacturer" || a.type === "producer") &&
        (a.email?.toLowerCase() === email || a.portalLoginEmail?.toLowerCase() === email),
    );
    if (mfgAccount?.tradingName) return mfgAccount.tradingName;
    return user.displayName?.trim() || "Manufacturer";
  }, [data.accounts, identity, user]);

  const scopedPos = useMemo(
    () => filterPosForManufacturerUser(purchaseOrders, identity),
    [purchaseOrders, identity],
  );

  const openPoCount = useMemo(
    () => scopedPos.filter((p) => p.status !== "delivered" && p.status !== "cancelled").length,
    [scopedPos],
  );

  const shipmentCount = useMemo(
    () => buildManufacturerShipments(data.shipments, [...identity.labels]).filter((s) => s.filterCategory !== "delivered").length,
    [data.shipments, identity],
  );

  const initials = user ? userInitials(user.displayName) : "?";
  const navCounts = { openPoCount, shipmentCount };

  return (
    <aside
      className={cn(
        "side flex w-[256px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <Link
        to="/manufacturer"
        onClick={onNavigate}
        className="logo-row flex shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4 pb-4 pt-5 no-underline"
      >
        <div className="logo-mark flex size-[34px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-accent">
          <HajimeLogo variant="dark" className="h-[26px] w-[26px] object-contain" alt="" />
        </div>
        <div className="min-w-0">
          <div className="logo-name font-display text-base font-semibold leading-tight text-[hsl(35_14%_90%)]">
            Hajime
          </div>
          <div className="logo-sub mt-px truncate text-[10px] tracking-[0.08em] text-[hsl(35_12%_42%)]">
            {orgLabel} · Manufacturer partner
          </div>
        </div>
      </Link>

      <ManufacturerPerfPill />

      <NavSection label="Production" items={productionItems} sectionClassName="pt-3.5" {...navCounts} onNavigate={onNavigate} />

      <div className="side-div mx-2.5 my-2.5 h-px bg-sidebar-border" />

      <NavSection label="Supply" items={supplyItems} sectionClassName="pt-1" {...navCounts} onNavigate={onNavigate} />

      <div className="side-div mx-2.5 my-2.5 h-px bg-sidebar-border" />

      <NavSection
        label="Quality & performance"
        items={qualityItems}
        sectionClassName="pt-1"
        {...navCounts}
        onNavigate={onNavigate}
      />

      <div className="side-footer mt-auto shrink-0 border-t border-sidebar-border px-2.5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="avatar flex size-[30px] shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[11px] font-semibold text-[hsl(35_14%_82%)]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-[hsl(35_14%_88%)]">{user?.displayName ?? "Guest"}</div>
            <div className="truncate text-[10px] text-[hsl(35_12%_44%)]">Tōji · {orgLabel}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/0.32)]">
              {t("Language")}
            </p>
            <LanguageSelect />
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md p-2 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={() => signOut()}
            aria-label={t("Sign out")}
          >
            <LogOut className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
});
