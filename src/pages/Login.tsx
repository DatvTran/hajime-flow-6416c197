import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
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

const ROLE_CONFIG: {
  id: HajimeRole;
  label: string;
  sublabel: string;
  mark: string;
}[] = [
  { id: "brand_operator", label: "Brand Operator", sublabel: "Hajime HQ — command center", mark: "◉" },
  { id: "manufacturer", label: "Manufacturer", sublabel: "Production & export", mark: "⚙" },
  { id: "distributor", label: "Distributor", sublabel: "Warehouse & fulfillment", mark: "◫" },
  { id: "sales_rep", label: "Sales Rep", sublabel: "Field accounts & drafts", mark: "◈" },
  { id: "retail", label: "Retail Store", sublabel: "Order & track deliveries", mark: "◻" },
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
    return <Navigate to={homePathForRole(user.role)} replace />;
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
    if (!email.trim() || !password.trim()) return;
    try {
      const signedIn = await signIn(email.trim(), password.trim());
      navigate(homePathForRole(signedIn.role), { replace: true });
    } catch {
      // handled by AuthContext
    }
  };

  const selectedConfig = ROLE_CONFIG.find((r) => r.id === role)!;

  return (
    <div className="min-h-svh flex items-stretch">
      {/* Left column — brand hero, hidden on mobile */}
      <div className="hidden lg:flex flex-col w-[55%] bg-[hsl(24_12%_8%)] relative overflow-hidden">
        {/* Radial gradient overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(40 88% 42% / 0.08), transparent)",
          }}
        />
        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-[0.025]" />

        {/* Logo top-left */}
        <div className="relative z-10 flex items-center gap-3 p-8">
          <HajimeLogo variant="dark" className="h-10 w-auto" />
          <span className="font-display text-2xl font-semibold text-[hsl(35_14%_90%)] tracking-tight">
            Hajime
          </span>
        </div>

        {/* Hero text — centered in remaining space */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-12">
          <h1 className="font-display text-[5rem] font-semibold leading-[1.0] tracking-tight text-[hsl(40_18%_97%)]">
            Five portals.
            <br />
            <em className="not-italic" style={{ fontStyle: "italic", color: "hsl(40 88% 42%)", fontWeight: 500 }}>
              One dataset.
            </em>
          </h1>
          <p className="mt-6 text-[1.1rem] text-[hsl(35_14%_72%)] leading-relaxed max-w-[44ch]">
            Every change propagates in real time across all five roles. Sign in to explore any portal.
          </p>
        </div>

        {/* Bottom stats bar */}
        <div className="relative z-10 p-8 border-t border-[hsl(35_12%_55%/0.2)]">
          <div className="flex gap-12">
            {[{ n: "5", l: "Portals" }, { n: "12", l: "Markets" }, { n: "1", l: "Shared truth" }].map((s) => (
              <div key={s.l}>
                <div className="font-display text-[2.5rem] font-semibold text-[hsl(40_88%_42%)] tracking-tight leading-none">
                  {s.n}
                </div>
                <div className="text-xs text-[hsl(35_12%_55%)] mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column — login form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[hsl(24_12%_8%)] relative overflow-hidden">
        {/* Radial gradient overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(40 88% 42% / 0.08), transparent)",
          }}
        />
        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-[0.025]" />

        <div className="relative z-10 w-full max-w-md px-8 py-12">
          {/* Mobile logo */}
          <HajimeLogo variant="dark" className="h-12 w-auto mb-8 lg:hidden" />

          {/* Role selection step */}
          {step === "role" && (
            <div className="animate-fade-up">
              <p className="mb-5 text-center text-sm text-[hsl(35_12%_55%)]">
                Choose your role to continue
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                {ROLE_CONFIG.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectRole(r.id)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left",
                      "transition-all duration-300 ease-out",
                      "bg-[hsl(0_0%_100%/0.03)] border-[hsl(0_0%_100%/0.08)] hover:bg-[hsl(0_0%_100%/0.06)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      "animate-enter touch-manipulation",
                    )}
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(0_0%_100%/0.06)] text-[hsl(35_14%_70%)] transition-colors group-hover:bg-[hsl(0_0%_100%/0.1)]">
                      <span className="text-[22px] text-[hsl(35_14%_70%)] leading-none">{r.mark}</span>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[hsl(35_14%_88%)]">{r.label}</p>
                      <p className="text-xs text-[hsl(35_12%_50%)]">{r.sublabel}</p>
                    </div>
                    <ArrowRight
                      className="ml-auto h-4 w-4 shrink-0 text-[hsl(35_12%_40%)] transition-all group-hover:translate-x-0.5 group-hover:text-[hsl(40_88%_42%)]"
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
              <p className="mt-6 text-center font-mono text-[10px] tracking-widest text-[hsl(35_12%_40%)]">
                DEMO ENVIRONMENT · NO REAL DATA
              </p>
            </div>
          )}

          {/* Credentials step */}
          {step === "credentials" && (
            <div className="animate-fade-up">
              <button
                type="button"
                onClick={() => setStep("role")}
                className="mb-4 flex items-center gap-1.5 text-xs text-[hsl(35_12%_50%)] transition-colors hover:text-[hsl(35_14%_88%)] touch-manipulation"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
                Change role
              </button>

              <div className="rounded-2xl border border-[hsl(0_0%_100%/0.08)] bg-[hsl(0_0%_100%/0.03)] p-7">
                {/* Role badge */}
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(0_0%_100%/0.06)] text-[hsl(35_14%_70%)]">
                    <span className="text-[22px] leading-none">{selectedConfig.mark}</span>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[hsl(35_14%_88%)]">{selectedConfig.label}</p>
                    <p className="text-xs text-[hsl(35_12%_50%)]">{selectedConfig.sublabel}</p>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={submit} className="space-y-4">
                  {rosterForRole.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="persona" className="text-xs text-[hsl(35_12%_55%)]">
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
                            const acct = RETAIL_ACCOUNT_TRADING_NAME_BY_EMAIL[m.email?.toLowerCase() || ""];
                            if (acct) setRetailAccount(acct);
                          }
                        }}
                      >
                        <SelectTrigger id="persona" className="touch-manipulation bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_100%/0.1)] text-[hsl(35_14%_88%)]">
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
                    <Label htmlFor="name" className="text-xs text-[hsl(35_12%_55%)]">Display name</Label>
                    <Input
                      id="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      autoComplete="name"
                      className="touch-manipulation bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_100%/0.1)] text-[hsl(35_14%_88%)] placeholder:text-[hsl(35_12%_40%)]"
                    />
                  </div>

                  {role === "retail" && (
                    <div className="space-y-2">
                      <Label htmlFor="retail-acct" className="text-xs text-[hsl(35_12%_55%)]">Ordering as</Label>
                      <Select value={retailAccount} onValueChange={setRetailAccount}>
                        <SelectTrigger id="retail-acct" className="touch-manipulation bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_100%/0.1)] text-[hsl(35_14%_88%)]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RETAIL_ACCOUNT_OPTIONS.map((name) => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs text-[hsl(35_12%_55%)]">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      className="touch-manipulation bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_100%/0.1)] text-[hsl(35_14%_88%)] placeholder:text-[hsl(35_12%_40%)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs text-[hsl(35_12%_55%)]">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      required
                      className="touch-manipulation bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_100%/0.1)] text-[hsl(35_14%_88%)] placeholder:text-[hsl(35_12%_40%)]"
                    />
                    <div className="flex justify-end">
                      <Link
                        to="/forgot-password"
                        className="text-[11px] text-[hsl(35_12%_50%)] underline-offset-4 hover:text-[hsl(35_14%_88%)] hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 h-12 w-full touch-manipulation text-sm font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-[hsl(40_88%_42%)] hover:bg-[hsl(40_88%_38%)] text-white border-0"
                  >
                    {isLoading ? "Signing in…" : `Continue as ${selectedConfig.label}`}
                  </Button>
                </form>
              </div>

              <p className="mt-4 text-center font-mono text-[10px] text-[hsl(35_12%_40%)]">
                Five portals — one shared dataset. Every change propagates in real time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
