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
    expect(requestedUrls).toHaveLength(8);
    expect(requestedUrls.every((url) => url.includes("/api/v1/"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("/api/app"))).toBe(false);
  });

  it("writes using /api/v1/* endpoints only", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "p-1" } }),
    });

    await createProduct({
      name: "Test Product",
      sku: "SKU-1",
      category: "Rum",
      abv: "40",
      caseSize: "12",
      unitPrice: "30",
      bottlesPerCase: "12",
      unit: "750ml",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/v1/products");
    expect(String(url)).not.toContain("/api/app");
  });
});
