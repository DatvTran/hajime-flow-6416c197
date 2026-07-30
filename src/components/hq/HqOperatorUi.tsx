/**
 * HQ operator page kit — mirrors hq-operator-app.html tokens (shared dist-* surface classes).
 */
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export function HqOperatorPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("animate-enter", className)}>{children}</div>;
}

export function HqOperatorPageHeader({
  title,
  description,
  actions,
  rawTitle,
  rawDescription,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  rawTitle?: boolean;
  rawDescription?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();
  return (
    <div className={cn("hq-ph-row flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em] text-foreground sm:text-[30px]">
          {rawTitle ? title : t(title)}
        </h1>
        {description ? (
          <p className="mt-1 max-w-[60ch] text-[13px] text-muted-foreground">
            {rawDescription ? description : typeof description === "string" ? t(description) : description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function HqOperatorSectionHead({
  title,
  linkLabel,
  linkTo,
  hint,
}: {
  title: string;
  linkLabel?: string;
  linkTo?: string;
  hint?: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="hq-sec-head mb-3.5 flex items-baseline justify-between gap-3">
      <div className="hq-sec-title font-display text-[19px] font-medium tracking-[-0.01em]">{t(title)}</div>
      {linkLabel && linkTo ? (
        <Link to={linkTo} className="hq-sec-link text-xs font-medium text-accent hover:underline">
          {t(linkLabel)}
        </Link>
      ) : hint ? (
        <span className="text-xs text-muted-foreground">{t(hint)}</span>
      ) : null}
    </div>
  );
}

const kpiIconTone: Record<string, string> = {
  gold: "hq-kpi-ic-gold",
  green: "hq-kpi-ic-green",
  blue: "hq-kpi-ic-blue",
  ink: "hq-kpi-ic-ink",
  red: "hq-kpi-ic-red",
};

export function HqOperatorKpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("hq-kpi-row grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4", className)}>{children}</div>;
}

export function HqOperatorKpiCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
  delta,
  deltaTone,
  to,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: "gold" | "green" | "blue" | "ink" | "red";
  label: string;
  value: string;
  sub?: string;
  delta?: ReactNode;
  deltaTone?: "up" | "down";
  to?: string;
  onClick?: () => void;
}) {
  const { t } = useLanguage();
  const inner = (
    <>
      <div className={cn("hq-kpi-ic mb-2 flex size-[34px] items-center justify-center rounded-lg", kpiIconTone[tone])}>
        <Icon className="size-[17px]" strokeWidth={1.75} />
      </div>
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{t(label)}</p>
      <p className="font-display text-[26px] font-semibold tabular-nums leading-none tracking-[-0.02em]">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{t(sub)}</p> : null}
      {delta ? (
        <div
          className={cn(
            "mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-medium",
            deltaTone === "up" && "text-[hsl(158_56%_32%)]",
            deltaTone === "down" && "text-[hsl(0_68%_44%)]",
          )}
        >
          {delta}
        </div>
      ) : null}
    </>
  );
  const className = "hq-kpi card-interactive flex flex-col gap-1 p-[18px] no-underline text-inherit";
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

export function HqOperatorCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("hq-card", className)}>{children}</div>;
}

export function HqOperatorCardHead({
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
    <div className="hq-card-head">
      <div>
        <div className="hq-card-title">{t(title)}</div>
        {subtitle ? <div className="hq-card-sub mt-0.5">{t(subtitle)}</div> : null}
      </div>
      {actions}
    </div>
  );
}

export function HqOperatorTwoCol({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("hq-two-col grid gap-[18px] lg:grid-cols-[1.4fr_1fr]", className)}>{children}</div>;
}

export function HqOperatorAlertBar({
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
        "hq-alert-bar flex flex-col gap-3 sm:flex-row sm:items-start",
        variant === "error" ? "hq-alert-err" : "hq-alert-warn",
      )}
    >
      <div className="flex-1 text-[13px]">{children}</div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function HqOperatorFilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("hq-filter-bar mb-5 flex flex-wrap items-center gap-1.5", className)}>{children}</div>;
}

export function HqOperatorFilterButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("hq-filter-btn", active && "active")}>
      {children}
    </button>
  );
}

export function HqOperatorDataTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="hq-data-table w-full min-w-[640px]">{children}</table>
    </div>
  );
}

