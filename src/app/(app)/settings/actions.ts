"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import type { SignatoryRole } from "@/types/db";

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

export async function addSignatory(formData: FormData) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const signature = formData.get("signature");
  const stamp = formData.get("stamp");
  const signaturePath = await uploadFile(
    "signatures",
    signature instanceof File ? signature : null,
    `${org.id}`,
  );
  const stampPath = await uploadFile(
    "stamps",
    stamp instanceof File ? stamp : null,
    `${org.id}`,
  );

  const { error } = await supabase.from("signatories").insert({
    org_id: org.id,
    name: str(formData.get("name")) ?? "Unnamed",
    designation: str(formData.get("designation")),
    organisation: str(formData.get("organisation")),
    role: (str(formData.get("role")) ?? "manufacturer") as SignatoryRole,
    signature_path: signaturePath,
    stamp_path: stampPath,
    is_active: true,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}

export async function deleteSignatory(signatoryId: string) {
  const { org } = await requireSession();
  const supabase = await createClient();
  await supabase
    .from("signatories")
    .update({ is_active: false })
    .eq("id", signatoryId)
    .eq("org_id", org.id);
  revalidatePath("/settings");
}
