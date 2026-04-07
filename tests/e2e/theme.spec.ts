// tests/e2e/theme.spec.ts
import { test, expect } from "@playwright/test";
import { mockTauriBridge } from "./support/mockTauri";

test.describe("Theme System", () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriBridge(page);
  });

  test("should default to system preference on first launch", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("sidebar-general")).toBeVisible();

    // Check initial theme based on system preference
    const html = page.locator("html");
    const systemPrefersDark = await page.evaluate(
      () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    );

    if (systemPrefersDark) {
      await expect(html).toHaveClass(/dark/);
    } else {
      await expect(html).not.toHaveClass(/dark/);
    }
  });

  test("should switch to dark theme when selected", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("sidebar-general")).toBeVisible();

    // Ensure we're on the general section (contains theme settings)
    await page.getByTestId("sidebar-general").click();

    // Open theme dropdown
    await page.getByTestId("theme-dropdown").click();

    // Select dark theme from dropdown
    await page.getByTestId("theme-dropdown-option-dark").click();

    // Verify dark theme is applied
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId("sidebar-general")).toBeVisible();
    await expect(html).toHaveClass(/dark/);
  });

  test("should switch to light theme when selected", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("sidebar-general")).toBeVisible();

    // Ensure we're on the general section (contains theme settings)
    await page.getByTestId("sidebar-general").click();

    // Open theme dropdown
    await page.getByTestId("theme-dropdown").click();

    // Select light theme from dropdown
    await page.getByTestId("theme-dropdown-option-light").click();

    // Verify light theme is applied
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);

    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId("sidebar-general")).toBeVisible();
    await expect(html).not.toHaveClass(/dark/);
  });
});
