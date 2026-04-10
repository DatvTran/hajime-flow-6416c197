import { test, expect, Page } from "@playwright/test";

/**
 * Authentication helpers for different roles
 */
export async function signInAsRole(page: Page, role: "brand" | "retail" | "distributor" | "manufacturer" | "sales"): Promise<void> {
  await page.goto("/login");
  
  const roleLabels: Record<string, string> = {
    brand: "Brand Operator",
    retail: "Retail Buyer",
    distributor: "Distributor",
    manufacturer: "Manufacturer",
    sales: "Sales Rep",
  };

  await page.getByRole("button", { name: new RegExp(roleLabels[role], "i") }).click();
  await page.getByRole("button", { name: new RegExp(`Continue as ${roleLabels[role]}`, "i") }).click();
}

export async function signInWithCredentials(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

/**
 * Role-Based Route Blocking Tests
 * Ensures users can only access routes permitted for their role
 */
test.describe("Role-Based Route Blocking", () => {
  test("retail user cannot access manufacturer routes", async ({ page }) => {
    await signInAsRole(page, "retail");
    await page.waitForURL("/", { timeout: 10_000 });
    
    // Try to access manufacturer-only routes
    await page.goto("/manufacturer/purchase-orders");
    await expect(page.getByText(/not authorized|access denied|404/i)).toBeVisible({ timeout: 5_000 });
    
    await page.goto("/manufacturer/production");
    await expect(page.getByText(/not authorized|access denied|404/i)).toBeVisible({ timeout: 5_000 });
  });

  test("retail user cannot access distributor routes", async ({ page }) => {
    await signInAsRole(page, "retail");
    await page.waitForURL("/", { timeout: 10_000 });
    
    await page.goto("/distributor/fulfillment");
    await expect(page.getByText(/not authorized|access denied|404/i)).toBeVisible({ timeout: 5_000 });
  });

  test("manufacturer user cannot access retail routes", async ({ page }) => {
    await signInAsRole(page, "manufacturer");
    await page.waitForURL("/", { timeout: 10_000 });
    
    await page.goto("/retail/new-order");
    await expect(page.getByText(/not authorized|access denied|404/i)).toBeVisible({ timeout: 5_000 });
  });

  test("distributor user cannot access sales rep routes", async ({ page }) => {
    await signInAsRole(page, "distributor");
    await page.waitForURL("/", { timeout: 10_000 });
    
    await page.goto("/sales/opportunities");
    await expect(page.getByText(/not authorized|access denied|404/i)).toBeVisible({ timeout: 5_000 });
    
    await page.goto("/sales/visits");
    await expect(page.getByText(/not authorized|access denied|404/i)).toBeVisible({ timeout: 5_000 });
  });

  test("sales rep user cannot access brand operator routes", async ({ page }) => {
    await signInAsRole(page, "sales");
    await page.waitForURL("/", { timeout: 10_000 });
    
    await page.goto("/users");
    await expect(page.getByText(/not authorized|access denied|404/i)).toBeVisible({ timeout: 5_000 });
    
    await page.goto("/settings/tenants");
    await expect(page.getByText(/not authorized|access denied|404/i)).toBeVisible({ timeout: 5_000 });
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/login/);
    
    await page.goto("/retail/account");
    await expect(page).toHaveURL(/\/login/);
    
    await page.goto("/sales/targets");
    await expect(page).toHaveURL(/\/login/);
  });

  test("retail user can access permitted routes", async ({ page }) => {
    await signInAsRole(page, "retail");
    await page.waitForURL("/", { timeout: 10_000 });
    
    // These should all work without 403/404
    await page.goto("/retail/new-order");
    await expect(page.getByRole("heading", { name: /new order|place order/i })).toBeVisible({ timeout: 5_000 });
    
    await page.goto("/retail/orders");
    await expect(page.getByRole("heading", { name: /orders|order history/i })).toBeVisible({ timeout: 5_000 });
    
    await page.goto("/retail/account");
    await expect(page.getByRole("heading", { name: /account|profile/i })).toBeVisible({ timeout: 5_000 });
    
    await page.goto("/retail/support");
    await expect(page.getByRole("heading", { name: /support|help/i })).toBeVisible({ timeout: 5_000 });
  });

  test("sales rep can access all sales routes", async ({ page }) => {
    await signInAsRole(page, "sales");
    await page.waitForURL("/", { timeout: 10_000 });
    
    await page.goto("/sales/opportunities");
    await expect(page.getByRole("heading", { name: /opportunities/i })).toBeVisible({ timeout: 5_000 });
    
    await page.goto("/sales/visits");
    await expect(page.getByRole("heading", { name: /visit notes/i })).toBeVisible({ timeout: 5_000 });
    
    await page.goto("/sales/targets");
    await expect(page.getByRole("heading", { name: /targets|goals/i })).toBeVisible({ timeout: 5_000 });
  });
});
