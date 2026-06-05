/** Scroll offset for sticky sales-rep header + section `scroll-mt-*` alignment. */
const DEFAULT_HEADER_OFFSET = 112;

/**
 * Scroll the sales rep shell's `<main>` pane (not `window`) to a hash target or top.
 * The layout uses an inner scroll container; `scrollIntoView` / native hash jumps often miss it.
 */
export function scrollSalesRepMainToHash(
  hash: string,
  options?: { behavior?: ScrollBehavior; headerOffset?: number },
): boolean {
  const main = document.querySelector<HTMLElement>("[data-sales-rep-scroll]");
  if (!main) return false;

  const behavior = options?.behavior ?? "smooth";
  const headerOffset = options?.headerOffset ?? DEFAULT_HEADER_OFFSET;
  const raw = hash.replace(/^#/, "").trim();

  if (!raw) {
    main.scrollTo({ top: 0, behavior });
    return true;
  }

  const el = document.getElementById(raw);
  if (!el) return false;

  const mainTop = main.getBoundingClientRect().top;
  const elTop = el.getBoundingClientRect().top;
  const target = main.scrollTop + (elTop - mainTop) - headerOffset;
  main.scrollTo({ top: Math.max(0, target), behavior });
  return true;
}

/** Run after layout paint; retries once if the target id is not mounted yet. */
export function scrollSalesRepMainToHashWhenReady(
  hash: string,
  options?: { behavior?: ScrollBehavior; headerOffset?: number },
): () => void {
  let cancelled = false;
  const behavior = options?.behavior ?? "smooth";

  const run = (attempt: number) => {
    if (cancelled) return;
    const ok = scrollSalesRepMainToHash(hash, { ...options, behavior });
    if (!ok && attempt < 4) {
      window.setTimeout(() => run(attempt + 1), attempt === 0 ? 0 : 80 * attempt);
    }
  };

  requestAnimationFrame(() => run(0));

  return () => {
    cancelled = true;
  };
}
