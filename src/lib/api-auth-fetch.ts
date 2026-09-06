const API_URL = import.meta.env.VITE_API_URL || "";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem("hajime_access_token");
  } catch {
    return null;
  }
}

function getRefreshToken(): string | null {
  try {
    return localStorage.getItem("hajime_refresh_token");
  } catch {
    return null;
  }
}

function storeTokens(accessToken: string, refreshToken: string): void {
  try {
    localStorage.setItem("hajime_access_token", accessToken);
    localStorage.setItem("hajime_refresh_token", refreshToken);
  } catch {
    // Ignore storage errors
  }
}

export function clearAuthTokens(): void {
  try {
    localStorage.removeItem("hajime_access_token");
    localStorage.removeItem("hajime_refresh_token");
  } catch {
    // Ignore storage errors
  }
}

/** True when JWT `exp` is missing or within `skewSeconds` of expiry. */
export function isAccessTokenExpiringSoon(token: string | null, skewSeconds = 60): boolean {
  if (!token) return true;
  try {
    const part = token.split(".")[1];
    if (!part) return true;
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
    };
    if (!payload.exp) return true;
    return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
  } catch {
    return true;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

/** Exchange refresh token for a new access token (deduped concurrent calls). */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const beforeAccess = getAuthToken();
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      // Another tab may have already rotated — use a fresher access token if present.
      const current = getAuthToken();
      if (current && current !== beforeAccess && !isAccessTokenExpiringSoon(current, 30)) {
        return current;
      }
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Multi-tab: peer may have rotated the refresh token already.
        const peerAccess = getAuthToken();
        if (peerAccess && peerAccess !== beforeAccess && !isAccessTokenExpiringSoon(peerAccess, 30)) {
          return peerAccess;
        }
        return null;
      }

      const data = (await response.json()) as {
        accessToken?: string;
        refreshToken?: string;
      };
      if (!data.accessToken || !data.refreshToken) return null;

      storeTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      const peerAccess = getAuthToken();
      if (peerAccess && !isAccessTokenExpiringSoon(peerAccess, 30)) return peerAccess;
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Ensure we have a non-expired access token (proactive refresh). */
export async function ensureFreshAccessToken(): Promise<string | null> {
  const current = getAuthToken();
  if (current && !isAccessTokenExpiringSoon(current, 120)) return current;
  if (!getRefreshToken() && current && !isAccessTokenExpiringSoon(current, 0)) return current;
  return (await refreshAccessToken()) || getAuthToken();
}

export function isAuthErrorMessage(message: string): boolean {
  return /invalid or expired token|access token required|session expired|authentication required|token_invalid|token_missing|refresh_invalid|\b401\b/i.test(
    message,
  );
}

/**
 * Authenticated fetch for `/api/v1/*`.
 * Proactively refreshes near-expiry tokens and retries once on 401.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<unknown> {
  const doFetch = async (token: string | null) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };
    return fetch(`${API_URL}${url}`, { ...options, headers });
  };

  let token = await ensureFreshAccessToken();
  let response = await doFetch(token);

  if (response.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      token = newToken;
      response = await doFetch(newToken);
    }
  }

  if (response.status === 401) {
    clearAuthTokens();
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: "Unknown error" }))) as {
      error?: string;
    };
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
