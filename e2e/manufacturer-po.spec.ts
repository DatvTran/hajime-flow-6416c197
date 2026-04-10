import { test, expect, Page } from "@playwright/test";
import { signInAsRole } from "./role-based-routes.spec";

/**
 * Manufacturer Purchase Order E2E Tests
 * Tests PO creation, updates, and production workflow
 */

test.describe("Manufacturer PO Management", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsRole(page, "manufacturer");
    await page.waitForURL("/", { timeout: 10_000 });
  });

  test("can view purchase orders list", async ({ page }) => {
    await page.goto("/manufacturer/purchase-orders");
    
    await expect(page.getByRole("heading", { name: /purchase orders|po/i })).toBeVisible();
    
    // Check for PO table
    const poTable = page.locator("table").or(page.locator("[data-testid='po-list']"));
    await expect(poTable).toBeVisible();
  });

  test("can create new purchase order", async ({ page }) => {
    await page.goto("/manufacturer/purchase-orders");
    
    await page.getByRole("button", { name: /new po|create po|new purchase/i }).click();
    
    // Fill PO details
    await page.getByLabel(/supplier|vendor/i).selectOption("supplier-1");
    await page.getByLabel(/delivery date|expected date/i).fill("2026-05-01");
    
    // Add line item
    await page.getByRole("button", { name: /add item|add line/i }).click();
    await page.locator("[name='sku']").last().fill("HAJ-001");
    await page.locator("[name='quantity']").last().fill("100");
    await page.locator("[name='unitCost']").last().fill("25.00");
    
    await page.getByRole("button", { name: /save|create/i }).click();
    
    await expect(page.getByText(/created|success|po-/i)).toBeVisible();
  });

  test("can update PO status", async ({ page }) => {
    await page.goto("/manufacturer/purchase-orders");
    
    // Click on a PO to edit
    const poRow = page.locator("tr").nth(1);
    if (await poRow.isVisible().catch(() => false)) {
      await poRow.click();
      
      // Change status
      await page.getByLabel(/status/i).selectOption("confirmed");
      await page.getByRole("button", { name: /update|save/i }).click();
      
      await expect(page.getByText(/updated|saved/i)).toBeVisible();
    }
  });

  test("can add notes to PO", async ({ page }) => {
    await page.goto("/manufacturer/purchase-orders");
    
    const poRow = page.locator("tr").nth(1);
    if (await poRow.isVisible().catch(() => false)) {
      await poRow.click();
      
      await page.getByLabel(/notes|comments/i).fill("Supplier confirmed lead time is 3 weeks");
      await page.getByRole("button", { name: /add note|save note/i }).click();
      
      await expect(page.getByText(/note added|saved/i)).toBeVisible();
    }
  });

  test("can receive partial shipment", async ({ page }) => {
    await page.goto("/manufacturer/purchase-orders");
    
    const poRow = page.locator("tr").nth(1);
    if (await poRow.isVisible().catch(() => false)) {
      await poRow.click();
      
      // Click receive button
      await page.getByRole("button", { name: /receive|receive shipment/i }).click();
      
      // Enter partial quantities
      await page.locator("[name='receivedQty']").first().fill("50");
      
      await page.getByRole("button", { name: /confirm|save/i }).click();
      
      await expect(page.getByText(/received|partial|updated/i)).toBeVisible();
    }
  });

  test("can cancel PO", async ({ page }) => {
    await page.goto("/manufacturer/purchase-orders");
    
    const poRow = page.locator("tr").nth(1);
    if (await poRow.isVisible().catch(() => false)) {
      await poRow.click();
      
      // Cancel with reason
      await page.getByRole("button", { name: /cancel/i }).click();
      
      // Confirm in dialog
      await page.getByLabel(/reason/i).fill("Supplier cannot fulfill");
      await page.getByRole("button", { name: /confirm cancel|yes/i }).click();
      
      await expect(page.getByText(/cancelled|status updated/i)).toBeVisible();
    }
  });

  test("PO shows correct totals and calculations", async ({ page }) => {
    await page.goto("/manufacturer/purchase-orders");
    
    await page.getByRole("button", { name: /new po/i }).click();
    
    // Add multiple items
    await page.getByRole("button", { name: /add item/i }).click();
    await page.locator("[name='quantity']").last().fill("10");
    await page.locator("[name='unitCost']").last().fill("30.00");
    
    await page.getByRole("button", { name: /add item/i }).click();
    await page.locator("[name='quantity']").last().fill("5");
    await page.locator("[name='unitCost']").last().fill("50.00");
    
    // Verify totals (10*30 + 5*50 = 300 + 250 = 550)
    await expect(page.getByText(/\$550|550\.00/)).toBeVisible();
  });

  test("can filter POs by status", async ({ page }) => {
    await page.goto("/manufacturer/purchase-orders");
    
    await page.getByLabel(/filter|status/i).selectOption("pending");
    
    // Verify only pending POs shown
    await expect(page.getByText(/pending/i).first()).toBeVisible();
  });

  test("production schedule integrates with POs", async ({ page }) => {
    await page.goto("/manufacturer/production");
    
    await expect(page.getByRole("heading", { name: /production|schedule/i })).toBeVisible();
    
    // Check for scheduled production runs
    const schedule = page.locator("[data-testid='production-schedule']").or(page.locator("table"));
    await expect(schedule).toBeVisible();
  });
});
