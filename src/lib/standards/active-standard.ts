import {
  ACTIVE_STANDARD_COOKIE,
  ACTIVE_STANDARD_SLUG,
  type StandardSlug,
} from "@/lib/standards/catalog";

export function isActiveStandardSlug(value: string | undefined): value is StandardSlug {
  return value === ACTIVE_STANDARD_SLUG;
}

/** Client — persist workspace choice after entering from the standards hub. */
export function setActiveStandardCookie() {
  document.cookie = `${ACTIVE_STANDARD_COOKIE}=${ACTIVE_STANDARD_SLUG}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function readActiveStandardCookie(): StandardSlug | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ACTIVE_STANDARD_COOKIE}=`));
  const value = match?.split("=")[1];
  return isActiveStandardSlug(value) ? value : null;
}
