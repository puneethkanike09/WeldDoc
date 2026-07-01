import { test, expect } from "@playwright/test";
import { expectPageHeader } from "./helpers/workspace";

test.describe("Standards hub navigation", () => {
  test("open welder workspace from ISO 9606 card", async ({ page }) => {
    await page.goto("/standards");
    await page
      .getByRole("article")
      .filter({ hasText: "EN ISO 9606-1:2017" })
      .getByRole("button", { name: /Open workspace/i })
      .click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Welders" }),
    ).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: "Welders" }).click();
    await expect(page).toHaveURL(/\/welders/);
    await expectPageHeader(page, "Welders");
  });

  test("open operator workspace from ISO 14732 card", async ({ page }) => {
    await page.goto("/standards");
    await page
      .getByRole("article")
      .filter({ hasText: "ISO 14732:2025" })
      .getByRole("button", { name: /Open workspace/i })
      .click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Operators" }),
    ).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: "Operators" }).click();
    await expect(page).toHaveURL(/\/operators/);
    await expectPageHeader(page, "Operators");
  });

  test("sidebar group qualify opens sessions list", async ({ page }) => {
    await page.goto("/welders");
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Group qualify" })
      .click();
    await expect(page).toHaveURL(/\/welders\/qualify\/group$/);
    await expectPageHeader(page, "Group qualification");
  });
});
