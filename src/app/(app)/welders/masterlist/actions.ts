"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import {
  ALL_WELDER_MASTER_EXPORT_KEYS,
  mergeMasterListColumnsConfig,
  type MasterExportKey,
} from "@/lib/masterlist/columns";

export async function updateWelderMasterListColumns(formData: FormData) {
  const { org } = await requireSession();
  const supabase = await createClient();
  const slug = "iso9606-1" as const;
  const allowed = new Set<string>(ALL_WELDER_MASTER_EXPORT_KEYS);

  const enabled = formData
    .getAll("columns")
    .map(String)
    .filter((id): id is MasterExportKey => allowed.has(id));

  if (enabled.length === 0) {
    throw new Error("Keep at least one column visible.");
  }

  const enabledSet = new Set(enabled);
  const ordered = ALL_WELDER_MASTER_EXPORT_KEYS.filter((key) =>
    enabledSet.has(key),
  );

  const masterlist_columns = mergeMasterListColumnsConfig(
    org.masterlist_columns,
    slug,
    ordered,
  );

  const { error } = await supabase
    .from("organizations")
    .update({ masterlist_columns })
    .eq("id", org.id);
  if (error) throw new Error(error.message);

  revalidatePath("/welders/masterlist");
}
