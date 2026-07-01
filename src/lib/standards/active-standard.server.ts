import "server-only";

import { cookies } from "next/headers";
import {
  ACTIVE_STANDARD_COOKIE,
  ACTIVE_STANDARD_SLUG,
  WELDING_STANDARDS_CATALOG,
  type StandardCatalogEntry,
  type StandardSlug,
} from "@/lib/standards/catalog";
import { isActiveStandardSlug } from "@/lib/standards/active-standard";

export async function getActiveStandardSlug(): Promise<StandardSlug> {
  const jar = await cookies();
  const value = jar.get(ACTIVE_STANDARD_COOKIE)?.value;
  if (isActiveStandardSlug(value)) return value;
  return ACTIVE_STANDARD_SLUG;
}

export async function activeStandardEntry(): Promise<StandardCatalogEntry> {
  const slug = await getActiveStandardSlug();
  return WELDING_STANDARDS_CATALOG.find((e) => e.slug === slug)!;
}

/** ISO 9606-1 workspace — redirect if user is in operator workspace. */
export async function requireWelderWorkspace(): Promise<StandardSlug> {
  const slug = await getActiveStandardSlug();
  if (slug !== "iso9606-1") {
    const { redirect } = await import("next/navigation");
    redirect("/operators/qualify/group");
  }
  return slug;
}

/** ISO 14732 workspace — redirect if user is in welder workspace. */
export async function requireOperatorWorkspace(): Promise<StandardSlug> {
  const slug = await getActiveStandardSlug();
  if (slug !== "iso-14732") {
    const { redirect } = await import("next/navigation");
    redirect("/welders/qualify/group");
  }
  return slug;
}
