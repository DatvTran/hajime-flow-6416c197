import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { homePathForRole, postLoginDestination, type HajimeRole, useAuth } from "@/contexts/AuthContext";
import { accounts as seedAccounts } from "@/data/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TEAM_ROSTER, RETAIL_ACCOUNT_TRADING_NAME_BY_EMAIL } from "@/data/team-roster";
import type { TeamMemberPortalRole } from "@/types/app-data";

const ROLE_LABELS: Record<HajimeRole, string> = {
  brand_operator: "Brand Operator (Hajime HQ)",
  manufacturer: "Manufacturer",
  distributor: "Distributor / Wholesaler",
  retail: "Retail Store / Account",
  sales_rep: "Sales Rep",
};

const ROLE_SELECT_ORDER: HajimeRole[] = [
  "brand_operator",
  "manufacturer",
  "distributor",
  "retail",
  "sales_rep",
];

const RETAIL_ACCOUNT_OPTIONS = seedAccounts
  .filter((a) => ["retail", "restaurant", "bar", "hotel"].includes(a.type) && a.status === "active")
  .map((a) => a.tradingName);

function authRoleToTeamRole(r: HajimeRole): TeamMemberPortalRole | null {
  if (r === "sales_rep" || r === "retail" || r === "distributor" || r === "manufacturer") return r;
  return null;
}

export default function Login() {
  const { user, signIn } = useAuth();
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

  const rosterForRole = useMemo(() => {
    const tr = authRoleToTeamRole(role);
    if (!tr) return [];
    return TEAM_ROSTER.filter((m) => m.role === tr);
  }, [role]);

  if (user) {
    const dest = from && from !== "/login" ? from : homePathForRole(user.role);
    return <Navigate to={dest} replace />;
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pw = password.trim();
    // Commit auth state before navigate, or RequireAuth may still see user=null and bounce back to /login.
    flushSync(() => {
      signIn(email, pw || "demo", role, displayName, role === "retail" ? retailAccount : undefined);
    });
    navigate(postLoginDestination(role, from), { replace: true });
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-sidebar p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary">
          <span className="text-lg font-bold text-sidebar-primary-foreground">H</span>
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-sidebar-foreground">Hajime</h1>
          <p className="text-xs uppercase tracking-widest text-sidebar-foreground/50">B2B Operations App</p>
        </div>
      </div>

      <Card className="w-full max-w-md border-sidebar-border bg-card shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="font-display text-2xl">Sign in</CardTitle>
          <CardDescription>
            One connected platform — five role-based dashboards on shared inventory, orders, and fulfillment. Pick a role to see that view.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(v) => {
                  setRole(v as HajimeRole);
                  setPersonaId("");
                }}
              >
                <SelectTrigger id="role" className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_SELECT_ORDER.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {rosterForRole.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="persona">Demo persona (Team roster)</Label>
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
                  <SelectTrigger id="persona" className="touch-manipulation">
                    <SelectValue placeholder="Choose roster contact…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom (edit fields below)</SelectItem>
                    {rosterForRole.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.displayName} · {m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Same people as Settings → Team — emails match accounts and (for reps) order salesRep names.
                </p>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" className="touch-manipulation" />
            </div>
            {role === "retail" ? (
              <div className="space-y-2">
                <Label htmlFor="retail-acct">Ordering as (account)</Label>
                <Select value={retailAccount} onValueChange={setRetailAccount}>
                  <SelectTrigger id="retail-acct" className="touch-manipulation">
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
                <p className="text-xs text-muted-foreground">Demo: pick which venue&apos;s orders you see.</p>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Optional for demo"
                className="touch-manipulation"
              />
            </div>
            <Button type="submit" className="w-full touch-manipulation">
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
