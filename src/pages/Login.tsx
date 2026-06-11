import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { homePathForRole, type HajimeRole, useAuth } from "@/contexts/AuthContext";
import { accounts as seedAccounts } from "@/data/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TEAM_ROSTER, RETAIL_ACCOUNT_TRADING_NAME_BY_EMAIL } from "@/data/team-roster";
import type { TeamMemberPortalRole } from "@/types/app-data";
import { HajimeLogo } from "@/components/HajimeLogo";
import { cn } from "@/lib/utils";

/** Unicode role marks — Hajime Design System auth kit */
const ROLE_CONFIG: {
  id: HajimeRole;
  label: string;
  sublabel: string;
  glyph: string;
  wide?: boolean;
}[] = [
  { id: "brand_operator", label: "Brand Operator", sublabel: "Hajime HQ — command center", glyph: "◉" },
  { id: "manufacturer", label: "Manufacturer", sublabel: "Production & export", glyph: "⚙" },
  { id: "distributor", label: "Distributor", sublabel: "Warehouse & fulfillment", glyph: "◫" },
  { id: "sales_rep", label: "Sales Rep", sublabel: "Field accounts & drafts", glyph: "◈" },
  { id: "retail", label: "Retail Store", sublabel: "Order & track deliveries", glyph: "◻", wide: true },
];

const RETAIL_ACCOUNT_OPTIONS = seedAccounts
  .filter((a) => ["retail", "restaurant", "bar", "hotel"].includes(a.type) && a.status === "active")
  .map((a) => a.tradingName);

const RETAIL_VENUE_OPTIONS =
  RETAIL_ACCOUNT_OPTIONS.length > 0 ? RETAIL_ACCOUNT_OPTIONS : ["The Drake Hotel"];

/** Seeded HQ admin (`server/seeds/001_initial_data.mjs`). */
const DEMO_BRAND_OPERATOR_PASSWORD = "admin123!";

/** Seeded DB password for all demo retail personas (`server/seeds/001_initial_data.mjs`). */
const DEMO_RETAIL_PASSWORD = "retail123!";

/** Demo sales rep personas — migration `026_demo_sales_rep_users` + seed. */
const DEMO_SALES_REP_PASSWORD = "admin123!";

/** Demo distributor — migration `026_demo_sales_rep_users` (Metro Logistics). */
const DEMO_DISTRIBUTOR_PASSWORD = "admin123!";

const DEFAULT_SALES_REP_PERSONA_ID = "tm-seed-2";
const DEFAULT_DISTRIBUTOR_PERSONA_ID = "tm-seed-7";

function authRoleToTeamRole(r: HajimeRole): TeamMemberPortalRole | null {
  if (r === "sales_rep" || r === "retail" || r === "distributor" || r === "manufacturer") return r;
  return null;
}

