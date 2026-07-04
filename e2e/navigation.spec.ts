import { test, expect } from "@playwright/test";
import { expectPageHeader } from "./helpers/workspace";

test.describe("App navigation", () => {
  test("sidebar welder qualification opens welder registry", async ({ page }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Welder qualification", exact: true })
      .click();
    await expect(page).toHaveURL(/\/welders/);
    await expectPageHeader(page, "Welders");
  });

  test("sidebar operator qualification opens operator registry", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Operator qualification", exact: true })
      .click();
    await expect(page).toHaveURL(/\/operators/);
    await expectPageHeader(page, "Operators");
  });

  test("standards page shows reference cards without workspace entry", async ({
    page,
  }) => {
    await page.goto("/standards");
    await expectPageHeader(page, "Standards");
    await expect(
      page.getByRole("button", { name: /Open workspace/i }),
    ).toHaveCount(0);
    await expect(page.getByText("EN ISO 9606-1:2017")).toBeVisible();
  });

  test("sidebar group qualify opens welder sessions list", async ({ page }) => {
    await page.goto("/welders");
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Welder group qualify" })
      .click();
    await expect(page).toHaveURL(/\/welders\/qualify\/group$/);
    await expectPageHeader(page, "Group qualification");
  });
});
