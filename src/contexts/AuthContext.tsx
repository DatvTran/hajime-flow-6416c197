import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "hajime-b2b-session";

/**
 * App roles (API / DB naming: manufacturer, brand_operator, distributor, retail_account, sales_rep).
 * In this client, `retail` is the canonical key; map to `retail_account` at integration boundaries.
 */
export type HajimeRole =
  | "manufacturer"
  | "brand_operator"
  | "distributor"
  | "retail"
  | "sales_rep";

const ROLES: HajimeRole[] = ["manufacturer", "brand_operator", "distributor", "retail", "sales_rep"];

function isRole(v: unknown): v is HajimeRole {
  return typeof v === "string" && (ROLES as string[]).includes(v);
}

/** Map pre–5-role sessions so users are not logged out on deploy */
function normalizeStoredRole(role: unknown): HajimeRole | null {
  if (isRole(role)) return role;
  if (typeof role !== "string") return null;
  const legacy: Record<string, HajimeRole> = {
    founder: "brand_operator",
    sales: "sales_rep",
    operations: "distributor",
  };
  return legacy[role] ?? null;
}

export type HajimeUser = {
  email: string;
  displayName: string;
  role: HajimeRole;
  /** Retail login: which trading name orders belong to (demo ACL). */
  retailAccountTradingName?: string;
};

type AuthContextValue = {
  user: HajimeUser | null;
  signIn: (email: string, _password: string, role: HajimeRole, displayName: string, retailAccountTradingName?: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): HajimeUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<HajimeUser>;
    const role = normalizeStoredRole(p.role);
    if (typeof p?.email !== "string" || !role) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const displayName = typeof p.displayName === "string" && p.displayName.trim() ? p.displayName.trim() : p.email;
    const retailAccountTradingName =
      typeof p.retailAccountTradingName === "string" && p.retailAccountTradingName.trim()
        ? p.retailAccountTradingName.trim()
        : undefined;
    const user: HajimeUser = { email: p.email, role, displayName, retailAccountTradingName };
    if (role === "retail" && !user.retailAccountTradingName) {
      user.retailAccountTradingName = "The Drake Hotel";
    }
    if (p.role !== role) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch {
        /* ignore quota */
      }
    }
    return user;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<HajimeUser | null>(() => loadSession());

  const signIn = useCallback(
    (email: string, _password: string, role: HajimeRole, displayName: string, retailAccountTradingName?: string) => {
      const u: HajimeUser = {
        email: email.trim(),
        displayName: displayName.trim() || email.trim(),
        role,
        retailAccountTradingName:
          role === "retail" && retailAccountTradingName?.trim() ? retailAccountTradingName.trim() : undefined,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      setUser(u);
    },
    [],
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Trading name used to filter retail orders (demo). */
export function useRetailAccountTradingName(): string {
  const { user } = useAuth();
  if (user?.role !== "retail") return "";
  return user.retailAccountTradingName ?? "The Drake Hotel";
}

function pathMatches(pathname: string, base: string): boolean {
  const p = pathname.split("?")[0];
  return p === base || p.startsWith(`${base}/`);
}

/**
 * Role permissions — same AppData, different surfaces (spec §6).
 * Brand Operator: full HQ tower. Manufacturer: production + aggregated demand, no retailer pricing detail on alerts.
 * Distributor: fulfillment, no PO authoring or HQ settings. Retail: orders + catalog + tracking, no other accounts.
 * Sales Rep: accounts + drafts + field tools, no manufacturer or PO.
 */
export function canAccessPath(role: HajimeRole, pathname: string): boolean {
  const p = pathname.split("?")[0];

  if (role === "brand_operator") return true;

  if (role === "manufacturer") {
    return (
      pathMatches(p, "/manufacturer") ||
      p === "/purchase-orders" ||
      pathMatches(p, "/purchase-orders") ||
      p === "/inventory" ||
      pathMatches(p, "/inventory") ||
      p === "/shipments" ||
      pathMatches(p, "/shipments") ||
      p === "/alerts"
    );
  }

  if (role === "retail") {
    return (
      p === "/" ||
      pathMatches(p, "/shipments") ||
      pathMatches(p, "/retail") ||
      p === "/alerts"
    );
  }

  if (role === "distributor") {
    if (pathMatches(p, "/settings") || pathMatches(p, "/manufacturer") || pathMatches(p, "/purchase-orders") || pathMatches(p, "/markets") || pathMatches(p, "/retail") || pathMatches(p, "/sales")) {
      return false;
    }
    return true;
  }

  if (role === "sales_rep") {
    if (pathMatches(p, "/settings") || pathMatches(p, "/manufacturer") || pathMatches(p, "/purchase-orders") || pathMatches(p, "/markets") || pathMatches(p, "/retail")) {
      return false;
    }
    return true;
  }

  return false;
}

export function homePathForRole(role: HajimeRole): string {
  return role === "manufacturer" ? "/manufacturer" : "/";
}

/** After login, avoid sending users to routes their role cannot open (e.g. manufacturer + `/`). */
export function postLoginDestination(role: HajimeRole, from?: string | null): string {
  const home = homePathForRole(role);
  if (!from || from === "/login") return home;
  if (canAccessPath(role, from)) return from;
  return home;
}
