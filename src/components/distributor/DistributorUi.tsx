import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

/** Page shell — distributor-app.html `.pw.enter` */
export function DistributorPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("animate-enter", className)}>{children}</div>;
}

/** `.ph-row` page title row */
export function DistributorPageHeader({
  title,
  description,
  actions,
  rawTitle,
  rawDescription,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** When set, title is shown as-is (e.g. personalized greeting). */
  rawTitle?: boolean;
  rawDescription?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="dist-ph-row flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em] text-foreground sm:text-[30px]">
          {rawTitle ? title : t(title)}
        </h1>
        {description ? (
          <p className="mt-1 max-w-[56ch] text-[13px] text-muted-foreground">
            {rawDescription ? description : t(description)}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function DistributorSectionHead({
  title,
  linkLabel,
  linkTo,
  onLinkClick,
}: {
  title: string;
  linkLabel?: string;
  linkTo?: string;
  onLinkClick?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="dist-sec-head mb-3.5 flex items-baseline justify-between gap-3">
      <h2 className="dist-sec-title font-display text-[19px] font-medium tracking-[-0.01em]">{t(title)}</h2>
      {linkLabel && linkTo ? (
        <Link to={linkTo} className="dist-sec-link text-xs font-medium text-accent hover:underline">
          {t(linkLabel)}
        </Link>
      ) : linkLabel && onLinkClick ? (
        <button type="button" onClick={onLinkClick} className="dist-sec-link text-xs font-medium text-accent hover:underline">
          {t(linkLabel)}
        </button>
      ) : null}
    </div>
  );
}

const kpiIconTone: Record<string, string> = {
  gold: "dist-kpi-ic-gold",
  green: "dist-kpi-ic-green",
  blue: "dist-kpi-ic-blue",
  ink: "dist-kpi-ic-ink",
};

export function DistributorKpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("dist-kpi-row grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4", className)}>{children}</div>;
}

export function DistributorKpiCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
  delta,
  to,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: "gold" | "green" | "blue" | "ink";
  label: string;
  value: string;
  sub?: string;
  delta?: ReactNode;
  to?: string;
  onClick?: () => void;
}) {
  const { t } = useLanguage();
  const inner = (
    <>
      <div className={cn("dist-kpi-ic mb-2 flex size-[34px] items-center justify-center rounded-lg", kpiIconTone[tone])}>
        <Icon className="size-[17px]" strokeWidth={1.75} />
      </div>
      <p className="dist-kpi-lab text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{t(label)}</p>
      <p className="dist-kpi-val font-display text-[26px] font-semibold tabular-nums leading-none tracking-[-0.02em]">
        {value}
      </p>
      {sub ? <p className="dist-kpi-sub text-xs text-muted-foreground">{t(sub)}</p> : null}
      {delta ? <div className="dist-kpi-delta mt-0.5 text-[11px] font-medium">{delta}</div> : null}
    </>
  );
  const className = "dist-kpi card-interactive flex flex-col gap-1 p-[18px] no-underline text-inherit";
  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(className, "text-left")}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

export function DistributorCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("dist-card", className)}>{children}</div>;
}

export function DistributorCardHead({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="dist-card-head">
      <div>
        <div className="dist-card-title">{t(title)}</div>
        {subtitle ? <div className="dist-card-sub mt-0.5">{t(subtitle)}</div> : null}
      </div>
      {actions}
    </div>
  );
}

export function DistributorTwoCol({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("dist-two-col grid gap-[18px] lg:grid-cols-[1.3fr_1fr]", className)}>{children}</div>;
}

export function DistributorAlertBar({
  variant,
  children,
  actions,
}: {
  variant: "error" | "warn";
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "dist-alert-bar flex flex-col gap-3 sm:flex-row sm:items-start",
        variant === "error" ? "dist-alert-err" : "dist-alert-warn",
      )}
    >
      <div className="flex-1 text-[13px]">{children}</div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function DistributorFilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("dist-filter-bar mb-5 flex flex-wrap items-center gap-1.5", className)}>{children}</div>;
}

export function DistributorFilterButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("dist-filter-btn", active && "active")}>
      {children}
    </button>
  );
}

export function DistributorDataTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="dist-data-table w-full min-w-[640px]">{children}</table>
    </div>
  );
}

