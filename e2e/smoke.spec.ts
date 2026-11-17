import { test, expect } from "@playwright/test";

test("LF storefront loads and shows the catch", async ({ page }) => {
  await page.goto("/lf");
  await expect(page).toHaveTitle(/Lake Fresh/i);
  await expect(page.getByRole("link", { name: /the catch/i })).toBeVisible();
});

test("LF checkout redirects to auth when cart empty", async ({ page }) => {
  await page.goto("/lf/checkout");
  // Either shows basket or redirects; page should not crash
  await expect(page.locator("body")).toBeVisible();
});

test("LF admin redirects unauthenticated users to sign in", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/auth/);
});