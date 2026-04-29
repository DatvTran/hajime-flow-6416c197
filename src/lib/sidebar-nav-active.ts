import { matchPath } from "react-router-dom";

/** Path segment of a nav URL (drops ?query). */
export function pathnameOnly(url: string): string {
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}

export function searchOnly(url: string): string {
  const i = url.indexOf("?");
  return i === -1 ? "" : url.slice(i);
}

/** Canonical query string for comparing tabbed routes. */
export function normalizeSearch(raw: string): string {
  if (!raw || raw === "?") return "";
  const q = raw.startsWith("?") ? raw.slice(1) : raw;
  if (!q) return "";
  const params = new URLSearchParams(q);
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const next = new URLSearchParams(sorted);
  const str = next.toString();
  return str ? `?${str}` : "";
}

/**
 * NavLink `end`: use exact pathname match when another nav item lives under this path
 * (e.g. /manufacturer vs /manufacturer/profile). Root "/" is always end-only.
 */
export function navPathEndFlag(itemUrl: string, allItemUrls: readonly string[]): boolean {
  const base = pathnameOnly(itemUrl);
  if (base === "/") return true;
  return allItemUrls.some((u) => {
    const p = pathnameOnly(u);
    return p !== base && p.startsWith(`${base}/`);
  });
}

/** Mirrors retail NavLink behavior: pathname via matchPath; optional ?query must match when present on the item. */
export function isSidebarNavItemActive(
  itemUrl: string,
  pathname: string,
  search: string,
  end: boolean,
): boolean {
  const itemPath = pathnameOnly(itemUrl);
  const queryPart = searchOnly(itemUrl);
  const itemSearchNorm = queryPart ? normalizeSearch(queryPart) : "";

  const match = matchPath({ path: itemPath, end }, pathname);
  if (!match) return false;
  if (!itemSearchNorm) return true;
  return normalizeSearch(search || "") === itemSearchNorm;
}