export function DistributorSearchWrap({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="dist-search-wrap relative ml-auto max-w-[320px] flex-1">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t(placeholder ?? "Search…")}
        className="h-9 w-full rounded-lg border border-border bg-background py-0 pl-9 pr-3 text-[13px] outline-none focus:border-ring"
      />
    </div>
  );
}

/** Shipment tracker steps — distributor-app.html `.mini-steps` */
export function DistributorMiniSteps({
  steps,
}: {
  steps: { label: string; state: "done" | "current" | "pending" }[];
}) {
  const { t } = useLanguage();
  return (
    <div className="dist-mini-steps">
      {steps.map((step) => (
        <div
          key={step.label}
          className={cn(
            "dist-mstep",
            step.state === "done" && "done",
            step.state === "current" && "cur",
          )}
        >
          <div className="dist-mstep-dot">
            {step.state === "done" ? (
              <Check className="size-2" strokeWidth={3} />
            ) : step.state === "current" ? (
              "●"
            ) : (
              "○"
            )}
          </div>
          <div className="dist-mstep-lbl">{t(step.label)}</div>
        </div>
      ))}
    </div>
  );
}

export function DistributorShipmentCard({
  tracking,
  poRef,
  title,
  accountHref,
  items,
  eta,
  etaLabel = "ETA",
  pill,
  defaultOpen,
  leadIcon,
  children,
}: {
  tracking: string;
  poRef?: string;
  title: ReactNode;
  accountHref?: string;
  items?: string;
  eta: string;
  etaLabel?: string;
  pill: ReactNode;
  defaultOpen?: boolean;
  leadIcon?: ReactNode;
  children?: ReactNode;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className="dist-shipment-card">
      <button
        type="button"
        className="dist-shipment-header flex w-full items-center gap-3.5 px-5 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        {leadIcon ? <div className="dist-shipment-icon shrink-0">{leadIcon}</div> : null}
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] text-muted-foreground">
            {tracking}
            {poRef ? ` · ${poRef}` : ""}
          </div>
          {accountHref ? (
            <Link
              to={accountHref}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 inline-flex items-center gap-1 text-[15px] font-semibold text-foreground no-underline hover:text-accent"
            >
              {title}
              <ChevronRight className="size-3.5 shrink-0 opacity-60" />
            </Link>
          ) : (
            <div className="mt-0.5 text-[15px] font-semibold">{title}</div>
          )}
          {items ? <div className="mt-0.5 text-xs text-muted-foreground">{items}</div> : null}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[13px] text-muted-foreground">{t(etaLabel)}</div>
          <div className="mt-0.5 text-[13px] font-medium">{eta}</div>
        </div>
        {pill}
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && children ? (
        <div className="border-t border-border/40 px-5 py-4">{children}</div>
      ) : null}
    </div>
  );
}

export function DistributorScheduleDay({ label, children }: { label: string; children: ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="dist-schedule-day mb-6">
      <div className="dist-sched-day-label mb-2.5 border-b border-border/40 pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {t(label)}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function DistributorScheduleRow({
  time,
  account,
  items,
  tracking,
  pill,
  action,
}: {
  time: string;
  account: string;
  items: string;
  tracking?: string;
  pill?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="dist-sched-row flex flex-col gap-3 rounded-[10px] border border-border/60 bg-card px-4 py-3 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lifted)] sm:flex-row sm:items-center sm:gap-3.5">
      <div className="dist-sched-time w-20 shrink-0 font-mono text-xs font-medium">{time}</div>
      <div className="dist-sched-body min-w-0 flex-1">
        <div className="dist-sched-acct text-[13px] font-medium">{account}</div>
        <div className="dist-sched-items mt-0.5 text-xs text-muted-foreground">{items}</div>
      </div>
      <div className="shrink-0 text-right">
        {tracking ? <div className="font-mono text-[11px] text-muted-foreground">{tracking}</div> : null}
        {pill ? <div className="mt-1">{pill}</div> : null}
      </div>
      {action}
    </div>
  );
}

export function DistributorAvailBar({ pct, tone }: { pct: number; tone: "low" | "med" | "ok" }) {
  return (
    <div className="dist-avail-bar mt-1 h-[5px] w-[120px] overflow-hidden rounded-full bg-border">
      <div
        className={cn("dist-avail-fill h-full rounded-full", tone === "low" && "af-low", tone === "med" && "af-med", tone === "ok" && "af-ok")}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}
