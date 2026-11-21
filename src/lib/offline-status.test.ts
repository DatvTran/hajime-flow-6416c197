import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getOfflineStatus,
  registerOffline,
  resetOfflineStatusForTests,
  retryOfflineDownload,
  subscribeOfflineStatus,
} from "@/lib/offline-status";

class FakeTarget {
  private handlers = new Map<string, Array<() => void>>();
  addEventListener(type: string, fn: () => void) {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), fn]);
  }
  emit(type: string) {
    (this.handlers.get(type) ?? []).forEach((fn) => fn());
  }
}

class FakeWorker extends FakeTarget {
  constructor(public state: ServiceWorkerState) {
    super();
  }
  to(state: ServiceWorkerState) {
    this.state = state;
    this.emit("statechange");
  }
}

class FakeRegistration extends FakeTarget {
  installing: FakeWorker | null = null;
  waiting: FakeWorker | null = null;
  active: FakeWorker | null = null;
  update = vi.fn(async () => {
    this.installing = new FakeWorker("installing");
  });
}

class FakeContainer extends FakeTarget {
  controller: object | null = null;
  constructor(public reg: FakeRegistration | Error) {
    super();
  }
  register = vi.fn(async () => {
    if (this.reg instanceof Error) throw this.reg;
    return this.reg;
  });
  claim() {
    this.controller = {};
    this.emit("controllerchange");
  }
}

const asContainer = (c: FakeContainer) => c as unknown as ServiceWorkerContainer;

beforeEach(() => resetOfflineStatusForTests());

describe("offline status", () => {
  it("is unsupported when the browser has no service worker", async () => {
    await registerOffline(undefined);
    expect(getOfflineStatus()).toBe("unsupported");
  });

  it("goes from downloading to ready when the worker takes control", async () => {
    const reg = new FakeRegistration();
    reg.installing = new FakeWorker("installing");
    const sw = new FakeContainer(reg);
    const seen: string[] = [];
    subscribeOfflineStatus(() => seen.push(getOfflineStatus()));

    await registerOffline(asContainer(sw));
    expect(getOfflineStatus()).toBe("downloading");

    reg.installing.to("installed");
    expect(getOfflineStatus()).toBe("downloading");
    sw.claim();
    expect(getOfflineStatus()).toBe("ready");
    expect(seen).toEqual(["downloading", "ready"]);
  });

  it("is ready straight away when the app is already stored", async () => {
    const reg = new FakeRegistration();
    reg.active = new FakeWorker("activated");
    await registerOffline(asContainer(new FakeContainer(reg)));
    expect(getOfflineStatus()).toBe("ready");
  });

  it("fails when the install doesn't finish, and retry starts it again", async () => {
    const reg = new FakeRegistration();
    const installing = new FakeWorker("installing");
    reg.installing = installing;
    await registerOffline(asContainer(new FakeContainer(reg)));
    // Let the post-register update() microtask finish (it may replace reg.installing).
    await Promise.resolve();

    installing.to("redundant");
    expect(getOfflineStatus()).toBe("failed");

    await retryOfflineDownload();
    expect(reg.update).toHaveBeenCalled();
    expect(getOfflineStatus()).toBe("downloading");
    reg.installing!.to("activated");
    expect(getOfflineStatus()).toBe("ready");
  });

  it("fails when registration is rejected, or is unsupported for a security error", async () => {
    await registerOffline(asContainer(new FakeContainer(new Error("network"))));
    expect(getOfflineStatus()).toBe("failed");

    resetOfflineStatusForTests();
    const denied = Object.assign(new Error("denied"), { name: "SecurityError" });
    await registerOffline(asContainer(new FakeContainer(denied)));
    expect(getOfflineStatus()).toBe("unsupported");
  });

  it("stays ready when a later update fails", async () => {
    const reg = new FakeRegistration();
    reg.active = new FakeWorker("activated");
    const sw = new FakeContainer(reg);
    sw.controller = {};
    await registerOffline(asContainer(sw));

    reg.installing = new FakeWorker("installing");
    reg.emit("updatefound");
    reg.installing.to("redundant");
    expect(getOfflineStatus()).toBe("ready");
  });

  it("reloads when an update takes control of an already-stored app", async () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { reload });
    const reg = new FakeRegistration();
    reg.active = new FakeWorker("activated");
    const sw = new FakeContainer(reg);
    sw.controller = {};
    await registerOffline(asContainer(sw));
    sw.claim();
    expect(reload).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
