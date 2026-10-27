import { test, expect } from "@playwright/test";

test("homepage shows hero and active draws", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /lowest unique bid wins/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /browse draws/i })).toBeVisible();
});

test("open draw page shows fields and login prompt", async ({ page }) => {
  await page.goto("/draws");
  await page.getByRole("link").filter({ hasText: /tablet/i }).first().click();
  await expect(page.getByText(/how the lowest unique bid works/i)).toBeVisible();
});

test("custom 404 page", async ({ page }) => {
  await page.goto("/definitely-not-a-page");
  await expect(page.getByText("We couldn’t find that page or draw.")).toBeVisible();
});