export function HqOperatorSearchWrap({
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
    <div className="hq-search-wrap relative ml-0 w-full max-w-none flex-1 sm:ml-auto sm:max-w-[320px]">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
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

const pillStyles = {
  green: "hq-pill-green",
  blue: "hq-pill-blue",
  amber: "hq-pill-amber",
  red: "hq-pill-red",
  neutral: "hq-pill-neutral",
  ink: "hq-pill-ink",
} as const;

const pillDots = {
  green: "bg-[hsl(158_56%_36%)]",
  blue: "bg-[hsl(215_72%_50%)]",
  amber: "bg-[hsl(38_90%_50%)]",
  red: "bg-[hsl(0_68%_48%)]",
  neutral: "bg-muted-foreground",
  ink: "bg-[hsl(24_10%_16%)]",
} as const;

export function HqOperatorPill({
  tone,
  children,
}: {
  tone: keyof typeof pillStyles;
  children: ReactNode;
}) {
  return (
    <span className={cn("hq-pill", pillStyles[tone])}>
      <span className={cn("hq-pdot", pillDots[tone])} />
      {children}
    </span>
  );
}

export function HqOperatorSrcChip({
  variant,
  children,
}: {
  variant: "rep" | "retail" | "dist" | "kura";
  children: ReactNode;
}) {
  const cls = {
    rep: "hq-src-rep",
    retail: "hq-src-retail",
    dist: "hq-src-dist",
    kura: "hq-src-kura",
  }[variant];
  return <span className={cn("hq-src-chip", cls)}>{children}</span>;
}

export function HqOperatorCoverBar({ pct, tone }: { pct: number; tone: "low" | "med" | "ok" }) {
  return (
    <div className="hq-cover-bar">
      <div
        className={cn("hq-cover-fill", tone === "low" && "cf-low", tone === "med" && "cf-med", tone === "ok" && "cf-ok")}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

export function HqOperatorMarketCard({
  name,
  sub,
  coverLabel,
  revenue,
  revenueSuffix = "",
  coverPct,
  coverTone,
  statusTone,
  statusLabel,
  skuCount,
  manageTo,
  to,
  onClick,
}: {
  name: string;
  sub: string;
  coverLabel: string;
  revenue: string;
  revenueSuffix?: string;
  coverPct: number;
  coverTone: "low" | "med" | "ok";
  statusTone: keyof typeof pillStyles;
  statusLabel: string;
  skuCount?: number;
  manageTo?: string;
  to?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="hq-market-name font-display text-lg font-semibold tracking-[-0.01em]">{name}</div>
          <div className="mt-px text-[11px] text-muted-foreground">{sub}</div>
        </div>
        <HqOperatorPill tone={statusTone}>{statusLabel}</HqOperatorPill>
      </div>
      <div className="mt-3.5 flex justify-between text-[11px] text-muted-foreground">
        <span>{coverLabel}</span>
        <span className="font-mono font-semibold text-foreground">
          {revenue}
          {revenueSuffix}
        </span>
      </div>
      <HqOperatorCoverBar pct={coverPct} tone={coverTone} />
      {skuCount != null || manageTo ? (
        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
          {skuCount != null ? (
            <span className="text-xs text-muted-foreground">{skuCount} SKUs listed</span>
          ) : (
            <span />
          )}
          {manageTo ? (
            <HqBtnLink to={manageTo} variant="outline" size="sm">
              Manage
            </HqBtnLink>
          ) : null}
        </div>
      ) : null}
    </>
  );
  const className = "hq-market-card cursor-pointer p-[18px] no-underline text-inherit";
  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(className, "w-full text-left")}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

export function HqOperatorApprovalCard({
  urgent,
  defaultOpen,
  header,
  detail,
}: {
  urgent?: boolean;
  defaultOpen?: boolean;
  header: ReactNode;
  detail: ReactNode;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className={cn("hq-approval-card", urgent && "urgent")}>
      <button type="button" className="hq-approval-head w-full text-left" onClick={() => setOpen((o) => !o)}>
        {header}
      </button>
      <div className={cn("hq-approval-detail", open && "open")}>{detail}</div>
    </div>
  );
}

export function HqBtn({
  variant = "outline",
  size = "default",
  className,
  type = "button",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "accent" | "outline" | "ink" | "green" | "red";
  size?: "default" | "sm";
}) {
  return (
    <button
      type={type}
      className={cn(
        "hq-btn inline-flex items-center justify-center gap-1.5",
        variant === "accent" && "hq-btn-accent",
        variant === "outline" && "hq-btn-outline",
        variant === "ink" && "hq-btn-ink",
        variant === "green" && "hq-btn-green",
        variant === "red" && "hq-btn-red",
        size === "sm" && "hq-btn-sm",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function HqBtnLink({
  to,
  variant = "outline",
  size = "default",
  className,
  children,
}: {
  to: string;
  variant?: "accent" | "outline" | "ink" | "green" | "red";
  size?: "default" | "sm";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "hq-btn inline-flex items-center justify-center gap-1.5 no-underline",
        variant === "accent" && "hq-btn-accent",
        variant === "outline" && "hq-btn-outline",
        variant === "ink" && "hq-btn-ink",
        variant === "green" && "hq-btn-green",
        variant === "red" && "hq-btn-red",
        size === "sm" && "hq-btn-sm",
        className,
      )}
    >
      {children}
    </Link>
  );
}
