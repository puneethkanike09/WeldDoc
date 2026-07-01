import { test, expect } from "@playwright/test";
import { createOperatorViaUi, createWelderViaUi } from "./helpers/create-person";
import { completeOperatorQualificationWizard } from "./helpers/operator-qualify";
import { completeWelderQualificationWizard } from "./helpers/welder-qualify";
import { gotoOperatorWorkspace, gotoWelderWorkspace, main } from "./helpers/workspace";
import { e2eOperatorName, e2eWelderName } from "./helpers/forms";

test.describe.configure({ mode: "serial", timeout: 300_000 });

test.describe("Welder qualification lifecycle", () => {
  let welderName: string;
  let welderId: string;

  test("create welder and complete 4-step qualification wizard", async ({ page }) => {
    welderName = e2eWelderName();
    const created = await createWelderViaUi(page, welderName);
    welderId = created.welderId;
    await completeWelderQualificationWizard(page);
  });

  test("welder profile shows issued qualification", async ({ page }) => {
    await gotoWelderWorkspace(page, `/welders/${welderId}`);
    await expect(page.getByRole("heading", { level: 1, name: welderName })).toBeVisible();
    await expect(
      main(page).getByRole("heading", { name: /Qualifications/i }).first(),
    ).toBeVisible({ timeout: 60_000 });
    await expect(main(page).getByText(/Active|Approved|Pending/i).first()).toBeVisible();
  });

  test("re-open qualify wizard step 1 from profile", async ({ page }) => {
    await gotoWelderWorkspace(page, `/welders/${welderId}/qualify`);
    await expect(
      page.getByRole("heading", { name: /Step 1 — Qualification plan/i }),
    ).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("Operator qualification lifecycle", () => {
  let operatorName: string;
  let operatorId: string;

  test("create operator and complete 4-step qualification wizard", async ({ page }) => {
    operatorName = e2eOperatorName();
    const created = await createOperatorViaUi(page, operatorName);
    operatorId = created.operatorId;
    await completeOperatorQualificationWizard(page);
  });

  test("operator profile shows issued qualification", async ({ page }) => {
    await gotoOperatorWorkspace(page, `/operators/${operatorId}`);
    await expect(page.getByRole("heading", { level: 1, name: operatorName })).toBeVisible();
    await expect(
      main(page).getByRole("heading", { name: /Qualifications/i }).first(),
    ).toBeVisible({ timeout: 60_000 });
    await expect(main(page).getByText(/Active|Approved|Pending/i).first()).toBeVisible();
  });

  test("re-open qualify wizard step 1 from profile", async ({ page }) => {
    await gotoOperatorWorkspace(page, `/operators/${operatorId}/qualify`);
    await expect(
      page.getByRole("heading", { name: /Step 1 — Qualification plan/i }),
    ).toBeVisible({ timeout: 60_000 });
  });
});