export default function Login() {
  const { user, signIn, signOut, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@hajime.jp");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("Admin");
  const [role, setRole] = useState<HajimeRole>("brand_operator");
  const [retailAccount, setRetailAccount] = useState(
    () =>
      RETAIL_VENUE_OPTIONS.includes("The Drake Hotel")
        ? "The Drake Hotel"
        : RETAIL_VENUE_OPTIONS[0] ?? "The Drake Hotel",
  );
  const [personaId, setPersonaId] = useState<string>("");
  const [step, setStep] = useState<"role" | "credentials">("role");
  const [localError, setLocalError] = useState<string | null>(null);

  const rosterForRole = useMemo(() => {
    const tr = authRoleToTeamRole(role);
    if (!tr) return [];
    return TEAM_ROSTER.filter((m) => m.role === tr);
  }, [role]);

  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  const selectRole = (r: HajimeRole) => {
    setRole(r);
    setPersonaId("");
    clearError();
    setLocalError(null);
    if (r === "brand_operator") {
      setEmail("admin@hajime.jp");
      setDisplayName("Admin");
      setPassword(DEMO_BRAND_OPERATOR_PASSWORD);
    }
    if (r === "retail") {
      setEmail("retail@hajime.jp");
      setDisplayName("Demo Retailer");
      setPassword(DEMO_RETAIL_PASSWORD);
      setRetailAccount(
        RETAIL_VENUE_OPTIONS.includes("The Drake Hotel") ? "The Drake Hotel" : RETAIL_VENUE_OPTIONS[0] ?? "The Drake Hotel",
      );
    }
    if (r === "sales_rep") {
      const m = TEAM_ROSTER.find((x) => x.id === DEFAULT_SALES_REP_PERSONA_ID);
      if (m) {
        setPersonaId(m.id);
        setEmail(m.email);
        setDisplayName(m.displayName);
      } else {
        setEmail("marcus.chen@hajime.jp");
        setDisplayName("Marcus Chen");
      }
      setPassword(DEMO_SALES_REP_PASSWORD);
    }
    if (r === "distributor") {
      const m = TEAM_ROSTER.find((x) => x.id === DEFAULT_DISTRIBUTOR_PERSONA_ID);
      if (m) {
        setPersonaId(m.id);
        setEmail(m.email);
        setDisplayName(m.displayName);
      } else {
        setEmail("fulfillment@metrologistics.example");
        setDisplayName("Metro Logistics Ops");
      }
      setPassword(DEMO_DISTRIBUTOR_PASSWORD);
    }
    setStep("credentials");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    if (!email.trim() || !password.trim()) {
      setLocalError("Enter both email and password.");
      return;
    }
    try {
      const signedIn = await signIn(email.trim(), password.trim(), role === "retail" ? { retailTradingName: retailAccount } : undefined);
      const portalRole = authRoleToTeamRole(role);
      if (portalRole && signedIn.role !== portalRole) {
        await signOut();
        setLocalError(
          `This account is registered as ${signedIn.role.replace(/_/g, " ")}, not ${portalRole.replace(/_/g, " ")}. Pick the matching role tile or use the demo email for this portal.`,
        );
        return;
      }
      navigate(homePathForRole(signedIn.role), { replace: true });
    } catch {
      // handled by AuthContext
    }
  };

  const selectedConfig = ROLE_CONFIG.find((r) => r.id === role)!;

  return (
    <div className="dark relative flex min-h-svh flex-col overflow-hidden bg-[#0a0a0a] text-foreground">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(var(--accent) / 0.07), transparent)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-[0.18]" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-12 px-4 py-10 lg:flex-row lg:items-center lg:gap-16 lg:px-8 lg:py-14">
        {/* Brand column — reference layout: split headline + stats rail */}
        <div className="flex w-full flex-shrink-0 flex-col justify-between gap-10 lg:flex-1 lg:min-w-0 lg:gap-14 lg:pr-6">
          <div className="flex flex-col items-start text-left">
            <h1 className="sr-only">Hajime</h1>
            <HajimeLogo
              variant="dark"
              className="h-[clamp(4.5rem,16vw,7.5rem)] w-auto max-w-[min(72vw,200px)] opacity-[0.97]"
              alt="Hajime logo"
            />

            <div className="mt-8 w-full max-w-xl lg:mt-10">
              <h2 className="font-display text-balance text-[clamp(2rem,6vw,2.75rem)] font-semibold leading-[1.08] tracking-tight">
                <span className="block text-[#faf9f7]">Five portals.</span>
                <span className="mt-1 block font-display italic text-accent">One dataset.</span>
              </h2>
              <p className="mt-5 max-w-[44ch] text-sm leading-relaxed text-[#888888]">
                Every change propagates in real time across all five roles. Sign in to explore any portal.
              </p>
            </div>
          </div>

          <div className="w-full border-t border-white/[0.12] pt-8 text-left">
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              <div>
                <p className="font-display text-3xl font-medium tabular-nums text-accent sm:text-4xl">5</p>
                <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#888888]">
                  Portals
                </p>
              </div>
              <div>
                <p className="font-display text-3xl font-medium tabular-nums text-accent sm:text-4xl">12</p>
                <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#888888]">
                  Markets
                </p>
              </div>
              <div>
                <p className="font-display text-3xl font-medium tabular-nums text-accent sm:text-4xl">1</p>
                <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#888888]">
                  Shared truth
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth column */}
        <div className="flex w-full flex-1 flex-col lg:max-w-[520px] lg:justify-center">
          {step === "role" && (
            <div className="animate-fade-up flex flex-col">
              <p className="mb-6 text-center text-[13px] text-[#9a9a9a]">Choose your role</p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {ROLE_CONFIG.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectRole(r.id)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl border px-3.5 py-3.5 text-left transition-all duration-300 ease-out",
                      "border-white/[0.08] bg-[#1a1a1a] hover:border-white/[0.14] hover:bg-[#222222]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
                      "animate-enter touch-manipulation",
                      r.wide && "sm:col-span-2",
                    )}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-lg text-[#a3a3a3] transition-colors group-hover:bg-accent/15 group-hover:text-accent">
                      <span aria-hidden className="leading-none">
                        {r.glyph}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#ececec]">{r.label}</p>
                      <p className="mt-0.5 text-[11px] text-[#888888]">{r.sublabel}</p>
                    </div>
                    <span
                      className="ml-auto shrink-0 text-sm text-[#5c5c5c] transition-all group-hover:translate-x-0.5 group-hover:text-accent"
                      aria-hidden
                    >
                      ›
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-8 text-center text-[10px] font-medium uppercase tracking-[0.28em] text-[#666666]">
                Demo environment • No real data
              </p>
            </div>
          )}

          {step === "credentials" && (
            <div className="animate-fade-up flex flex-col">
              <button
                type="button"
                onClick={() => setStep("role")}
                className="mb-4 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground touch-manipulation"
              >
                <span aria-hidden>‹</span>
                Change role
              </button>

              <div className="rounded-2xl border border-white/[0.08] bg-[#141414]/95 p-6 backdrop-blur-sm sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent/20 text-lg text-accent">
                    <span aria-hidden>{selectedConfig.glyph}</span>
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{selectedConfig.label}</p>
                    <p className="text-[11px] text-muted-foreground">{selectedConfig.sublabel}</p>
                  </div>
                </div>

                {error || localError ? (
                  <Alert variant="destructive" className="mb-4 border-destructive/40">
                    <AlertDescription className="text-sm">{error ?? localError}</AlertDescription>
                  </Alert>
                ) : null}

                <form onSubmit={submit} className="space-y-4">
                  {rosterForRole.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="persona" className="text-[11px] text-muted-foreground">
                        Team persona
                      </Label>
                      <Select
                        value={personaId || "custom"}
                        onValueChange={(id) => {
                          if (id === "custom") {
                            setPersonaId("");
                            return;
                          }
                          setPersonaId(id);
                          const m = TEAM_ROSTER.find((x) => x.id === id);
                          if (!m) return;
                          setEmail(m.email);
                          setDisplayName(m.displayName);
                          if (m.role === "retail") {
                            setPassword(DEMO_RETAIL_PASSWORD);
                            const acct = RETAIL_ACCOUNT_TRADING_NAME_BY_EMAIL[m.email?.toLowerCase() || ""];
                            if (acct) setRetailAccount(acct);
                          }
                          if (m.role === "sales_rep") {
                            setPassword(DEMO_SALES_REP_PASSWORD);
                          }
                          if (m.role === "distributor") {
                            setPassword(DEMO_DISTRIBUTOR_PASSWORD);
                          }
                        }}
                      >
                        <SelectTrigger id="persona" className="h-10 touch-manipulation">
                          <SelectValue placeholder="Choose persona…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom</SelectItem>
                          {rosterForRole.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.displayName} ·{" "}
                              <span className="text-muted-foreground">{m.email}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[11px] text-muted-foreground">
                      Display name
                    </Label>
                    <Input
                      id="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      autoComplete="name"
                      className="h-10 touch-manipulation"
                    />
                  </div>

                  {role === "retail" && (
                    <div className="space-y-2">
                      <Label htmlFor="retail-acct" className="text-[11px] text-muted-foreground">
                        Ordering as
                      </Label>
                      <Select value={retailAccount} onValueChange={setRetailAccount}>
                        <SelectTrigger id="retail-acct" className="h-10 touch-manipulation">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RETAIL_VENUE_OPTIONS.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[11px] text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      className="h-10 touch-manipulation"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[11px] text-muted-foreground">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      required
                      className="h-10 touch-manipulation"
                    />
                    {role === "brand_operator" ? (
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Demo HQ login: <span className="font-mono text-foreground">admin@hajime.jp</span> · password{" "}
                        <span className="font-mono text-foreground">{DEMO_BRAND_OPERATOR_PASSWORD}</span> (from DB seed).
                      </p>
                    ) : null}
                    {role === "retail" ? (
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Demo retail accounts use password <span className="font-mono text-foreground">{DEMO_RETAIL_PASSWORD}</span> after{" "}
                        <code className="rounded bg-muted px-1 py-px font-mono text-[10px]">npm run dev:api</code> and seed. Personas (
                        Jeff, Maria, James) share this password once seeded.
                      </p>
                    ) : null}
                    {role === "sales_rep" ? (
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Use the persona email (e.g. <span className="font-mono text-foreground">marcus.chen@hajime.jp</span>), not{" "}
                        <span className="font-mono text-foreground">admin@hajime.jp</span>. Password:{" "}
                        <span className="font-mono text-foreground">{DEMO_SALES_REP_PASSWORD}</span> (created by DB seed or migration 026).
                      </p>
                    ) : null}
                    {role === "distributor" ? (
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Demo login: <span className="font-mono text-foreground">fulfillment@metrologistics.example</span> · password{" "}
                        <span className="font-mono text-foreground">{DEMO_DISTRIBUTOR_PASSWORD}</span> (Metro Logistics — migration 026).
                        Do not use <span className="font-mono text-foreground">admin@hajime.jp</span>; that is Brand Operator only.
                      </p>
                    ) : null}
                    <div className="flex justify-end">
                      <Link
                        to="/forgot-password"
                        className="text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 h-11 w-full bg-accent text-accent-foreground shadow-soft hover:bg-accent/90 touch-manipulation active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? "Signing in…" : `Continue as ${selectedConfig.label}`}
                  </Button>
                </form>
              </div>

              <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-[0.28em] text-[#666666]">
                Demo environment • No real data
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
