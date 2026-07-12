/**
 * Recompute stored expiry / continuity dates for existing qualifications.
 *
 * Usage:
 *   npx tsx scripts/backfill-expiry-dates.ts              # dry-run (all orgs)
 *   npx tsx scripts/backfill-expiry-dates.ts --apply      # write changes
 *   npx tsx scripts/backfill-expiry-dates.ts --org Puneeth
 *   npx tsx scripts/backfill-expiry-dates.ts --org Puneeth --apply
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  diffBackfillPatch,
  recomputeOperatorQualDates,
  recomputeWelderQualDates,
  type BackfillValidationEvent,
} from "../src/lib/expiry-backfill";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    if (!process.env[key]) process.env[key] = t.slice(i + 1).trim();
  }
}

function isoDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.includes("T") ? value.slice(0, 10) : value;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const orgIdx = args.indexOf("--org");
  const orgFilter = orgIdx >= 0 ? args[orgIdx + 1] : undefined;
  if (orgIdx >= 0 && !orgFilter) {
    throw new Error("--org requires an organisation name fragment.");
  }
  return { apply, orgFilter };
}

type OrgRow = { id: string; name: string };

async function loadOrgs(
  supabase: SupabaseClient,
  orgFilter?: string,
): Promise<OrgRow[]> {
  let query = supabase.from("organizations").select("id, name").order("name");
  if (orgFilter) query = query.ilike("name", `%${orgFilter}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data?.length) {
    throw new Error(
      orgFilter
        ? `No organisation matching "${orgFilter}".`
        : "No organisations found.",
    );
  }
  return data;
}

async function backfillWelderQualifications(
  supabase: SupabaseClient,
  org: OrgRow,
  apply: boolean,
): Promise<{ qualUpdates: number; validationUpdates: number }> {
  const { data: wpqs, error: wpqErr } = await supabase
    .from("qualification_records")
    .select(
      "id, process, revalidation_method, certificate_issued_date, date_of_welding, expiry_date, continuity_last_verified, welder_id",
    )
    .eq("org_id", org.id);
  if (wpqErr) throw new Error(wpqErr.message);

  const wpqIds = (wpqs ?? []).map((q) => q.id);
  if (!wpqIds.length) return { qualUpdates: 0, validationUpdates: 0 };

  const { data: validations, error: valErr } = await supabase
    .from("validation_records")
    .select("id, wpq_id, validated_on, kind, new_expiry_date")
    .eq("org_id", org.id)
    .in("wpq_id", wpqIds);
  if (valErr) throw new Error(valErr.message);

  const validationsByWpq = new Map<string, BackfillValidationEvent[]>();
  for (const v of validations ?? []) {
    const arr = validationsByWpq.get(v.wpq_id) ?? [];
    arr.push(v as BackfillValidationEvent);
    validationsByWpq.set(v.wpq_id, arr);
  }

  let qualUpdates = 0;
  let validationUpdates = 0;

  for (const qual of wpqs ?? []) {
    const events = validationsByWpq.get(qual.id) ?? [];
    const patch = recomputeWelderQualDates(qual, events);
    if (!patch) continue;

    const { qualChanged, validationChanges } = diffBackfillPatch(
      qual,
      events,
      patch,
    );
    if (!qualChanged && validationChanges.length === 0) continue;

    console.log(
      `\nWelder qual ${qual.id.slice(0, 8)}… process ${qual.process ?? "—"}`,
    );
    if (qualChanged) {
      console.log(
        `  expiry_date: ${isoDateOnly(qual.expiry_date) ?? "—"} → ${patch.expiryDate ?? "—"}`,
      );
      console.log(
        `  continuity_last_verified: ${isoDateOnly(qual.continuity_last_verified) ?? "—"} → ${patch.continuityLastVerified ?? "—"}`,
      );
    }
    for (const change of validationChanges) {
      console.log(
        `  validation ${change.id.slice(0, 8)}… new_expiry_date: ${change.from ?? "—"} → ${change.to ?? "—"}`,
      );
    }

    if (apply) {
      if (qualChanged) {
        const { error } = await supabase
          .from("qualification_records")
          .update({
            expiry_date: patch.expiryDate,
            continuity_last_verified: patch.continuityLastVerified,
          })
          .eq("id", qual.id)
          .eq("org_id", org.id);
        if (error) throw new Error(error.message);
        qualUpdates += 1;
      }

      for (const change of validationChanges) {
        const { error } = await supabase
          .from("validation_records")
          .update({ new_expiry_date: change.to })
          .eq("id", change.id)
          .eq("org_id", org.id);
        if (error) throw new Error(error.message);
        validationUpdates += 1;
      }
    } else {
      if (qualChanged) qualUpdates += 1;
      validationUpdates += validationChanges.length;
    }
  }

  return { qualUpdates, validationUpdates };
}

async function backfillOperatorQualifications(
  supabase: SupabaseClient,
  org: OrgRow,
  apply: boolean,
): Promise<{ qualUpdates: number; validationUpdates: number }> {
  const { data: oqs, error: oqErr } = await supabase
    .from("operator_qualifications")
    .select(
      "id, process, revalidation_method, certificate_issued_date, date_of_welding, expiry_date, continuity_last_verified, operator_id",
    )
    .eq("org_id", org.id);
  if (oqErr) throw new Error(oqErr.message);

  const oqIds = (oqs ?? []).map((q) => q.id);
  if (!oqIds.length) return { qualUpdates: 0, validationUpdates: 0 };

  const { data: validations, error: valErr } = await supabase
    .from("operator_validations")
    .select("id, oq_id, validated_on, kind, new_expiry_date")
    .eq("org_id", org.id)
    .in("oq_id", oqIds);
  if (valErr) throw new Error(valErr.message);

  const validationsByOq = new Map<string, BackfillValidationEvent[]>();
  for (const v of validations ?? []) {
    const arr = validationsByOq.get(v.oq_id) ?? [];
    arr.push({
      id: v.id,
      validated_on: v.validated_on,
      kind: v.kind,
      new_expiry_date: v.new_expiry_date,
    });
    validationsByOq.set(v.oq_id, arr);
  }

  let qualUpdates = 0;
  let validationUpdates = 0;

  for (const qual of oqs ?? []) {
    const events = validationsByOq.get(qual.id) ?? [];
    const patch = recomputeOperatorQualDates(qual, events);
    if (!patch) continue;

    const { qualChanged, validationChanges } = diffBackfillPatch(
      qual,
      events,
      patch,
    );
    if (!qualChanged && validationChanges.length === 0) continue;

    console.log(
      `\nOperator qual ${qual.id.slice(0, 8)}… process ${qual.process ?? "—"}`,
    );
    if (qualChanged) {
      console.log(
        `  expiry_date: ${isoDateOnly(qual.expiry_date) ?? "—"} → ${patch.expiryDate ?? "—"}`,
      );
      console.log(
        `  continuity_last_verified: ${isoDateOnly(qual.continuity_last_verified) ?? "—"} → ${patch.continuityLastVerified ?? "—"}`,
      );
    }
    for (const change of validationChanges) {
      console.log(
        `  validation ${change.id.slice(0, 8)}… new_expiry_date: ${change.from ?? "—"} → ${change.to ?? "—"}`,
      );
    }

    if (apply) {
      if (qualChanged) {
        const { error } = await supabase
          .from("operator_qualifications")
          .update({
            expiry_date: patch.expiryDate,
            continuity_last_verified: patch.continuityLastVerified,
          })
          .eq("id", qual.id)
          .eq("org_id", org.id);
        if (error) throw new Error(error.message);
        qualUpdates += 1;
      }

      for (const change of validationChanges) {
        const { error } = await supabase
          .from("operator_validations")
          .update({ new_expiry_date: change.to })
          .eq("id", change.id)
          .eq("org_id", org.id);
        if (error) throw new Error(error.message);
        validationUpdates += 1;
      }
    } else {
      if (qualChanged) qualUpdates += 1;
      validationUpdates += validationChanges.length;
    }
  }

  return { qualUpdates, validationUpdates };
}

async function main() {
  loadEnv();
  const { apply, orgFilter } = parseArgs();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const orgs = await loadOrgs(supabase, orgFilter);
  console.log(
    apply
      ? `Applying expiry backfill for ${orgs.length} organisation(s)…`
      : `Dry-run expiry backfill for ${orgs.length} organisation(s) (pass --apply to write)…`,
  );

  let totalQualUpdates = 0;
  let totalValidationUpdates = 0;

  for (const org of orgs) {
    console.log(`\n=== ${org.name} ===`);
    const welder = await backfillWelderQualifications(supabase, org, apply);
    const operator = await backfillOperatorQualifications(supabase, org, apply);
    totalQualUpdates += welder.qualUpdates + operator.qualUpdates;
    totalValidationUpdates +=
      welder.validationUpdates + operator.validationUpdates;

    if (
      welder.qualUpdates + operator.qualUpdates + welder.validationUpdates + operator.validationUpdates ===
      0
    ) {
      console.log("  (no changes needed)");
    }
  }

  console.log(
    `\n${apply ? "Updated" : "Would update"} ${totalQualUpdates} qualification(s) and ${totalValidationUpdates} validation row(s).`,
  );
  if (!apply && totalQualUpdates + totalValidationUpdates > 0) {
    console.log("Re-run with --apply to write these changes.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
