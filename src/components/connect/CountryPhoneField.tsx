import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CONNECT_COUNTRIES } from "@/lib/connect-countries";
import { cn } from "@/lib/utils";

const norm = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

type CountryPhoneFieldProps = {
  country: string;
  onCountryChange: (iso: string) => void;
  phone: string;
  onPhoneChange: (value: string) => void;
  error?: string | null;
};

export const CountryPhoneField = forwardRef<HTMLInputElement, CountryPhoneFieldProps>(function CountryPhoneField(
  { country, onCountryChange, phone, onPhoneChange, error },
  phoneRef,
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = CONNECT_COUNTRIES.find((c) => c.iso === country) ?? CONNECT_COUNTRIES[0];

  const list = useMemo(() => {
    const q = norm(query.trim());
    const qd = q.replace(/\D/g, "");
    if (!q) return CONNECT_COUNTRIES;
    return CONNECT_COUNTRIES.filter(
      (c) => norm(c.name).includes(q) || c.iso.toLowerCase() === q || (qd && c.dial.slice(1).startsWith(qd)),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const pick = (iso: string) => {
    onCountryChange(iso);
    setOpen(false);
    setQuery("");
    if (phoneRef && typeof phoneRef === "object") phoneRef.current?.focus();
  };

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-1.5">
      <label htmlFor="connect-phone" className="text-[15px] font-medium">
        Phone number{" "}
        <span aria-hidden className="text-[hsl(0_68%_44%)]">
          *
        </span>
      </label>
      <div
        className={cn(
          "flex h-[52px] overflow-hidden rounded-lg border bg-[hsl(40_20%_99%)]",
          error ? "border-[hsl(0_68%_48%)]" : "border-[hsl(35_12%_84%)]",
        )}
      >
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setOpen((o) => !o);
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country code ${current.name} ${current.dial}. Change`}
          className="flex flex-none items-center gap-1.5 border-r border-[hsl(35_12%_89%)] bg-[hsl(37_14%_95%)] pl-3.5 pr-2.5 text-base focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[hsl(40_88%_42%)]"
        >
          <span className="font-mono text-xs font-medium text-[hsl(24_8%_34%)]">{current.iso}</span>
          <span className="tabular-nums">{current.dial}</span>
          <ChevronDown className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </button>
        <input
          ref={phoneRef}
          id="connect-phone"
          type="tel"
          inputMode="tel"
          name="phone"
          autoComplete="tel"
          required
          aria-required="true"
          aria-invalid={error ? "true" : "false"}
          aria-describedby="connect-phone-error"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-base outline-none focus:shadow-[inset_0_0_0_2px_hsl(40_88%_42%)]"
        />
      </div>
      {open ? (
        <div className="absolute inset-x-0 top-[86px] z-10 flex flex-col gap-1.5 rounded-xl border border-[hsl(35_12%_86%)] bg-[hsl(40_20%_99%)] p-2 shadow-[var(--shadow-float)]">
          <input
            ref={searchRef}
            type="search"
            aria-label="Search country or code"
            placeholder="Search country or code"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 w-full rounded-lg border border-[hsl(35_12%_89%)] bg-[hsl(40_18%_97%)] px-3 text-base outline-none focus:border-[hsl(40_88%_42%)]"
          />
          <ul role="listbox" aria-label="Country calling code" className="m-0 max-h-[232px] list-none overflow-auto p-0">
            {list.map((c) => {
              const selected = c.iso === current.iso;
              return (
                <li key={c.iso} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => pick(c.iso)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[15px] hover:bg-[hsl(37_14%_93%)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[hsl(40_88%_42%)]",
                      selected && "bg-[hsl(40_88%_42%/0.1)]",
                    )}
                  >
                    <span className="flex-1">{c.name}</span>
                    <span className="tabular-nums text-[hsl(24_8%_34%)]">{c.dial}</span>
                  </button>
                </li>
              );
            })}
            {list.length === 0 ? (
              <li className="px-2.5 py-3 text-sm text-[hsl(24_8%_34%)]">No matching country.</li>
            ) : null}
          </ul>
        </div>
      ) : null}
      <div id="connect-phone-error" aria-live="polite">
        {error ? <p className="m-0 text-sm text-[hsl(0_68%_40%)]">{error}</p> : null}
      </div>
    </div>
  );
});
