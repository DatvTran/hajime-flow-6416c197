import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { homePathForRole, postLoginDestination, type HajimeRole, useAuth } from "@/contexts/AuthContext";
import { accounts as seedAccounts } from "@/data/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TEAM_ROSTER, RETAIL_ACCOUNT_TRADING_NAME_BY_EMAIL } from "@/data/team-roster";
import type { TeamMemberPortalRole } from "@/types/app-data";
import { HajimeLogo } from "@/components/HajimeLogo";
import { cn } from "@/lib/utils";

const ROLE_CONFIG: { id: HajimeRole; label: string; sublabel: string; icon: string; accent: string }[] = [
  { id: "brand_operator", label: "Brand Operator", sublabel: "Hajime HQ — command center", icon: "◉", accent: "border-amber-600/40 bg-amber-600/5 hover:bg-amber-600/10 hover:border-amber-600/60" },
  { id: "manufacturer", label: "Manufacturer", sublabel: "Production & export", icon: "⚙", accent: "border-stone-500/40 bg-stone-500/5 hover:bg-stone-500/10 hover:border-stone-500/60" },
  { id: "distributor", label: "Distributor", sublabel: "Warehouse & fulfillment", icon: "◫", accent: "border-violet-500/40 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/60" },
  { id: "sales_rep", label: "Sales Rep", sublabel: "Field accounts & drafts", icon: "◈", accent: "border-emerald-600/40 bg-emerald-600/5 hover:bg-emerald-600/10 hover:border-emerald-600/60" },
  { id: "retail", label: "Retail Store", sublabel: "Order & track deliveries", icon: "◻", accent: "border-rose-600/40 bg-rose-600/5 hover:bg-rose-600/10 hover:border-rose-600/60" },
];

const RETAIL_ACCOUNT_OPTIONS = seedAccounts
  .filter((a) => ["retail", "restaurant", "bar", "hotel"].includes(a.type) && a.status === "active")
  .map((a) => a.tradingName);

function authRoleToTeamRole(r: HajimeRole): TeamMemberPortalRole | null {
  if (r === "sales_rep" || r === "retail" || r === "distributor" || r === "manufacturer") return r;
  return null;
}

