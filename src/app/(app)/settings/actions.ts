"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import {
  allWidgetIdsForStandard,
  mergeDashboardWidgetsConfig,
  type DashboardWidgetId,
} from "@/lib/dashboard/widgets";
import type { StandardSlug } from "@/lib/standards/catalog";

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export async function updateOrgSettings(formData: FormData) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const emails = (str(formData.get("alert_emails")) ?? "")
    .split(/[,\n]/)
    .map((e) => e.trim())
    .filter(Boolean);

  const leadDays = (str(formData.get("alert_lead_days")) ?? "30,7")
    .split(/[,\s]+/)
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  const logo = formData.get("logo");
  const logoPath = await uploadFile(
    "org-assets",
    logo instanceof File ? logo : null,
    `${org.id}`,
  );

  const update: Record<string, unknown> = {
    name: str(formData.get("name")) ?? org.name,
    location_code: str(formData.get("location_code")),
    report_prefix: str(formData.get("report_prefix")) ?? org.report_prefix,
    uid_prefix: str(formData.get("uid_prefix")) ?? org.uid_prefix,
    alert_emails: emails,
    alert_lead_days: leadDays.length ? leadDays : [30, 7],
  };
  if (logoPath) update.logo_path = logoPath;

  const { error } = await supabase
    .from("organizations")
    .update(update)
    .eq("id", org.id);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}

const LAYOUT_STANDARD_SLUGS: StandardSlug[] = ["iso9606-1", "iso-14732"];

/** Saves both standards' layouts in one call. Order of ids = display order. */
export async function updateDashboardWidgets(formData: FormData) {
  const { org } = await requireSession();
  const supabase = await createClient();

  let dashboard_widgets = org.dashboard_widgets as unknown;

  for (const slug of LAYOUT_STANDARD_SLUGS) {
    const allowed = new Set<string>(allWidgetIdsForStandard(slug));
    const ordered = formData
      .getAll(`widgets_${slug}`)
      .map(String)
      .filter((id): id is DashboardWidgetId => allowed.has(id));

    if (ordered.length === 0) {
      throw new Error("Keep at least one dashboard block visible.");
    }

    dashboard_widgets = mergeDashboardWidgetsConfig(
      dashboard_widgets,
      slug,
      ordered,
    );
  }

  const { error } = await supabase
    .from("organizations")
    .update({ dashboard_widgets })
    .eq("id", org.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}
