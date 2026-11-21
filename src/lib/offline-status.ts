export type OfflineStatus = "checking" | "unsupported" | "downloading" | "failed" | "ready";

type Container = Pick<ServiceWorkerContainer, "controller" | "register" | "addEventListener">;

let status: OfflineStatus = "checking";
let registration: ServiceWorkerRegistration | null = null;
let container: Container | null = null;
const listeners = new Set<() => void>();

function set(next: OfflineStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach((fn) => fn());
}

export function getOfflineStatus(): OfflineStatus {
  return status;
}

export function subscribeOfflineStatus(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function watch(worker: ServiceWorker | null) {
  if (!worker) return;
  const check = () => {
    if (container?.controller || worker.state === "activated") set("ready");
    else if (worker.state === "redundant") set("failed");
  };
  worker.addEventListener("statechange", check);
  check();
}

function track(reg: ServiceWorkerRegistration) {
  registration = reg;
  reg.addEventListener("updatefound", () => watch(reg.installing));
  if (container?.controller || reg.active?.state === "activated") return set("ready");
  set("downloading");
  watch(reg.installing);
  watch(reg.waiting);
  watch(reg.active);
}

/** Registers the service worker that stores the app for offline use and tracks how far it got. */
export async function registerOffline(
  sw: Container | undefined = typeof navigator !== "undefined" ? navigator.serviceWorker : undefined,
): Promise<void> {
  if (!sw) return set("unsupported");
  container = sw;
  // If a worker already controls this page, a later controllerchange means an update took over —
  // reload so we don't keep running the previous JS bundle (e.g. after a deploy).
  const hadController = Boolean(sw.controller);
  if (hadController) set("ready");
  sw.addEventListener("controllerchange", () => {
    if (sw.controller) set("ready");
    if (hadController && typeof location !== "undefined") location.reload();
  });
  try {
    const reg = await sw.register("/sw.js");
    track(reg);
    // Pull a fresh worker after deploys so Home Screen / offline installs don't keep old JS.
    void reg.update().catch(() => {});
  } catch (err) {
    console.warn("[sw] register failed:", err);
    set(err instanceof Error && err.name === "SecurityError" ? "unsupported" : "failed");
  }
}

/** Retries the offline download; reloads the page when there's no registration to retry. */
export async function retryOfflineDownload(): Promise<void> {
  if (!registration) {
    if (container) return registerOffline(container);
    return location.reload();
  }
  set("downloading");
  try {
    await registration.update();
    watch(registration.installing);
    if (!registration.installing && !container?.controller) location.reload();
  } catch {
    set("failed");
  }
}

export function resetOfflineStatusForTests() {
  status = "checking";
  registration = null;
  container = null;
  listeners.clear();
}
