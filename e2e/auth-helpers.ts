import { Page } from "@playwright/test";

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
