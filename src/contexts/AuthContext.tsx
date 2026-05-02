import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// Use relative URL in production (same origin), or fallback to localhost for dev
const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * App roles (API / DB naming: manufacturer, brand_operator, distributor, retail_account, sales_rep).
 * In this client, `retail` is the canonical key; map to `retail_account` at integration boundaries.
 */
export type HajimeRole =
  | "manufacturer"
  | "brand_operator"
  | "distributor"
  | "retail"
  | "sales_rep"
  | "founder_admin"
  | "sales"
  | "operations"
  | "finance";

const ROLES: HajimeRole[] = [
  "manufacturer",
  "brand_operator",
  "distributor",
  "retail",
  "sales_rep",
  "founder_admin",
  "sales",
  "operations",
  "finance",
];

function isRole(v: unknown): v is HajimeRole {
  return typeof v === "string" && (ROLES as string[]).includes(v);
}

/** Map pre–5-role sessions so users are not logged out on deploy */
function normalizeStoredRole(role: unknown): HajimeRole | null {
  if (isRole(role)) return role;
  if (typeof role !== "string") return null;
  // Legacy mappings for old role names (pre-9-role system)
  const legacy: Record<string, HajimeRole> = {
    founder: "brand_operator",        // Old 'founder' -> brand_operator
  };
  return legacy[role] ?? null;
}

