import { useMemo } from "react";
import QRCode from "react-qr-code";
import { Link, useSearchParams } from "react-router-dom";
import { HajimeLogo } from "@/components/HajimeLogo";
import { expoConnectFormUrl } from "@/lib/expo-connect-url";

/** 8″ × 8″ booth sign — print this page at 100% on square stock. */
export default function ConnectSignPage() {
  const [params] = useSearchParams();
  const eventCode = (params.get("event") || "HK26").toUpperCase();
  const formUrl = useMemo(
    () => params.get("url")?.trim() || expoConnectFormUrl(eventCode),
    [params, eventCode],
  );

  return (
    <div className="connect-sign-root min-h-svh bg-[hsl(40_18%_97%)] text-foreground">
      <style>{`
        @page { size: 8in 8in; margin: 0; }
        @media print {
          .connect-sign-caption { display: none !important; }
          .connect-sign-card {
            margin: 0 !important;
            box-shadow: none !important;
            width: 8in !important;
            height: 8in !important;
          }
          html, body { background: #fff !important; }
        }
      `}</style>

      <div
        className="connect-sign-card relative mx-auto mt-6 flex h-[min(100vw,8in)] w-[min(100vw,8in)] max-w-[8in] flex-col items-center overflow-hidden px-[0.48in] pb-[0.38in] pt-[0.42in] text-center"
        style={{
          background: "hsl(24 12% 8%)",
          color: "hsl(40 20% 97%)",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 18%, hsl(40 88% 42% / 0.22), transparent 52%)",
          }}
        />
        <HajimeLogo variant="dark" className="relative mb-2 h-9 w-9" />
        <p className="relative text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(40_88%_62%)]">
          Scan to connect with our team
        </p>
        <h1 className="relative mt-2.5 font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.024em]">
          Connect with Hajime
        </h1>
        <p className="relative mt-2.5 max-w-[5.8in] text-[12.5px] leading-snug text-[hsl(35_14%_78%)]">
          Interested in representing, stocking, serving, or featuring Hajime?
        </p>
        <a
          href={formUrl}
          className="relative mt-4 block rounded-[4px] bg-white p-3.5 no-underline"
          aria-label="Open buyer registration form"
        >
          <QRCode value={formUrl} size={268} level="M" bgColor="#ffffff" fgColor="#1c1814" />
        </a>
        <p className="relative mt-3.5 text-[13px]">Scan to connect with our team.</p>
        <p className="relative mt-auto font-mono text-[10px] tracking-[0.08em] text-[hsl(35_12%_52%)]">はじめ · hong kong 2026</p>
      </div>

      <div className="connect-sign-caption mx-auto mt-4 max-w-[8in] px-4 pb-10 text-[13px] text-muted-foreground">
        <p>
          Print this page (8″ × 8″). The QR opens the public buyer form on{" "}
          <span className="whitespace-nowrap">supply.drinkhajime.jp</span>.
        </p>
        <p className="mt-2 break-all font-mono text-[12px]">
          <a className="text-accent underline-offset-2 hover:underline" href={formUrl}>
            {formUrl}
          </a>
        </p>
        <p className="mt-3">
          <Link to="/connect" className="text-accent underline-offset-2 hover:underline">
            Open the form without scanning
          </Link>
        </p>
      </div>
    </div>
  );
}
