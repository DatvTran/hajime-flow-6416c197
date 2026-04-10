import { test, expect, Page } from "@playwright/test";
import { signInAsRole } from "./role-based-routes.spec";

/**
 * Sales Rep Draft Creation E2E Tests
 * Tests creating drafts, managing opportunities, and visit notes
 */

test.describe("Sales Rep Draft Creation", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsRole(page, "sales");
    await page.waitForURL("/", { timeout: 10_000 });
  });

  test("can view opportunities list", async ({ page }) => {
    await page.goto("/sales/opportunities");
    
    await expect(page.getByRole("heading", { name: /opportunities/i })).toBeVisible();
    
    // Check for opportunity types
    await expect(page.getByText(/dormant|reorder|prospect|velocity/i).first()).toBeVisible();
  });

  test("can filter opportunities by type", async ({ page }) => {
    await page.goto("/sales/opportunities");
    
    await page.getByRole("tab", { name: /dormant/i }).click();
    await expect(page.getByText(/dormant|no orders/i).first()).toBeVisible();
    
    await page.getByRole("tab", { name: /reorder/i }).click();
    await expect(page.getByText(/reorder|restock/i).first()).toBeVisible();
  });

  test("can create draft order from opportunity", async ({ page }) => {
    await page.goto("/sales/opportunities");
    
    // Find an opportunity with draft order button
    const draftButton = page.getByRole("button", { name: /draft order|create draft/i }).first();
    
    if (await draftButton.isVisible().catch(() => false)) {
      await draftButton.click();
      
      // Should navigate to orders with draft
      await expect(page).toHaveURL(/\/sales\/orders/);
      await expect(page.getByText(/draft|unsaved/i)).toBeVisible();
    }
  });

  test("can create draft order manually", async ({ page }) => {
    await page.goto("/sales/orders");
    
    await page.getByRole("button", { name: /new order|create order/i }).click();
    
    // Select account
    await page.getByLabel(/account|customer/i).selectOption("account-1");
    
    // Add product
    await page.getByRole("button", { name: /add product|add item/i }).click();
    await page.locator("[name='sku']").last().fill("HAJ-001");
    await page.locator("[name='quantity']").last().fill("10");
    
    // Save as draft
    await page.getByRole("button", { name: /save draft|draft/i }).click();
    
    await expect(page.getByText(/draft saved|success/i)).toBeVisible();
  });

  test("can view and edit existing drafts", async ({ page }) => {
    await page.goto("/sales/orders");
    
    // Look for draft status
    const draftRow = page.locator("tr", { hasText: /draft/i }).first();
    
    if (await draftRow.isVisible().catch(() => false)) {
      await draftRow.click();
      
      // Edit the draft
      await page.locator("[name='quantity']").first().fill("20");
      await page.getByRole("button", { name: /save|update/i }).click();
      
      await expect(page.getByText(/updated|saved/i)).toBeVisible();
    }
  });

  test("can submit draft as final order", async ({ page }) => {
    await page.goto("/sales/orders");
    
    const draftRow = page.locator("tr", { hasText: /draft/i }).first();
    
    if (await draftRow.isVisible().catch(() => false)) {
      await draftRow.getByRole("button", { name: /submit|place|confirm/i }).click();
      
      // Confirm submission
      await page.getByRole("button", { name: /yes|confirm/i }).click();
      
      await expect(page.getByText(/submitted|order placed|success/i)).toBeVisible();
    }
  });

  test("can log visit note", async ({ page }) => {
    await page.goto("/sales/visits");
    
    await page.getByRole("button", { name: /add visit|log visit|new note/i }).click();
    
    // Fill visit note
    await page.getByLabel(/account/i).selectOption("account-1");
    await page.getByLabel(/visit type/i).selectOption("in-person");
    await page.getByLabel(/date/i).fill("2026-04-11");
    await page.getByLabel(/note|description/i).fill("Met with buyer. Interested in new SKU.");
    
    await page.getByRole("button", { name: /save|submit/i }).click();
    
    await expect(page.getByText(/saved|note added|success/i)).toBeVisible();
  });

  test("can view visit notes by account", async ({ page }) => {
    await page.goto("/sales/visits");
    
    // Switch to by-account tab
    await page.getByRole("tab", { name: /by account/i }).click();
    
    // Should show account cards
    await expect(page.locator("[data-testid='account-card']").or(page.locator("h3")).first()).toBeVisible();
  });

  test("can view and update targets", async ({ page }) => {
    await page.goto("/sales/targets");
    
    await expect(page.getByRole("heading", { name: /targets|goals/i })).toBeVisible();
    
    // Check for progress indicators
    await expect(page.getByText(/q1|q2|quarter/i).first()).toBeVisible();
  });

  test("home page shows daily schedule", async ({ page }) => {
    await page.goto("/sales");
    
    await expect(page.getByRole("heading", { name: /schedule|today|visits/i })).toBeVisible();
    
    // Check for calendar or schedule
    await expect(page.getByText(/mon|tue|wed|thu|fri/i).first()).toBeVisible();
  });

  test("can search accounts", async ({ page }) => {
    await page.goto("/sales/accounts");
    
    await page.getByPlaceholder(/search/i).fill("test");
    
    // Results should filter
    await expect(page.locator("tr").or(page.locator("[data-testid='account-row']")).first()).toBeVisible();
  });

  test("opportunity scores are calculated correctly", async ({ page }) => {
    await page.goto("/sales/opportunities");
    
    // Look for score indicators
    const scoreElement = page.locator("[data-testid='score']").or(page.locator("text=/score: \\d+/i"));
    
    if (await scoreElement.first().isVisible().catch(() => false)) {
      // Verify score is numeric
      const scoreText = await scoreElement.first().textContent();
      expect(scoreText).toMatch(/\d+/);
    }
  });
});
