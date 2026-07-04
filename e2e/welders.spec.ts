import { test, expect } from "@playwright/test";
import {
  expectPageHeader,
  firstViewLink,
  gotoWelderWorkspace,
  main,
  mainLink,
  selectMainComboboxOption,
} from "./helpers/workspace";

test.describe("Welder registry", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWelderWorkspace(page, "/welders");
  });

  test("welders list page", async ({ page }) => {
    await expectPageHeader(page, "Welders");
    await expect(mainLink(page, /Add welder/i)).toBeVisible();
    await expect(mainLink(page, /Group qualify/i)).toBeVisible();
    await expect(mainLink(page, /Import from Excel/i)).toBeVisible();
  });

  test("welders list search and filters", async ({ page }) => {
    await page.getByPlaceholder(/Search by name/i).fill("a");
    await page.getByRole("button", { name: "Search" }).click();
    await selectMainComboboxOption(page, 0, "Active");
    await expect(page).toHaveURL(/status=Active/);
  });

  test("add welder form", async ({ page }) => {
    await mainLink(page, /Add welder/i).click();
    await expectPageHeader(page, "Add welder");
    await expect(page.getByPlaceholder("Alex Morgan")).toBeVisible();
    await expect(page.getByPlaceholder("W#01")).toBeVisible();
    await expect(page.getByPlaceholder("Acme Fabrication Ltd")).toBeVisible();
  });

  test("bulk import page", async ({ page }) => {
    await mainLink(page, /Import from Excel/i).click();
    await expectPageHeader(page, /Import welders/i);
    await expect(page.getByRole("link", { name: /Download template/i })).toBeVisible();
  });

  test("master list", async ({ page }) => {
    await page.goto("/welders/masterlist");
    await expectPageHeader(page, "Master list");
    await expect(page.getByRole("link", { name: "Excel" })).toBeVisible();
    await expect(page.getByRole("link", { name: "PDF" })).toBeVisible();
  });

  test("group qualification sessions list", async ({ page }) => {
    await page.goto("/welders/qualify/group");
    await expectPageHeader(page, "Group qualification");
    await expect(mainLink(page, /New group session/i).first()).toBeVisible();
  });

  test("header group qualify opens new session", async ({ page }) => {
    await mainLink(page, /Group qualify/i).click();
    await expect(page).toHaveURL(/\/welders\/qualify\/group\/new/);
    await expectPageHeader(page, "New group session");
  });

  test("new group session participants step", async ({ page }) => {
    await page.goto("/welders/qualify/group/new");
    await expectPageHeader(page, "New group session");
    await expect(page.getByRole("heading", { name: /Step 0 — Participants/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add new welder/i })).toBeVisible();
  });

  test("group session — add inline welder pre-fills plant ID", async ({ page }) => {
    await page.goto("/welders/qualify/group/new");
    await page.getByRole("button", { name: /Add new welder/i }).click();
    const plantInput = page.locator('input[name*="_welder_id"]').first();
    await expect(plantInput).toBeVisible();
    await expect(plantInput).not.toHaveValue("");
    await expect(plantInput).toHaveValue(/^W#/i);
  });

  test("sidebar navigation highlights welders workspace", async ({ page }) => {
    await expect(page.getByRole("navigation").getByRole("link", { name: "Welder qualification", exact: true })).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: "Welder master list" }).click();
    await expect(page).toHaveURL(/\/welders\/masterlist/);
  });
});

test.describe("Welder profile and qualification", () => {
  test("open first welder profile when registry has rows", async ({ page }) => {
    await gotoWelderWorkspace(page, "/welders?q=E2E");
    const view = await firstViewLink(page);
    await expect(view).toBeVisible({ timeout: 30_000 });
    await view.click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/\/welders\/[^/]+$/);
    await expect(
      main(page).getByRole("heading", {
        name: /No qualifications yet|Qualifications/i,
      }).first(),
    ).toBeVisible({ timeout: 60_000 });
  });
});
