import type { Page } from "@playwright/test";

export async function fillLoginForm(
  page: Page,
  email: string,
  password: string,
) {
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
}

export async function submitLogin(page: Page) {
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await fillLoginForm(page, email, password);
  await submitLogin(page);
}
