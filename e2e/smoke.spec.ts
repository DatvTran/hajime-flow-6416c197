import { test, expect } from "@playwright/test";

test.describe("Hajime B2B smoke", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  });

  test("demo sign-in reaches command center as brand operator", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Command center" })).toBeVisible({ timeout: 15_000 });
  });

  test("orders page loads when signed in", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible({ timeout: 15_000 });
  });
});
