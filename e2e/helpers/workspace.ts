import type { Page } from "@playwright/test";

export type WorkspaceSlug = "iso9606-1" | "iso-14732";

const STANDARD_COOKIE = "welddoc_active_standard";

async function appOrigin(page: Page): Promise<string> {
  if (page.url() && page.url() !== "about:blank") {
    return new URL(page.url()).origin;
  }
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
  await page.goto(baseURL);
  return new URL(page.url()).origin;
}

export async function setWorkspace(page: Page, slug: WorkspaceSlug) {
  const origin = await appOrigin(page);
  await page.context().addCookies([
    {
      name: STANDARD_COOKIE,
      value: slug,
      url: `${origin}/`,
    },
  ]);
}

export async function gotoWelderWorkspace(page: Page, path = "/welders") {
  await setWorkspace(page, "iso9606-1");
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 90_000 });
}

export async function gotoOperatorWorkspace(page: Page, path = "/operators") {
  await setWorkspace(page, "iso-14732");
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 90_000 });
}

export async function expectPageHeader(page: Page, title: string | RegExp) {
  await page
    .getByRole("heading", { level: 1, name: title })
    .waitFor({ state: "visible", timeout: 90_000 });
}

export async function firstViewLink(page: Page) {
  return page.getByRole("link", { name: "View" }).first();
}

/** Page content area — avoids sidebar duplicate nav links. */
export function main(page: Page) {
  return page.getByRole("main");
}

export function mainLink(page: Page, name: string | RegExp) {
  return main(page).getByRole("link", { name });
}

export async function selectMainComboboxOption(
  page: Page,
  comboboxIndex: number,
  optionName: string | RegExp,
) {
  const combobox = main(page).getByRole("combobox").nth(comboboxIndex);
  await combobox.click();
  const option =
    typeof optionName === "string"
      ? page.getByRole("option", { name: optionName, exact: true })
      : page.getByRole("option", { name: optionName });
  await option.click();
}

/** Open individual qualification wizard step 1 from a welder/operator profile URL. */
export async function openQualifyWizardStep1(page: Page) {
  const profileUrl = page.url();
  await page.goto(`${profileUrl.replace(/\/$/, "")}/qualify`, {
    waitUntil: "domcontentloaded",
  });
  await page
    .getByRole("heading", { name: /Step 1 — Qualification plan/i })
    .waitFor({ state: "visible", timeout: 60_000 });
}