export default function Login() {
  const { user, signIn, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("admin@hajime.jp");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("Admin");
  const [role, setRole] = useState<HajimeRole>("brand_operator");
  const [retailAccount, setRetailAccount] = useState(
    () => RETAIL_ACCOUNT_OPTIONS.includes("The Drake Hotel") ? "The Drake Hotel" : RETAIL_ACCOUNT_OPTIONS[0] ?? "The Drake Hotel",
  );
  const [personaId, setPersonaId] = useState<string>("");
  const [step, setStep] = useState<"role" | "credentials">("role");

  const rosterForRole = useMemo(() => {
    const tr = authRoleToTeamRole(role);
    if (!tr) return [];
    return TEAM_ROSTER.filter((m) => m.role === tr);
  }, [role]);

  if (user) {
    const dest = from && from !== "/login" ? from : homePathForRole(user.role);
    return <Navigate to={dest} replace />;
  }

  const selectRole = (r: HajimeRole) => {
    setRole(r);
    setPersonaId("");
    clearError();
    if (r === "brand_operator") {
      setEmail("admin@hajime.jp");
      setDisplayName("Admin");
    }
    setStep("credentials");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email.trim() || !password.trim()) {
      return;
    }

    try {
      await signIn(email.trim(), password.trim());
      navigate(postLoginDestination(role, from), { replace: true });
    } catch {
      // Error is handled by AuthContext
    }
  };

  const selectedConfig = ROLE_CONFIG.find((r) => r.id === role)!;

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[hsl(24,12%,8%)] p-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(40 88% 42% / 0.08), transparent)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-[0.03]" />

      <div className="relative z-10 mb-10 flex flex-col items-center text-center animate-enter">
        <h1 className="sr-only">Hajime</h1>
        <HajimeLogo variant="dark" className="h-[clamp(7rem,22vw,11rem)] w-auto max-w-[min(85vw,260px)]" alt="" />
        <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.35em] text-[hsl(35,12%,45%)]">B2B Supply Chain OS</p>
      </div>

      {step === "role" && (
        <div className="relative z-10 w-full max-w-xl animate-fade-up">
          <p className="mb-6 text-center text-sm text-[hsl(35,12%,55%)]">Choose your role to see that portal view</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            {ROLE_CONFIG.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => selectRole(r.id)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-300",
                  "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(24,12%,8%)]",
                  "animate-enter touch-manipulation",
                )}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-lg text-[hsl(35,14%,70%)] transition-colors group-hover:bg-white/[0.1] group-hover:text-amber-500">
                  {r.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[hsl(35,14%,88%)]">{r.label}</p>
                  <p className="text-xs text-[hsl(35,12%,45%)]">{r.sublabel}</p>
                </div>
                <svg
                  className="ml-auto h-4 w-4 shrink-0 text-[hsl(35,12%,30%)] transition-all group-hover:translate-x-0.5 group-hover:text-amber-600/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "credentials" && (
        <div className="relative z-10 w-full max-w-md animate-fade-up">
          <button
            type="button"
            onClick={() => setStep("role")}
            className="mb-4 flex items-center gap-1.5 text-xs text-[hsl(35,12%,50%)] transition-colors hover:text-[hsl(35,14%,75%)] touch-manipulation"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Change role
          </button>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] text-lg text-amber-500">
                {selectedConfig.icon}
              </span>
              <div>
                <p className="text-sm font-medium text-[hsl(35,14%,88%)]">{selectedConfig.label}</p>
                <p className="text-xs text-[hsl(35,12%,45%)]">{selectedConfig.sublabel}</p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-900/30">
                <AlertDescription className="text-red-200 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={submit} className="space-y-4">
              {rosterForRole.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="persona" className="text-xs text-[hsl(35,12%,55%)]">
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
                        const acct = RETAIL_ACCOUNT_TRADING_NAME_BY_EMAIL[m.email.toLowerCase()];
                        if (acct) setRetailAccount(acct);
                      }
                    }}
                  >
                    <SelectTrigger id="persona" className="touch-manipulation border-white/[0.1] bg-white/[0.04] text-[hsl(35,14%,85%)] hover:bg-white/[0.06]">
                      <SelectValue placeholder="Choose persona…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      {rosterForRole.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.displayName} · <span className="text-muted-foreground">{m.email}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs text-[hsl(35,12%,55%)]">
                  Display name
                </Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                  className="touch-manipulation border-white/[0.1] bg-white/[0.04] text-[hsl(35,14%,88%)] placeholder:text-[hsl(35,12%,30%)] focus:border-amber-600/40 focus:ring-amber-600/20"
                />
              </div>

              {role === "retail" && (
                <div className="space-y-2">
                  <Label htmlFor="retail-acct" className="text-xs text-[hsl(35,12%,55%)]">
                    Ordering as
                  </Label>
                  <Select value={retailAccount} onValueChange={setRetailAccount}>
                    <SelectTrigger id="retail-acct" className="touch-manipulation border-white/[0.1] bg-white/[0.04] text-[hsl(35,14%,85%)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RETAIL_ACCOUNT_OPTIONS.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-[hsl(35,12%,55%)]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="touch-manipulation border-white/[0.1] bg-white/[0.04] text-[hsl(35,14%,88%)] placeholder:text-[hsl(35,12%,30%)] focus:border-amber-600/40 focus:ring-amber-600/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs text-[hsl(35,12%,55%)]">
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
                  className="touch-manipulation border-white/[0.1] bg-white/[0.04] text-[hsl(35,14%,88%)] placeholder:text-[hsl(35,12%,30%)] focus:border-amber-600/40 focus:ring-amber-600/20"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="mt-2 h-12 w-full touch-manipulation bg-amber-600 text-sm font-semibold tracking-wide text-white transition-all hover:bg-amber-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : `Continue as ${selectedConfig.label}`}
              </Button>
            </form>
          </div>

          <p className="mt-4 text-center text-[10px] text-[hsl(35,12%,35%)]">
            Five portals — one shared dataset. Every change propagates in real time.
          </p>
        </div>
      )}
    </div>
  );
}
