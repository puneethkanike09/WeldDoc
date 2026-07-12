"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import {
  ALL_OPERATOR_MASTER_COLUMN_KEYS,
  mergeMasterListColumnsConfig,
  type OperatorMasterColumnKey,
} from "@/lib/masterlist/operator-columns";

export async function updateOperatorMasterListColumns(formData: FormData) {
  const { org } = await requireSession();
  const supabase = await createClient();
  const slug = "iso-14732" as const;
  const allowed = new Set<string>(ALL_OPERATOR_MASTER_COLUMN_KEYS);

  const ordered = formData
    .getAll("columns")
    .map(String)
    .filter((id): id is OperatorMasterColumnKey => allowed.has(id));

  if (ordered.length === 0) {
    throw new Error("Keep at least one column visible.");
  }

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

  revalidatePath("/operators/masterlist");
}