export type HajimeUser = {
  id: string;
  email: string;
  displayName: string;
  role: HajimeRole;
  tenantId: string;
  /** Retail login: which trading name orders belong to (demo ACL). */
  retailAccountTradingName?: string;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthContextValue = {
  user: HajimeUser | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<HajimeUser>;
  signOut: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Token storage
function getStoredTokens(): AuthTokens | null {
  try {
    const accessToken = localStorage.getItem("hajime_access_token");
    const refreshToken = localStorage.getItem("hajime_refresh_token");
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

function storeTokens(tokens: AuthTokens | null) {
  try {
    if (tokens) {
      localStorage.setItem("hajime_access_token", tokens.accessToken);
      localStorage.setItem("hajime_refresh_token", tokens.refreshToken);
    } else {
      localStorage.removeItem("hajime_access_token");
      localStorage.removeItem("hajime_refresh_token");
    }
  } catch {
    // Ignore storage errors
  }
}

// API helper with auth
async function apiFetch(path: string, options: RequestInit = {}) {
  const tokens = getStoredTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (tokens?.accessToken) {
    headers["Authorization"] = `Bearer ${tokens.accessToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired - could implement refresh here
    storeTokens(null);
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<HajimeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const tokens = getStoredTokens();
      if (!tokens) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiFetch("/api/auth/me");
        const userData = await response.json();
        const validatedRole = normalizeStoredRole(userData.role);
        if (!validatedRole) {
          console.error(`[Auth] Invalid role from server: ${userData.role}, defaulting to brand_operator`);
        }
        setUser({
          id: userData.id,
          email: userData.email,
          displayName: userData.displayName,
          role: validatedRole || "brand_operator",
          tenantId: userData.tenantId,
        });
      } catch (err) {
        // Session invalid, clear tokens
        storeTokens(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const ct = response.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error(
          "Login API returned a non-JSON response (often HTML). Use the same origin as the app or set VITE_API_URL to your API base URL when building.",
        );
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Login failed" }));
        throw new Error(error.error || "Invalid email or password");
      }

      const data = await response.json();

      storeTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      const validatedRole = normalizeStoredRole(data.user.role);
      if (!validatedRole) {
        console.error(`[Auth] Invalid role from server: ${data.user.role}, defaulting to brand_operator`);
      }
      const nextUser: HajimeUser = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName,
        role: validatedRole || "brand_operator",
        tenantId: data.user.tenantId,
      };
      setUser(nextUser);
      return nextUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const tokens = getStoredTokens();
    if (tokens?.refreshToken) {
      try {
        // Notify server to revoke refresh token
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      } catch {
        // Ignore logout errors
      }
    }

    // Clear all storage
    storeTokens(null);
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cookies
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.split("=");
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    setUser(null);
    setError(null);
    
    // Hard redirect to login (no history preservation)
    window.location.href = "/login";
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      error,
      signIn,
      signOut,
      clearError,
    }),
    // signOut is stable (useCallback with no deps), omit from deps to reduce noise
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, isLoading, error, signIn, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Get API fetch helper with auth */
export function useApi() {
  return useMemo(
    () => ({
      fetch: apiFetch,
      fetchJson: async (path: string, options?: RequestInit) => {
        const response = await apiFetch(path, options);
        return response.json();
      },
    }),
    [] // apiFetch is a stable module-level function; no reactive deps needed
  );
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
 * Brand Operator: full HQ tower; creates production requests (POs). Manufacturer: executes POs, inventory, shipments — no PO creation in V1 UI.
 * Distributor: fulfillment; read-only production requests (inbound context), no PO authoring or HQ settings. Retail: orders + catalog + tracking, no other accounts.
 * Sales Rep: accounts + drafts + field tools, no manufacturer or PO.
 * Founder Admin: full access to everything.
 */
export function canAccessPath(role: HajimeRole, pathname: string): boolean {
  const p = pathname.split("?")[0];

  if (role === "founder_admin") return true;
  if (role === "brand_operator") return true;

  if (role === "manufacturer") {
    const allowed = (
      pathMatches(p, "/manufacturer") ||
      p === "/purchase-orders" ||
      pathMatches(p, "/purchase-orders") ||
      p === "/inventory" ||
      pathMatches(p, "/inventory") ||
      p === "/shipments" ||
      pathMatches(p, "/shipments") ||
      p === "/alerts" ||
      p === "/finance" ||
      pathMatches(p, "/finance")
    );
    return allowed;
  }

  if (role === "retail") {
    const allowed = (
      p === "/" ||
      pathMatches(p, "/shipments") ||
      pathMatches(p, "/retail") ||
      p === "/alerts"
    );
    return allowed;
  }

  // HQ-only pages: incentives and product development — only brand_operator and operations allowed
  const hqOnlyPaths = ["/incentives", "/product-development"];
  const isHqOnly = hqOnlyPaths.some(base => pathMatches(p, base));

  if (isHqOnly) {
    // Explicit allow-only: brand_operator and operations roles
    if (role !== "brand_operator" && role !== "operations") {
      return false;
    }
  }

  if (role === "distributor") {
    if (
      pathMatches(p, "/settings") ||
      pathMatches(p, "/manufacturer") ||
      pathMatches(p, "/markets") ||
      pathMatches(p, "/global-markets") ||
      pathMatches(p, "/retail") ||
      pathMatches(p, "/sales")
    ) {
      return false;
    }
    return true;
  }

  if (role === "sales_rep" || role === "sales") {
    if (
      pathMatches(p, "/settings") ||
      pathMatches(p, "/manufacturer") ||
      pathMatches(p, "/purchase-orders") ||
      pathMatches(p, "/markets") ||
      pathMatches(p, "/global-markets") ||
      pathMatches(p, "/retail")
    ) {
      return false;
    }
    return true;
  }

  if (role === "finance") {
    // Finance has read access to most areas except settings
    if (pathMatches(p, "/settings")) {
      return false;
    }
    return true;
  }

  if (role === "operations") {
    // Operations has access to everything except settings
    if (pathMatches(p, "/settings")) {
      return false;
    }
    return true;
  }

  return false;
}

export function homePathForRole(role: HajimeRole): string {
  if (role === "manufacturer") return "/manufacturer";
  if (role === "founder_admin") return "/";
  return "/";
}

/** After login, avoid sending users to routes their role cannot open (e.g. manufacturer + `/`). */
export function postLoginDestination(role: HajimeRole, from?: string | null): string {
  const home = homePathForRole(role);
  if (!from || from === "/login") return home;
  if (canAccessPath(role, from)) return from;
  return home;
}
