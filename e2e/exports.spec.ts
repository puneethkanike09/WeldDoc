import { test, expect } from "@playwright/test";
import { gotoWelderWorkspace, gotoOperatorWorkspace } from "./helpers/workspace";

test.describe("Welder exports", () => {
  test("master list CSV export returns file", async ({ page, request }) => {
    await gotoWelderWorkspace(page, "/welders/masterlist");
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const response = await request.get("/api/welders/masterlist/export?format=csv", {
      headers: { cookie: cookieHeader },
    });
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("text/csv");
  });

  test("import template download", async ({ page }) => {
    await gotoWelderWorkspace(page, "/welders/import");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: /Download template/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
  });
});

test.describe("Operator exports", () => {
  test("master list CSV export returns file", async ({ page, request }) => {
    await gotoOperatorWorkspace(page, "/operators/masterlist");
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const response = await request.get("/api/operators/masterlist/export?format=csv", {
      headers: { cookie: cookieHeader },
    });
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("text/csv");
  });

  test("import template download", async ({ page }) => {
    await gotoOperatorWorkspace(page, "/operators/import");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: /Download template/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
  });
});
