import type { Locator, Page } from "@playwright/test";
import path from "path";

export const TEST_PHOTO = path.join(__dirname, "../fixtures/test-photo.png");

export function e2eSuffix() {
  return `${Date.now()}`;
}

export function e2eWelderName(suffix = e2eSuffix()) {
  return `E2E Welder ${suffix}`;
}

export function e2eOperatorName(suffix = e2eSuffix()) {
  return `E2E Operator ${suffix}`;
}

function fieldRoot(label: Locator) {
  return label.locator(
    "xpath=ancestor::div[contains(@class,'grid') or contains(@class,'space-y')][1]",
  );
}

export async function pickCombobox(
  page: Page,
  trigger: Locator,
  search: string,
  option: string,
) {
  await trigger.click();
  const popover = page.locator("[data-radix-popper-content-wrapper]").last();
  await popover.getByPlaceholder(/Search/i).fill(search);
  await popover.getByRole("option", { name: option, exact: true }).click();
}

export async function fillPlaceOfBirth(page: Page, root: Locator = page.locator("body")) {
  const placeLabel = root.locator('label:has-text("Place of birth")');
  const place =
    (await placeLabel.count()) > 0
      ? placeLabel.locator("xpath=ancestor::div[contains(@class,'grid')][1]")
      : root
          .locator('label:has-text("Country")')
          .locator("xpath=ancestor::div[contains(@class,'grid')][1]");
  await pickCombobox(page, place.getByRole("combobox").nth(0), "India", "India");
  await place
    .getByRole("combobox")
    .nth(1)
    .waitFor({ state: "visible", timeout: 30_000 });
  await pickCombobox(page, place.getByRole("combobox").nth(1), "Maharashtra", "Maharashtra");
  const districtInput = place.getByPlaceholder("Type district");
  if (await districtInput.isVisible()) {
    await districtInput.fill("Pune");
  } else {
    await pickCombobox(page, place.getByRole("combobox").nth(2), "Pune", "Pune");
  }
}

export async function pickBirthDate(page: Page, root: Locator = page.locator("body")) {
  await root.getByRole("button", { name: "Select date of birth" }).last().click();
  const picker = page.locator(".welddoc-datepicker-popper");
  await picker.locator(".react-datepicker__year-select").selectOption("1990");
  await picker.locator(".react-datepicker__month-select").selectOption("0");
  await picker
    .locator(".react-datepicker__day:not(.react-datepicker__day--outside-month)")
    .filter({ hasText: "15" })
    .first()
    .click();
}

export async function pickDateByFieldName(page: Page, name: string) {
  const wrap = page.locator(`input[type="hidden"][name="${name}"]`).locator("..");
  await wrap.getByRole("button").click();
  const picker = page.locator(".welddoc-datepicker-popper");
  await picker.waitFor({ state: "visible", timeout: 15_000 });
  const today = picker.locator(".react-datepicker__day--today");
  if (await today.count()) {
    await today.click();
    return;
  }
  await picker
    .locator(".react-datepicker__day:not(.react-datepicker__day--outside-month)")
    .first()
    .click();
}

const DATE_FIELD_BY_LABEL: Record<string, string> = {
  "Date of welding": "date_of_welding",
  "Certificate date": "certificate_date",
};

export async function pickTodayDate(page: Page, label: string | RegExp) {
  const labelText = typeof label === "string" ? label : label.source;
  const fieldName = DATE_FIELD_BY_LABEL[labelText];
  if (fieldName) {
    await pickDateByFieldName(page, fieldName);
    return;
  }
  const field = page
    .locator("div")
    .filter({ has: page.getByText(label) })
    .filter({ has: page.getByRole("button") })
    .first();
  await field.getByRole("button").first().click();
  const picker = page.locator(".welddoc-datepicker-popper");
  await picker.waitFor({ state: "visible", timeout: 15_000 });
  await picker
    .locator(".react-datepicker__day:not(.react-datepicker__day--outside-month)")
    .first()
    .click();
}

async function selectInRoot(
  root: Locator,
  page: Page,
  label: string | RegExp,
  option: string,
) {
  const field = root
    .locator("div")
    .filter({ has: root.locator("label").filter({ hasText: label }) })
    .first();
  const combobox = field.getByRole("combobox").first();
  await combobox.click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

/** Select a Radix option on a labeled field (page-wide or within a root locator). */
export async function selectLabeledField(
  pageOrRoot: Page | Locator,
  labelOrPage: string | RegExp | Page,
  optionOrLabel?: string,
  option?: string,
) {
  if (option !== undefined) {
    await selectInRoot(
      pageOrRoot as Locator,
      labelOrPage as Page,
      optionOrLabel as string | RegExp,
      option,
    );
    return;
  }
  const page = pageOrRoot as Page;
  const label = labelOrPage as string | RegExp;
  const opt = optionOrLabel as string;
  await selectInRoot(page.locator("body"), page, label, opt);
}

export async function uploadPhoto(page: Page, root: Locator = page.locator("body")) {
  const input = root.locator('input[type="file"]').first();
  await input.setInputFiles(TEST_PHOTO);
}

export async function fillIfEmpty(locator: Locator, value: string) {
  if ((await locator.inputValue()).trim() === "") {
    await locator.fill(value);
  }
}

export async function fillNdtReportFields(page: Page, prefix = "") {
  const refs = page.locator(`input[name^="${prefix}conducted_by__"]`);
  const count = await refs.count();
  for (let i = 0; i < count; i++) {
    await refs.nth(i).fill(`E2E-NDT-${Date.now()}-${i}`);
  }
  const dates = page.locator(`input[type="hidden"][name^="${prefix}test_date__"]`);
  const dateCount = await dates.count();
  for (let i = 0; i < dateCount; i++) {
    const name = await dates.nth(i).getAttribute("name");
    if (name) await pickDateByFieldName(page, name);
  }
}
