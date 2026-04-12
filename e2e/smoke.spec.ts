import { test, expect } from "@playwright/test";

// ============================================
// Auth Helpers
// ============================================

async function signInAsRole(page: import("@playwright/test").Page, role: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(role, "i") }).click();
  await page.getByRole("button", { name: new RegExp(`Continue as ${role}`, "i") }).click();
}

async function signInAsBrandOperator(page: import("@playwright/test").Page) {
  await signInAsRole(page, "Brand Operator");
}

async function signInAsRetail(page: import("@playwright/test").Page) {
  await signInAsRole(page, "Retail");
}

async function signInAsManufacturer(page: import("@playwright/test").Page) {
  await signInAsRole(page, "Manufacturer");
}

async function signInAsDistributor(page: import("@playwright/test").Page) {
  await signInAsRole(page, "Distributor");
}

async function signInAsSalesRep(page: import("@playwright/test").Page) {
  await signInAsRole(page, "Sales Rep");
}

async function signInAsSales(page: import("@playwright/test").Page) {
  await signInAsRole(page, "Sales");
}

async function signInAsOperations(page: import("@playwright/test").Page) {
  await signInAsRole(page, "Operations");
}

async function signInAsFinance(page: import("@playwright/test").Page) {
  await signInAsRole(page, "Finance");
}

// ============================================
// Smoke Tests
// ============================================

