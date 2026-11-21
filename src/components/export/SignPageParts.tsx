import type { ReactNode } from "react";
import { Check, MessageCircle, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

/** Contact link from the Drink Hajime WhatsApp QR; breaks if the QR is reset in WhatsApp. */
export const WHATSAPP_URL = "https://wa.me/qr/DIXQDR63EM7TF1";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const primaryBtn =
  "relative flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[10px] border border-[hsl(40_60%_46%/0.7)] " +
  "bg-[hsl(24_10%_10%)] font-display text-[22px] font-medium text-[hsl(40_20%_97%)] no-underline transition-[background,transform] " +
  "hover:bg-[hsl(24_10%_18%)] active:scale-[0.98] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-[3px] focus-visible:outline-[hsl(40_88%_42%)]";
export const secondaryBtn =
  "flex min-h-[48px] items-center justify-center gap-2 rounded-[10px] border border-[hsl(35_12%_82%)] " +
  "bg-[hsl(40_20%_99%)] px-4 text-[15px] font-medium text-[hsl(24_10%_10%)] no-underline hover:bg-[hsl(35_16%_93%)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[hsl(40_88%_42%)]";

export const inputCls = (invalid: boolean) =>
  cn(
    "w-full rounded-lg border bg-[hsl(40_20%_99%)] px-3.5 text-base outline-none",
    "focus:border-[hsl(40_88%_42%)] focus:shadow-[0_0_0_3px_hsl(40_88%_42%/0.25)]",
    invalid ? "border-[hsl(0_68%_48%)]" : "border-[hsl(35_12%_84%)]",
  );

export function usd(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) ? `US$ ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A";
}

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-medium">
        {label}{" "}
        {optional ? null : (
          <span aria-hidden className="text-[hsl(0_68%_44%)]">
            *
          </span>
        )}
      </label>
      {hint ? <p className="-mt-1 mb-0 text-[13px] text-[hsl(24_8%_38%)]">{hint}</p> : null}
      {children}
      <div id={`${id}-error`} aria-live="polite">
        {error ? <p className="m-0 text-sm text-[hsl(0_68%_40%)]">{error}</p> : null}
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[hsl(40_18%_97%)] font-body text-[hsl(24_10%_10%)] antialiased [-webkit-tap-highlight-color:transparent] print:bg-white">
      <header className="mx-auto flex max-w-[860px] items-center gap-3 px-[18px] pb-3 pt-4 print:hidden">
        <img
          src="/connect-img/hajime-enso.png"
          alt="Hajime"
          width={40}
          height={40}
          className="block h-10 w-10 object-contain mix-blend-multiply"
        />
        <span aria-hidden className="font-display text-[17px] font-semibold tracking-[0.34em]">
          HAJIME
        </span>
      </header>
      <main className="mx-auto max-w-[860px] px-[18px] pb-[calc(32px+env(safe-area-inset-bottom))] print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  );
}

export function Notice({
  tone = "neutral",
  title,
  children,
}: {
  tone?: "neutral" | "success" | "warning";
  title: string;
  children?: ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "mt-4 rounded-xl border px-5 py-5 print:hidden",
        tone === "success" && "border-[hsl(142_35%_60%)] bg-[hsl(142_40%_96%)]",
        tone === "warning" && "border-[hsl(40_70%_60%)] bg-[hsl(42_80%_95%)]",
        tone === "neutral" && "border-[hsl(35_12%_84%)] bg-[hsl(40_20%_99%)]",
      )}
    >
      <h1 className="m-0 flex items-center gap-2.5 font-display text-[28px] font-medium leading-tight">
        {tone === "success" ? (
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[hsl(142_45%_32%)] text-white">
            <Check className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />
          </span>
        ) : null}
        {title}
      </h1>
      {children ? <div className="mt-2 text-[15px] leading-relaxed text-[hsl(24_8%_28%)]">{children}</div> : null}
    </div>
  );
}

export function ContactRow() {
  return (
    <div className="mt-4 flex flex-col gap-2.5 min-[480px]:flex-row print:hidden">
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={cn(secondaryBtn, "flex-1")}>
        <MessageCircle className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        Message us on WhatsApp
      </a>
      <button type="button" onClick={() => window.print()} className={cn(secondaryBtn, "flex-1")}>
        <Printer className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        Print / Save PDF
      </button>
    </div>
  );
}
