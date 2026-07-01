/**
 * End-to-end bulk import verification:
 * builds a realistic Excel file (today's dates), validates, commits, and
 * checks welders, qualifications, ranges, NDT, and certificate readiness.
 *
 * Usage: npx tsx scripts/e2e-bulk-import.ts
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { commitValidatedImport } from "../src/lib/welders/bulk-import/commit";
import { IMPORT_COLUMNS, IMPORT_SHEET_NAME } from "../src/lib/welders/bulk-import/columns";
import { parseImportWorkbook } from "../src/lib/welders/bulk-import/parse";
import { validateParsedImport } from "../src/lib/welders/bulk-import/validate";
import { computeExpiry } from "../src/lib/expiry";
import { effectiveRangeForWpq } from "../src/lib/iso9606/effective-range";
import { ndtJointCategory } from "../src/lib/iso9606/qualification-fields";
import type { Organization, QualificationRecord, Welder } from "../src/types/db";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  return Object.fromEntries(
    readFileSync(join(root, ".env.local"), "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function buildWorkbookBuffer(rows: Array<Record<string, string | number | undefined>>) {
  const wb = XLSX.utils.book_new();
  const aoa = [
    [...IMPORT_COLUMNS],
    ...rows.map((row) =>
      IMPORT_COLUMNS.map((col) => {
        const v = row[col];
        return v ?? "";
      }),
    ),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, sheet, IMPORT_SHEET_NAME);
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

function log(ok: boolean, msg: string) {
  console.log(`${ok ? "  OK" : "  FAIL"} ${msg}`);
  if (!ok) process.exitCode = 1;
}

async function deleteWelderByPlantId(
  supabase: SupabaseClient,
  orgId: string,
  plantId: string,
) {
  const { data } = await supabase
    .from("welders")
    .select("id")
    .eq("org_id", orgId)
    .eq("welder_id", plantId)
    .maybeSingle();
  if (data?.id) {
    await supabase.from("welders").delete().eq("id", data.id);
  }
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id")
    .limit(1)
    .single();
  if (!profile) throw new Error("No profile found for E2E test.");

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.org_id)
    .single();
  if (!org) throw new Error("No organization found.");

  const today = todayIso();
  const welderOnlyId = "W#9981";
  const welderQualId = "W#9982";
  const expectedExpiry = computeExpiry("9.3b", today);

  console.log(`E2E bulk import — org "${(org as Organization).name}" — today ${today}\n`);

  await deleteWelderByPlantId(supabase, org.id, welderOnlyId);
  await deleteWelderByPlantId(supabase, org.id, welderQualId);

  const testRows = [
    {
      plant_welder_id: welderOnlyId,
      full_name: "E2E Import Welder Only",
      date_of_birth: "1992-03-14",
      place_of_birth: "Bangalore, Karnataka, India",
      id_method: "Passport",
      id_number: "E2E-W9981",
      welder_status: "Active",
    },
    {
      plant_welder_id: welderQualId,
      full_name: "E2E Import With Qualification",
      date_of_birth: "1988-07-22",
      place_of_birth: "Mumbai, Maharashtra, India",
      id_method: "ID Card",
      id_number: "E2E-W9982",
      welder_status: "Active",
      process: "135",
      joint_type: "BW",
      position: "PF",
      base_material_group: "1",
      filler_group: "FM1",
      test_thickness_mm: 12,
      deposited_thickness_mm: 8,
      product: "Plate",
      testing_standard: "EN ISO 9606-1:2017",
      date_of_welding: today,
      revalidation_method: "9.3b",
      result_vt: "Pass",
      result_rt_ut: "Pass",
      result_fracture: "NA",
    },
  ];

  const buffer = buildWorkbookBuffer(testRows);
  const outPath = join(root, "scripts", ".e2e-import-test.xlsx");
  writeFileSync(outPath, Buffer.from(buffer));
  console.log(`Wrote test workbook: ${outPath}\n`);

  const { rows: parsed, fileError } = parseImportWorkbook(buffer);
  log(!fileError && parsed.length === 2, `parse workbook (${parsed.length} rows)`);

  const validation = validateParsedImport(parsed, new Set());
  log(validation.ok, `validate parsed rows (${validation.summary.errorCount} errors)`);
  if (!validation.ok) {
    for (const e of validation.errors) {
      console.log(`    row ${e.excelRow} ${e.column ?? ""}: ${e.message}`);
    }
    throw new Error("Validation failed.");
  }

  log(
    validation.rows[1].qualification?.expiryDate === expectedExpiry,
    `expiry auto-calculated to ${expectedExpiry}`,
  );

  const commit = await commitValidatedImport(
    supabase,
    {
      orgId: org.id,
      userId: profile.id,
      orgName: org.name,
      orgLocation: org.location_code,
      welderSeq: org.welder_seq,
    },
    validation.rows,
  );
  log(
    commit.weldersCreated === 2 && commit.qualificationsCreated === 1,
    `commit (${commit.weldersCreated} welders, ${commit.qualificationsCreated} quals)`,
  );

  const { data: welderOnly } = await supabase
    .from("welders")
    .select("*")
    .eq("org_id", org.id)
    .eq("welder_id", welderOnlyId)
    .single();
  const { data: welderQual } = await supabase
    .from("welders")
    .select("*")
    .eq("org_id", org.id)
    .eq("welder_id", welderQualId)
    .single();

  log(Boolean(welderOnly && welderQual), "welders persisted");
  if (welderOnly) {
    log(welderOnly.employer === org.name, "welder-only employer from org settings");
    log(
      welderOnly.branch_location === org.location_code,
      "welder-only branch from org settings",
    );
    log(welderOnly.is_new_welder === true, "welder-only marked is_new_welder");
  }

  if (!welderQual) throw new Error("Missing qualification welder.");

  const { data: wpq } = await supabase
    .from("qualification_records")
    .select("*")
    .eq("welder_id", welderQual.id)
    .maybeSingle();

  log(Boolean(wpq), "qualification record exists");
  if (wpq) {
    const q = wpq as QualificationRecord;
    log(q.wpq_status === "Approved", "qualification status Approved");
    log(q.is_legacy === true, "qualification marked legacy import");
    log(q.date_of_welding === today, "date_of_welding matches today");
    log(q.expiry_date === expectedExpiry, "expiry_date stored correctly");
    log(q.certificate_issued_date === today, "certificate_issued_date set");
    log(q.process === "135", "process stored");
    log(q.joint_type === "BW", "joint_type stored");
    log(q.test_thickness_mm === 12, "test thickness stored");
  }

  const wpqId = wpq?.id;
  const { data: range } = wpqId
    ? await supabase
        .from("ranges_of_approval")
        .select("*")
        .eq("wpq_id", wpqId)
        .maybeSingle()
    : { data: null };

  log(Boolean(range), "range of approval row exists");
  if (range && wpq) {
    log(range.summary != null && range.summary.length > 0, "range summary populated");
    log(
      Array.isArray(range.approved_positions) && range.approved_positions.length > 0,
      "approved positions populated",
    );
    const effective = effectiveRangeForWpq(wpq as QualificationRecord, range);
    log(effective.summary === range.summary, "effective range matches stored range");
  }

  const { data: ndt } = wpqId
    ? await supabase.from("ndt_dt_records").select("*").eq("wpq_id", wpqId)
    : { data: [] };

  const ndtMethods = (ndt ?? []).map((n) => n.test_method);
  log(ndtMethods.includes("Visual"), "NDT Visual record saved");
  log(ndtMethods.includes("RT/UT"), "NDT RT/UT record saved for BW");
  log(
    (ndt ?? []).every((n) => n.result === "Pass"),
    "NDT results Pass",
  );

  // Certificate PDF is generated on demand for Approved legacy imports.
  log(
    (wpq as QualificationRecord | undefined)?.wpq_status === "Approved",
    "certificate endpoint eligible (Approved status)",
  );

  console.log("\nSummary:");
  console.log(`  Welder-only: ${welderOnlyId} → ${welderOnly?.uid}`);
  console.log(`  With qual:   ${welderQualId} → ${welderQual.uid}, WPQ ${wpqId}`);
  console.log(`  Expiry:      ${expectedExpiry} (9.3b from ${today})`);
  console.log(`  Range:       ${range?.summary ?? "—"}`);
  console.log(`  NDT:         ${ndtMethods.join(", ") || "—"}`);

  if (process.exitCode) {
    throw new Error("E2E bulk import verification failed.");
  }
  console.log("\nAll E2E bulk import checks passed.");
}

main().catch((err) => {
  console.error("\nE2E failed:", err.message);
  process.exit(1);
});
