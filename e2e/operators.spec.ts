import { test, expect } from "@playwright/test";
import {
  expectPageHeader,
  firstViewLink,
  gotoOperatorWorkspace,
  gotoWelderWorkspace,
  main,
  mainLink,
  selectMainComboboxOption,
} from "./helpers/workspace";

test.describe("Operator registry", () => {
  test.beforeEach(async ({ page }) => {
    await gotoOperatorWorkspace(page, "/operators");
  });

  test("operators list page", async ({ page }) => {
    await expectPageHeader(page, "Operators");
    await expect(mainLink(page, /Add operator/i)).toBeVisible();
    await expect(mainLink(page, /Group qualify/i)).toBeVisible();
    await expect(mainLink(page, /Import from Excel/i)).toBeVisible();
  });

  test("operators list search and filters", async ({ page }) => {
    await page.getByPlaceholder(/Search by name/i).fill("a");
    await page.getByRole("button", { name: "Search" }).click();
    await selectMainComboboxOption(page, 0, "Active");
    await expect(page).toHaveURL(/status=Active/);
  });

  test("add operator form", async ({ page }) => {
    await mainLink(page, /Add operator/i).click();
    await expectPageHeader(page, "Add operator");
    await expect(page.getByPlaceholder("Alex Morgan")).toBeVisible();
    await expect(page.getByPlaceholder("O#01")).toBeVisible();
    await expect(page.getByPlaceholder("Acme Fabrication Ltd")).toBeVisible();
  });

  test("bulk import page", async ({ page }) => {
    await mainLink(page, /Import from Excel/i).click();
    await expectPageHeader(page, /Import operators/i);
    await expect(page.getByRole("link", { name: /Download template/i })).toBeVisible();
  });

  test("master list", async ({ page }) => {
    await page.goto("/operators/masterlist");
    await expectPageHeader(page, "Master list");
    await expect(page.getByRole("link", { name: "Excel" })).toBeVisible();
    await expect(page.getByRole("link", { name: "PDF" })).toBeVisible();
  });

  test("group qualification sessions list", async ({ page }) => {
    await page.goto("/operators/qualify/group");
    await expectPageHeader(page, "Group qualification");
    await expect(mainLink(page, /New group session/i).first()).toBeVisible();
  });

  test("header group qualify opens new session", async ({ page }) => {
    await mainLink(page, /Group qualify/i).click();
    await expect(page).toHaveURL(/\/operators\/qualify\/group\/new/);
    await expectPageHeader(page, "New group session");
  });

  test("new group session participants step", async ({ page }) => {
    await page.goto("/operators/qualify/group/new");
    await expectPageHeader(page, "New group session");
    await expect(page.getByRole("heading", { name: /Step 0 — Participants/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add new operator/i })).toBeVisible();
  });

  test("group session — add inline operator pre-fills plant ID", async ({ page }) => {
    await page.goto("/operators/qualify/group/new");
    await page.getByRole("button", { name: /Add new operator/i }).click();
    const plantInput = page.locator('input[name*="_operator_id"]').first();
    await expect(plantInput).toBeVisible();
    await expect(plantInput).not.toHaveValue("");
    await expect(plantInput).toHaveValue(/^O#/i);
  });

  test("sidebar navigation highlights operators workspace", async ({ page }) => {
    await expect(page.getByRole("navigation").getByRole("link", { name: "Operator qualification", exact: true })).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: "Operator master list" }).click();
    await expect(page).toHaveURL(/\/operators\/masterlist/);
  });

  test("legacy masterlist redirect goes to welder list", async ({ page }) => {
    await page.goto("/masterlist");
    await expect(page).toHaveURL(/\/welders\/masterlist/);
  });
});

test.describe("Operator profile and qualification", () => {
  test("open first operator profile when registry has rows", async ({ page }) => {
    await gotoOperatorWorkspace(page, "/operators?q=E2E");
    const view = await firstViewLink(page);
    await expect(view).toBeVisible({ timeout: 30_000 });
    await view.click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/\/operators\/[^/]+$/);
    await expect(
      main(page).getByRole("heading", {
        name: /No qualifications yet|Qualifications/i,
      }).first(),
    ).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("Workspace isolation", () => {
  test("welder master list does not show in operator workspace URL", async ({ page }) => {
    await gotoWelderWorkspace(page, "/welders/masterlist");
    await expect(page).toHaveURL(/\/welders\/masterlist/);
    await gotoOperatorWorkspace(page, "/operators/masterlist");
    await expect(page).toHaveURL(/\/operators\/masterlist/);
  });
});
