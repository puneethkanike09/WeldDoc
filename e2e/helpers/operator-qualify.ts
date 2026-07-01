import { expect, type Page } from "@playwright/test";
import { fillNdtReportFields, pickTodayDate } from "./forms";

export async function expectOperatorQualifyStep(
  page: Page,
  step: number,
  title: RegExp,
) {
  await expect(page).toHaveURL(new RegExp(`step=${step}`), { timeout: 120_000 });
  await expect(page.getByRole("heading", { name: title })).toBeVisible({
    timeout: 120_000,
  });
}

async function pickMainOption(page: Page, comboboxIndex: number, option: string) {
  const combobox = page.getByRole("main").getByRole("combobox").nth(comboboxIndex);
  await combobox.click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

export async function completeOperatorPlanStep(page: Page) {
  await expect(page.getByRole("heading", { name: /Step 1 — Qualification plan/i })).toBeVisible();
  await pickTodayDate(page, "Date of welding");
  await pickMainOption(page, 0, "Fusion");
  await pickMainOption(page, 1, "TIG / GTAW (tungsten inert gas) — 141");
  await pickMainOption(page, 2, "Plate");
  await pickMainOption(page, 3, "BW");
  await pickMainOption(page, 4, "Automatic");
  await page.getByPlaceholder("ACME/PLT-A/QA/WPS-075 REV-02").fill("E2E/WPS/001");
  await page.locator('input[name="employer_branch"]').fill("E2E Plant");
  await page.locator('input[name="functional_knowledge_ref"]').fill("E2E-FK-001");
  await pickMainOption(page, 5, "Acceptable");
  await page.getByPlaceholder("Third-party examiner ref.").fill("E2E-EXAM-REF");
  await page.getByPlaceholder("Jordan Lee").fill("E2E Examiner");
  await page.locator('input[name="revalidation_method"]').first().check();
  await page.getByRole("button", { name: "Save & continue" }).click();
  await expectOperatorQualifyStep(page, 2, /Step 2 — Test piece/i);
}

export async function completeOperatorTestStep(page: Page) {
  await page.locator('input[name="equipment_power_source"]').fill("E2E Power Source");
  await page.locator('textarea[name="equipment_unit_details"]').fill("E2E welding unit details");
  await pickMainOption(page, 0, "Single Run");
  await page.getByRole("button", { name: "Save & continue" }).click();
  await expectOperatorQualifyStep(page, 3, /Step 3 — NDT \/ DT results/i);
}

export async function completeOperatorNdtStep(page: Page) {
  await pickMainOption(page, 0, "Method 1 — ISO 9606-1 / ISO 9606-2");
  await pickMainOption(page, 1, "ISO 9606-1");
  await fillNdtReportFields(page);
  await page.getByRole("button", { name: "Save results" }).click();
  await expectOperatorQualifyStep(page, 4, /Step 4 — Generate certificate/i);
}

export async function completeOperatorCertificateStep(page: Page) {
  await pickTodayDate(page, "Certificate date");
  await page.getByRole("button", { name: "Issue certificate" }).click();
  await expect(page).toHaveURL(/\/operators\/[^/?]+(\?|$)/, { timeout: 120_000 });
  await expect(page.getByText(/Qualifications/i).first()).toBeVisible({
    timeout: 60_000,
  });
}

export async function completeOperatorQualificationWizard(page: Page) {
  await completeOperatorPlanStep(page);
  await completeOperatorTestStep(page);
  await completeOperatorNdtStep(page);
  await completeOperatorCertificateStep(page);
}
