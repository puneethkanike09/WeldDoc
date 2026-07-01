import {
  ACTIVE_STANDARD_COOKIE,
  ACTIVE_STANDARD_SLUG,
  WELDING_STANDARDS_CATALOG,
  type StandardSlug,
} from "@/lib/standards/catalog";

const ACTIVE_SLUGS = new Set(
  WELDING_STANDARDS_CATALOG.filter((e) => e.status === "active").map(
    (e) => e.slug,
  ),
);

export function isActiveStandardSlug(value: string | undefined): value is StandardSlug {
  return ACTIVE_SLUGS.has(value as StandardSlug);
}

const STANDARD_CHANGED_KEY = "welddoc_standard_changed";

/** Client — persist workspace choice after entering from the standards hub. */
export function setActiveStandardCookie(slug: StandardSlug = ACTIVE_STANDARD_SLUG) {
  document.cookie = `${ACTIVE_STANDARD_COOKIE}=${slug}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  try {
    sessionStorage.setItem(STANDARD_CHANGED_KEY, slug);
  } catch {
    /* private browsing */
  }
}

export function consumeStandardChangedFlag(): StandardSlug | null {
  if (typeof sessionStorage === "undefined") return null;
  const value = sessionStorage.getItem(STANDARD_CHANGED_KEY);
  if (!value) return null;
  sessionStorage.removeItem(STANDARD_CHANGED_KEY);
  return isActiveStandardSlug(value) ? value : null;
}

export function clearStandardChangedFlag(): void {
  try {
    sessionStorage.removeItem(STANDARD_CHANGED_KEY);
  } catch {
    /* private browsing */
  }
}

/** Switch workspace standard and load dashboard with a fresh server render. */
export function navigateToStandardWorkspace(slug: StandardSlug) {
  setActiveStandardCookie(slug);
  clearStandardChangedFlag();
  window.location.assign("/dashboard");
}

export function readActiveStandardCookie(): StandardSlug | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ACTIVE_STANDARD_COOKIE}=`));
  const value = match?.split("=")[1];
  return isActiveStandardSlug(value) ? value : null;
}

export function workspacePersonnelHref(slug: StandardSlug): string {
  return slug === "iso-14732" ? "/operators" : "/welders";
}

export function workspacePersonnelLabel(slug: StandardSlug): string {
  return slug === "iso-14732" ? "Operators" : "Welders";
}

export function workspaceMasterlistHref(slug: StandardSlug): string {
  return `${workspacePersonnelHref(slug)}/masterlist`;
}
