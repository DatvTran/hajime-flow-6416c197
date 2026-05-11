import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchAppData } from "@/lib/data-service";
import { createProduct } from "@/lib/api-v1-mutations";

describe("API v1 only regression", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads app data using /api/v1/* endpoints only", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await fetchAppData();

    const requestedUrls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(requestedUrls.length).toBeGreaterThan(0);
    expect(requestedUrls.every((url) => url.includes("/api/v1/"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("/api/app"))).toBe(false);
  });

  it("writes using /api/v1/* endpoints only", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "p-1" } }),
    });

    await createProduct({
      sku: "SKU-1",
      name: "Test Product",
      unit_size: "750ml",
      category: "Rum",
      metadata: { caseSize: 12, status: "active" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/v1/products");
    expect(String(url)).not.toContain("/api/app");
  });
});
