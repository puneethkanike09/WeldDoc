import { test, expect } from "@playwright/test";
import { fillInlineGroupPerson } from "./helpers/create-person";
import { e2eOperatorName, e2eWelderName } from "./helpers/forms";
import { completeWelderPlanStep } from "./helpers/welder-qualify";
import { completeOperatorPlanStep } from "./helpers/operator-qualify";
import { gotoOperatorWorkspace, gotoWelderWorkspace } from "./helpers/workspace";

test.describe.configure({ mode: "serial", timeout: 300_000 });

async function selectExistingParticipant(
  page: import("@playwright/test").Page,
  kind: "welder" | "operator",
) {
  const search = page.getByPlaceholder(
    new RegExp(`Search ${kind}s by name`, "i"),
  );
  await search.fill("E2E");
  const row = page
    .locator("label")
    .filter({ hasText: new RegExp(`E2E ${kind}`, "i") })
    .first();
  if (await row.isVisible()) {
    await row.click();
    return;
  }
  await fillInlineGroupPerson(
    page,
    kind,
    kind === "welder" ? e2eWelderName() : e2eOperatorName(),
  );
}

async function startGroupSession(page: import("@playwright/test").Page, kind: "welder" | "operator") {
  await page.getByRole("button", { name: /Start group session/i }).click();
  const path =
    kind === "welder"
      ? /\/welders\/qualify\/group\/(?!new)[^/?]+\?step=1/
      : /\/operators\/qualify\/group\/(?!new)[^/?]+\?step=1/;
  await expect(page).toHaveURL(path, { timeout: 120_000 });
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("404");
}

test.describe("Group qualification sessions", () => {
  test("welder group session — create participant and open step 1", async ({ page }) => {
    await gotoWelderWorkspace(page, "/welders/qualify/group/new");
    await selectExistingParticipant(page, "welder");
    await startGroupSession(page, "welder");
    await expect(
      page.getByRole("heading", { name: /Step 1 — Qualification plan/i }),
    ).toBeVisible({ timeout: 60_000 });
    await completeWelderPlanStep(page);
    await expect(page).toHaveURL(/step=2/, { timeout: 120_000 });
    await expect(
      page.getByRole("heading", { name: /Step 2 — Test piece record/i }),
    ).toBeVisible();
  });

  test("welder group session list shows Open link for created session", async ({ page }) => {
    await gotoWelderWorkspace(page, "/welders/qualify/group");
    await expect(page.getByRole("link", { name: "Open" }).first()).toBeVisible({
      timeout: 60_000,
    });
    await page.getByRole("link", { name: "Open" }).first().click();
    await expect(
      page.getByRole("heading", { name: /Step 1 — Qualification plan|Step 2 — Test piece record/i }),
    ).toBeVisible({ timeout: 60_000 });
  });

  test("operator group session — create participant and open step 1", async ({ page }) => {
    await gotoOperatorWorkspace(page, "/operators/qualify/group/new");
    await selectExistingParticipant(page, "operator");
    await startGroupSession(page, "operator");
    await expect(
      page.getByRole("heading", { name: /Step 1 — Qualification plan/i }),
    ).toBeVisible({ timeout: 60_000 });
    await completeOperatorPlanStep(page);
    await expect(page).toHaveURL(/step=2/, { timeout: 120_000 });
    await expect(
      page.getByRole("heading", { name: /Step 2 — Test piece/i }),
    ).toBeVisible();
  });

  test("operator group session list shows Open link for created session", async ({ page }) => {
    await gotoOperatorWorkspace(page, "/operators/qualify/group");
    await expect(page.getByRole("link", { name: "Open" }).first()).toBeVisible({
      timeout: 60_000,
    });
    await page.getByRole("link", { name: "Open" }).first().click();
    await expect(
      page.getByRole("heading", { name: /Step 1 — Qualification plan|Step 2 — Test piece/i }),
    ).toBeVisible({ timeout: 60_000 });
  });
});