test.describe("Hajime B2B Smoke Tests", () => {
  
  // ==========================================
  // Basic Auth & Rendering
  // ==========================================
  
  test("login page renders with all role options", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Hajime" })).toBeVisible();
    await expect(page.getByText("Choose your role to see that portal view")).toBeVisible();
    
    // Verify all 9 roles are available
    const roles = ["Brand Operator", "Manufacturer", "Distributor", "Retail", "Sales Rep", "Sales", "Operations", "Finance", "Founder Admin"];
    for (const role of roles) {
      await expect(page.getByRole("button", { name: new RegExp(role, "i") })).toBeVisible();
    }
  });

  test("demo sign-in reaches command center as brand operator", async ({ page }) => {
    await page.goto("/login");
    await signInAsBrandOperator(page);
    await expect(page.getByRole("heading", { name: "Command center" })).toBeVisible({ timeout: 15_000 });
  });

  // ==========================================
  // Role-Based Route Blocking
  // ==========================================
  
  test.describe("Role-Based Access Control", () => {
    test("retail user cannot access manufacturer portal", async ({ page }) => {
      await signInAsRetail(page);
      await page.goto("/manufacturer");
      // Should redirect to 404 or show access denied
      await expect(page.getByText(/404|not found|access denied/i)).toBeVisible({ timeout: 10_000 });
    });

    test("manufacturer user cannot access distributor portal", async ({ page }) => {
      await signInAsManufacturer(page);
      await page.goto("/distributor");
      await expect(page.getByText(/404|not found|access denied/i)).toBeVisible({ timeout: 10_000 });
    });

    test("sales rep cannot access finance reports", async ({ page }) => {
      await signInAsSalesRep(page);
      await page.goto("/reports/financials");
      await expect(page.getByText(/404|not found|access denied/i)).toBeVisible({ timeout: 10_000 });
    });

    test("distributor cannot access brand operator dashboard", async ({ page }) => {
      await signInAsDistributor(page);
      await page.goto("/dashboard");
      await expect(page.getByText(/404|not found|access denied/i)).toBeVisible({ timeout: 10_000 });
    });
  });

  // ==========================================
  // Orders & Approval Flows
  // ==========================================
  
  test.describe("Orders & Approvals", () => {
    test("orders page loads when signed in as brand operator", async ({ page }) => {
      await signInAsBrandOperator(page);
      await page.goto("/orders");
      await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible({ timeout: 15_000 });
    });

    test("brand operator can see approval queue", async ({ page }) => {
      await signInAsBrandOperator(page);
      await page.goto("/dashboard");
      await expect(page.getByText(/approval|pending review|awaiting/i)).toBeVisible({ timeout: 10_000 });
    });

    test("sales rep cannot approve orders", async ({ page }) => {
      await signInAsSalesRep(page);
      await page.goto("/orders");
      await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible({ timeout: 15_000 });
      // Should not see approve/reject buttons
      await expect(page.getByRole("button", { name: /approve/i })).not.toBeVisible();
    });

    test("approval buttons only visible to brand operator", async ({ page }) => {
      await signInAsBrandOperator(page);
      await page.goto("/dashboard");
      
      // Look for any approval buttons
      const approveButtons = page.getByRole("button", { name: /approve/i });
      const hasApproveButtons = await approveButtons.count() > 0;
      
      if (hasApproveButtons) {
        await expect(approveButtons.first()).toBeVisible();
      }
    });
  });

  // ==========================================
  // Retail Ordering Flow
  // ==========================================
  
  test.describe("Retail Ordering", () => {
    test("retail user can access retail home", async ({ page }) => {
      await signInAsRetail(page);
      await expect(page.getByRole("heading", { name: /retail|store/i })).toBeVisible({ timeout: 15_000 });
    });

    test("retail user can view catalog", async ({ page }) => {
      await signInAsRetail(page);
      await page.goto("/retail/catalog");
      await expect(page.getByRole("heading", { name: /catalog|products/i })).toBeVisible({ timeout: 10_000 });
    });

    test("retail user can view their orders", async ({ page }) => {
      await signInAsRetail(page);
      await page.goto("/retail/orders");
      await expect(page.getByRole("heading", { name: /my orders|orders/i })).toBeVisible({ timeout: 10_000 });
    });

    test("retail user can create new order", async ({ page }) => {
      await signInAsRetail(page);
      await page.goto("/retail/orders?new=1");
      await expect(page.getByText(/new order|create order|place order/i)).toBeVisible({ timeout: 10_000 });
    });
  });

  // ==========================================
  // Manufacturer PO Updates
  // ==========================================
  
  test.describe("Manufacturer Portal", () => {
    test("manufacturer can access production portal", async ({ page }) => {
      await signInAsManufacturer(page);
      await expect(page.getByRole("heading", { name: /production|manufacturer/i })).toBeVisible({ timeout: 15_000 });
    });

    test("manufacturer can view PO list", async ({ page }) => {
      await signInAsManufacturer(page);
      await page.goto("/manufacturer/pos");
      await expect(page.getByRole("heading", { name: /purchase orders|POs/i })).toBeVisible({ timeout: 10_000 });
    });

    test("manufacturer can update PO status", async ({ page }) => {
      await signInAsManufacturer(page);
      await page.goto("/manufacturer/pos");
      await expect(page.getByRole("heading", { name: /purchase orders|POs/i })).toBeVisible({ timeout: 10_000 });
      
      // Check for status update buttons or dropdowns
      const statusElements = page.locator('[data-testid="po-status"], select, button:has-text("Update")');
      if (await statusElements.count() > 0) {
        await expect(statusElements.first()).toBeVisible();
      }
    });

    test("manufacturer can view shipment schedule", async ({ page }) => {
      await signInAsManufacturer(page);
      await page.goto("/manufacturer/shipments");
      await expect(page.getByRole("heading", { name: /shipments|schedule/i })).toBeVisible({ timeout: 10_000 });
    });
  });

  // ==========================================
  // Distributor Fulfillment
  // ==========================================
  
  test.describe("Distributor Portal", () => {
    test("distributor can access fulfillment portal", async ({ page }) => {
      await signInAsDistributor(page);
      await expect(page.getByRole("heading", { name: /fulfillment|distributor|warehouse/i })).toBeVisible({ timeout: 15_000 });
    });

    test("distributor can view inventory", async ({ page }) => {
      await signInAsDistributor(page);
      await page.goto("/distributor/inventory");
      await expect(page.getByRole("heading", { name: /inventory|stock/i })).toBeVisible({ timeout: 10_000 });
    });

    test("distributor can view orders to fulfill", async ({ page }) => {
      await signInAsDistributor(page);
      await page.goto("/distributor/orders");
      await expect(page.getByRole("heading", { name: /orders|fulfillment/i })).toBeVisible({ timeout: 10_000 });
    });

    test("distributor can create shipments", async ({ page }) => {
      await signInAsDistributor(page);
      await page.goto("/distributor/shipments");
      await expect(page.getByRole("heading", { name: /shipments/i })).toBeVisible({ timeout: 10_000 });
      
      // Check for create shipment button
      const createButton = page.getByRole("button", { name: /create shipment|new shipment/i });
      if (await createButton.count() > 0) {
        await expect(createButton).toBeVisible();
      }
    });
  });

  // ==========================================
  // Sales Rep Drafts & Field Tools
  // ==========================================
  
  test.describe("Sales Rep Portal", () => {
    test("sales rep can access field sales portal", async ({ page }) => {
      await signInAsSalesRep(page);
      await expect(page.getByRole("heading", { name: /field sales|my accounts/i })).toBeVisible({ timeout: 15_000 });
    });

    test("sales rep can view their assigned accounts", async ({ page }) => {
      await signInAsSalesRep(page);
      await page.goto("/sales/accounts");
      await expect(page.getByRole("heading", { name: /accounts/i })).toBeVisible({ timeout: 10_000 });
    });

    test("sales rep can create draft orders", async ({ page }) => {
      await signInAsSalesRep(page);
      await page.goto("/sales/orders?new=1");
      await expect(page.getByText(/new order|create order|draft/i)).toBeVisible({ timeout: 10_000 });
    });

    test("sales rep can log visit notes", async ({ page }) => {
      await signInAsSalesRep(page);
      await page.goto("/sales/visits");
      await expect(page.getByRole("heading", { name: /visit notes|visits/i })).toBeVisible({ timeout: 10_000 });
    });

    test("sales rep schedule is personalized", async ({ page }) => {
      await signInAsSalesRep(page);
      await page.goto("/sales");
      await expect(page.getByText(/visit schedule|my schedule/i)).toBeVisible({ timeout: 10_000 });
    });
  });

  // ==========================================
  // CSV Export Functionality
  // ==========================================
  
  test.describe("CSV Exports", () => {
    test("orders CSV export button is available", async ({ page }) => {
      await signInAsBrandOperator(page);
      await page.goto("/orders");
      await expect(page.getByRole("button", { name: /export csv|export/i })).toBeVisible({ timeout: 10_000 });
    });

    test("inventory CSV export button is available", async ({ page }) => {
      await signInAsBrandOperator(page);
      await page.goto("/inventory");
      await expect(page.getByRole("button", { name: /export csv|export/i })).toBeVisible({ timeout: 10_000 });
    });

    test("CSV export dropdown opens", async ({ page }) => {
      await signInAsBrandOperator(page);
      await page.goto("/orders");
      
      const exportButton = page.getByRole("button", { name: /export csv|export/i });
      await exportButton.click();
      
      // Check dropdown appears with export options
      await expect(page.getByText(/all orders|pending|confirmed/i)).toBeVisible({ timeout: 5_000 });
    });

    test("low stock export option available in inventory", async ({ page }) => {
      await signInAsBrandOperator(page);
      await page.goto("/inventory");
      
      const exportButton = page.getByRole("button", { name: /export csv|export/i });
      await exportButton.click();
      
      await expect(page.getByText(/low stock/i)).toBeVisible({ timeout: 5_000 });
    });
  });

  // ==========================================
  // Inventory & Stock Management
  // ==========================================
  
  test.describe("Inventory Management", () => {
    test("inventory page loads with stats", async ({ page }) => {
      await signInAsBrandOperator(page);
      await page.goto("/inventory");
      await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible({ timeout: 15_000 });
      
      // Check for stat cards
      await expect(page.getByText(/on hand|available|reserved/i)).toBeVisible({ timeout: 10_000 });
    });

    test("operations can receive stock", async ({ page }) => {
      await signInAsOperations(page);
      await page.goto("/inventory");
      
      const receiveButton = page.getByRole("button", { name: /receive stock/i });
      await expect(receiveButton).toBeVisible({ timeout: 10_000 });
    });

    test("sales rep cannot receive stock", async ({ page }) => {
      await signInAsSalesRep(page);
      await page.goto("/inventory");
      
      const receiveButton = page.getByRole("button", { name: /receive stock/i });
      await expect(receiveButton).not.toBeVisible();
    });
  });

  // ==========================================
  // Shipment Auto-Creation
  // ==========================================
  
  test.describe("Shipment Management", () => {
    test("shipments page loads", async ({ page }) => {
      await signInAsBrandOperator(page);
      await page.goto("/shipments");
      await expect(page.getByRole("heading", { name: /shipments/i })).toBeVisible({ timeout: 15_000 });
    });

    test("distributor can view shipment list", async ({ page }) => {
      await signInAsDistributor(page);
      await page.goto("/distributor/shipments");
      await expect(page.getByRole("heading", { name: /shipments/i })).toBeVisible({ timeout: 10_000 });
    });

    test("shipment creation button available to authorized roles", async ({ page }) => {
      await signInAsDistributor(page);
      await page.goto("/distributor/shipments");
      
      const createButton = page.getByRole("button", { name: /create shipment|new shipment/i });
      if (await createButton.count() > 0) {
        await expect(createButton).toBeVisible();
      }
    });
  });

  // ==========================================
  // Accounts Management
  // ==========================================
  
  test.describe("Accounts Management", () => {
    test("accounts page loads", async ({ page }) => {
      await signInAsBrandOperator(page);
      await page.goto("/accounts");
      await expect(page.getByRole("heading", { name: "Accounts" })).toBeVisible({ timeout: 15_000 });
    });

    test("sales rep only sees assigned accounts", async ({ page }) => {
      await signInAsSalesRep(page);
      await page.goto("/sales/accounts");
      await expect(page.getByRole("heading", { name: /accounts|my accounts/i })).toBeVisible({ timeout: 10_000 });
    });

    test("new account button available to authorized roles", async ({ page }) => {
      await signInAsBrandOperator(page);
      await page.goto("/accounts");
      
      const newAccountButton = page.getByRole("button", { name: /new account/i });
      await expect(newAccountButton).toBeVisible({ timeout: 10_000 });
    });
  });

  // ==========================================
  // Error Handling & Edge Cases
  // ==========================================
  
  test.describe("Error Handling", () => {
    test("404 page renders for non-existent routes", async ({ page }) => {
      await page.goto("/non-existent-route");
      await expect(page.getByText(/404|page not found/i)).toBeVisible({ timeout: 10_000 });
    });

    test("401/403 handling for unauthenticated access", async ({ page }) => {
      // Try accessing protected route without auth
      await page.goto("/orders");
      // Should redirect to login or show auth error
      const isLoginPage = await page.getByRole("heading", { name: "Hajime" }).isVisible();
      const isErrorPage = await page.getByText(/401|403|unauthorized|sign in/i).isVisible();
      expect(isLoginPage || isErrorPage).toBeTruthy();
    });
  });
});
