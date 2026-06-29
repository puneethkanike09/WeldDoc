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
