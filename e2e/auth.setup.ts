import { test as setup, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fillLoginForm, submitLogin } from "./helpers/login";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.e2e.local (see .env.e2e.example).",
    );
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto("/login");
  await fillLoginForm(page, email, password);
  await submitLogin(page);

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
