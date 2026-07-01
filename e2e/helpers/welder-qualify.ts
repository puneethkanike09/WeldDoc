import { expect, type Page } from "@playwright/test";
import {
  fillNdtReportFields,
  pickTodayDate,
} from "./forms";

export async function expectWelderQualifyStep(
  page: Page,
  step: number,
  title: RegExp,
) {
  await expect(page).toHaveURL(new RegExp(`step=${step}`), { timeout: 120_000 });
  await expect(page.getByRole("heading", { name: title })).toBeVisible({
    timeout: 120_000,
  });
}

export async function completeWelderPlanStep(page: Page) {
  await expect(page.getByRole("heading", { name: /Step 1 — Qualification plan/i })).toBeVisible();
  await page.getByPlaceholder("ACME/PLT-A/QA/WPS-075 REV-02").fill("E2E/WPS/001");
  await pickTodayDate(page, "Date of welding");
  await page.getByPlaceholder("Third-party examiner ref.").fill("E2E-EXAM-REF");
  await page.getByPlaceholder("Jordan Lee").fill("E2E Examiner");
  await page.locator('input[name="revalidation_method"]').first().check();
  await page.getByRole("button", { name: "Save & continue" }).click();
  await expectWelderQualifyStep(page, 2, /Step 2 — Test piece record/i);
}

export async function completeWelderTestStep(page: Page) {
  const pickOption = async (comboboxIndex: number, option: string) => {
    const combobox = page.getByRole("main").getByRole("combobox").nth(comboboxIndex);
    await combobox.click();
    await page.getByRole("option", { name: option, exact: true }).click();
  };

  await pickOption(0, "CEN ISO/TR 20172 — European materials");
  await pickOption(1, "EN 10025-2");
  await pickOption(2, "S235JR (1.0038)");
  await page.getByRole("button", { name: "Copy Material 1 to Material 2" }).click();
  await page.locator('input[name="dimension_thickness_mm"]').fill("12");
  await page.locator('input[name="dimension_width_mm"]').fill("200");
  await page.locator('input[name="dimension_length_mm"]').fill("300");
  await page.locator('input[name="dimension2_thickness_mm"]').fill("12");
  await page.locator('input[name="dimension2_width_mm"]').fill("200");
  await page.locator('input[name="dimension2_length_mm"]').fill("300");
  await page.getByPlaceholder("ER70S-6 / SFA 5.18").fill("ER70S-6");
  await page.locator('input[name="deposited_thickness_mm"]').fill("8");
  await page.getByRole("button", { name: "Save & continue" }).click();
  await expectWelderQualifyStep(page, 3, /Step 3 — NDT \/ DT results/i);
}

export async function completeWelderNdtStep(page: Page) {
  await fillNdtReportFields(page);
  await page.getByRole("button", { name: "Save results" }).click();
  await expectWelderQualifyStep(page, 4, /Step 4 — Generate certificate/i);
}

export async function completeWelderCertificateStep(page: Page) {
  await pickTodayDate(page, "Certificate date");
  await page.getByRole("button", { name: "Issue certificate" }).click();
  await expect(page).toHaveURL(/\/welders\/[^/?]+(\?|$)/, { timeout: 120_000 });
  await expect(page.getByText(/Qualifications/i).first()).toBeVisible({
    timeout: 60_000,
  });
}

export async function completeWelderQualificationWizard(page: Page) {
  await completeWelderPlanStep(page);
  await completeWelderTestStep(page);
  await completeWelderNdtStep(page);
  await completeWelderCertificateStep(page);
}
