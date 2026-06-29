import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { computeOperatorRange } from "@/lib/iso14732/range-engine";
import type { OperatorQualification } from "@/types/db";

async function getOq(oqId: string): Promise<OperatorQualification | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("operator_qualifications")
    .select("*")
    .eq("id", oqId)
    .single();
  return (data as OperatorQualification | null) ?? null;
}

export async function recomputeOperatorRange(oqId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("operator_qualifications")
    .select("*")
    .eq("id", oqId)
    .single();

  const oq = data as OperatorQualification | null;
  if (!oq) return;

  const { lines, summary } = computeOperatorRange(oq);

  await admin.from("operator_ranges").upsert(
    {
      oq_id: oqId,
      summary,
      range_lines: lines,
    },
    { onConflict: "oq_id" },
  );
}

export async function getOperatorRangeForOq(oqId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("operator_ranges")
    .select("*")
    .eq("oq_id", oqId)
    .maybeSingle();
  return data;
}

export { getOq };
