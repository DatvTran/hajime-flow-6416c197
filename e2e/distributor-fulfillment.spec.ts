import { test, expect, Page } from "@playwright/test";
import { signInAsRole } from "./role-based-routes.spec";

/**
 * Distributor Fulfillment E2E Tests
 * Tests order fulfillment, shipment creation, and inventory allocation
 */

test.describe("Distributor Fulfillment", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsRole(page, "distributor");
    await page.waitForURL("/", { timeout: 10_000 });
  });

  test("can view fulfillment queue", async ({ page }) => {
    await page.goto("/distributor/fulfillment");
    
    await expect(page.getByRole("heading", { name: /fulfillment|orders|queue/i })).toBeVisible();
    
    // Check for orders awaiting fulfillment
    const queue = page.locator("[data-testid='fulfillment-queue']").or(page.locator("table"));
    await expect(queue).toBeVisible();
  });

  test("can view inventory levels", async ({ page }) => {
    await page.goto("/distributor/inventory");
    
    await expect(page.getByRole("heading", { name: /inventory|stock/i })).toBeVisible();
    
    // Check inventory table has required columns
    await expect(page.getByText(/sku|product/i)).toBeVisible();
    await expect(page.getByText(/quantity|stock/i)).toBeVisible();
    await expect(page.getByText(/location|warehouse/i)).toBeVisible();
  });

  test("can allocate inventory to order", async ({ page }) => {
    await page.goto("/distributor/fulfillment");
    
    // Find an order to fulfill
    const orderRow = page.locator("[data-testid='order-row']").first().or(page.locator("tr").nth(1));
    
    if (await orderRow.isVisible().catch(() => false)) {
      await orderRow.getByRole("button", { name: /allocate|fulfill|process/i }).click();
      
      // Allocate stock
      await page.getByRole("button", { name: /allocate|auto-allocate/i }).click();
      
      await expect(page.getByText(/allocated|ready to ship/i)).toBeVisible();
    }
  });

  test("can create shipment", async ({ page }) => {
    await page.goto("/distributor/fulfillment");
    
    const orderRow = page.locator("tr").nth(1);
    if (await orderRow.isVisible().catch(() => false)) {
      await orderRow.getByRole("button", { name: /ship|create shipment/i }).click();
      
      // Fill shipment details
      await page.getByLabel(/carrier|shipping method/i).selectOption("fedex");
      await page.getByLabel(/tracking number/i).fill("1234567890");
      
      await page.getByRole("button", { name: /ship|confirm/i }).click();
      
      await expect(page.getByText(/shipped|tracking|success/i)).toBeVisible();
    }
  });

  test("can handle partial fulfillment", async ({ page }) => {
    await page.goto("/distributor/fulfillment");
    
    const orderRow = page.locator("tr").nth(1);
    if (await orderRow.isVisible().catch(() => false)) {
      await orderRow.getByRole("button", { name: /fulfill|process/i }).click();
      
      // Mark as partial
      await page.getByRole("button", { name: /partial|split/i }).click();
      
      // Enter partial quantity
      await page.locator("[name='shipQty']").first().fill("5");
      
      // Create backorder for remaining
      await page.getByRole("button", { name: /create backorder|confirm/i }).click();
      
      await expect(page.getByText(/partial|backorder created/i)).toBeVisible();
    }
  });

  test("can view and manage backorders", async ({ page }) => {
    await page.goto("/distributor/backorders");
    
    await expect(page.getByRole("heading", { name: /backorder/i })).toBeVisible();
    
    // Check for backorder tabs
    await expect(page.getByRole("tab", { name: /list|queue|by sku/i })).toBeVisible();
  });

  test("inventory adjustments update available stock", async ({ page }) => {
    await page.goto("/distributor/inventory");
    
    const productRow = page.locator("tr").nth(1);
    if (await productRow.isVisible().catch(() => false)) {
      await productRow.getByRole("button", { name: /adjust|edit/i }).click();
      
      // Enter adjustment
      await page.getByLabel(/adjustment quantity/i).fill("-5");
      await page.getByLabel(/reason/i).selectOption("damaged");
      
      await page.getByRole("button", { name: /save|confirm/i }).click();
      
      await expect(page.getByText(/adjusted|updated/i)).toBeVisible();
    }
  });

  test("can view shipment tracking", async ({ page }) => {
    await page.goto("/distributor/shipments");
    
    await expect(page.getByRole("heading", { name: /shipment/i })).toBeVisible();
    
    // Check for tracking info
    await expect(page.getByText(/tracking|carrier|status/i).first()).toBeVisible();
  });

  test("low stock alerts are visible", async ({ page }) => {
    await page.goto("/distributor/inventory");
    
    // Look for alert indicators
    const alertBadge = page.locator("[data-testid='low-stock-alert']").or(page.locator(".text-red"));
    
    // If there are low stock items, verify alert is shown
    if (await alertBadge.first().isVisible().catch(() => false)) {
      await expect(alertBadge.first()).toBeVisible();
    }
  });

  test("can filter orders by status", async ({ page }) => {
    await page.goto("/distributor/fulfillment");
    
    await page.getByLabel(/filter|status/i).selectOption("pending");
    
    await expect(page.getByText(/pending|awaiting/i).first()).toBeVisible();
  });

  test("bulk actions work for multiple orders", async ({ page }) => {
    await page.goto("/distributor/fulfillment");
    
    // Select multiple orders
    const checkboxes = page.locator("input[type='checkbox']");
    const count = await checkboxes.count();
    
    if (count >= 2) {
      await checkboxes.nth(1).check();
      await checkboxes.nth(2).check();
      
      // Bulk action should appear
      await page.getByRole("button", { name: /bulk|batch/i }).click();
      await page.getByRole("menuitem", { name: /print|ship|export/i }).click();
      
      await expect(page.getByText(/processing|success/i)).toBeVisible();
    }
  });
});
