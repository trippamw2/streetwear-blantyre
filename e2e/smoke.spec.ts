import { test, expect } from "@playwright/test";

test("LF storefront loads and shows the catch", async ({ page }) => {
  await page.goto("/lf");
  await expect(page).toHaveTitle(/Lake Fresh/i);
  await expect(page.getByRole("link", { name: /the catch/i })).toBeVisible();
});

test("LF checkout supports guests with an empty cart", async ({ page }) => {
  await page.goto("/lf/checkout");
  await expect(page.locator("body")).toBeVisible();
  await expect(page).not.toHaveURL(/auth/);
});

test("LF admin redirects unauthenticated users to sign in", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/auth/);
});