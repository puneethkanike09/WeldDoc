import { expect, type Page } from "@playwright/test";
import { gotoOperatorWorkspace, gotoWelderWorkspace } from "./workspace";
import {
  e2eOperatorName,
  e2eWelderName,
  fillIfEmpty,
  fillPlaceOfBirth,
  pickBirthDate,
  TEST_PHOTO,
  uploadPhoto,
} from "./forms";

export async function createWelderViaUi(
  page: Page,
  name = e2eWelderName(),
): Promise<{ welderId: string; name: string }> {
  await gotoWelderWorkspace(page, "/welders/new");
  await page.getByPlaceholder("Alex Morgan").fill(name);
  await page.getByPlaceholder("ID / passport no.").fill(`E2E-W-${Date.now()}`);
  await pickBirthDate(page);
  await fillPlaceOfBirth(page);
  await fillIfEmpty(page.locator('input[name="branch_location"]'), "E2E Plant");
  await uploadPhoto(page);
  await page.getByRole("button", { name: "Create welder" }).click();
  await expect(page).toHaveURL(/\/welders\/[^/]+\/qualify/, { timeout: 120_000 });
  const welderId = page.url().match(/\/welders\/([^/]+)\/qualify/)?.[1];
  if (!welderId) throw new Error("Could not parse welder id after create.");
  return { welderId, name };
}

export async function createOperatorViaUi(
  page: Page,
  name = e2eOperatorName(),
): Promise<{ operatorId: string; name: string }> {
  await gotoOperatorWorkspace(page, "/operators/new");
  await page.getByPlaceholder("Alex Morgan").fill(name);
  await page.getByPlaceholder("ID / passport no.").fill(`E2E-O-${Date.now()}`);
  await pickBirthDate(page);
  await fillPlaceOfBirth(page);
  await fillIfEmpty(page.locator('input[name="branch_location"]'), "E2E Plant");
  await uploadPhoto(page);
  await page.getByRole("button", { name: "Create operator" }).click();
  await expect(page).toHaveURL(/\/operators\/[^/]+\/qualify/, { timeout: 120_000 });
  const operatorId = page.url().match(/\/operators\/([^/]+)\/qualify/)?.[1];
  if (!operatorId) throw new Error("Could not parse operator id after create.");
  return { operatorId, name };
}

export async function fillInlineGroupPerson(
  page: Page,
  kind: "welder" | "operator",
  name: string,
) {
  await page.getByRole("button", { name: new RegExp(`Add new ${kind}`, "i") }).click();
  await page.getByPlaceholder("Alex Morgan").last().fill(name);
  await page.getByPlaceholder("ID / passport no.").last().fill(`E2E-G-${Date.now()}`);
  await pickBirthDate(page);
  await fillPlaceOfBirth(page);
  await fillIfEmpty(page.locator('input[name$="_branch_location"]').last(), "E2E Plant");
  await page.locator('input[type="file"]').last().setInputFiles(TEST_PHOTO);
}
