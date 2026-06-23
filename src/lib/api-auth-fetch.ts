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

let refreshInFlight: Promise<string | null> | null = null;

/** Exchange refresh token for a new access token (deduped concurrent calls). */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return null;

      const data = (await response.json()) as {
        accessToken?: string;
        refreshToken?: string;
      };
      if (!data.accessToken || !data.refreshToken) return null;

      storeTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export function isAuthErrorMessage(message: string): boolean {
  return /invalid or expired token|access token required|session expired|authentication required|token_invalid|token_missing|\b401\b/i.test(
    message,
  );
}

/**
 * Authenticated fetch for `/api/v1/*` mutations.
 * Retries once after refreshing the access token on 401.
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

  let response = await doFetch(getAuthToken());

  if (response.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doFetch(newToken);
    }
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: "Unknown error" }))) as {
      error?: string;
    };
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
