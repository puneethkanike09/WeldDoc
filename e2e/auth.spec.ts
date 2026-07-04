import { test, expect } from "@playwright/test";
import { fillLoginForm, submitLogin } from "./helpers/login";

test.describe("Authentication", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login page renders sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("invalid credentials stay on login", async ({ page }) => {
    await page.goto("/login");
    await fillLoginForm(page, "invalid@example.com", "wrong-password");
    await submitLogin(page);
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});

test.describe("Authenticated shell", () => {
  test("dashboard loads after login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("standards reference page loads", async ({ page }) => {
    await page.goto("/standards");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("dashboard loads", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("settings loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });
});
