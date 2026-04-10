import { test, expect, Page } from "@playwright/test";
import { signInAsRole } from "./role-based-routes.spec";

/**
 * Retail Ordering Flow E2E Tests
 * Tests the complete retail buyer journey from browsing to order submission
 */

test.describe("Retail Ordering Flow", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsRole(page, "retail");
    await page.waitForURL("/", { timeout: 10_000 });
  });

  test("retail user can navigate to new order page", async ({ page }) => {
    await page.goto("/retail/new-order");
    
    await expect(page.getByRole("heading", { name: /new order|place order/i })).toBeVisible();
    await expect(page.getByText(/product|catalog|sku/i)).toBeVisible();
  });

  test("can add products to cart", async ({ page }) => {
    await page.goto("/retail/new-order");
    
    // Find a product and add quantity
    const productRow = page.locator("[data-testid='product-row']").first();
    await expect(productRow).toBeVisible();
    
    // Clear and enter quantity
    const quantityInput = productRow.locator("input[type='number']");
    await quantityInput.fill("5");
    
    // Add to cart
    await productRow.locator("button", { hasText: /add|cart/i }).click();
    
    // Verify cart shows item
    await expect(page.getByText(/cart|items|5/i)).toBeVisible();
  });

  test("can complete full checkout flow", async ({ page }) => {
    await page.goto("/retail/new-order");
    
    // Add a product
    const productRow = page.locator("[data-testid='product-row']").first();
    await productRow.locator("input[type='number']").fill("3");
    await productRow.locator("button", { hasText: /add|cart/i }).click();
    
    // Go to checkout
    await page.getByRole("button", { name: /checkout|review order/i }).click();
    
    // Review page
    await expect(page.getByRole("heading", { name: /review|checkout/i })).toBeVisible();
    await expect(page.getByText(/subtotal|total|3/i)).toBeVisible();
    
    // Select delivery option
    await page.getByLabel(/delivery|shipping/i).selectOption("standard");
    
    // Add notes
    await page.getByLabel(/notes|comments/i).fill("Please deliver after 2 PM");
    
    // Submit order
    await page.getByRole("button", { name: /place order|submit/i }).click();
    
    // Verify success
    await expect(page.getByText(/success|confirmed|order placed/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/order number|order #/i)).toBeVisible();
  });

  test("can view order history", async ({ page }) => {
    await page.goto("/retail/orders");
    
    await expect(page.getByRole("heading", { name: /orders|order history/i })).toBeVisible();
    
    // Check for order table or list
    const ordersList = page.locator("[data-testid='orders-list']").or(page.locator("table"));
    await expect(ordersList).toBeVisible();
  });

  test("can view order details", async ({ page }) => {
    await page.goto("/retail/orders");
    
    // Click first order
    const firstOrder = page.locator("[data-testid='order-row']").first().or(page.locator("tr").nth(1));
    if (await firstOrder.isVisible().catch(() => false)) {
      await firstOrder.click();
      
      // Verify detail view
      await expect(page.getByRole("heading", { name: /order details|order #/i })).toBeVisible();
      await expect(page.getByText(/status|items|total/i)).toBeVisible();
    }
  });

  test("can reorder from history", async ({ page }) => {
    await page.goto("/retail/orders");
    
    // Find reorder button on an order
    const reorderButton = page.getByRole("button", { name: /reorder/i }).first();
    if (await reorderButton.isVisible().catch(() => false)) {
      await reorderButton.click();
      
      // Should go to new order page with items pre-filled
      await expect(page).toHaveURL(/\/retail\/new-order/);
      await expect(page.getByText(/items added|cart updated/i)).toBeVisible();
    }
  });

  test("validates minimum order quantity", async ({ page }) => {
    await page.goto("/retail/new-order");
    
    const productRow = page.locator("[data-testid='product-row']").first();
    const quantityInput = productRow.locator("input[type='number']");
    
    // Try to add 0 quantity
    await quantityInput.fill("0");
    await productRow.locator("button", { hasText: /add|cart/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/minimum|invalid|greater than 0/i)).toBeVisible();
  });

  test("can save and manage account info", async ({ page }) => {
    await page.goto("/retail/account");
    
    await expect(page.getByRole("heading", { name: /account|profile/i })).toBeVisible();
    
    // Check for editable fields
    await expect(page.getByLabel(/business name|company/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();
    
    // Update a field
    const businessName = page.getByLabel(/business name|company/i);
    await businessName.fill("Test Retail Store");
    
    await page.getByRole("button", { name: /save|update/i }).click();
    
    await expect(page.getByText(/saved|updated|success/i)).toBeVisible();
  });

  test("can access support and create ticket", async ({ page }) => {
    await page.goto("/retail/support");
    
    await expect(page.getByRole("heading", { name: /support|help/i })).toBeVisible();
    
    // Create new ticket
    await page.getByRole("button", { name: /new ticket|create ticket/i }).click();
    
    await page.getByLabel(/subject/i).fill("Missing item in delivery");
    await page.getByLabel(/category/i).selectOption("delivery");
    await page.getByLabel(/description|message/i).fill("Order #123 was missing 2 bottles");
    
    await page.getByRole("button", { name: /submit|send/i }).click();
    
    await expect(page.getByText(/ticket created|submitted|success/i)).toBeVisible();
  });
});
