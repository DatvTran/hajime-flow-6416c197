import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Crown,
  Factory,
  Truck,
  UserCheck,
  Store,
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

const ROLE_CONFIG: { id: HajimeRole; label: string; sublabel: string; icon: typeof Crown }[] = [
  { id: "brand_operator", label: "Brand Operator", sublabel: "Hajime HQ — command center", icon: Crown },
  { id: "manufacturer", label: "Manufacturer", sublabel: "Production & export", icon: Factory },
  { id: "distributor", label: "Distributor", sublabel: "Warehouse & fulfillment", icon: Truck },
  { id: "sales_rep", label: "Sales Rep", sublabel: "Field accounts & drafts", icon: UserCheck },
  { id: "retail", label: "Retail Store", sublabel: "Order & track deliveries", icon: Store },
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
      await signIn(email.trim(), password.trim());
      navigate(homePathForRole(role), { replace: true });
    } catch {
      // handled by AuthContext
    }
  };

  const selectedConfig = ROLE_CONFIG.find((r) => r.id === role)!;
  const RoleIcon = selectedConfig.icon;

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-4">
      {/* Ambient gradient — warm glow from top */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(var(--accent) / 0.06), transparent)",
        }}
      />
      {/* Noise texture */}
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-[0.025]" />

      {/* Logo */}
      <div className="relative z-10 mb-10 flex flex-col items-center text-center animate-enter">
        <h1 className="sr-only">Hajime</h1>
        <HajimeLogo
          variant="dark"
          className="h-[clamp(7rem,22vw,11rem)] w-auto max-w-[min(85vw,260px)]"
          alt="Hajime logo"
        />
        <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.35em] text-muted-foreground">
          B2B Supply Chain OS
        </p>
      </div>

      {/* Role selection */}
      {step === "role" && (
        <div className="relative z-10 w-full max-w-xl animate-fade-up">
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Choose your role to enter the portal
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            {ROLE_CONFIG.map((r, i) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectRole(r.id)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left",
                    "transition-all duration-300 ease-out",
                    "bg-card/40 border-border/60 hover:bg-card/70 hover:border-border/90",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "animate-enter touch-manipulation",
                  )}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.sublabel}</p>
                  </div>
                  <ArrowRight
                    className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-accent"
                    strokeWidth={1.5}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Credentials */}
      {step === "credentials" && (
        <div className="relative z-10 w-full max-w-md animate-fade-up">
          <button
            type="button"
            onClick={() => setStep("role")}
            className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground touch-manipulation"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Change role
          </button>

          <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm sm:p-8">
            {/* Role badge */}
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <RoleIcon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{selectedConfig.label}</p>
                <p className="text-xs text-muted-foreground">{selectedConfig.sublabel}</p>
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
                  <Label htmlFor="persona" className="text-xs text-muted-foreground">
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
                    <SelectTrigger id="persona" className="touch-manipulation">
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
                <Label htmlFor="name" className="text-xs text-muted-foreground">Display name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                  className="touch-manipulation"
                />
              </div>

              {role === "retail" && (
                <div className="space-y-2">
                  <Label htmlFor="retail-acct" className="text-xs text-muted-foreground">Ordering as</Label>
                  <Select value={retailAccount} onValueChange={setRetailAccount}>
                    <SelectTrigger id="retail-acct" className="touch-manipulation">
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
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="touch-manipulation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  className="touch-manipulation"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="mt-2 h-12 w-full touch-manipulation text-sm font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in…" : `Continue as ${selectedConfig.label}`}
              </Button>
            </form>
          </div>

          <p className="mt-4 text-center text-[10px] text-muted-foreground/60">
            Five portals — one shared dataset. Every change propagates in real time.
          </p>
        </div>
      )}
    </div>
  );
}
